package sk.uniba.fmph.dai.researcher.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.uniba.fmph.dai.researcher.auth.dto.LoginRequest;
import sk.uniba.fmph.dai.researcher.auth.dto.LoginResponse;
import sk.uniba.fmph.dai.researcher.auth.dto.RegisterRequest;
import sk.uniba.fmph.dai.researcher.auth.repository.UserRepository;
import sk.uniba.fmph.dai.researcher.category.Category;
import sk.uniba.fmph.dai.researcher.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.common.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.common.entity.User;
import sk.uniba.fmph.dai.researcher.common.exception.InvalidCredentialsException;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private record PredefinedCategory(String name, String icon) {}

    private static final List<PredefinedCategory> PREDEFINED_CATEGORIES = List.of(
            new PredefinedCategory("Publications",  "book-open"),
            new PredefinedCategory("Presentations", "presentation"),
            new PredefinedCategory("Books",         "bookmark"),
            new PredefinedCategory("Conferences",   "users"),
            new PredefinedCategory("Notes",         "notebook-pen"),
            new PredefinedCategory("Calendar",      "calendar"),
            new PredefinedCategory("Posts",         "rss")
    );

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return toResponse(user);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.USER);
        userRepository.save(user);

        List<Category> categories = PREDEFINED_CATEGORIES.stream().map(p -> {
            Category c = new Category();
            c.setName(p.name());
            c.setIcon(p.icon());
            c.setPredefined(true);
            c.setOwner(user);
            return c;
        }).toList();
        categoryRepository.saveAll(categories);

        return toResponse(user);
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

    @Transactional
    public LoginResponse updateMode(User.Mode mode) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User " + username + " not found"));
        user.setMode(mode);
        return toResponse(user);
    }

    private LoginResponse toResponse(User user) {
        return new LoginResponse(buildToken(user), user.getUsername(), user.getRole().name(), user.getMode().name());
    }
}
