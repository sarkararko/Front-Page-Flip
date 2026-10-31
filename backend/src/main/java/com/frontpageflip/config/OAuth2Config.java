package com.frontpageflip.config;

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

    @Value("${app.oauth.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${app.oauth.google.client-secret:${GOOGLE_CLIENT_SECRET:}}")
    private String googleClientSecret;

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        List<ClientRegistration> registrations = new ArrayList<>();

        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.contains("placeholder")) {
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(googleClientId.trim())
                    .clientSecret(googleClientSecret != null ? googleClientSecret.trim() : "")
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        } else {
            // Provide placeholder registration so Spring Boot doesn't fail on startup before user configures env vars in Render
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId("placeholder-google-client-id.apps.googleusercontent.com")
                    .clientSecret("placeholder-google-client-secret")
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        return new InMemoryClientRegistrationRepository(registrations);
    }
}
