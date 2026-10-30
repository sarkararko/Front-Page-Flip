package com.frontpageflip.repository;

import com.frontpageflip.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {
    Optional<Subject> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT s FROM Subject s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Subject> searchSubjects(@Param("query") String query);

    @Query("SELECT s.id, COUNT(p) FROM Subject s LEFT JOIN PdfDocument p ON p.subject.id = s.id AND p.published = true GROUP BY s.id")
    List<Object[]> countPdfsPerSubject();
}
