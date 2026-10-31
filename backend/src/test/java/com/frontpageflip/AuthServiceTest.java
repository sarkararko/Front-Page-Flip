package com.frontpageflip;

import com.frontpageflip.dto.AuthDtos.*;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.PasswordResetToken;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.model.VerificationToken;
import com.frontpageflip.repository.PasswordResetTokenRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

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
                verificationTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                jwtService,
                emailService
        );
        ReflectionTestUtils.setField(authService, "creatorEmail", creatorEmail);
    }

    @Test
    @DisplayName("Student registration assigns STUDENT role and dispatches Brevo verification email")
    void testRegisterStudentSuccess() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Rohan Sharma");
        request.setEmail("rohan@university.edu");
        request.setPassword("StrongPass123!");

        when(userRepository.findByEmailIgnoreCase("rohan@university.edu")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(verificationTokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.registerStudent(request);

        assertNotNull(response);
        assertTrue(response.isRequiresVerification());
        assertEquals("rohan@university.edu", response.getUser().getEmail());
        assertEquals(Role.STUDENT, response.getUser().getRole());
        assertFalse(response.getUser().isEmailVerified());
        verify(emailService, times(1)).sendVerificationEmail(eq("rohan@university.edu"), eq("Rohan Sharma"), anyString());
    }

    @Test
    @DisplayName("Unverified student cannot log in until email is verified")
    void testUnverifiedStudentCannotLogin() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@university.edu");
        request.setPassword("Password123!");

        User student = new User("usr-1", "Test Student", "student@university.edu", Role.STUDENT);
        student.setPasswordHash("hashed_pass");
        student.setEmailVerified(false); // Not verified yet

        when(userRepository.findByEmailIgnoreCase("student@university.edu")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("Password123!", "hashed_pass")).thenReturn(true);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.loginStudent(request));
        assertTrue(ex.getMessage().contains("not verified"));
    }

    @Test
    @DisplayName("Verified student can log in successfully")
    void testVerifiedStudentCanLogin() {
        LoginRequest request = new LoginRequest();
        request.setEmail("verified@university.edu");
        request.setPassword("Password123!");

        User student = new User("usr-2", "Verified Student", "verified@university.edu", Role.STUDENT);
        student.setPasswordHash("hashed_pass");
        student.setEmailVerified(true);

        when(userRepository.findByEmailIgnoreCase("verified@university.edu")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("Password123!", "hashed_pass")).thenReturn(true);
        when(jwtService.generateToken(student)).thenReturn("jwt.student.token");

        AuthResponse response = authService.loginStudent(request);

        assertNotNull(response);
        assertEquals("jwt.student.token", response.getToken());
        assertTrue(response.getUser().isEmailVerified());
    }

    @Test
    @DisplayName("Email verification succeeds with valid token")
    void testVerifyEmailSuccess() {
        VerificationRequest request = new VerificationRequest();
        request.setEmail("rohan@university.edu");
        request.setToken("123456");

        User student = new User("usr-1", "Rohan", "rohan@university.edu", Role.STUDENT);
        student.setEmailVerified(false);

        VerificationToken vToken = new VerificationToken("vt-1", student, "123456", Instant.now().plus(24, ChronoUnit.HOURS));

        when(userRepository.findByEmailIgnoreCase("rohan@university.edu")).thenReturn(Optional.of(student));
        when(verificationTokenRepository.findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc("usr-1"))
                .thenReturn(Optional.of(vToken));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt.verified.token");

        AuthResponse response = authService.verifyEmail(request);

        assertNotNull(response);
        assertTrue(response.getUser().isEmailVerified());
        assertNotNull(vToken.getUsedAt());
        verify(verificationTokenRepository, times(1)).save(vToken);
    }

    @Test
    @DisplayName("Forgot password dispatches single-use recovery code and reset password applies it")
    void testForgotPasswordAndResetFlow() {
        User student = new User("usr-3", "Reset User", "student@school.edu", Role.STUDENT);
        student.setPasswordHash("old_hashed_pass");

        when(userRepository.findByEmailIgnoreCase("student@school.edu")).thenReturn(Optional.of(student));

        // 1. Forgot Password request
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("student@school.edu");
        GenericResponse forgotResp = authService.forgotPassword(forgotReq);
        assertTrue(forgotResp.isSuccess());
        verify(emailService, times(1)).sendPasswordResetEmail(eq("student@school.edu"), eq("Reset User"), anyString());

        // 2. Reset Password request
        PasswordResetToken resetToken = new PasswordResetToken(
                "prt-1",
                student,
                "654321",
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );

        when(passwordResetTokenRepository.findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc("usr-3"))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("NewSecret123!")).thenReturn("new_hashed_pass");

        ResetPasswordRequest resetReq = new ResetPasswordRequest();
        resetReq.setEmail("student@school.edu");
        resetReq.setToken("654321");
        resetReq.setNewPassword("NewSecret123!");

        GenericResponse resetResp = authService.resetPassword(resetReq);
        assertTrue(resetResp.isSuccess());
        assertTrue(resetToken.isUsed());
        assertEquals("new_hashed_pass", student.getPasswordHash());
    }

    @Test
    @DisplayName("Creator email cannot register as student via public registration")
    void testRegisterStudentRejectsCreatorEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Attacker");
        request.setEmail(creatorEmail);
        request.setPassword("Attempt123!");

        assertThrows(BadRequestException.class, () -> authService.registerStudent(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Admin login authenticates creator with BCrypt password without requiring OTP")
    void testAdminLoginSuccessForCreator() {
        LoginRequest request = new LoginRequest();
        request.setEmail(creatorEmail);
        request.setPassword("AdminMasterSecret!");

        User adminUser = new User("admin-001", "Administrator", creatorEmail, Role.ADMIN);
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
    @DisplayName("Admin login returns generic UnauthorizedException on non-creator email")
    void testAdminLoginRejectsNonCreator() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@gmail.com");
        request.setPassword("Secret123!");

        assertThrows(UnauthorizedException.class, () -> authService.loginAdmin(request));
        verify(userRepository, never()).findByEmailIgnoreCase("student@gmail.com");
    }
}
