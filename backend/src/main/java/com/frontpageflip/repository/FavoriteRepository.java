package com.frontpageflip.repository;

import com.frontpageflip.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Favorite> findByUserIdAndSubjectId(String userId, String subjectId);
    boolean existsByUserIdAndSubjectId(String userId, String subjectId);
    void deleteByUserIdAndSubjectId(String userId, String subjectId);
    long countByUserId(String userId);
}
