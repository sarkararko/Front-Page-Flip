package com.frontpageflip.repository;

import com.frontpageflip.model.PdfDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdfDocumentRepository extends JpaRepository<PdfDocument, String> {
    List<PdfDocument> findBySubjectIdAndPublishedTrueOrderByCreatedAtDesc(String subjectId);
    List<PdfDocument> findBySubjectIdOrderByCreatedAtDesc(String subjectId);
    List<PdfDocument> findByPublishedTrueOrderByCreatedAtDesc();
    long countByPublishedTrue();
    long countBySubjectIdAndPublishedTrue(String subjectId);

    @Query("SELECT p FROM PdfDocument p WHERE p.published = true AND (" +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.topic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<PdfDocument> searchPdfs(@Param("query") String query);

    @Query("SELECT p FROM PdfDocument p WHERE p.published = true AND p.subject.id = :subjectId AND (" +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.topic) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<PdfDocument> searchPdfsInSubject(@Param("subjectId") String subjectId, @Param("query") String query);
}
