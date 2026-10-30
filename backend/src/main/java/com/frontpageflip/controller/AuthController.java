package com.frontpageflip.controller;

import com.frontpageflip.dto.AuthDtos.*;
import com.frontpageflip.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/student/register")
    public ResponseEntity<AuthResponse> registerStudent(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerStudent(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/student/login")
    public ResponseEntity<AuthResponse> loginStudent(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginStudent(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> loginAdmin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginAdmin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/setup")
    public ResponseEntity<AuthResponse> setupAdmin(@Valid @RequestBody SetupAdminPasswordRequest request) {
        AuthResponse response = authService.setupAdminPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerificationRequest request) {
        boolean verified = authService.verifyEmail(request.getToken());
        return ResponseEntity.ok().body("{\"success\": " + verified + ", \"message\": \"Email verified successfully.\"}");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }
}
