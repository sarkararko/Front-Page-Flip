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

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        List<ClientRegistration> registrations = new ArrayList<>();

        // 1. Google OAuth 2.0 / OpenID Connect Provider
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.contains("placeholder")) {
            log.info("Google OAuth provider configured successfully with Client ID prefix: {}***",
                    googleClientId.trim().length() > 12 ? googleClientId.trim().substring(0, 12) : "valid-id");
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(googleClientId.trim())
                    .clientSecret(googleClientSecret != null ? googleClientSecret.trim() : "")
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        } else {
            log.warn("GOOGLE_CLIENT_ID is not configured in Render environment variables. Falling back to placeholder registration.");
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId("placeholder-google-client-id.apps.googleusercontent.com")
                    .clientSecret("placeholder-google-client-secret")
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        // 2. GitHub OAuth 2.0 Provider
        if (githubClientId != null && !githubClientId.isBlank() && !githubClientId.contains("placeholder")) {
            log.info("GitHub OAuth provider configured successfully with Client ID prefix: {}***",
                    githubClientId.trim().length() > 8 ? githubClientId.trim().substring(0, 8) : "valid-id");
            registrations.add(CommonOAuth2Provider.GITHUB.getBuilder("github")
                    .clientId(githubClientId.trim())
                    .clientSecret(githubClientSecret != null ? githubClientSecret.trim() : "")
                    .scope("read:user", "user:email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        } else {
            log.warn("GITHUB_CLIENT_ID is not configured in Render environment variables. Falling back to placeholder registration.");
            registrations.add(CommonOAuth2Provider.GITHUB.getBuilder("github")
                    .clientId("placeholder-github-client-id")
                    .clientSecret("placeholder-github-client-secret")
                    .scope("read:user", "user:email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        return new InMemoryClientRegistrationRepository(registrations);
    }
}
