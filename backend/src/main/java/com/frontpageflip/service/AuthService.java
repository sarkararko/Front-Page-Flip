package com.frontpageflip.service;

import com.frontpageflip.dto.AuthDtos.*;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ForbiddenException;
import com.frontpageflip.exception.ResourceNotFoundException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.PasswordResetToken;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.model.VerificationToken;
import com.frontpageflip.repository.PasswordResetTokenRepository;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.repository.VerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.security.creator-email:arkaparna.ds@gmail.com}")
    private String creatorEmail;

    public AuthService(UserRepository userRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    /**
     * Public Student Registration.
     * Assigns ROLE_STUDENT (never ADMIN). Generates 6-digit verification code and dispatches Brevo email.
     */
    @Transactional
    public AuthResponse registerStudent(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Creator email cannot register as student
        if (normalizedEmail.equalsIgnoreCase(creatorEmail.trim().toLowerCase())) {
            throw new BadRequestException("This email address is reserved for system administration.");
        }

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.isEmailVerified()) {
                // Generic response to avoid email enumeration
                return new AuthResponse(null, null,
                        "If this email is eligible, account verification instructions have been dispatched. Please check your inbox.",
                        true);
            } else {
                // Existing unverified student: update name/password and send fresh OTP
                existing.setName(request.getName().trim());
                existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                existing.setLastVerificationSentAt(Instant.now());
                User saved = userRepository.save(existing);

                String code = generateNumericOtp(6);
                saveVerificationToken(saved, code, 24, ChronoUnit.HOURS);
                emailService.sendVerificationEmail(saved.getEmail(), saved.getName(), code);

                return new AuthResponse(null, toUserDto(saved),
                        "A new 6-digit verification code has been dispatched to your email address.",
                        true);
            }
        }

        User user = new User();
        user.setId("usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT); // STRICT: Public registration can only yield student role
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(false);
        user.setProvider("email");
        user.setLastVerificationSentAt(Instant.now());

        User savedUser = userRepository.save(user);

        // Generate 6-digit numeric OTP verification code
        String code = generateNumericOtp(6);
        saveVerificationToken(savedUser, code, 24, ChronoUnit.HOURS);

        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getName(), code);

        return new AuthResponse(
                null,
                toUserDto(savedUser),
                "Registration successful! Please check your email for your 6-digit verification code.",
                true
        );
    }

    /**
     * Student Login.
     * Enforces that student email must be verified prior to login.
     */
    public AuthResponse loginStudent(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            throw new ForbiddenException("Your account is currently disabled. Please contact support.");
        }

        // STRICT: Allow student login only after email verification
        if (!user.isEmailVerified()) {
            throw new UnauthorizedException("Your email address is not verified yet. Please enter the verification code sent to your email.");
        }

        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, toUserDto(user), "Login successful.");
    }

    /**
     * Google Student OAuth authentication.
     * Safely links existing student or registers new student with ROLE_STUDENT.
     * Never grants administrator access.
     */
    @Transactional
    public AuthResponse authenticateGoogleStudent(GoogleAuthRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String name = request.getName() != null && !request.getName().isBlank() ? request.getName().trim() : email.split("@")[0];

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            // STRICT SECURITY: Google OAuth must NEVER authenticate as Admin
            if (user.getRole() == Role.ADMIN) {
                throw new ForbiddenException("Administrator accounts must sign in using the dedicated Administrator Portal.");
            }
            user.setEmailVerified(true);
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
        } else {
            user = new User();
            user.setId("usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            user.setName(name);
            user.setEmail(email);
            user.setRole(Role.STUDENT); // STRICT: Always Role.STUDENT
            user.setAccountStatus("ACTIVE");
            user.setEmailVerified(true);
            user.setProvider("google");
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
        }

        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, toUserDto(user), "Google authentication successful.");
    }

    /**
     * Verify email with 6-digit code or token.
     */
    @Transactional
    public AuthResponse verifyEmail(VerificationRequest request) {
        String code = request.getToken().trim();
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;

        VerificationToken token = null;

        if (email != null && !email.isBlank()) {
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
            if (userOpt.isPresent()) {
                String userId = userOpt.get().getId();
                Optional<VerificationToken> userToken = verificationTokenRepository
                        .findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(userId);
                if (userToken.isPresent() && userToken.get().getToken().equalsIgnoreCase(code)) {
                    token = userToken.get();
                }
            }
        }

        if (token == null) {
            token = verificationTokenRepository.findByTokenAndUsedAtIsNull(code)
                    .orElseThrow(() -> new BadRequestException("Invalid or unrecognized verification code."));
        }

        if (token.isUsed()) {
            throw new BadRequestException("This verification code has already been used.");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This verification code has expired. Please request a new code.");
        }

        token.setUsedAt(Instant.now());
        verificationTokenRepository.save(token);

        User user = token.getUser();
        user.setEmailVerified(true);
        User savedUser = userRepository.save(user);

        String jwt = jwtService.generateToken(savedUser);
        return new AuthResponse(jwt, toUserDto(savedUser), "Email verified successfully! You now have full access to study materials.");
    }

    /**
     * Resend verification email with 60-second cooldown rate limit.
     * Uses generic response to avoid email enumeration.
     */
    @Transactional
    public GenericResponse resendVerification(ResendVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            // Generic response to avoid enumeration
            return new GenericResponse(true, "If an unverified account exists for this email address, a new verification code has been dispatched.");
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            return new GenericResponse(true, "Your email is already verified. You can proceed directly to sign in.");
        }

        // Rate limit: 60-second cooldown
        if (user.getLastVerificationSentAt() != null &&
                Instant.now().isBefore(user.getLastVerificationSentAt().plusSeconds(60))) {
            return new GenericResponse(true, "A verification email was requested recently. Please check your inbox or wait a moment before trying again.");
        }

        String code = generateNumericOtp(6);
        saveVerificationToken(user, code, 24, ChronoUnit.HOURS);

        user.setLastVerificationSentAt(Instant.now());
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), code);

        return new GenericResponse(true, "If an unverified account exists for this email address, a new verification code has been dispatched.");
    }

    /**
     * Forgot Password request.
     * Generates single-use 6-digit code with 15-minute expiry.
     * Generic response prevents email enumeration.
     */
    @Transactional
    public GenericResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Rate limit: 60-second cooldown
            boolean canSend = user.getLastPasswordResetSentAt() == null ||
                    Instant.now().isAfter(user.getLastPasswordResetSentAt().plusSeconds(60));

            if (canSend) {
                String code = generateNumericOtp(6);
                PasswordResetToken resetToken = new PasswordResetToken(
                        "prt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                        user,
                        code,
                        Instant.now().plus(15, ChronoUnit.MINUTES) // 15-minute expiry
                );
                passwordResetTokenRepository.save(resetToken);

                user.setLastPasswordResetSentAt(Instant.now());
                userRepository.save(user);

                emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), code);
            }
        }

        return new GenericResponse(true, "If an account exists for this email address, password recovery instructions have been dispatched.");
    }

    /**
     * Reset password using single-use 6-digit code.
     */
    @Transactional
    public GenericResponse resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String code = request.getToken().trim();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset code."));

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(t -> t.getToken().equalsIgnoreCase(code))
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset code."));

        if (resetToken.isExpired()) {
            throw new BadRequestException("This password reset code has expired. Please request a new code.");
        }

        // Apply new password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token used immediately to prevent reuse
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        return new GenericResponse(true, "Password has been reset successfully. You can now log in with your new password.");
    }

    /**
     * Separate Administrator Authentication.
     * Restricted to configured creator account.
     * Does NOT require Brevo email verification or OTP.
     * Generic error responses prevent disclosure.
     */
    @Transactional
    public AuthResponse loginAdmin(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // STRICT SECURITY: Only configured creator email can authenticate as Admin
        if (!normalizedEmail.equalsIgnoreCase(creatorEmail.trim().toLowerCase())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        Optional<User> existingCreator = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingCreator.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        User admin = existingCreator.get();
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (admin.getPasswordHash() == null) {
            throw new UnauthorizedException("Administrator credentials not yet established.");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String jwt = jwtService.generateToken(admin);
        return new AuthResponse(jwt, toUserDto(admin), "Admin authentication verified.");
    }

    /**
     * Initial Admin Password Setup for Creator.
     */
    @Transactional
    public AuthResponse setupAdminPassword(SetupAdminPasswordRequest request) {
        String normalizedCreator = creatorEmail.trim().toLowerCase();

        User admin = userRepository.findByEmailIgnoreCase(normalizedCreator).orElseGet(() -> {
            User newAdmin = new User();
            newAdmin.setId("admin_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            newAdmin.setName("System Administrator");
            newAdmin.setEmail(normalizedCreator);
            newAdmin.setRole(Role.ADMIN);
            newAdmin.setEmailVerified(true);
            newAdmin.setAccountStatus("ACTIVE");
            return newAdmin;
        });

        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        admin.setEmailVerified(true);
        User savedAdmin = userRepository.save(admin);

        String jwt = jwtService.generateToken(savedAdmin);
        return new AuthResponse(jwt, toUserDto(savedAdmin), "Admin credentials secured successfully.");
    }

    public UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return toUserDto(user);
    }

    private void saveVerificationToken(User user, String code, long duration, ChronoUnit unit) {
        VerificationToken verificationToken = new VerificationToken(
                "vtok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                user,
                code,
                Instant.now().plus(duration, unit)
        );
        verificationTokenRepository.save(verificationToken);
    }

    private String generateNumericOtp(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }

    public static UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAccountStatus(),
                user.isEmailVerified()
        );
    }
}
