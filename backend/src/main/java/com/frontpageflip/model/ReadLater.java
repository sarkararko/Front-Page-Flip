package com.frontpageflip.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "read_later", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_readlater_pdf", columnNames = {"user_id", "pdf_id"})
})
public class ReadLater {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pdf_id", nullable = false)
    private PdfDocument pdf;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ReadLater() {}

    public ReadLater(String id, User user, PdfDocument pdf) {
        this.id = id;
        this.user = user;
        this.pdf = pdf;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public PdfDocument getPdf() { return pdf; }
    public void setPdf(PdfDocument pdf) { this.pdf = pdf; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
