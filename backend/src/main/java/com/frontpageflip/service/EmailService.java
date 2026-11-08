package com.frontpageflip.service;

import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.SendFailedException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Brevo SMTP & Transactional Email Service.
 * Provides resilient, dual-transport delivery over both:
 * 1. Brevo v3 Transactional Email REST API (https://api.brevo.com/v3/smtp/email) over HTTPS Port 443
 *    (immune to cloud provider outbound SMTP port filtering)
 * 2. Brevo SMTP Relay (smtp-relay.brevo.com) over ports 587, 2525, and 465 (SMTPS)
 *
 * Captures explicit error diagnostics from Brevo rejection responses and SMTP exceptions
 * to guarantee that success is never reported unless the email was verified accepted by Brevo.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final Pattern MESSAGE_ID_PATTERN = Pattern.compile("\"messageId\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ERROR_MESSAGE_PATTERN = Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ERROR_CODE_PATTERN = Pattern.compile("\"code\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:smtp-relay.brevo.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.api-key:}")
    private String apiKey;

    @Value("${app.mail.api-url:https://api.brevo.com/v3/smtp/email}")
    private String apiUrl;

    @Value("${app.mail.fallback-ports:2525,465,587}")
    private String fallbackPorts;

    @Value("${app.mail.from:frontpageflipofficial@gmail.com}")
    private String fromEmail;

    @Value("${app.security.creator-email:${CREATOR_EMAIL:${ADMIN_EMAIL:arkaparna.ds@gmail.com}}}")
    private String creatorEmail;

    @Value("${app.mail.from-name:Front-Page Flip}")
    private String fromName;

    @Value("${app.mail.frontend-url:${FRONTEND_URL:https://frontpageflip.vercel.app}}")
    private String frontendUrl;

    private final ThreadLocal<String> lastErrorMessage = new ThreadLocal<>();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String getLastErrorMessage() {
        return lastErrorMessage.get();
    }

    public boolean isConfigured() {
        boolean hasApiKey = apiKey != null && !apiKey.trim().isEmpty();
        boolean hasMailPassword = mailPassword != null && !mailPassword.trim().isEmpty();
        boolean hasMailUsername = mailUsername != null && !mailUsername.trim().isEmpty();

        return hasApiKey || hasMailPassword || (mailSender != null && hasMailUsername);
    }

    public boolean sendVerificationEmail(String toEmail, String userName, String code) {
        String cleanEmail = toEmail != null ? toEmail.trim().toLowerCase() : "";
        String cleanName = (userName != null && !userName.isBlank()) ? userName.trim() : "Student";
        String directLink = frontendUrl + "/?mode=verify&email=" + cleanEmail + "&code=" + code;
        String subject = "Verify your Front-Page Flip student account";

        String htmlContent = "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\">" +
                "<style>" +
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }" +
                ".container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(16,42,86,0.06); }" +
                ".header { background: linear-gradient(135deg, #102A56 0%, #1677FF 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }" +
                ".header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }" +
                ".header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #E0E7FF; }" +
                ".content { padding: 32px 28px; }" +
                ".greeting { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 12px; }" +
                ".code-box { background: #EFF6FF; border: 2px dashed #93C5FD; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }" +
                ".code-label { font-size: 11px; font-weight: 700; color: #1D4ED8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }" +
                ".code-value { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1677FF; margin: 0; }" +
                ".button-wrap { text-align: center; margin: 24px 0 16px 0; }" +
                ".button { display: inline-block; background-color: #1677FF; color: #FFFFFF !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; }" +
                ".footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; font-size: 12px; color: #64748B; text-align: center; line-height: 1.5; }" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Front-Page Flip</h1><p>Your notes. One place.</p></div>" +
                "<div class=\"content\">" +
                "<div class=\"greeting\">Hello " + escapeHtml(cleanName) + ",</div>" +
                "<p style=\"font-size: 14px; line-height: 1.6; color: #334155;\">Welcome to Front-Page Flip! Please use the 6-digit verification code below to activate your student account and access curated educational notes and PDFs:</p>" +
                "<div class=\"code-box\">" +
                "<div class=\"code-label\">Verification Code</div>" +
                "<div class=\"code-value\">" + escapeHtml(code) + "</div>" +
                "</div>" +
                "<div class=\"button-wrap\">" +
                "<a href=\"" + directLink + "\" class=\"button\" target=\"_blank\">Verify Account Automatically</a>" +
                "</div>" +
                "<p style=\"font-size: 12px; color: #64748B; margin-top: 20px;\">This verification code expires in 24 hours and can be used once. If you did not register for Front-Page Flip, you can safely disregard this message.</p>" +
                "</div>" +
                "<div class=\"footer\">Front-Page Flip • Curated Academic Materials<br>This is an automated security dispatch from Brevo.</div>" +
                "</div></body></html>";

        String plainText = "Hello " + cleanName + ",\n\n" +
                "Welcome to Front-Page Flip! Your 6-digit verification code is:\n\n" +
                code + "\n\n" +
                "Or verify directly using this link:\n" + directLink + "\n\n" +
                "This code will expire in 24 hours.\n\n" +
                "— Front-Page Flip Security";

        return sendWithBrevo(cleanEmail, cleanName, subject, htmlContent, plainText);
    }

    public boolean sendPasswordResetEmail(String toEmail, String userName, String code) {
        String cleanEmail = toEmail != null ? toEmail.trim().toLowerCase() : "";
        String cleanName = (userName != null && !userName.isBlank()) ? userName.trim() : "Student";
        String directLink = frontendUrl + "/?mode=reset&email=" + cleanEmail + "&token=" + code;
        String subject = "Reset your Front-Page Flip password";

        String htmlContent = "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\">" +
                "<style>" +
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }" +
                ".container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(16,42,86,0.06); }" +
                ".header { background: linear-gradient(135deg, #102A56 0%, #0DB7A5 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }" +
                ".header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }" +
                ".header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #E0E7FF; }" +
                ".content { padding: 32px 28px; }" +
                ".greeting { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 12px; }" +
                ".code-box { background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }" +
                ".code-label { font-size: 11px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }" +
                ".code-value { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #D97706; margin: 0; }" +
                ".button-wrap { text-align: center; margin: 24px 0 16px 0; }" +
                ".button { display: inline-block; background-color: #102A56; color: #FFFFFF !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; }" +
                ".footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; font-size: 12px; color: #64748B; text-align: center; line-height: 1.5; }" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Front-Page Flip</h1><p>Account Security & Password Recovery</p></div>" +
                "<div class=\"content\">" +
                "<div class=\"greeting\">Hello " + escapeHtml(cleanName) + ",</div>" +
                "<p style=\"font-size: 14px; line-height: 1.6; color: #334155;\">We received a request to reset the password for your Front-Page Flip account. Enter the 6-digit recovery code below or click the reset link to create a new password:</p>" +
                "<div class=\"code-box\">" +
                "<div class=\"code-label\">Password Recovery Code</div>" +
                "<div class=\"code-value\">" + escapeHtml(code) + "</div>" +
                "</div>" +
                "<div class=\"button-wrap\">" +
                "<a href=\"" + directLink + "\" class=\"button\" target=\"_blank\">Reset Password</a>" +
                "</div>" +
                "<p style=\"font-size: 12px; color: #64748B; margin-top: 20px;\">This recovery code expires in <strong>15 minutes</strong> and is single-use. If you did not initiate this request, your account remains secure and no changes were made.</p>" +
                "</div>" +
                "<div class=\"footer\">Front-Page Flip • Curated Academic Materials<br>This is an automated security dispatch from Brevo.</div>" +
                "</div></body></html>";

        String plainText = "Hello " + cleanName + ",\n\n" +
                "We received a request to reset your Front-Page Flip password. Your 6-digit recovery code is:\n\n" +
                code + "\n\n" +
                "Or reset your password directly using this link:\n" + directLink + "\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "— Front-Page Flip Security";

        return sendWithBrevo(cleanEmail, cleanName, subject, htmlContent, plainText);
    }

    private boolean sendWithBrevo(String toEmail, String recipientName, String subject, String htmlContent, String plainText) {
        lastErrorMessage.remove();

        if (!isConfigured()) {
            String err = "Brevo email credentials are not configured in environment variables (MAIL_PASSWORD / BREVO_API_KEY).";
            log.warn("{}. Dispatch to {} skipped.", err, maskEmail(toEmail));
            lastErrorMessage.set(err);
            return false;
        }

        List<String> sendersToTry = getSenderCandidates();
        List<String> attemptedErrors = new ArrayList<>();
        String candidateApiKey = getEffectiveApiKey();

        // Tier 1: Attempt Brevo v3 Transactional Email REST API over HTTPS (Port 443)
        // Try each verified sender candidate (e.g. frontpageflipofficial@gmail.com, then arkaparna.ds@gmail.com)
        if (candidateApiKey != null && !candidateApiKey.isBlank()) {
            for (String senderEmail : sendersToTry) {
                try {
                    boolean apiSuccess = sendViaBrevoRestApi(candidateApiKey, toEmail, recipientName, subject, htmlContent, plainText, senderEmail);
                    if (apiSuccess) {
                        return true;
                    }
                } catch (Exception e) {
                    String errorDetail = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    attemptedErrors.add("Brevo HTTPS API (" + senderEmail + "): " + errorDetail);
                    log.warn("Brevo HTTPS REST API attempt with sender {} did not succeed: {}", senderEmail, errorDetail);
                }
            }
        }

        // Tier 2: Attempt Brevo SMTP Relay over TCP (ports: configured port, 2525, 465, 587)
        List<Integer> portsToTry = getPortsToTry();
        for (String senderEmail : sendersToTry) {
            for (int port : portsToTry) {
                try {
                    boolean smtpSuccess = sendViaBrevoSmtp(port, toEmail, senderEmail, subject, htmlContent, plainText);
                    if (smtpSuccess) {
                        return true;
                    }
                } catch (AuthenticationFailedException authEx) {
                    String msg = "Brevo SMTP authentication rejected credentials (check MAIL_USERNAME and MAIL_PASSWORD/SMTP key).";
                    attemptedErrors.add("Port " + port + ": " + msg);
                    log.error("[Brevo SMTP] {} Recipient: {}", msg, maskEmail(toEmail));
                    break; // No need to retry other ports on auth rejection
                } catch (SendFailedException sendEx) {
                    String msg = "Brevo SMTP rejected dispatch for sender '" + senderEmail + "': " + sendEx.getMessage();
                    attemptedErrors.add("Port " + port + ": " + msg);
                    log.warn("[Brevo SMTP] {}", msg);
                    break; // Try next sender candidate
                } catch (Exception ex) {
                    String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
                    attemptedErrors.add("Port " + port + " (" + senderEmail + "): " + msg);
                    log.warn("[Brevo SMTP] Port {} delivery failed: {}", port, msg);
                }
            }
        }

        // If all attempts failed, set meaningful error diagnostic
        String combinedError = String.join(" | ", attemptedErrors);
        if (combinedError.isBlank()) {
            combinedError = "Failed to establish connection to Brevo SMTP service.";
        }
        log.error("All Brevo delivery attempts failed for {}: {}", maskEmail(toEmail), combinedError);
        lastErrorMessage.set(combinedError);
        return false;
    }

    private boolean sendViaBrevoRestApi(String key, String toEmail, String recipientName, String subject,
                                        String htmlContent, String plainText, String effectiveFrom) throws Exception {
        String jsonPayload = buildBrevoJsonPayload(effectiveFrom, fromName, toEmail, recipientName, subject, htmlContent, plainText);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("api-key", key.trim())
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        int statusCode = response.statusCode();
        String responseBody = response.body();

        if (statusCode >= 200 && statusCode < 300) {
            String messageId = extractPattern(MESSAGE_ID_PATTERN, responseBody);
            log.info("Email delivered successfully via Brevo Transactional API to {} (messageId: {})",
                    maskEmail(toEmail), messageId != null ? messageId : "accepted");
            return true;
        }

        // Parse Brevo error details
        String brevoCode = extractPattern(ERROR_CODE_PATTERN, responseBody);
        String brevoMessage = extractPattern(ERROR_MESSAGE_PATTERN, responseBody);
        String reason = (brevoMessage != null && !brevoMessage.isBlank()) ? brevoMessage : responseBody;

        if (statusCode == 401) {
            // Key might be an SMTP key rather than a v3 REST API key; allow fallback to SMTP
            throw new RuntimeException("Brevo API key not recognized by v3 REST API (HTTP 401: " + reason + ")");
        }

        throw new RuntimeException("Brevo API HTTP " + statusCode + (brevoCode != null ? " (" + brevoCode + ")" : "") + ": " + reason);
    }

    private boolean sendViaBrevoSmtp(int port, String toEmail, String effectiveFrom,
                                     String subject, String htmlContent, String plainText) throws Exception {
        JavaMailSenderImpl sender = createJavaMailSender(port);

        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

        helper.setFrom(new InternetAddress(effectiveFrom, fromName));
        helper.setReplyTo(new InternetAddress(effectiveFrom, fromName));
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(plainText, htmlContent);

        sender.send(message);
        log.info("Email delivered successfully via Brevo SMTP (host: {}, port: {}) to {}",
                mailHost, port, maskEmail(toEmail));
        return true;
    }

    private JavaMailSenderImpl createJavaMailSender(int port) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailHost != null && !mailHost.isBlank() ? mailHost.trim() : "smtp-relay.brevo.com");
        sender.setPort(port);
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        String username = mailUsername != null ? mailUsername.trim() : "";
        String password = mailPassword != null && !mailPassword.isBlank() ? mailPassword.trim() :
                (apiKey != null ? apiKey.trim() : "");

        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.smtp.connectiontimeout", "8000");
        props.put("mail.smtp.timeout", "8000");
        props.put("mail.smtp.writetimeout", "8000");

        if (port == 465) {
            // SMTPS with explicit SSL
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        } else {
            // STARTTLS for port 587 and port 2525
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        }

        return sender;
    }

    private List<Integer> getPortsToTry() {
        Set<Integer> ports = new LinkedHashSet<>();
        // Priority 1: Configured port
        if (mailPort > 0) {
            ports.add(mailPort);
        }
        // Priority 2: Alternative Brevo SMTP ports (2525, 465, 587)
        if (fallbackPorts != null && !fallbackPorts.isBlank()) {
            for (String p : fallbackPorts.split(",")) {
                try {
                    int parsed = Integer.parseInt(p.trim());
                    if (parsed > 0) ports.add(parsed);
                } catch (NumberFormatException ignored) {}
            }
        }
        ports.add(2525);
        ports.add(465);
        ports.add(587);
        return new ArrayList<>(ports);
    }

    private String getEffectiveApiKey() {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return apiKey.trim();
        }
        if (mailPassword != null && !mailPassword.trim().isEmpty()) {
            return mailPassword.trim();
        }
        return null;
    }

    public List<String> getSenderCandidates() {
        Set<String> senders = new LinkedHashSet<>();
        if (fromEmail != null && !fromEmail.isBlank() && fromEmail.contains("@") &&
                !fromEmail.contains("frontpageflip.com") && !fromEmail.contains("yourdomain.com")) {
            senders.add(fromEmail.trim());
        }
        if (creatorEmail != null && !creatorEmail.isBlank() && creatorEmail.contains("@")) {
            senders.add(creatorEmail.trim());
        }
        if (mailUsername != null && mailUsername.contains("@") && !mailUsername.contains("smtp-brevo.com")) {
            senders.add(mailUsername.trim());
        }
        if (senders.isEmpty()) {
            senders.add("frontpageflipofficial@gmail.com");
        }
        return new ArrayList<>(senders);
    }

    public String resolveEffectiveSender() {
        List<String> candidates = getSenderCandidates();
        return candidates.isEmpty() ? "frontpageflipofficial@gmail.com" : candidates.get(0);
    }

    private String buildBrevoJsonPayload(String fromEmail, String fromName, String toEmail,
                                         String toName, String subject, String htmlContent, String plainText) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"sender\":{\"name\":").append(toJsonString(fromName)).append(",\"email\":").append(toJsonString(fromEmail)).append("},");
        json.append("\"to\":[{\"email\":").append(toJsonString(toEmail)).append(",\"name\":").append(toJsonString(toName)).append("}],");
        json.append("\"subject\":").append(toJsonString(subject)).append(",");
        json.append("\"htmlContent\":").append(toJsonString(htmlContent)).append(",");
        json.append("\"textContent\":").append(toJsonString(plainText));
        json.append("}");
        return json.toString();
    }

    private String toJsonString(String val) {
        if (val == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < val.length(); i++) {
            char c = val.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        String t = "000" + Integer.toHexString(c);
                        sb.append("\\u").append(t.substring(t.length() - 4));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    private String extractPattern(Pattern pattern, String text) {
        if (text == null) return null;
        Matcher m = pattern.matcher(text);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "recipient";
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        String maskedName = name.length() > 2 ? name.substring(0, 2) + "***" : "***";
        return maskedName + "@" + domain;
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
