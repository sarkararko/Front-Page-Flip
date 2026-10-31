package com.frontpageflip.controller;

import com.frontpageflip.dto.AuthDtos.AuthResponse;
import com.frontpageflip.dto.AuthDtos.LoginRequest;
import com.frontpageflip.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dedicated controller for administrator authentication endpoints.
 * Distinct from student authentication routes.
 */
@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminAuthController {

    private final AuthService authService;

    public AdminAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginAdmin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginAdmin(request);
        return ResponseEntity.ok(response);
    }
}
