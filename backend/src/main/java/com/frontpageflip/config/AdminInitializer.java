package com.frontpageflip.config;

import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Initializes the designated creator account as the sole system administrator.
 * Credentials and seed behavior are controlled via secure environment variables.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.creator-email:arkaparna.ds@gmail.com}")
    private String creatorEmail;

    @Value("${app.security.admin-initial-password:${ADMIN_INITIAL_PASSWORD:}}")
    private String adminInitialPassword;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String normalizedEmail = (creatorEmail != null && !creatorEmail.isBlank())
                ? creatorEmail.trim().toLowerCase()
                : "arkaparna.ds@gmail.com";

        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existing.isEmpty()) {
            User admin = new User();
            admin.setId("usr_admin_creator");
            admin.setName("Front-Page Flip Admin");
            admin.setEmail(normalizedEmail);
            admin.setRole(Role.ADMIN);
            admin.setAccountStatus("ACTIVE");
            admin.setEmailVerified(true);
            admin.setProvider("email");

            if (adminInitialPassword != null && !adminInitialPassword.isBlank()) {
                admin.setPasswordHash(passwordEncoder.encode(adminInitialPassword.trim()));
                log.info("Initialized system administrator for configured creator account from ADMIN_INITIAL_PASSWORD.");
            } else {
                log.info("Provisioned administrator record for {}. Password can be established via ADMIN_INITIAL_PASSWORD or setup.", normalizedEmail);
            }
            userRepository.save(admin);
        } else {
            User admin = existing.get();
            boolean updated = false;

            // Ensure creator retains active ADMIN role and verified status
            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
                updated = true;
            }
            if (!admin.isEmailVerified()) {
                admin.setEmailVerified(true);
                updated = true;
            }
            if (!"ACTIVE".equalsIgnoreCase(admin.getAccountStatus())) {
                admin.setAccountStatus("ACTIVE");
                updated = true;
            }

            // If ADMIN_INITIAL_PASSWORD is provided in environment variables,
            // ensure the database password matches this configured environment variable
            if (adminInitialPassword != null && !adminInitialPassword.isBlank()) {
                String trimmedPass = adminInitialPassword.trim();
                if (admin.getPasswordHash() == null || !passwordEncoder.matches(trimmedPass, admin.getPasswordHash())) {
                    admin.setPasswordHash(passwordEncoder.encode(trimmedPass));
                    updated = true;
                    log.info("Synchronized administrator password for {} from ADMIN_INITIAL_PASSWORD environment variable.", normalizedEmail);
                }
            }

            if (updated) {
                userRepository.save(admin);
            }
        }
    }
}
