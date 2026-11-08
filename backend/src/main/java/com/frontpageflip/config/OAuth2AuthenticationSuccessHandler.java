package com.frontpageflip.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.mail.frontend-url:${FRONTEND_URL:https://frontpageflip.vercel.app}}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository,
                                              JwtService jwtService,
                                              OAuth2AuthorizedClientService authorizedClientService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authorizedClientService = authorizedClientService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String provider = "google";
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            provider = oauthToken.getAuthorizedClientRegistrationId().toLowerCase();
        }

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // GitHub often returns display name in "login" if "name" is unset
        if (name == null || name.isBlank()) {
            name = oAuth2User.getAttribute("login");
        }

        // If email was not exposed in default profile (common in GitHub private email settings),
        // query GitHub's authenticated /user/emails endpoint using the OAuth2 access token
        if ((email == null || email.isBlank()) && "github".equalsIgnoreCase(provider)) {
            if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
                OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                        oauthToken.getAuthorizedClientRegistrationId(),
                        oauthToken.getName()
                );
                if (client != null && client.getAccessToken() != null) {
                    email = fetchGitHubPrimaryVerifiedEmail(client.getAccessToken().getTokenValue());
                }
            }
        }

        // Determine effective frontend URL: check session attribute 'oauth_frontend_url' first, else fallback to configured frontendUrl
        String effectiveFrontend = null;
        try {
            jakarta.servlet.http.HttpSession session = request.getSession(false);
            if (session != null) {
                effectiveFrontend = (String) session.getAttribute("oauth_frontend_url");
            }
        } catch (Exception ignored) {}

        if (effectiveFrontend == null || effectiveFrontend.isBlank()) {
            effectiveFrontend = frontendUrl;
        }

        if (email == null || email.isBlank()) {
            String errorMsg = "github".equalsIgnoreCase(provider)
                    ? "No verified email address found on your GitHub account. Please ensure your GitHub account has a verified email address."
                    : "Email address was not provided by Google account.";
            String errorUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(effectiveFrontend))
                    .fragment("auth-error?message=" + URLEncoder.encode(errorMsg, StandardCharsets.UTF_8))
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
            // STRICT SECURITY: Social OAuth must NEVER authenticate or grant administrator privileges
            if (user.getRole() == Role.ADMIN) {
                log.warn("Blocked {} login attempt for designated administrator account: {}", provider, email);
                String errorUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(effectiveFrontend))
                        .fragment("auth-error?message=" + URLEncoder.encode("Administrator accounts must sign in using the dedicated Administrator Portal.", StandardCharsets.UTF_8))
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, errorUrl);
                return;
            }

            // Safely link verified student account and refresh activity
            user.setEmailVerified(true);
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
        } else {
            // First-time student account creation in MySQL
            user = new User();
            user.setId("usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            user.setName(name);
            user.setEmail(email);
            user.setRole(Role.STUDENT); // STRICT: Social OAuth public logins ALWAYS yield student role
            user.setAccountStatus("ACTIVE");
            user.setEmailVerified(true); // Pre-verified by OAuth identity provider
            user.setProvider(provider);
            user.setLastActiveAt(Instant.now());
            user = userRepository.save(user);
            log.info("New student account successfully registered via {} OAuth: {}", provider, email);
        }

        String jwt = jwtService.generateToken(user);

        // Redirect back to frontend with JWT and student profile info
        String targetUrl = UriComponentsBuilder.fromUriString(sanitizeFrontendUrl(effectiveFrontend))
                .fragment(String.format("auth-success?token=%s&userId=%s&email=%s&name=%s&role=student&provider=%s",
                        URLEncoder.encode(jwt, StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getId(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getName(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getProvider(), StandardCharsets.UTF_8)))
                .build().toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    /**
     * Safely calls GitHub API /user/emails with OAuth access token to retrieve the primary verified email.
     */
    private String fetchGitHubPrimaryVerifiedEmail(String accessToken) {
        try {
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user/emails"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/vnd.github+json")
                    .header("User-Agent", "Front-Page-Flip-App")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.isArray()) {
                    String fallbackVerified = null;
                    for (JsonNode node : root) {
                        boolean verified = node.path("verified").asBoolean(false);
                        boolean primary = node.path("primary").asBoolean(false);
                        String emailVal = node.path("email").asText(null);

                        if (verified && emailVal != null && !emailVal.isBlank()) {
                            if (primary) {
                                return emailVal.trim().toLowerCase();
                            }
                            if (fallbackVerified == null) {
                                fallbackVerified = emailVal.trim().toLowerCase();
                            }
                        }
                    }
                    return fallbackVerified;
                }
            } else {
                log.warn("GitHub /user/emails returned HTTP status: {}", response.statusCode());
            }
        } catch (Exception e) {
            log.error("Failed to fetch verified email from GitHub API: {}", e.getMessage());
        }
        return null;
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
