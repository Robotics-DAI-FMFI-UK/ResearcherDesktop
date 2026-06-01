package sk.uniba.fmph.dai.researcher.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginResponse;
import sk.uniba.fmph.dai.researcher.dtos.auth.PasswordResetConfirmRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.PasswordResetRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.RegisterRequest;
import sk.uniba.fmph.dai.researcher.services.AuthService;

/**
 * REST controller for authentication and account management.
 *
 * <p>Handles user login, registration, and the two-step password reset flow.</p>
 *
 * <p>Base path: {@code /api/auth}</p>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Authenticates a user and returns a JWT token.
     *
     * @param request login credentials (username and password)
     * @return JWT token and user information
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Registers a new user account.
     *
     * <p>The account is created with {@code PENDING} status and requires
     * administrator approval before the user can log in.</p>
     *
     * @param request registration details (username, email, password)
     * @return account status; JWT token is {@code null} until account is approved
     */
    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * Initiates a password reset by sending a reset link to the user's email.
     *
     * <p>If the username and email do not match any account, the request is silently
     * ignored to avoid disclosing account existence.</p>
     *
     * @param request username and email address of the account
     * @return empty 200 response regardless of whether a matching account was found
     */
    @PostMapping("/reset-request")
    public ResponseEntity<Void> resetRequest(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok().build();
    }

    /**
     * Confirms a password reset using the token from the reset email.
     *
     * @param request reset token and the new password
     * @return empty 200 response on success
     */
    @PostMapping("/reset-confirm")
    public ResponseEntity<Void> resetConfirm(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
