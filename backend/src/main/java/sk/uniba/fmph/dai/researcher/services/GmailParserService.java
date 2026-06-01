package sk.uniba.fmph.dai.researcher.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.google.CreateEventRequest;
import sk.uniba.fmph.dai.researcher.dtos.google.GmailMessageDetail;
import sk.uniba.fmph.dai.researcher.dtos.google.GmailMessagesResponse;
import sk.uniba.fmph.dai.researcher.dtos.google.ImportConferenceRequest;
import sk.uniba.fmph.dai.researcher.dtos.google.ParsedConferenceDto;
import sk.uniba.fmph.dai.researcher.entities.item.ItemComment;
import sk.uniba.fmph.dai.researcher.repositories.item.ItemCommentRepository;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFieldValue;
import sk.uniba.fmph.dai.researcher.entities.item.ItemLink;
import sk.uniba.fmph.dai.researcher.repositories.item.ItemLinkRepository;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRepository;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemResponse;

import jakarta.mail.internet.MimeUtility;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for scanning Gmail and importing conference data.
 *
 * <p>Uses the Gmail API (same OAuth token as Google Calendar) to search the user's
 * inbox for conference-related messages. Extracted fields include deadlines,
 * conference dates, location, URL, and submission URL using regex-based parsing.</p>
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class GmailParserService {

    private static final String GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me/messages";

    private static final Pattern URL_PATTERN = Pattern.compile("https?://[^\\s>\"<)\\]]+");
    private static final Pattern SUBMISSION_URL_PATTERN = Pattern.compile(
            "https?://[^\\s>\"<)\\]]*(?:submit|easychair|hotcrp|cmt3|openreview|paper)[^\\s>\"<)\\]]*",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern HREF_PATTERN = Pattern.compile(
            "href\\s*=\\s*[\"']\\s*(https?://[^\"']+?)\\s*[\"']",
            Pattern.CASE_INSENSITIVE
    );
    private static final String DATE_VALUE = "([A-Za-z]+ \\d{1,2},?\\s+\\d{4}|\\d{1,2}[.\\-/]\\d{1,2}[.\\-/]\\d{2,4})";
    private static final Pattern ABSTRACT_DEADLINE_PATTERN = Pattern.compile(
            "(?i)abstract\\s+(?:submission\\s+)?deadline[:\\s]+" + DATE_VALUE);
    private static final Pattern PAPER_DEADLINE_PATTERN = Pattern.compile(
            "(?i)(?:paper|full\\s+paper|manuscript)\\s+(?:submission\\s+)?deadline[:\\s]+" + DATE_VALUE);
    private static final Pattern CAMERA_READY_PATTERN = Pattern.compile(
            "(?i)camera.?ready\\s*(?:deadline|papers?)[:\\s]+" + DATE_VALUE);
    private static final Pattern DEADLINE_PATTERN = Pattern.compile(
            "(?i)(?:submission|paper|abstract|camera.?ready)?\\s*deadline[:\\s]+" + DATE_VALUE);
    private static final Pattern DATE_RANGE_PATTERN = Pattern.compile(
            "([A-Za-z]+)\\s+(\\d{1,2})\\s*[–—\\-]+\\s*(?:([A-Za-z]+)\\s+)?(\\d{1,2}),?\\s+(\\d{4})"
    );
    private static final Pattern LOCATION_PATTERN = Pattern.compile(
            "(?i)(?:location|venue|held in|conference venue|city)[:\\s]+([A-Za-z][^\\n\\r;]{2,80})"
    );
    private static final Pattern CONTACT_PATTERN = Pattern.compile(
            "(?i)(?:contact|inquiries|questions)[:\\s]+([a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"
    );
    private static final Pattern ORGANIZER_PATTERN = Pattern.compile(
            "(?i)(?:organizer|organiser|organized by|presented by)[:\\s]+([^\\n\\r;]{2,100})"
    );

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMMM d yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMM d yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ISO_LOCAL_DATE
    );

    private final GoogleCalendarService calendarService;
    private final RestClient restClient;
    private final CategoryRepository categoryRepository;
    private final ResearchItemRepository itemRepository;
    private final ItemLinkRepository linkRepository;
    private final ItemCommentRepository commentRepository;

    /**
     * Searches the user's Gmail inbox for conference-related emails from the last 90 days
     * and parses structured conference data from each message.
     *
     * @param user authenticated user whose Gmail is scanned
     * @return list of parsed conference entries; each entry has {@code alreadyImported} set
     *         if the message was previously imported
     */
    public List<ParsedConferenceDto> scanInbox(User user) {
        String accessToken = calendarService.getOrRefreshToken(user);

        String after = LocalDate.now().minusDays(90).format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String query = "(subject:CfP OR subject:\"Call for Papers\" OR subject:conference OR subject:deadline) after:" + after;

        URI searchUri = UriComponentsBuilder.fromUriString(GMAIL_API)
                .queryParam("q", query)
                .queryParam("maxResults", "20")
                .build()
                .toUri();

        log.debug("Gmail search URI: {}", searchUri);

        GmailMessagesResponse messages = restClient.get()
                .uri(searchUri)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(GmailMessagesResponse.class);

        log.debug("Gmail search result: {}", messages != null ? messages.getMessages() : "null");

        if (messages == null || messages.getMessages() == null) { return List.of(); }

        List<ParsedConferenceDto> result = new ArrayList<>();
        for (GmailMessagesResponse.MessageRef ref : messages.getMessages()) {
            try {
                URI msgUri = UriComponentsBuilder.fromUriString(GMAIL_API + "/" + ref.getId())
                        .queryParam("format", "full")
                        .build()
                        .toUri();

                GmailMessageDetail detail = restClient.get()
                        .uri(msgUri)
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .body(GmailMessageDetail.class);

                if (detail != null) {
                    log.debug("Processing message id={} snippet={}", detail.getId(), detail.getSnippet());
                    ParsedConferenceDto dto = parseConference(detail);
                    dto.setAlreadyImported(itemRepository.existsByGmailMessageIdAndOwner(detail.getId(), user));
                    result.add(dto);
                }
            } catch (Exception e) {
                log.warn("Failed to fetch message {}: {}", ref.getId(), e.getMessage());
            }
        }
        return result;
    }

    /**
     * Imports a parsed conference as a research item in the user's Conferences category.
     *
     * <p>Optionally creates Google Calendar events for the conference dates and
     * deadline types (abstract, paper, camera-ready). Saves the email body as a comment
     * and conference URLs as external links.</p>
     *
     * @param user    authenticated user
     * @param request parsed conference data and import options
     * @return the created research item
     * @throws ResponseStatusException with {@code 409 CONFLICT} if already imported,
     *                                  or {@code 400 BAD_REQUEST} if no target category exists
     */
    public ResearchItemResponse importConference(User user, ImportConferenceRequest request) {
        ParsedConferenceDto conf = request.getConference();

        if (conf.getMessageId() != null && itemRepository.existsByGmailMessageIdAndOwner(conf.getMessageId(), user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conference already imported");
        }

        List<Category> categories = categoryRepository.findByOwner(user);
        Category category = categories.stream()
                .filter(c -> "Conferences".equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> categories.isEmpty() ? null : categories.get(0));

        if (category == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No category available for import");
        }

        ResearchItem item = new ResearchItem();
        String title = (conf.getTitle() != null && !conf.getTitle().isBlank()) ? conf.getTitle() : conf.getEmailSubject();
        item.setTitle(title != null ? title : "Unnamed Conference");
        item.setOwner(user);
        item.setCategory(category);
        item.setDate(LocalDate.now());
        item.setGmailMessageId(conf.getMessageId());

        prefillFieldValues(item, category, conf);

        ResearchItem saved = itemRepository.save(item);

        if (conf.getUrl() != null && !conf.getUrl().isBlank()) {
            saveLink(saved, conf.getUrl(), "Conference Website");
        }
        if (conf.getSubmissionUrl() != null && !conf.getSubmissionUrl().isBlank()
                && !conf.getSubmissionUrl().equals(conf.getUrl())) {
            saveLink(saved, conf.getSubmissionUrl(), "Submission");
        }

        if (conf.getBodyText() != null && !conf.getBodyText().isBlank()) {
            String commentText = truncate(conf.getBodyText().strip(), 5000);
            ItemComment comment = new ItemComment();
            comment.setItem(saved);
            comment.setText(commentText);
            commentRepository.save(comment);
        }

        if (request.isAddToCalendar()) {
            String confTitle = saved.getTitle();
            createDeadlineEvent(user, conf.getAbstractDeadline(), "Abstract Deadline: " + confTitle);
            createDeadlineEvent(user, conf.getPaperDeadline(),    "Paper Deadline: " + confTitle);
            createDeadlineEvent(user, conf.getCameraReadyDeadline(), "Camera-Ready Deadline: " + confTitle);
            if (conf.getAbstractDeadline() == null && conf.getPaperDeadline() == null
                    && conf.getCameraReadyDeadline() == null) {
                createDeadlineEvent(user, conf.getDeadline(), "Deadline: " + confTitle);
            }
            if (conf.getStartDate() != null) {
                try {
                    CreateEventRequest ev = new CreateEventRequest();
                    ev.setSummary(confTitle);
                    ev.setStartDateTime(conf.getStartDate());
                    ev.setEndDateTime(conf.getEndDate() != null ? conf.getEndDate() : conf.getStartDate());
                    ev.setAllDay(true);
                    if (conf.getLocation() != null) { ev.setLocation(conf.getLocation()); }
                    calendarService.createEvent(user, ev);
                } catch (Exception e) {
                    log.warn("Failed to create conference dates event: {}", e.getMessage());
                }
            }
        }

        return ResearchItemResponse.from(saved, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
    }

    private void createDeadlineEvent(User user, String dateStr, String summary) {
        if (dateStr == null || dateStr.isBlank()) { return; }
        try {
            LocalDate date = tryParseDate(dateStr);
            if (date == null) { return; }
            CreateEventRequest ev = new CreateEventRequest();
            ev.setSummary(summary);
            ev.setStartDateTime(date.toString());
            ev.setAllDay(true);
            calendarService.createEvent(user, ev);
        } catch (Exception e) {
            log.warn("Failed to create calendar event '{}': {}", summary, e.getMessage());
        }
    }

    private void saveLink(ResearchItem item, String url, String name) {
        ItemLink link = new ItemLink();
        link.setItem(item);
        link.setUrl(url);
        link.setName(name);
        linkRepository.save(link);
    }

    private void prefillFieldValues(ResearchItem item, Category category, ParsedConferenceDto conf) {
        List<CategoryField> fields = category.getFields();
        for (CategoryField field : fields) {
            String nameLower = field.getName().toLowerCase();
            String rawValue = null;

            if (nameLower.contains("organiz") || nameLower.contains("organis") || nameLower.contains("sent from") || nameLower.contains("send from")) {
                rawValue = extractOrganizer(conf.getBodyText(), conf.getSender());
            } else if (nameLower.contains("deadline")) {
                rawValue = conf.getDeadline();
            } else if (nameLower.contains("start") || (nameLower.contains("conference") && nameLower.contains("date"))) {
                rawValue = conf.getStartDate();
            } else if (nameLower.contains("end") && (nameLower.contains("date") || field.getFieldType() == FieldType.DATE)) {
                rawValue = conf.getEndDate();
            } else if (nameLower.contains("location") || nameLower.contains("venue") || nameLower.contains("city")) {
                rawValue = conf.getLocation();
            } else if (nameLower.contains("contact") || (nameLower.contains("email") && !nameLower.contains("deadline"))) {
                rawValue = conf.getContactEmail();
            } else if (nameLower.contains("submission") && (nameLower.contains("url") || nameLower.contains("link"))) {
                rawValue = conf.getSubmissionUrl() != null ? conf.getSubmissionUrl() : conf.getUrl();
            } else if (nameLower.contains("url") || nameLower.contains("website") || nameLower.contains("link")) {
                rawValue = conf.getUrl();
            }

            if (rawValue == null || rawValue.isBlank()) { continue; }

            String storedValue = rawValue;
            if (field.getFieldType() == FieldType.DATE) {
                LocalDate parsed = tryParseDate(rawValue);
                if (parsed == null) { continue; }
                storedValue = parsed.toString();
            }

            ItemFieldValue fv = new ItemFieldValue();
            fv.setItem(item);
            fv.setField(field);
            fv.setValue(storedValue);
            item.getFieldValues().add(fv);
        }
    }

    private ParsedConferenceDto parseConference(GmailMessageDetail detail) {
        String subject = "";
        String emailDate = "";
        String from = "";

        if (detail.getPayload() != null && detail.getPayload().getHeaders() != null) {
            for (GmailMessageDetail.Payload.Header h : detail.getPayload().getHeaders()) {
                if ("Subject".equalsIgnoreCase(h.getName())) {
                    try { subject = MimeUtility.decodeText(h.getValue()); }
                    catch (Exception e) { subject = h.getValue(); }
                }
                if ("Date".equalsIgnoreCase(h.getName())) { emailDate = h.getValue(); }
                if ("From".equalsIgnoreCase(h.getName())) { from = h.getValue(); }
            }
        }

        String bodyText = extractBodyText(detail.getPayload());
        String snippet = detail.getSnippet() != null ? detail.getSnippet() : "";
        String searchText = subject + "\n" + snippet + "\n" + bodyText;

        ParsedConferenceDto dto = new ParsedConferenceDto();
        dto.setTitle(cleanSubject(subject));
        dto.setEmailSubject(subject);
        dto.setEmailDate(emailDate);
        dto.setMessageId(detail.getId());
        dto.setAbstractDeadline(extractFirst(ABSTRACT_DEADLINE_PATTERN, searchText));
        dto.setPaperDeadline(extractFirst(PAPER_DEADLINE_PATTERN, searchText));
        dto.setCameraReadyDeadline(extractFirst(CAMERA_READY_PATTERN, searchText));
        String specificDeadline = dto.getPaperDeadline() != null ? dto.getPaperDeadline()
                : dto.getAbstractDeadline() != null ? dto.getAbstractDeadline()
                : extractFirst(DEADLINE_PATTERN, searchText);
        dto.setDeadline(specificDeadline);
        List<String> hrefUrls = extractHrefUrls(detail.getPayload());
        dto.setUrl(completeTruncatedUrl(extractUrl(searchText), hrefUrls));
        dto.setSubmissionUrl(completeTruncatedUrl(extractSubmissionUrl(searchText), hrefUrls));
        dto.setLocation(extractLocation(searchText));
        dto.setContactEmail(extractContactEmail(searchText));
        dto.setBodyText(cleanBodyText(bodyText.isBlank() ? snippet : bodyText));
        dto.setSender(from.isBlank() ? null : from);

        String[] range = extractDateRange(searchText);
        dto.setStartDate(range[0]);
        dto.setEndDate(range[1]);

        return dto;
    }

    private String extractBodyText(GmailMessageDetail.Payload payload) {
        if (payload == null) { return ""; }
        StringBuilder sb = new StringBuilder();
        collectText(payload.getBody(), payload.getMimeType(), payload.getParts(), sb);
        return sb.toString();
    }

    /**
     * Collects every absolute URL found in {@code href} attributes of the HTML parts.
     *
     * <p>Anchor hrefs hold the complete, unbroken URL even when the visible link text is
     * split by inline tags (such as {@code <wbr>}) for line wrapping.</p>
     */
    private List<String> extractHrefUrls(GmailMessageDetail.Payload payload) {
        List<String> urls = new ArrayList<>();
        if (payload != null) {
            collectHrefs(payload.getBody(), payload.getMimeType(), payload.getParts(), urls);
        }
        return urls;
    }

    private void collectHrefs(GmailMessageDetail.Payload.Body body, String mimeType,
                              List<GmailMessageDetail.Payload.Part> parts, List<String> urls) {
        if (body != null && body.getData() != null && mimeType != null && mimeType.startsWith("text/html")) {
            try {
                String html = new String(Base64.getUrlDecoder().decode(body.getData()), StandardCharsets.UTF_8);
                Matcher m = HREF_PATTERN.matcher(html);
                while (m.find()) {
                    urls.add(m.group(1).trim());
                }
            } catch (Exception e) {
                log.debug("Failed to decode html part for hrefs: {}", e.getMessage());
            }
        }
        if (parts != null) {
            for (GmailMessageDetail.Payload.Part part : parts) {
                collectHrefs(part.getBody(), part.getMimeType(), part.getParts(), urls);
            }
        }
    }

    /**
     * Restores a URL that was truncated while stripping HTML tags from the visible text.
     *
     * <p>Returns the shortest {@code href} URL that the extracted value is a prefix of, so a
     * truncated link is only ever extended to its full form — never replaced by a different link.</p>
     */
    private String completeTruncatedUrl(String url, List<String> hrefUrls) {
        if (url == null) { return null; }
        String best = null;
        for (String href : hrefUrls) {
            if (href.length() > url.length() && href.startsWith(url)
                    && (best == null || href.length() < best.length())) {
                best = href;
            }
        }
        return best != null ? best : url;
    }

    private void collectText(GmailMessageDetail.Payload.Body body, String mimeType,
                              List<GmailMessageDetail.Payload.Part> parts, StringBuilder sb) {
        if (body != null && body.getData() != null) {
            try {
                byte[] decoded = Base64.getUrlDecoder().decode(body.getData());
                String text = new String(decoded, StandardCharsets.UTF_8);
                if (mimeType == null || mimeType.startsWith("text/plain")) {
                    sb.append(text).append("\n");
                } else if (mimeType.startsWith("text/html")) {
                    String stripped = text.replaceAll("<[^>]+>", " ");
                    stripped = stripped.replaceAll("&nbsp;", " ");
                    sb.append(stripped).append("\n");
                }
            } catch (Exception e) {
                log.debug("Failed to decode body part: {}", e.getMessage());
            }
        }
        if (parts != null) {
            for (GmailMessageDetail.Payload.Part part : parts) {
                collectText(part.getBody(), part.getMimeType(), part.getParts(), sb);
            }
        }
    }

    private String cleanBodyText(String raw) {
        if (raw == null) { return ""; }
        return raw.replaceAll("[\\u00A0\\t ]+", " ")
                  .replaceAll("(\\r?\\n){3,}", "\n\n")
                  .strip();
    }

    private String cleanSubject(String subject) {
        if (subject == null) { return ""; }
        return subject.replaceAll("(?i)^(re:\\s*|fwd?:\\s*|\\[cfp\\]\\s*|cfp:\\s*|cfp\\s*-\\s*|call for papers:\\s*)", "").trim();
    }

    private String extractUrl(String text) {
        if (text == null) { return null; }
        Matcher m = URL_PATTERN.matcher(text);
        while (m.find()) {
            String url = m.group();
            if (!url.contains("unsubscribe") && !url.contains("mailto:") && !url.contains("google.com/")) {
                return url;
            }
        }
        return null;
    }

    private String extractSubmissionUrl(String text) {
        if (text == null) { return null; }
        Matcher m = SUBMISSION_URL_PATTERN.matcher(text);
        return m.find() ? m.group() : null;
    }

    private String extractFirst(Pattern pattern, String text) {
        if (text == null) { return null; }
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    private String extractLocation(String text) {
        if (text == null) { return null; }
        Matcher m = LOCATION_PATTERN.matcher(text);
        if (!m.find()) { return null; }
        return m.group(1).replaceAll("[\\s]+$", "").trim();
    }

    private String extractOrganizer(String bodyText, String sender) {
        if (bodyText != null) {
            Matcher m = ORGANIZER_PATTERN.matcher(bodyText);
            if (m.find()) { return m.group(1).trim(); }
        }
        return sender;
    }

    private String extractContactEmail(String text) {
        if (text == null) { return null; }
        Matcher m = CONTACT_PATTERN.matcher(text);
        if (m.find()) { return m.group(1); }
        Matcher m2 = EMAIL_PATTERN.matcher(text);
        while (m2.find()) {
            String email = m2.group();
            if (!email.endsWith(".png") && !email.endsWith(".jpg") && !email.contains("example.")) {
                return email;
            }
        }
        return null;
    }

    /** Returns [startDateIso, endDateIso] — either may be null if not found. */
    private String[] extractDateRange(String text) {
        if (text == null) { return new String[]{null, null}; }
        Matcher m = DATE_RANGE_PATTERN.matcher(text);
        if (!m.find()) { return new String[]{null, null}; }

        String startMonth = m.group(1);
        int startDay = Integer.parseInt(m.group(2));
        String endMonth = m.group(3) != null ? m.group(3) : startMonth;
        int endDay = Integer.parseInt(m.group(4));
        int year = Integer.parseInt(m.group(5));

        LocalDate start = buildDate(startMonth, startDay, year);
        LocalDate end = buildDate(endMonth, endDay, year);
        return new String[]{start != null ? start.toString() : null, end != null ? end.toString() : null};
    }

    private LocalDate buildDate(String monthName, int day, int year) {
        for (String pattern : List.of("MMMM d yyyy", "MMM d yyyy")) {
            try {
                return LocalDate.parse(monthName + " " + day + " " + year,
                        DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private LocalDate tryParseDate(String text) {
        if (text == null || text.isBlank()) { return null; }
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try { return LocalDate.parse(text.trim(), fmt); } catch (Exception ignored) {}
        }
        return null;
    }

    private String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
