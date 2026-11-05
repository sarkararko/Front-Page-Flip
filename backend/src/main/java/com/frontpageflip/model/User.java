package com.frontpageflip.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role = Role.STUDENT;

    @Column(name = "account_status", nullable = false, length = 32)
    private String accountStatus = "ACTIVE";

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false, length = 64)
    private String provider = "email";

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Column(name = "last_verification_sent_at")
    private Instant lastVerificationSentAt;

    @Column(name = "last_password_reset_sent_at")
    private Instant lastPasswordResetSentAt;

    @Column(name = "is_golden", nullable = false)
    private boolean isGolden = false;

    @Column(name = "golden_plan", length = 64)
    private String goldenPlan;

    @Column(name = "payment_status", nullable = false, length = 32)
    private String paymentStatus = "NONE";

    @Column(name = "payment_order_id", length = 128)
    private String paymentOrderId;

    @Column(name = "golden_purchased_at")
    private Instant goldenPurchasedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public User() {}

    public User(String id, String name, String email, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public Instant getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public Instant getLastVerificationSentAt() { return lastVerificationSentAt; }
    public void setLastVerificationSentAt(Instant lastVerificationSentAt) { this.lastVerificationSentAt = lastVerificationSentAt; }

    public Instant getLastPasswordResetSentAt() { return lastPasswordResetSentAt; }
    public void setLastPasswordResetSentAt(Instant lastPasswordResetSentAt) { this.lastPasswordResetSentAt = lastPasswordResetSentAt; }

    public boolean isGolden() { return isGolden; }
    public void setGolden(boolean isGolden) { this.isGolden = isGolden; }

    public String getGoldenPlan() { return goldenPlan; }
    public void setGoldenPlan(String goldenPlan) { this.goldenPlan = goldenPlan; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentOrderId() { return paymentOrderId; }
    public void setPaymentOrderId(String paymentOrderId) { this.paymentOrderId = paymentOrderId; }

    public Instant getGoldenPurchasedAt() { return goldenPurchasedAt; }
    public void setGoldenPurchasedAt(Instant goldenPurchasedAt) { this.goldenPurchasedAt = goldenPurchasedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
