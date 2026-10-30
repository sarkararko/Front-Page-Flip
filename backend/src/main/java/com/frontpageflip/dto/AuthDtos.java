package com.frontpageflip.dto;

import com.frontpageflip.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        private boolean rememberMe;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public boolean isRememberMe() { return rememberMe; }
        public void setRememberMe(boolean rememberMe) { this.rememberMe = rememberMe; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class SetupAdminPasswordRequest {
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
        private String password;

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class VerificationRequest {
        @NotBlank(message = "Token is required")
        private String token;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class UserDto {
        private String id;
        private String name;
        private String email;
        private Role role;
        private String accountStatus;
        private boolean emailVerified;
        private String avatar;

        public UserDto() {}

        public UserDto(String id, String name, String email, Role role, String accountStatus, boolean emailVerified) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.accountStatus = accountStatus;
            this.emailVerified = emailVerified;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }

        public String getAccountStatus() { return accountStatus; }
        public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

        public boolean isEmailVerified() { return emailVerified; }
        public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
    }

    public static class AuthResponse {
        private String token;
        private UserDto user;
        private String message;

        public AuthResponse() {}

        public AuthResponse(String token, UserDto user, String message) {
            this.token = token;
            this.user = user;
            this.message = message;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
