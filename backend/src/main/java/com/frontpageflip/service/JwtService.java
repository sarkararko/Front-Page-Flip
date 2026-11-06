package com.frontpageflip.service;

import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        String secret = (jwtSecret != null && !jwtSecret.isBlank())
                ? jwtSecret
                : "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // Pad if short for HMAC-SHA256
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("name", user.getName());
        claims.put("role", user.getRole().name());
        claims.put("email", user.getEmail());
        claims.put("sub", user.getEmail());
        claims.put("verified", user.isEmailVerified());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        String sub = claims.getSubject();
        if (sub != null && !sub.isBlank()) {
            return sub;
        }
        Object email = claims.get("email");
        return email != null ? String.valueOf(email) : null;
    }

    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object uid = claims.get("userId");
        if (uid != null && !String.valueOf(uid).isBlank()) {
            return String.valueOf(uid);
        }
        Object id = claims.get("id");
        if (id != null && !String.valueOf(id).isBlank()) {
            return String.valueOf(id);
        }
        return claims.getSubject();
    }

    public Role extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object roleStr = claims.get("role");
            if (roleStr == null) {
                return Role.STUDENT;
            }
            return Role.valueOf(String.valueOf(roleStr).trim().toUpperCase());
        } catch (Exception e) {
            return Role.STUDENT;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
