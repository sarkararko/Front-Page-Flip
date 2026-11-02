package com.frontpageflip.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class OAuth2Config {

    private static final Logger log = LoggerFactory.getLogger(OAuth2Config.class);

    @Value("${app.oauth.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${app.oauth.google.client-secret:${GOOGLE_CLIENT_SECRET:}}")
    private String googleClientSecret;

    @Value("${app.oauth.github.client-id:${GITHUB_CLIENT_ID:}}")
    private String githubClientId;

    @Value("${app.oauth.github.client-secret:${GITHUB_CLIENT_SECRET:}}")
    private String githubClientSecret;

    public boolean isGoogleConfigured() {
        return googleClientId != null &&
                !googleClientId.isBlank() &&
                !googleClientId.toLowerCase().contains("placeholder") &&
                !googleClientId.toLowerCase().contains("your-google-oauth-client-id");
    }

    public boolean isGithubConfigured() {
        return githubClientId != null &&
                !githubClientId.isBlank() &&
                !githubClientId.toLowerCase().contains("placeholder") &&
                !githubClientId.toLowerCase().contains("your-github-oauth-client-id");
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        List<ClientRegistration> registrations = new ArrayList<>();

        // 1. Google OAuth 2.0 / OpenID Connect Provider
        if (isGoogleConfigured()) {
            String cleanClientId = googleClientId.trim();
            log.info("Google OAuth provider configured successfully with Client ID prefix: {}***",
                    cleanClientId.length() > 12 ? cleanClientId.substring(0, 12) : "valid-id");
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(cleanClientId)
                    .clientSecret(googleClientSecret != null ? googleClientSecret.trim() : "")
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        } else {
            log.warn("GOOGLE_CLIENT_ID is not configured in Render environment variables. Google OAuth registration omitted to prevent 401 invalid_client.");
        }

        // 2. GitHub OAuth 2.0 Provider
        if (isGithubConfigured()) {
            String cleanClientId = githubClientId.trim();
            log.info("GitHub OAuth provider configured successfully with Client ID prefix: {}***",
                    cleanClientId.length() > 8 ? cleanClientId.substring(0, 8) : "valid-id");
            registrations.add(CommonOAuth2Provider.GITHUB.getBuilder("github")
                    .clientId(cleanClientId)
                    .clientSecret(githubClientSecret != null ? githubClientSecret.trim() : "")
                    .scope("read:user", "user:email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        } else {
            log.warn("GITHUB_CLIENT_ID is not configured in Render environment variables. GitHub OAuth registration omitted.");
        }

        // If neither is configured in environment, register a disabled dummy client
        // solely to satisfy Spring Security's non-empty InMemoryClientRegistrationRepository constraint
        if (registrations.isEmpty()) {
            log.warn("No OAuth2 providers configured. Registering disabled dummy client to satisfy container startup.");
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("unconfigured")
                    .clientId("unconfigured-client-id")
                    .clientSecret("unconfigured-client-secret")
                    .scope("openid")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        return new InMemoryClientRegistrationRepository(registrations);
    }
}
