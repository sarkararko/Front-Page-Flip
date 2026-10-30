package com.frontpageflip.repository;

import com.frontpageflip.model.RecentlyViewed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, String> {
    List<RecentlyViewed> findByUserIdOrderByViewedAtDesc(String userId);
    Optional<RecentlyViewed> findByUserIdAndPdfId(String userId, String pdfId);
}
