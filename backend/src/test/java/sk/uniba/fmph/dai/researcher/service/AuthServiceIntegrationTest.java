package sk.uniba.fmph.dai.researcher.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import sk.uniba.fmph.dai.researcher.AbstractIntegrationTest;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginResponse;
import sk.uniba.fmph.dai.researcher.dtos.auth.PasswordResetRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.RegisterRequest;
import sk.uniba.fmph.dai.researcher.entities.PasswordResetToken;
import sk.uniba.fmph.dai.researcher.entities.RegistrationToken;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.exceptions.InvalidCredentialsException;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.repositories.PasswordResetTokenRepository;
import sk.uniba.fmph.dai.researcher.repositories.RegistrationTokenRepository;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.services.AuthService;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RegistrationTokenRepository registrationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Test
    void registerCreatesUserAndPredefinedCategories() {
        RegisterRequest request = registerRequest("alice", "alice@test.com", "secret123");

        String[] result = authService.registerAndSave(request);

        assertThat(result[0]).isEqualTo("alice");
        User saved = userRepository.findByUsername("alice").orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(User.Status.PENDING);
        assertThat(categoryRepository.findByOwner(saved)).hasSize(13);
    }

    @Test
    void registerThrowsWhenPasswordsDoNotMatch() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("bob");
        request.setEmail("bob@test.com");
        request.setPassword("pass123");
        request.setConfirmPassword("different");

        assertThatThrownBy(() -> authService.registerAndSave(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Passwords do not match");
    }

    @Test
    void registerThrowsWhenUsernameAlreadyTaken() {
        createApprovedUser("carol");
        RegisterRequest request = registerRequest("carol", "carol2@test.com", "pass123");

        assertThatThrownBy(() -> authService.registerAndSave(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already taken");
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        createApprovedUser("dave");
        RegisterRequest request = registerRequest("dave2", "dave@test.com", "pass123");

        assertThatThrownBy(() -> authService.registerAndSave(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void loginReturnsTokenWhenUserApproved() {
        createApprovedUser("eva");

        LoginRequest request = loginRequest("eva", "password123");
        LoginResponse response = authService.login(request);

        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getUsername()).isEqualTo("eva");
    }

    @Test
    void loginThrowsWhenUserNotFound() {
        assertThatThrownBy(() -> authService.login(loginRequest("nobody", "pass")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginThrowsWhenWrongPassword() {
        createApprovedUser("frank");

        assertThatThrownBy(() -> authService.login(loginRequest("frank", "wrongpass")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginThrowsWhenStatusPending() {
        User user = createApprovedUser("grace");
        user.setStatus(User.Status.PENDING);
        userRepository.save(user);

        assertThatThrownBy(() -> authService.login(loginRequest("grace", "password123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("awaiting admin approval");
    }

    @Test
    void loginThrowsWhenStatusRejected() {
        User user = createApprovedUser("henry");
        user.setStatus(User.Status.REJECTED);
        userRepository.save(user);

        assertThatThrownBy(() -> authService.login(loginRequest("henry", "password123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("rejected");
    }

    @Test
    void approveRegistrationSetsStatusApproved() {
        String[] result = authService.registerAndSave(registerRequest("ivan", "ivan@test.com", "pass123"));
        String tokenValue = result[2];

        authService.approveRegistration(tokenValue);

        User user = userRepository.findByUsername("ivan").orElseThrow();
        assertThat(user.getStatus()).isEqualTo(User.Status.APPROVED);
    }

    @Test
    void approveRegistrationThrowsWhenTokenExpired() {
        String[] result = authService.registerAndSave(registerRequest("julia", "julia@test.com", "pass123"));
        RegistrationToken token = registrationTokenRepository.findByToken(result[2]).orElseThrow();
        token.setExpiresAt(LocalDateTime.now().minusDays(1));
        registrationTokenRepository.save(token);

        assertThatThrownBy(() -> authService.approveRegistration(result[2]))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Token expired");
    }

    @Test
    void approveRegistrationThrowsWhenTokenNotFound() {
        assertThatThrownBy(() -> authService.approveRegistration("nonexistent-token"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void rejectRegistrationSetsStatusRejected() {
        String[] result = authService.registerAndSave(registerRequest("kate", "kate@test.com", "pass123"));

        authService.rejectRegistration(result[2]);

        User user = userRepository.findByUsername("kate").orElseThrow();
        assertThat(user.getStatus()).isEqualTo(User.Status.REJECTED);
    }

    @Test
    void confirmPasswordResetChangesPassword() {
        User user = createApprovedUser("leo");
        PasswordResetToken token = saveResetToken(user, false, LocalDateTime.now().plusHours(1));

        authService.confirmPasswordReset(token.getToken(), "newpassword");

        User updated = userRepository.findByUsername("leo").orElseThrow();
        assertThat(passwordEncoder.matches("newpassword", updated.getPasswordHash())).isTrue();
    }

    @Test
    void confirmPasswordResetThrowsWhenTokenAlreadyUsed() {
        User user = createApprovedUser("mia");
        PasswordResetToken token = saveResetToken(user, true, LocalDateTime.now().plusHours(1));

        assertThatThrownBy(() -> authService.confirmPasswordReset(token.getToken(), "newpass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired token");
    }

    @Test
    void confirmPasswordResetThrowsWhenTokenExpired() {
        User user = createApprovedUser("nick");
        PasswordResetToken token = saveResetToken(user, false, LocalDateTime.now().minusHours(1));

        assertThatThrownBy(() -> authService.confirmPasswordReset(token.getToken(), "newpass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired token");
    }


    private RegisterRequest registerRequest(String username, String email, String password) {
        RegisterRequest r = new RegisterRequest();
        r.setUsername(username);
        r.setEmail(email);
        r.setPassword(password);
        r.setConfirmPassword(password);
        return r;
    }

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest r = new LoginRequest();
        r.setUsername(username);
        r.setPassword(password);
        return r;
    }

    private PasswordResetToken saveResetToken(User user, boolean used, LocalDateTime expiresAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(java.util.UUID.randomUUID().toString());
        token.setUsed(used);
        token.setExpiresAt(expiresAt);
        return passwordResetTokenRepository.save(token);
    }
}
