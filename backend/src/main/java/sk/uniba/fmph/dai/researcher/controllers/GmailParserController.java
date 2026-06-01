package sk.uniba.fmph.dai.researcher.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.google.ImportConferenceRequest;
import sk.uniba.fmph.dai.researcher.dtos.google.ParsedConferenceDto;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemResponse;

import java.util.List;
import sk.uniba.fmph.dai.researcher.services.GmailParserService;

/**
 * REST controller for Gmail-based conference scanning and import.
 *
 * <p>Uses the Gmail API (via the same Google OAuth token as Calendar)
 * to search the user's inbox for conference-related emails and extract
 * structured conference data from them.</p>
 *
 * <p>Base path: {@code /api/gmail}</p>
 */
@RestController
@RequestMapping("/api/gmail")
@RequiredArgsConstructor
public class GmailParserController {

    private final GmailParserService gmailParserService;
    private final UserRepository userRepository;

    /**
     * Scans the authenticated user's Gmail inbox for conference-related emails.
     *
     * <p>Searches for messages with subjects containing keywords such as
     * "CfP", "Call for Papers", "conference" or "deadline" and extracts
     * structured data (title, deadline, location, URL) from each match.</p>
     *
     * @param authentication current authenticated user
     * @return list of parsed conference entries found in the inbox
     */
    @PostMapping("/scan")
    public List<ParsedConferenceDto> scan(Authentication authentication) {
        User user = getUser(authentication.getName());
        return gmailParserService.scanInbox(user);
    }

    /**
     * Imports a parsed conference as a research item and optionally
     * creates a corresponding Google Calendar event.
     *
     * @param request         conference data and import options (addToCalendar flag)
     * @param authentication  current authenticated user
     * @return the newly created research item
     */
    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public ResearchItemResponse importConference(
            @RequestBody ImportConferenceRequest request,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        return gmailParserService.importConference(user, request);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
    }
}
