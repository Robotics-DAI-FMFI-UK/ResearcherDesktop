package sk.uniba.fmph.dai.researcher.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import sk.uniba.fmph.dai.researcher.AbstractControllerTest;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.RegisterRequest;
import sk.uniba.fmph.dai.researcher.entities.User;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends AbstractControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = createUser("testuser", "testuser@test.com", User.Status.APPROVED);
    }

    @AfterEach
    void tearDown() {
        userRepository.findByUsername("testuser").ifPresent(userRepository::delete);
        userRepository.findByUsername("newuser").ifPresent(userRepository::delete);
        userRepository.findByUsername("pending").ifPresent(userRepository::delete);
    }

    @Test
    void loginSucceeds() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void loginFailsOnWrongPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginFailsOnUnknownUser() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("nobody");
        request.setPassword("pass123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginFailsOnBlankUsername() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("");
        request.setPassword("pass123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginFailsOnPendingAccount() throws Exception {
        createUser("pending", "pending@test.com", User.Status.PENDING);

        LoginRequest request = new LoginRequest();
        request.setUsername("pending");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Account is awaiting admin approval"));
    }

    @Test
    void registerSucceeds() throws Exception {
        RegisterRequest request = registerRequest("newuser", "newuser@test.com", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.token").isEmpty());
    }

    @Test
    void registerFailsOnShortPassword() throws Exception {
        RegisterRequest request = registerRequest("newuser2", "newuser2@test.com", "12345");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerFailsOnInvalidEmail() throws Exception {
        RegisterRequest request = registerRequest("newuser3", "not-an-email", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerFailsOnTakenUsername() throws Exception {
        RegisterRequest request = registerRequest("testuser", "other@test.com", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username already taken"));
    }

    @Test
    void resetRequestSucceeds() throws Exception {
        String body = "{\"username\":\"nobody\",\"email\":\"nobody@test.com\"}";

        mockMvc.perform(post("/api/auth/reset-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }


    private User createUser(String username, String email, User.Status status) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(User.Role.USER);
        user.setStatus(status);
        return userRepository.save(user);
    }

    private RegisterRequest registerRequest(String username, String email, String password) {
        RegisterRequest r = new RegisterRequest();
        r.setUsername(username);
        r.setEmail(email);
        r.setPassword(password);
        r.setConfirmPassword(password);
        return r;
    }
}
