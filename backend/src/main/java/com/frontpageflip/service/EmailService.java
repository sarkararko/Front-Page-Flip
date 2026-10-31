package com.frontpageflip.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:${spring.mail.from:${MAIL_FROM:no-reply@frontpageflip.com}}}")
    private String fromEmail;

    @Value("${app.mail.from-name:Front-Page Flip}")
    private String fromName;

    @Value("${app.mail.frontend-url:${FRONTEND_URL:http://localhost:3000}}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String userName, String code) {
        String directLink = frontendUrl + "/?mode=verify&email=" + toEmail + "&code=" + code;
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
                "<div class=\"greeting\">Hello " + escapeHtml(userName) + ",</div>" +
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
                "<div class=\"footer\">Front-Page Flip • Curated Academic Materials<br>This is an automated security dispatch.</div>" +
                "</div></body></html>";

        String plainText = "Hello " + userName + ",\n\n" +
                "Welcome to Front-Page Flip! Your 6-digit verification code is:\n\n" +
                code + "\n\n" +
                "Or verify directly using this link:\n" + directLink + "\n\n" +
                "This code will expire in 24 hours.\n\n" +
                "— Front-Page Flip Security";

        sendHtmlEmail(toEmail, subject, htmlContent, plainText);
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String code) {
        String directLink = frontendUrl + "/?mode=reset&email=" + toEmail + "&token=" + code;
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
                "<div class=\"greeting\">Hello " + escapeHtml(userName) + ",</div>" +
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
                "<div class=\"footer\">Front-Page Flip • Curated Academic Materials<br>This is an automated security dispatch.</div>" +
                "</div></body></html>";

        String plainText = "Hello " + userName + ",\n\n" +
                "We received a request to reset your Front-Page Flip password. Your 6-digit recovery code is:\n\n" +
                code + "\n\n" +
                "Or reset your password directly using this link:\n" + directLink + "\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "— Front-Page Flip Security";

        sendHtmlEmail(toEmail, subject, htmlContent, plainText);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent, String plainText) {
        if (mailSender == null) {
            log.info("Brevo JavaMailSender not initialized. Simulated email dispatch for {}: subject={}",
                    maskEmail(toEmail), subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainText, htmlContent);

            mailSender.send(message);
            log.info("Email delivered successfully via Brevo SMTP to {}", maskEmail(toEmail));
        } catch (Exception e) {
            // Never log sensitive credentials or tokens on failure
            log.warn("SMTP delivery attempt to {} encountered an error: {}", maskEmail(toEmail), e.getMessage());
        }
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
