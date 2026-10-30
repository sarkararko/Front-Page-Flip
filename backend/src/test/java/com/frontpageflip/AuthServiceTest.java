package com.frontpageflip;

import com.frontpageflip.dto.AuthDtos.AuthResponse;
import com.frontpageflip.dto.AuthDtos.LoginRequest;
import com.frontpageflip.dto.AuthDtos.RegisterRequest;
import com.frontpageflip.dto.AuthDtos.SetupAdminPasswordRequest;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ForbiddenException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.model.VerificationToken;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.repository.VerificationTokenRepository;
import com.frontpageflip.service.AuthService;
import com.frontpageflip.service.EmailService;
import com.frontpageflip.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    private AuthService authService;

    private final String creatorEmail = "arkaparna.ds@gmail.com";

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                tokenRepository,
                passwordEncoder,
                jwtService,
                emailService
        );
        ReflectionTestUtils.setField(authService, "creatorEmail", creatorEmail);
    }

    @Test
    @DisplayName("Student registration successfully assigns STUDENT role and generates token")
    void testRegisterStudentSuccess() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Rohan Sharma");
        request.setEmail("rohan@university.edu");
        request.setPassword("StrongPass123!");

        when(userRepository.existsByEmailIgnoreCase("rohan@university.edu")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("mock.jwt.token");

        AuthResponse response = authService.registerStudent(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("rohan@university.edu", response.getUser().getEmail());
        assertEquals(Role.STUDENT, response.getUser().getRole());
        verify(emailService, times(1)).sendVerificationEmail(eq("rohan@university.edu"), eq("Rohan Sharma"), anyString());
    }

    @Test
    @DisplayName("Creator email cannot be registered through public student registration")
    void testRegisterStudentRejectsCreatorEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Attacker");
        request.setEmail(creatorEmail);
        request.setPassword("Attempt123!");

        assertThrows(BadRequestException.class, () -> authService.registerStudent(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Admin login allows specifically authorized creator email with valid password")
    void testAdminLoginSuccessForCreator() {
        LoginRequest request = new LoginRequest();
        request.setEmail(creatorEmail);
        request.setPassword("AdminMasterSecret!");

        User adminUser = new User();
        adminUser.setId("admin-001");
        adminUser.setName("Arkoparno");
        adminUser.setEmail(creatorEmail);
        adminUser.setRole(Role.ADMIN);
        adminUser.setPasswordHash("hashed_admin_pass");

        when(userRepository.findByEmailIgnoreCase(creatorEmail)).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("AdminMasterSecret!", "hashed_admin_pass")).thenReturn(true);
        when(jwtService.generateToken(adminUser)).thenReturn("admin.jwt.token");

        AuthResponse response = authService.loginAdmin(request);

        assertNotNull(response);
        assertEquals("admin.jwt.token", response.getToken());
        assertEquals(Role.ADMIN, response.getUser().getRole());
    }

    @Test
    @DisplayName("Admin login rejects non-creator email with ForbiddenException")
    void testAdminLoginRejectsNonCreator() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@gmail.com");
        request.setPassword("Secret123!");

        assertThrows(ForbiddenException.class, () -> authService.loginAdmin(request));
        verify(userRepository, never()).findByEmailIgnoreCase("student@gmail.com");
    }

    @Test
    @DisplayName("Admin password setup secures administrator account for creator email")
    void testSetupAdminPasswordSuccess() {
        SetupAdminPasswordRequest request = new SetupAdminPasswordRequest();
        request.setPassword("InitialAdminSecret2026!");

        when(userRepository.findByEmailIgnoreCase(creatorEmail)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("InitialAdminSecret2026!")).thenReturn("hashed_new_admin_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("admin.jwt.setup.token");

        AuthResponse response = authService.setupAdminPassword(request);

        assertNotNull(response);
        assertEquals(Role.ADMIN, response.getUser().getRole());
        assertEquals(creatorEmail, response.getUser().getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
