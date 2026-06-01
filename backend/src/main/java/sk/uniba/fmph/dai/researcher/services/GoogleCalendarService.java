package sk.uniba.fmph.dai.researcher.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.google.CalendarEventDto;
import sk.uniba.fmph.dai.researcher.dtos.google.CreateEventRequest;
import sk.uniba.fmph.dai.researcher.dtos.google.GoogleEventsResponse;
import sk.uniba.fmph.dai.researcher.dtos.google.GoogleTokenResponse;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import sk.uniba.fmph.dai.researcher.config.GoogleCalendarProperties;
import sk.uniba.fmph.dai.researcher.entities.UserGoogleToken;
import sk.uniba.fmph.dai.researcher.repositories.UserGoogleTokenRepository;

/**
 * Service for Google Calendar OAuth2 integration and event management.
 *
 * <p>Handles the full OAuth2 flow (authorisation URL, callback, token storage),
 * automatic token refresh, and CRUD operations against the Google Calendar API.</p>
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class GoogleCalendarService {

    private static final String SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    private final GoogleCalendarProperties properties;
    private final UserGoogleTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RestClient restClient;

    /**
     * Builds the Google OAuth2 authorisation URL for the given user.
     *
     * <p>The username is passed as the OAuth {@code state} parameter so the callback
     * can identify which user completed the flow.</p>
     *
     * @param username username of the user initiating the OAuth flow
     * @return full Google authorisation URL to redirect the user to
     */
    public String buildAuthUrl(String username) {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + encode(properties.getClientId()) +
                "&redirect_uri=" + encode(properties.getRedirectUri()) +
                "&response_type=code" +
                "&scope=" + encode(SCOPES) +
                "&access_type=offline" +
                "&prompt=consent" +
                "&state=" + encode(username);
    }

    /**
     * Handles the Google OAuth2 callback by exchanging the authorisation code for tokens
     * and persisting them for the user identified by {@code state}.
     *
     * @param code  authorisation code received from Google
     * @param state username passed as OAuth state during authorisation
     * @throws ResponseStatusException with {@code 502 BAD_GATEWAY} if token exchange fails
     */
    public void handleCallback(String code, String state) {
        String username = state;
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", properties.getClientId());
        params.add("client_secret", properties.getClientSecret());
        params.add("redirect_uri", properties.getRedirectUri());
        params.add("grant_type", "authorization_code");

        GoogleTokenResponse tokenResponse = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(params)
                .retrieve()
                .body(GoogleTokenResponse.class);

        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to obtain Google tokens");
        }

        UserGoogleToken token = tokenRepository.findByUser(user).orElseGet(UserGoogleToken::new);
        token.setUser(user);
        token.setAccessToken(tokenResponse.getAccessToken());
        if (tokenResponse.getRefreshToken() != null) {
            token.setRefreshToken(tokenResponse.getRefreshToken());
        }
        token.setExpiresAt(Instant.now().plusSeconds(tokenResponse.getExpiresIn() - 60));
        tokenRepository.save(token);
    }

    /**
     * Returns whether the user has connected their Google Calendar account.
     *
     * @param user the user to check
     * @return {@code true} if OAuth tokens are stored for the user
     */
    public boolean isConnected(User user) {
        return tokenRepository.existsByUser(user);
    }

    public String getFrontendUrl() {
        return properties.getFrontendUrl();
    }

    /**
     * Retrieves events from the user's primary Google Calendar.
     *
     * @param user authenticated user
     * @param from optional RFC 3339 lower bound (inclusive)
     * @param to   optional RFC 3339 upper bound (exclusive)
     * @return list of calendar events, up to 2500 results
     */
    public List<CalendarEventDto> getEvents(User user, String from, String to) {
        String accessToken = getOrRefreshToken(user);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(CALENDAR_API)
                .queryParam("orderBy", "startTime")
                .queryParam("singleEvents", "true")
                .queryParam("maxResults", "2500");
        if (from != null && !from.isBlank()) builder.queryParam("timeMin", from);
        if (to != null && !to.isBlank()) builder.queryParam("timeMax", to);
        URI uri = builder.build().toUri();

        GoogleEventsResponse response = restClient.get()
                .uri(uri)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(GoogleEventsResponse.class);

        if (response == null || response.getItems() == null) { return List.of(); }

        return response.getItems().stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Creates a new event in the user's primary Google Calendar.
     *
     * <p>For all-day events the end date is automatically incremented by one day
     * because the Google Calendar API treats the end date as exclusive.</p>
     *
     * @param user    authenticated user
     * @param request event details
     * @return the created event as returned by the Google Calendar API
     * @throws ResponseStatusException with {@code 502 BAD_GATEWAY} if the API call fails
     */
    public CalendarEventDto createEvent(User user, CreateEventRequest request) {
        String accessToken = getOrRefreshToken(user);

        Map<String, Object> body = new HashMap<>();
        body.put("summary", request.getSummary());
        if (request.getDescription() != null) { body.put("description", request.getDescription()); }
        if (request.getLocation() != null) { body.put("location", request.getLocation()); }
        if (request.getColorId() != null) { body.put("colorId", request.getColorId().toString()); }
        if (request.isAllDay()) {
            body.put("start", Map.of("date", request.getStartDateTime()));
            String endDate;
            try {
                String base = request.getEndDateTime() != null ? request.getEndDateTime() : request.getStartDateTime();
                endDate = LocalDate.parse(base).plusDays(1).toString();
            } catch (Exception e) {
                endDate = request.getEndDateTime() != null ? request.getEndDateTime() : request.getStartDateTime();
            }
            body.put("end", Map.of("date", endDate));
        } else {
            body.put("start", Map.of("dateTime", request.getStartDateTime(), "timeZone", "UTC"));
            String endDt;
            if (request.getEndDateTime() != null) {
                endDt = request.getEndDateTime();
            } else {
                try {
                    endDt = LocalDateTime.parse(request.getStartDateTime()).plusHours(1).toString();
                } catch (Exception e) {
                    endDt = request.getStartDateTime();
                }
            }
            body.put("end", Map.of("dateTime", endDt, "timeZone", "UTC"));
        }

        GoogleEventsResponse.GoogleEvent created;
        try {
            created = restClient.post()
                    .uri(CALENDAR_API)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GoogleEventsResponse.GoogleEvent.class);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            log.error("Google Calendar create event failed: {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Google Calendar API error " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }

        return toDto(created);
    }

    /**
     * Deletes an event from the user's primary Google Calendar.
     *
     * @param user    authenticated user
     * @param eventId Google Calendar event ID to delete
     * @throws ResponseStatusException with {@code 502 BAD_GATEWAY} if the API call fails
     */
    public void deleteEvent(User user, String eventId) {
        String accessToken = getOrRefreshToken(user);
        try {
            restClient.delete()
                    .uri(CALENDAR_API + "/" + eventId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (org.springframework.web.client.RestClientResponseException e) {
            log.error("Google Calendar delete event failed: {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Google Calendar API error " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    /**
     * Returns a valid access token for the user, refreshing it if expired.
     *
     * @param user authenticated user
     * @return valid access token
     * @throws ResponseStatusException with {@code 401} if Google Calendar is not connected,
     *                                  or {@code 502} if the refresh fails
     */
    String getOrRefreshToken(User user) {
        UserGoogleToken token = tokenRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google Calendar not connected"));

        if (token.getExpiresAt().isAfter(Instant.now())) {
            return token.getAccessToken();
        }

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", properties.getClientId());
        params.add("client_secret", properties.getClientSecret());
        params.add("refresh_token", token.getRefreshToken());
        params.add("grant_type", "refresh_token");

        GoogleTokenResponse refreshed = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(params)
                .retrieve()
                .body(GoogleTokenResponse.class);

        if (refreshed == null || refreshed.getAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to refresh Google token");
        }

        token.setAccessToken(refreshed.getAccessToken());
        token.setExpiresAt(Instant.now().plusSeconds(refreshed.getExpiresIn() - 60));
        tokenRepository.save(token);

        return token.getAccessToken();
    }

    private CalendarEventDto toDto(GoogleEventsResponse.GoogleEvent e) {
        if (e == null) { return null; }
        String start = e.getStart() != null
                ? (e.getStart().getDateTime() != null ? e.getStart().getDateTime() : e.getStart().getDate())
                : null;
        String end = e.getEnd() != null
                ? (e.getEnd().getDateTime() != null ? e.getEnd().getDateTime() : e.getEnd().getDate())
                : null;
        return new CalendarEventDto(e.getId(), e.getSummary(), e.getDescription(), start, end, e.getHtmlLink(), e.getColorId(), e.getLocation());
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
