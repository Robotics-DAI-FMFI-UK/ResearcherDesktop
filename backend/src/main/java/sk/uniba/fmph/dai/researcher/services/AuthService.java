package sk.uniba.fmph.dai.researcher.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginRequest;
import sk.uniba.fmph.dai.researcher.dtos.auth.LoginResponse;
import sk.uniba.fmph.dai.researcher.dtos.auth.RegisterRequest;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.dtos.auth.PasswordResetRequest;
import sk.uniba.fmph.dai.researcher.entities.PasswordResetToken;
import sk.uniba.fmph.dai.researcher.entities.RegistrationToken;
import sk.uniba.fmph.dai.researcher.repositories.PasswordResetTokenRepository;
import sk.uniba.fmph.dai.researcher.repositories.RegistrationTokenRepository;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.exceptions.InvalidCredentialsException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Service handling authentication, registration, and password management.
 *
 * <p>On successful registration, 13 predefined categories with standard field definitions
 * are created for the new user. The account requires administrator approval before
 * the user can log in.</p>
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private record FieldDef(String name, FieldType type, String options) {
        FieldDef(String name, FieldType type) { this(name, type, null); }
    }

    private record CategoryDef(String name, String icon, List<FieldDef> fields) {}

    private static final List<CategoryDef> PREDEFINED = List.of(
        new CategoryDef("Publications", "book-open", List.of(
            new FieldDef("Authors", FieldType.TEXT),
            new FieldDef("Type", FieldType.DROPDOWN, "Journal Article,Conference Paper,Book Chapter,Preprint,Technical Report,Thesis"),
            new FieldDef("Year", FieldType.NUMBER),
            new FieldDef("Venue / Publisher", FieldType.TEXT),
            new FieldDef("Volume / Issue", FieldType.TEXT),
            new FieldDef("Pages", FieldType.TEXT),
            new FieldDef("DOI", FieldType.TEXT),
            new FieldDef("Status", FieldType.DROPDOWN, "Published,Accepted,Submitted,In Review,Draft")
        )),
        new CategoryDef("Conferences", "calendar-days", List.of(
            new FieldDef("Location", FieldType.TEXT),
            new FieldDef("Start Date", FieldType.DATE),
            new FieldDef("End Date", FieldType.DATE),
            new FieldDef("Abstract Deadline", FieldType.DATE),
            new FieldDef("Paper Deadline", FieldType.DATE),
            new FieldDef("Organizer", FieldType.TEXT),
            new FieldDef("Website", FieldType.TEXT),
            new FieldDef("Submission Status", FieldType.DROPDOWN, "Not Submitted,Submitted,Accepted,Rejected")
        )),
        new CategoryDef("Projects", "folder-open", List.of(
            new FieldDef("Lead Researcher", FieldType.TEXT),
            new FieldDef("Description", FieldType.TEXT),
            new FieldDef("Team Members", FieldType.TEXT),
            new FieldDef("Start Date", FieldType.DATE),
            new FieldDef("End Date", FieldType.DATE),
            new FieldDef("Type", FieldType.DROPDOWN, "Research,Applied,Educational,Industrial,International"),
            new FieldDef("Status", FieldType.DROPDOWN, "Planning,Active,Completed,On Hold,Cancelled"),
            new FieldDef("Funding Source", FieldType.TEXT),
            new FieldDef("Budget", FieldType.NUMBER)
        )),
        new CategoryDef("Contacts", "contact", List.of(
            new FieldDef("First Name", FieldType.TEXT),
            new FieldDef("Last Name", FieldType.TEXT),
            new FieldDef("Email", FieldType.TEXT),
            new FieldDef("Phone", FieldType.TEXT),
            new FieldDef("Institution", FieldType.TEXT),
            new FieldDef("Role / Position", FieldType.TEXT),
            new FieldDef("Meeting Date", FieldType.DATE),
            new FieldDef("Notes", FieldType.TEXT)
        )),
        new CategoryDef("Books", "bookmark", List.of(
            new FieldDef("Authors", FieldType.TEXT),
            new FieldDef("Publisher", FieldType.TEXT),
            new FieldDef("Year", FieldType.NUMBER),
            new FieldDef("Edition", FieldType.TEXT),
            new FieldDef("ISBN", FieldType.TEXT),
            new FieldDef("Status", FieldType.DROPDOWN, "Own,Borrowed,Lent Out,Lost,Wishlist"),
            new FieldDef("Location", FieldType.TEXT)
        )),
        new CategoryDef("Work Trips", "map-pin", List.of(
            new FieldDef("Destination", FieldType.TEXT),
            new FieldDef("Purpose / Event", FieldType.TEXT),
            new FieldDef("Start Date", FieldType.DATE),
            new FieldDef("End Date", FieldType.DATE),
            new FieldDef("Funding Source", FieldType.TEXT),
            new FieldDef("Participants", FieldType.TEXT),
            new FieldDef("Transport", FieldType.DROPDOWN, "Flight,Train,Car,Bus,Other"),
            new FieldDef("Accommodation", FieldType.TEXT)
        )),
        new CategoryDef("Thesis", "graduation-cap", List.of(
            new FieldDef("Student", FieldType.TEXT),
            new FieldDef("Type", FieldType.DROPDOWN, "Bachelor,Master,PhD"),
            new FieldDef("Role", FieldType.DROPDOWN, "Supervisor,Opponent,Consultant"),
            new FieldDef("Expected Year", FieldType.NUMBER),
            new FieldDef("Status", FieldType.DROPDOWN, "In Progress,Submitted,Defended,Failed"),
            new FieldDef("Topic / Goal", FieldType.TEXT)
        )),
        new CategoryDef("Reviews", "clipboard-check", List.of(
            new FieldDef("Author", FieldType.TEXT),
            new FieldDef("Type", FieldType.DROPDOWN, "Journal,Conference,Thesis,Grant Application,Book"),
            new FieldDef("Event / Journal", FieldType.TEXT),
            new FieldDef("Review Date", FieldType.DATE),
            new FieldDef("Decision", FieldType.DROPDOWN, "Accept,Minor Revision,Major Revision,Reject,Pending")
        )),
        new CategoryDef("Cooperation", "handshake", List.of(
            new FieldDef("Organization", FieldType.TEXT),
            new FieldDef("Contact Person", FieldType.TEXT),
            new FieldDef("Phone", FieldType.TEXT),
            new FieldDef("Email", FieldType.TEXT),
            new FieldDef("Contract Date", FieldType.DATE),
            new FieldDef("Contract Expiry", FieldType.DATE),
            new FieldDef("Address", FieldType.TEXT),
            new FieldDef("Notes", FieldType.TEXT)
        )),
        new CategoryDef("Software", "cpu", List.of(
            new FieldDef("Version", FieldType.TEXT),
            new FieldDef("License", FieldType.TEXT),
            new FieldDef("Price", FieldType.NUMBER),
            new FieldDef("Vendor", FieldType.TEXT),
            new FieldDef("License Expiry", FieldType.DATE),
            new FieldDef("Platform", FieldType.DROPDOWN, "Windows,macOS,Linux,Cross-platform,Web"),
            new FieldDef("Notes", FieldType.TEXT)
        )),
        new CategoryDef("Inventory", "package", List.of(
            new FieldDef("Price", FieldType.NUMBER),
            new FieldDef("Currency", FieldType.DROPDOWN, "EUR,USD,CZK,PLN,GBP"),
            new FieldDef("Purchase Date", FieldType.DATE),
            new FieldDef("Funding Source", FieldType.TEXT),
            new FieldDef("Purpose", FieldType.TEXT),
            new FieldDef("Location", FieldType.TEXT),
            new FieldDef("Condition", FieldType.DROPDOWN, "New,Good,Fair,Poor")
        )),
        new CategoryDef("Documents", "file-text", List.of(
            new FieldDef("Description", FieldType.TEXT),
            new FieldDef("Document Date", FieldType.DATE),
            new FieldDef("Type", FieldType.DROPDOWN, "Report,Contract,Minutes,Guidelines,Proposal,Other"),
            new FieldDef("Author", FieldType.TEXT),
            new FieldDef("Confidential", FieldType.CHECKBOX)
        )),
        new CategoryDef("Presentations", "presentation", List.of(
            new FieldDef("Event / Conference", FieldType.TEXT),
            new FieldDef("Date", FieldType.DATE),
            new FieldDef("Location", FieldType.TEXT),
            new FieldDef("Type", FieldType.DROPDOWN, "Talk,Poster,Keynote,Workshop"),
            new FieldDef("Language", FieldType.TEXT),
            new FieldDef("Duration (min)", FieldType.NUMBER)
        ))
    );

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final RegistrationTokenRepository registrationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.admin-email}")
    private String adminEmail;

    /**
     * Authenticates a user and returns a signed JWT token.
     *
     * @param request login credentials
     * @return JWT token and user profile
     * @throws InvalidCredentialsException  if the username or password is incorrect
     * @throws IllegalStateException        if the account is pending approval or has been rejected
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        if (user.getStatus() == User.Status.PENDING) {
            throw new IllegalStateException("Account is awaiting admin approval");
        }
        if (user.getStatus() == User.Status.REJECTED) {
            throw new IllegalStateException("Account registration was rejected");
        }

        return toResponse(user);
    }

    /**
     * Persists a new user, creates predefined categories, and generates a registration token.
     *
     * @param request registration details
     * @return array: [username, role, registrationToken]
     * @throws IllegalArgumentException if passwords do not match, username is taken, or email already exists
     */
    @Transactional
    public String[] registerAndSave(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            switch (existing.getStatus()) {
                case PENDING -> throw new IllegalArgumentException("An account with this email is awaiting admin approval");
                case REJECTED -> throw new IllegalArgumentException("An account with this email was rejected. Please contact the administrator");
                default -> throw new IllegalArgumentException("An account with this email already exists");
            }
        });

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.PENDING);
        userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        RegistrationToken regToken = new RegistrationToken();
        regToken.setUser(user);
        regToken.setToken(tokenValue);
        regToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        registrationTokenRepository.save(regToken);

        List<Category> categories = new ArrayList<>();
        for (CategoryDef def : PREDEFINED) {
            Category c = new Category();
            c.setName(def.name());
            c.setIcon(def.icon());
            c.setPredefined(true);
            c.setOwner(user);
            for (int i = 0; i < def.fields().size(); i++) {
                FieldDef fd = def.fields().get(i);
                CategoryField cf = new CategoryField();
                cf.setCategory(c);
                cf.setName(fd.name());
                cf.setFieldType(fd.type());
                cf.setSortOrder(i);
                if (fd.options() != null) {
                    cf.setOptions(fd.options());
                }
                c.getFields().add(cf);
            }
            categories.add(c);
        }
        categoryRepository.saveAll(categories);

        return new String[]{user.getUsername(), user.getRole().name(), tokenValue};
    }

    /**
     * Registers a new user and sends an approval request email to the administrator.
     *
     * @param request registration details
     * @return login response with {@code null} JWT token (account is pending approval)
     */
    public LoginResponse register(RegisterRequest request) {
        String[] result = registerAndSave(request);
        emailService.sendRegistrationApprovalRequest(adminEmail, result[0], result[2]);
        return new LoginResponse(null, result[0], result[1]);
    }

    /**
     * Approves a pending registration using the token from the administrator email.
     *
     * <p>Sets the user status to {@code APPROVED} and notifies the user by email.</p>
     *
     * @param tokenValue one-time approval token
     * @throws ResourceNotFoundException if the token does not exist
     * @throws IllegalStateException     if the token has expired
     */
    @Transactional
    public void approveRegistration(String tokenValue) {
        RegistrationToken token = registrationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token expired");
        }
        User user = token.getUser();
        user.setStatus(User.Status.APPROVED);
        userRepository.save(user);
        registrationTokenRepository.delete(token);
        if (user.getEmail() != null) {
            emailService.sendRegistrationApproved(user.getEmail(), user.getUsername());
        }
    }

    /**
     * Rejects a pending registration using the token from the administrator email.
     *
     * <p>Sets the user status to {@code REJECTED}.</p>
     *
     * @param tokenValue one-time rejection token
     * @throws ResourceNotFoundException if the token does not exist
     */
    @Transactional
    public void rejectRegistration(String tokenValue) {
        RegistrationToken token = registrationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found"));
        User user = token.getUser();
        user.setStatus(User.Status.REJECTED);
        userRepository.save(user);
        registrationTokenRepository.delete(token);
    }

    /**
     * Creates a password reset token if the given username and email match an existing account.
     *
     * <p>Returns {@code null} silently when no matching account is found,
     * to avoid disclosing account existence.</p>
     *
     * @param request username and email to validate
     * @return the reset token value, or {@code null} if no match was found
     */
    @Transactional
    public String preparePasswordResetToken(PasswordResetRequest request) {
        return userRepository.findByUsernameAndEmail(request.getUsername(), request.getEmail()).map(user -> {
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setToken(tokenValue);
            token.setExpiresAt(LocalDateTime.now().plusHours(1));
            passwordResetTokenRepository.save(token);
            return tokenValue;
        }).orElse(null);
    }

    /**
     * Initiates the password reset flow by sending a reset link to the user's email.
     *
     * <p>Does nothing if the username and email do not match any account.</p>
     *
     * @param request username and email of the account
     */
    public void requestPasswordReset(PasswordResetRequest request) {
        String tokenValue = preparePasswordResetToken(request);
        if (tokenValue != null) {
            emailService.sendPasswordResetLink(request.getEmail(), tokenValue);
        }
    }

    /**
     * Completes the password reset by validating the token and setting the new password.
     *
     * @param tokenValue  reset token from the email link
     * @param newPassword new password to set
     * @throws IllegalArgumentException if the token is invalid, expired, or already used
     */
    @Transactional
    public void confirmPasswordReset(String tokenValue, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));
        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired token");
        }
        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }

    private String buildToken(User user) {
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private LoginResponse toResponse(User user) {
        return new LoginResponse(buildToken(user), user.getUsername(), user.getRole().name());
    }
}
