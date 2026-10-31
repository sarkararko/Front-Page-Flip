package com.frontpageflip.controller;

import com.frontpageflip.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/presence", "/api/presence"})
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    /**
     * Public count of distinct registered student accounts from MySQL.
     * Excludes administrators and system accounts.
     */
    @GetMapping({"/student-count", "/count"})
    public ResponseEntity<Map<String, Object>> getStudentCount() {
        long totalStudents = presenceService.getTotalRegisteredStudentCount();
        return ResponseEntity.ok(Map.of(
                "totalStudents", totalStudents,
                "count", totalStudents,
                "status", "live"
        ));
    }

    /**
     * Public / Authenticated count of active students from MySQL.
     * No personal data or email addresses are exposed.
     */
    @GetMapping("/active-students-count")
    public ResponseEntity<Map<String, Object>> getActiveStudentsCount(
            @RequestParam(name = "window", defaultValue = "5") int windowMinutes) {
        long activeCount = presenceService.getActiveStudentCount(windowMinutes);
        long totalStudents = presenceService.getTotalRegisteredStudentCount();
        return ResponseEntity.ok(Map.of(
                "totalStudents", totalStudents,
                "count", totalStudents,
                "activeCount", activeCount,
                "windowMinutes", windowMinutes,
                "status", "live"
        ));
    }

    /**
     * Heartbeat endpoint sent by active student sessions.
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String userId) {
            presenceService.recordHeartbeat(userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Heartbeat recorded"));
        }
        return ResponseEntity.ok(Map.of("success", false, "message", "Anonymous session"));
    }

    /**
     * Decrement/clear student active state immediately on explicit logout.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String userId) {
            presenceService.recordLogout(userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Presence cleared"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}
