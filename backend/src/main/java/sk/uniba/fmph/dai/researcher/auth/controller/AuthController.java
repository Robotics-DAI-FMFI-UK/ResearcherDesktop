package sk.uniba.fmph.dai.researcher.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.auth.dto.LoginRequest;
import sk.uniba.fmph.dai.researcher.auth.dto.LoginResponse;
import sk.uniba.fmph.dai.researcher.auth.dto.RegisterRequest;
import sk.uniba.fmph.dai.researcher.auth.dto.UpdateModeRequest;
import sk.uniba.fmph.dai.researcher.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PutMapping("/me/mode")
    public ResponseEntity<LoginResponse> updateMode(@Valid @RequestBody UpdateModeRequest request) {
        return ResponseEntity.ok(authService.updateMode(request.getMode()));
    }
}
