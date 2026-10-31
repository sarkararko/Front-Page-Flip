package com.frontpageflip.config;

import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.mail.frontend-url:${FRONTEND_URL:https://frontpageflip.vercel.app}}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            String errorUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(frontendUrl))
                    .fragment("auth-error?message=" + URLEncoder.encode("Email address was not provided by Google account.", StandardCharsets.UTF_8))
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }

        email = email.trim().toLowerCase();
        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            // STRICT SECURITY: Google OAuth must NEVER authenticate or grant administrator privileges
            if (user.getRole() == Role.ADMIN) {
                log.warn("Blocked Google login attempt for designated administrator account: {}", email);
                String errorUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(frontendUrl))
                        .fragment("auth-error?message=" + URLEncoder.encode("Administrator accounts must sign in using the dedicated Administrator Portal.", StandardCharsets.UTF_8))
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, errorUrl);
                return;
            }

            // Safely link verified student account
            user.setEmailVerified(true);
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
        } else {
            // First-time student account creation in MySQL
            user = new User();
            user.setId("usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            user.setName(name);
            user.setEmail(email);
            user.setRole(Role.STUDENT); // STRICT: Google OAuth public logins ALWAYS yield student role
            user.setAccountStatus("ACTIVE");
            user.setEmailVerified(true); // Pre-verified by Google OIDC
            user.setProvider("google");
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
            log.info("New student account successfully registered via Google OAuth: {}", email);
        }

        String jwt = jwtService.generateToken(user);

        // Redirect back to frontend with JWT and student profile info
        String targetUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(frontendUrl))
                .fragment(String.format("auth-success?token=%s&userId=%s&email=%s&name=%s&role=student",
                        URLEncoder.encode(jwt, StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getId(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)))
                .build().toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String sanitizeFrontendUrl(String url) {
        if (url == null || url.isBlank()) {
            return "https://frontpageflip.vercel.app";
        }
        String clean = url.trim();
        if (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        return clean;
    }
}
