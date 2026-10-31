package com.frontpageflip.service;

import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class PresenceService {

    private final UserRepository userRepository;
    private static final int DEFAULT_INACTIVITY_WINDOW_MINUTES = 5;

    public PresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void recordHeartbeat(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // STRICT: Track only student accounts, exclude administrators
            if (user.getRole() == Role.STUDENT && "ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
                user.setLastActiveAt(Instant.now());
                userRepository.save(user);
            }
        }
    }

    @Transactional
    public void recordLogout(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setLastActiveAt(null);
            userRepository.save(user);
        }
    }

    public long getActiveStudentCount() {
        return getActiveStudentCount(DEFAULT_INACTIVITY_WINDOW_MINUTES);
    }

    public long getActiveStudentCount(int windowMinutes) {
        int window = windowMinutes > 0 ? windowMinutes : DEFAULT_INACTIVITY_WINDOW_MINUTES;
        Instant threshold = Instant.now().minus(window, ChronoUnit.MINUTES);
        return userRepository.countActiveStudents(threshold);
    }

    public long getTotalRegisteredStudentCount() {
        return userRepository.countByRole(Role.STUDENT);
    }
}
