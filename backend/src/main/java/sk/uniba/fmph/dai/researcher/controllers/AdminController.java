package sk.uniba.fmph.dai.researcher.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.services.AuthService;

/**
 * REST controller for administrator actions.
 *
 * <p>Exposes endpoints for approving or rejecting user registration requests.
 * These endpoints are accessed via one-time links sent to the administrator by email.</p>
 *
 * <p>Base path: {@code /api/admin}</p>
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;

    /**
     * Approves a pending user registration.
     *
     * @param token one-time registration approval token sent to the administrator by email
     * @return confirmation message
     */
    @GetMapping("/approve/{token}")
    public ResponseEntity<String> approve(@PathVariable String token) {
        authService.approveRegistration(token);
        return ResponseEntity.ok("Registration approved.");
    }

    /**
     * Rejects a pending user registration.
     *
     * @param token one-time registration rejection token sent to the administrator by email
     * @return confirmation message
     */
    @GetMapping("/reject/{token}")
    public ResponseEntity<String> reject(@PathVariable String token) {
        authService.rejectRegistration(token);
        return ResponseEntity.ok("Registration rejected.");
    }
}
