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
        String normalizedEmail = creatorEmail.trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existing.isEmpty()) {
            User admin = new User();
            admin.setId("usr_admin_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
            admin.setName("Front-Page Flip Admin");
            admin.setEmail(normalizedEmail);
            admin.setRole(Role.ADMIN);
            admin.setAccountStatus("ACTIVE");
            admin.setEmailVerified(true);
            admin.setProvider("email");

            if (adminInitialPassword != null && !adminInitialPassword.isBlank()) {
                admin.setPasswordHash(passwordEncoder.encode(adminInitialPassword));
                log.info("Initialized system administrator for configured creator account from environment variables.");
            } else {
                log.info("Provisioned administrator record for {}. Password can be established via setup endpoint or ADMIN_INITIAL_PASSWORD.", normalizedEmail);
            }
            userRepository.save(admin);
        } else {
            User admin = existing.get();
            // Ensure creator retains ADMIN role and is active
            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }
            // Update password from environment variable if provided
            if (adminInitialPassword != null && !adminInitialPassword.isBlank() && admin.getPasswordHash() == null) {
                admin.setPasswordHash(passwordEncoder.encode(adminInitialPassword));
                userRepository.save(admin);
                log.info("Updated administrator password for {} from environment variables.", normalizedEmail);
            }
        }
    }
}
