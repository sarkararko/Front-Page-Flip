package com.frontpageflip.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.mail.frontend-url:${FRONTEND_URL:https://frontpageflip.vercel.app}}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.trim() : "https://frontpageflip.vercel.app";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        String targetUrl = UriComponentsBuilder.fromUriString(base)
                .fragment("auth-error?message=" + URLEncoder.encode("Google authentication was canceled or failed: " + exception.getMessage(), StandardCharsets.UTF_8))
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
