package com.frontpageflip.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Custom OAuth2 Authorization Request Resolver.
 *
 * Configures provider-specific parameters:
 * 1. Google: Adds "prompt=select_account" so the user is always presented with Google's account selection chooser.
 * 2. GitHub: Adds "prompt=consent" so GitHub forces reauthorization/consent rather than silently reusing
 *    the previously logged-in session, giving the student the opportunity to review the active account or switch accounts.
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository,
                                                   String authorizationRequestBaseUri) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, authorizationRequestBaseUri);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customize(req, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customize(req, request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest authRequest, HttpServletRequest request) {
        if (authRequest == null) {
            return null;
        }

        // Intercept frontend_url or redirect_to from request and store in HTTP session for OAuth2 success/failure handlers
        if (request != null) {
            String frontendUrlParam = request.getParameter("frontend_url");
            if (frontendUrlParam == null || frontendUrlParam.isBlank()) {
                frontendUrlParam = request.getParameter("redirect_to");
            }
            if (frontendUrlParam != null && !frontendUrlParam.isBlank()) {
                String clean = frontendUrlParam.trim();
                if (clean.startsWith("http://") || clean.startsWith("https://")) {
                    try {
                        request.getSession(true).setAttribute("oauth_frontend_url", clean);
                    } catch (Exception ignored) {}
                }
            }
        }

        Map<String, Object> additionalParameters = new HashMap<>(authRequest.getAdditionalParameters());
        String registrationId = (String) authRequest.getAttributes().get("registration_id");

        if ("google".equalsIgnoreCase(registrationId)) {
            // Force Google to always show the Account Chooser dialog ("Choose an account")
            additionalParameters.put("prompt", "select_account");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            // Force GitHub to prompt for consent/reauthorization every time,
            // displaying the active GitHub username and allowing the user to confirm or switch accounts
            additionalParameters.put("prompt", "consent");
        }

        return OAuth2AuthorizationRequest.from(authRequest)
                .additionalParameters(additionalParameters)
                .build();
    }
}
