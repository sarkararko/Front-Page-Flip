package com.frontpageflip;

import com.frontpageflip.model.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class SecurityConfigTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    @DisplayName("BCrypt password encoder produces secure hashes and validates correctly")
    void testPasswordHashing() {
        String rawPassword = "StrongStudentPassword2026!";
        String hash = passwordEncoder.encode(rawPassword);

        assertNotNull(hash);
        assertNotEquals(rawPassword, hash);
        assertTrue(hash.startsWith("$2a$") || hash.startsWith("$2b$"));
        assertTrue(passwordEncoder.matches(rawPassword, hash));
        assertFalse(passwordEncoder.matches("WrongPassword123!", hash));
    }

    @Test
    @DisplayName("Roles are strictly defined as STUDENT and ADMIN")
    void testRoleDefinitions() {
        assertEquals("STUDENT", Role.STUDENT.name());
        assertEquals("ADMIN", Role.ADMIN.name());
        assertEquals(2, Role.values().length);
    }
}
