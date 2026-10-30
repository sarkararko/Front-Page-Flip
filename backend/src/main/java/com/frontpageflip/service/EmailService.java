package com.frontpageflip.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String userName, String token) {
        String verificationUrl = "http://localhost:3000/verify-email?token=" + token;
        String subject = "Verify your Front-Page Flip student account";
        String body = "Hello " + userName + ",\n\n" +
                "Welcome to Front-Page Flip! Please verify your email by clicking the link below or copying your verification token:\n\n" +
                "Verification Token: " + token + "\n" +
                "Direct Link: " + verificationUrl + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "— Front-Page Flip Team";

        if (mailSender != null && fromEmail != null && !fromEmail.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Verification email dispatched to {}", toEmail);
                return;
            } catch (Exception e) {
                log.warn("SMTP send failed ({}). Logging verification token: {}", e.getMessage(), token);
            }
        } else {
            log.info("Email service not configured with live credentials. Simulated token for {}: {}", toEmail, token);
        }
    }
}
