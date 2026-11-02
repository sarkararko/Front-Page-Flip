package com.frontpageflip.controller;

import com.frontpageflip.config.OAuth2Config;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Fallback controller for unconfigured OAuth2 providers.
 * If GOOGLE_CLIENT_ID or GITHUB_CLIENT_ID is not configured in Render,
 * Spring Security's OAuth2 filter does not intercept the request and falls through here,
 * where it cleanly redirects back to the frontend with an actionable error rather than
 * sending the student to an invalid OAuth provider URL (e.g. Error 401: invalid_client).
 */
@Controller
@RequestMapping("/oauth2/authorization")
public class OAuthFallbackController {

    private final OAuth2Config oAuth2Config;

    @Value("${app.mail.frontend-url:${FRONTEND_URL:https://frontpageflip.vercel.app}}")
    private String frontendUrl;

    public OAuthFallbackController(OAuth2Config oAuth2Config) {
        this.oAuth2Config = oAuth2Config;
    }

    @GetMapping("/google")
    public void handleUnconfiguredGoogle(HttpServletResponse response) throws IOException {
        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.trim() : "https://frontpageflip.vercel.app";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String msg = "Google OAuth is not configured on the backend. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your Render environment variables.";
        response.sendRedirect(base + "#auth-error?message=" + URLEncoder.encode(msg, StandardCharsets.UTF_8));
    }

    @GetMapping("/github")
    public void handleUnconfiguredGithub(HttpServletResponse response) throws IOException {
        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.trim() : "https://frontpageflip.vercel.app";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String msg = "GitHub OAuth is not configured on the backend. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your Render environment variables.";
        response.sendRedirect(base + "#auth-error?message=" + URLEncoder.encode(msg, StandardCharsets.UTF_8));
    }
}
