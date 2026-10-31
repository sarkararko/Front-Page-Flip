package com.frontpageflip.repository;

import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByRole(Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = com.frontpageflip.model.Role.STUDENT AND u.accountStatus = 'ACTIVE' AND u.lastActiveAt >= :activeThreshold")
    long countActiveStudents(@Param("activeThreshold") Instant activeThreshold);
}
