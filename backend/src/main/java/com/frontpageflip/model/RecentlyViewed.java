package com.frontpageflip.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "recently_viewed", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_recent_pdf", columnNames = {"user_id", "pdf_id"})
})
public class RecentlyViewed {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pdf_id", nullable = false)
    private PdfDocument pdf;

    @Column(name = "last_page_read", nullable = false)
    private int lastPageRead = 1;

    @Column(name = "total_pages", nullable = false)
    private int totalPages = 1;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt = Instant.now();

    public RecentlyViewed() {}

    public RecentlyViewed(String id, User user, PdfDocument pdf, int lastPageRead, int totalPages) {
        this.id = id;
        this.user = user;
        this.pdf = pdf;
        this.lastPageRead = lastPageRead;
        this.totalPages = totalPages;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public PdfDocument getPdf() { return pdf; }
    public void setPdf(PdfDocument pdf) { this.pdf = pdf; }

    public int getLastPageRead() { return lastPageRead; }
    public void setLastPageRead(int lastPageRead) { this.lastPageRead = lastPageRead; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public Instant getViewedAt() { return viewedAt; }
    public void setViewedAt(Instant viewedAt) { this.viewedAt = viewedAt; }
}
