package sk.uniba.fmph.dai.researcher.controllers;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.google.CalendarEventDto;
import sk.uniba.fmph.dai.researcher.dtos.google.CreateEventRequest;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import sk.uniba.fmph.dai.researcher.services.GoogleCalendarService;

/**
 * REST controller for Google Calendar integration.
 *
 * <p>Manages the OAuth2 authorisation flow and provides endpoints to retrieve
 * and create events in the user's primary Google Calendar.</p>
 *
 * <p>Base path: {@code /api/calendar}</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class GoogleCalendarController {

    private final GoogleCalendarService calendarService;
    private final UserRepository userRepository;

    /**
     * Builds and returns the Google OAuth2 authorisation URL.
     *
     * <p>The frontend should redirect the user to the returned URL to begin
     * the Google Calendar consent flow.</p>
     *
     * @param authentication current authenticated user
     * @return map containing the {@code authUrl} field
     */
    @GetMapping("/auth")
    public Map<String, String> getAuthUrl(Authentication authentication) {
        String authUrl = calendarService.buildAuthUrl(authentication.getName());
        return Map.of("authUrl", authUrl);
    }

    /**
     * OAuth2 callback endpoint invoked by Google after the user grants consent.
     *
     * <p>Exchanges the authorisation code for access and refresh tokens,
     * persists them, and redirects the user back to the calendar page.</p>
     *
     * @param code     authorisation code returned by Google
     * @param state    username passed as OAuth state parameter
     * @param response HTTP response used to issue the redirect
     * @throws IOException if the redirect fails
     */
    @GetMapping("/callback")
    public void callback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletResponse response) throws IOException {
        try {
            calendarService.handleCallback(code, state);
            response.sendRedirect(calendarService.getFrontendUrl() + "/calendar");
        } catch (Exception e) {
            response.sendRedirect(calendarService.getFrontendUrl() + "/calendar?error=auth_failed");
        }
    }

    /**
     * Returns the Google Calendar connection status for the authenticated user.
     *
     * @param authentication current authenticated user
     * @return map with {@code connected} flag ({@code true} if OAuth tokens are stored)
     */
    @GetMapping("/status")
    public Map<String, Boolean> getStatus(Authentication authentication) {
        User user = getUser(authentication.getName());
        return Map.of("connected", calendarService.isConnected(user));
    }

    /**
     * Retrieves events from the user's primary Google Calendar within the given time range.
     *
     * @param from           optional RFC 3339 timestamp for the start of the range (inclusive)
     * @param to             optional RFC 3339 timestamp for the end of the range (exclusive)
     * @param authentication current authenticated user
     * @return list of calendar events
     */
    @GetMapping("/events")
    public List<CalendarEventDto> getEvents(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication authentication) {
        try {
            User user = getUser(authentication.getName());
            return calendarService.getEvents(user, from, to);
        } catch (Exception e) {
            log.error("GET /events failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Creates a new event in the user's primary Google Calendar.
     *
     * @param request        event details (summary, start/end datetime, location, color, all-day flag)
     * @param authentication current authenticated user
     * @return the created calendar event as returned by the Google Calendar API
     */
    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public CalendarEventDto createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        return calendarService.createEvent(user, request);
    }

    /**
     * Deletes an event from the user's primary Google Calendar.
     *
     * @param eventId        Google Calendar event ID to delete
     * @param authentication current authenticated user
     * @return 204 No Content on success
     */
    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable String eventId,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        calendarService.deleteEvent(user, eventId);
        return ResponseEntity.noContent().build();
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
    }
}
