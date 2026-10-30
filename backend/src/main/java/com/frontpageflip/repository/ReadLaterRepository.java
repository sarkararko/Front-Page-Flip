package com.frontpageflip.repository;

import com.frontpageflip.model.ReadLater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadLaterRepository extends JpaRepository<ReadLater, String> {
    List<ReadLater> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<ReadLater> findByUserIdAndPdfId(String userId, String pdfId);
    boolean existsByUserIdAndPdfId(String userId, String pdfId);
    void deleteByUserIdAndPdfId(String userId, String pdfId);
    long countByUserId(String userId);
}
