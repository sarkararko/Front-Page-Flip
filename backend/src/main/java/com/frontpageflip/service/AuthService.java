package com.frontpageflip.service;

import com.frontpageflip.dto.AuthDtos.*;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ForbiddenException;
import com.frontpageflip.exception.ResourceNotFoundException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.model.VerificationToken;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.security.creator-email:arkaparna.ds@gmail.com}")
    private String creatorEmail;

    public AuthService(UserRepository userRepository,
                       VerificationTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse registerStudent(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Creator cannot register via public student registration
        if (normalizedEmail.equalsIgnoreCase(creatorEmail.trim())) {
            throw new BadRequestException("This email address is reserved for administrator management.");
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = new User();
        user.setId("usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT); // STRICT: Never allow elevation during registration
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(false);
        user.setProvider("email");

        User savedUser = userRepository.save(user);

        // Generate verification token
        String tokenString = UUID.randomUUID().toString().replace("-", "");
        VerificationToken verificationToken = new VerificationToken(
                "vtok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                savedUser,
                tokenString,
                Instant.now().plus(24, ChronoUnit.HOURS)
        );
        tokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getName(), tokenString);

        String jwt = jwtService.generateToken(savedUser);
        UserDto userDto = toUserDto(savedUser);

        return new AuthResponse(jwt, userDto, "Registration successful. Please verify your email to access all study materials.");
    }

    public AuthResponse loginStudent(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            throw new ForbiddenException("Your account is currently disabled. Please contact support.");
        }

        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, toUserDto(user), "Login successful.");
    }

    @Transactional
    public AuthResponse loginAdmin(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // STRICT SECURITY: Only creator can authenticate as Admin
        if (!normalizedEmail.equalsIgnoreCase(creatorEmail.trim().toLowerCase())) {
            throw new ForbiddenException("Access is restricted strictly to the verified account creator.");
        }

        Optional<User> existingCreator = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existingCreator.isEmpty()) {
            throw new BadRequestException("Admin account is not initialized. Please run admin setup first.");
        }

        User admin = existingCreator.get();
        if (admin.getPasswordHash() == null) {
            throw new BadRequestException("Admin password has not been established. Please set up admin password.");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new UnauthorizedException("Invalid administrator credentials.");
        }

        String jwt = jwtService.generateToken(admin);
        return new AuthResponse(jwt, toUserDto(admin), "Admin authentication verified.");
    }

    @Transactional
    public AuthResponse setupAdminPassword(SetupAdminPasswordRequest request) {
        String normalizedCreator = creatorEmail.trim().toLowerCase();

        User admin = userRepository.findByEmailIgnoreCase(normalizedCreator).orElseGet(() -> {
            User newAdmin = new User();
            newAdmin.setId("admin_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            newAdmin.setName("Arkoparno (Admin)");
            newAdmin.setEmail(normalizedCreator);
            newAdmin.setRole(Role.ADMIN);
            newAdmin.setEmailVerified(true);
            newAdmin.setAccountStatus("ACTIVE");
            return newAdmin;
        });

        // Enforce role
        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        admin.setEmailVerified(true);
        User savedAdmin = userRepository.save(admin);

        String jwt = jwtService.generateToken(savedAdmin);
        return new AuthResponse(jwt, toUserDto(savedAdmin), "Admin credentials secured successfully.");
    }

    @Transactional
    public boolean verifyEmail(String tokenString) {
        VerificationToken token = tokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new BadRequestException("Invalid or unrecognized verification token."));

        if (token.isUsed()) {
            throw new BadRequestException("This verification token has already been used.");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This verification token has expired. Please request a new one.");
        }

        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        return true;
    }

    public UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return toUserDto(user);
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
