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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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

    @Value("${app.security.admin-initial-password:${ADMIN_INITIAL_PASSWORD:}}")
    private String adminInitialPassword;


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
     * Check email availability directly against Aiven Cloud MySQL users table.
     */
    @Transactional(readOnly = true)
    public EmailAvailabilityResponse checkEmailAvailability(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty()) {
            throw new BadRequestException("Please enter a valid email address.");
        }
        String normalizedEmail = rawEmail.trim().toLowerCase();

        if (normalizedEmail.equalsIgnoreCase(getNormalizedCreatorEmail())) {
            return new EmailAvailabilityResponse(
                    true,
                    true,
                    normalizedEmail,
                    "This email address is reserved for system administration."
            );
        }

        boolean exists = userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (exists) {
            return new EmailAvailabilityResponse(
                    true,
                    false,
                    normalizedEmail,
                    "An account with this email address already exists. Please sign in instead or use Forgot Password if you cannot access your account."
            );
        }

        return new EmailAvailabilityResponse(
                false,
                false,
                normalizedEmail,
                "Email address is available."
        );
    }

    /**
     * Public Student Registration.
     * Assigns ROLE_STUDENT (never ADMIN). Generates 6-digit verification code and dispatches Brevo email.
     */
    @Transactional
    public AuthResponse registerStudent(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Creator email cannot register as student
        if (normalizedEmail.equalsIgnoreCase(getNormalizedCreatorEmail())) {
            throw new BadRequestException("This email address is reserved for system administration.");
        }

        // Check if an account with this email address already exists in the database
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            throw new BadRequestException("An account with this email address already exists. Please sign in instead or use Forgot Password if you cannot access your account.");
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

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Only report duplicate account if the email genuinely exists in MySQL
            if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new BadRequestException("An account with this email address already exists. Please sign in instead or use Forgot Password if you cannot access your account.");
            }
            throw e;
        }

        // Generate 6-digit numeric OTP verification code
        String code = generateNumericOtp(6);
        saveVerificationToken(savedUser, code, 24, ChronoUnit.HOURS);

        boolean sent = emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getName(), code);
        if (!sent) {
            String detail = emailService.getLastErrorMessage();
            throw new BadRequestException("Verification email delivery failed via Brevo" +
                    (detail != null && !detail.isBlank() ? ": " + detail : ". Please check your email configuration and retry."));
        }

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
            throw new BadRequestException("A verification email was requested recently. Please check your inbox or wait 60 seconds before trying again.");
        }

        String code = generateNumericOtp(6);
        saveVerificationToken(user, code, 24, ChronoUnit.HOURS);

        user.setLastVerificationSentAt(Instant.now());
        userRepository.save(user);

        boolean sent = emailService.sendVerificationEmail(user.getEmail(), user.getName(), code);
        if (!sent) {
            String detail = emailService.getLastErrorMessage();
            throw new BadRequestException("Verification email delivery failed via Brevo" +
                    (detail != null && !detail.isBlank() ? ": " + detail : ". Please check your email configuration and retry."));
        }

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

            if (!canSend) {
                throw new BadRequestException("A password recovery email was requested recently. Please check your inbox or wait 60 seconds before trying again.");
            }

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

            boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), code);
            if (!sent) {
                String detail = emailService.getLastErrorMessage();
                throw new BadRequestException("Password recovery email delivery failed via Brevo" +
                        (detail != null && !detail.isBlank() ? ": " + detail : ". Please check your email configuration and retry."));
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

    public String getNormalizedCreatorEmail() {
        if (creatorEmail == null || creatorEmail.isBlank()) {
            return "arkaparna.ds@gmail.com";
        }
        return creatorEmail.trim().toLowerCase();
    }


    /**
     * Separate Administrator Authentication.
     * Restricted to configured creator account.
     * Does NOT require Brevo email verification or OTP.
     * Safely verifies BCrypt password and transparently upgrades legacy hashes.
     */
    @Transactional
    public AuthResponse loginAdmin(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String creator = getNormalizedCreatorEmail();

        // STRICT SECURITY: Only configured creator email can authenticate as Admin
        if (!normalizedEmail.equalsIgnoreCase(creator)) {
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

        // If password is not yet established
        if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
            if (adminInitialPassword != null && !adminInitialPassword.isBlank() &&
                    adminInitialPassword.trim().equals(request.getPassword().trim())) {
                admin.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
                userRepository.save(admin);
                log.info("Established administrator password for creator from ADMIN_INITIAL_PASSWORD.");
            } else {
                throw new UnauthorizedException("Administrator credentials not yet established. Please configure ADMIN_INITIAL_PASSWORD in Render or complete setup.");
            }
        }

        boolean matches = checkAndUpgradePassword(admin, request.getPassword());
        if (!matches) {
            // Also check if entered password directly matches ADMIN_INITIAL_PASSWORD from environment
            if (adminInitialPassword != null && !adminInitialPassword.isBlank() &&
                    adminInitialPassword.trim().equals(request.getPassword().trim())) {
                admin.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
                userRepository.save(admin);
                matches = true;
                log.info("Synchronized administrator password with configured ADMIN_INITIAL_PASSWORD.");
            }
        }

        if (!matches) {
            throw new UnauthorizedException("Incorrect administrator passphrase.");
        }

        String jwt = jwtService.generateToken(admin);
        return new AuthResponse(jwt, toUserDto(admin), "Admin authentication verified.");
    }

    /**
     * Initial Admin Password Setup for Creator.
     * Only permitted if administrator password has not been established yet.
     */
    @Transactional
    public AuthResponse setupAdminPassword(SetupAdminPasswordRequest request) {
        String normalizedCreator = getNormalizedCreatorEmail();

        User admin = userRepository.findByEmailIgnoreCase(normalizedCreator).orElseGet(() -> {
            User newAdmin = new User();
            newAdmin.setId("usr_admin_creator");
            newAdmin.setName("Front-Page Flip Admin");
            newAdmin.setEmail(normalizedCreator);
            newAdmin.setRole(Role.ADMIN);
            newAdmin.setEmailVerified(true);
            newAdmin.setAccountStatus("ACTIVE");
            return newAdmin;
        });

        if (admin.getPasswordHash() != null && !admin.getPasswordHash().isBlank()) {
            throw new ForbiddenException("Administrator credentials already established. To update credentials, please use the password reset flow or set ADMIN_INITIAL_PASSWORD in Render.");
        }

        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        admin.setEmailVerified(true);
        User savedAdmin = userRepository.save(admin);

        String jwt = jwtService.generateToken(savedAdmin);
        return new AuthResponse(jwt, toUserDto(savedAdmin), "Admin credentials secured successfully.");
    }

    /**
     * Verify password using standard BCrypt and transparently upgrade legacy formats.
     */
    private boolean checkAndUpgradePassword(User user, String rawPassword) {
        if (user == null || user.getPasswordHash() == null || rawPassword == null) {
            return false;
        }
        String storedHash = user.getPasswordHash().trim();
        String trimmedRaw = rawPassword.trim();

        // 1. Standard BCrypt verification (handles $2a$, $2b$, $2y$)
        if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
            return passwordEncoder.matches(trimmedRaw, storedHash) || passwordEncoder.matches(rawPassword, storedHash);
        }

        // 2. Legacy Plain Text match: if previously saved in plain text
        if (storedHash.equals(rawPassword) || storedHash.equals(trimmedRaw)) {
            user.setPasswordHash(passwordEncoder.encode(trimmedRaw));
            userRepository.save(user);
            log.info("Upgraded administrator password hash from plain text to BCrypt.");
            return true;
        }

        // 3. Legacy SHA-256 match: check client-side salt from storage.ts: SHA-256(password + '_fpf_salt_sec_2026')
        String shaSaltedRaw = computeSha256(rawPassword + "_fpf_salt_sec_2026");
        String shaSaltedTrimmed = computeSha256(trimmedRaw + "_fpf_salt_sec_2026");
        String shaPlainRaw = computeSha256(rawPassword);
        String shaPlainTrimmed = computeSha256(trimmedRaw);

        if (storedHash.equalsIgnoreCase(shaSaltedRaw) || storedHash.equalsIgnoreCase(shaSaltedTrimmed) ||
                storedHash.equalsIgnoreCase(shaPlainRaw) || storedHash.equalsIgnoreCase(shaPlainTrimmed)) {
            user.setPasswordHash(passwordEncoder.encode(trimmedRaw));
            userRepository.save(user);
            log.info("Upgraded administrator password hash from legacy SHA-256 to BCrypt.");
            return true;
        }

        return false;
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "";
        }
    }


    public UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return toUserDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(String userId, String newName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        if (newName != null && !newName.trim().isBlank()) {
            user.setName(newName.trim());
            User saved = userRepository.save(user);
            return toUserDto(saved);
        }
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
        UserDto dto = new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAccountStatus(),
                user.isEmailVerified()
        );
        dto.setProvider(user.getProvider());
        dto.setGolden(user.isGolden());
        dto.setGoldenPlan(user.getGoldenPlan());
        dto.setPaymentStatus(user.getPaymentStatus());
        if (user.getCreatedAt() != null) {
            dto.setCreatedAt(user.getCreatedAt().toString());
        }
        return dto;
    }
}
