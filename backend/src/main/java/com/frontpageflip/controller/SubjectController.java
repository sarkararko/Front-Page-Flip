package com.frontpageflip.controller;

import com.frontpageflip.dto.SubjectDtos.*;
import com.frontpageflip.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAllSubjects(Authentication authentication) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        List<SubjectResponse> subjects = subjectService.getAllSubjects(currentUserId);
        return ResponseEntity.ok(subjects);
    }

    @GetMapping("/search")
    public ResponseEntity<List<SubjectResponse>> searchSubjects(
            @RequestParam(required = false, defaultValue = "") String q,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        List<SubjectResponse> results = subjectService.searchSubjects(q, currentUserId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<SubjectResponse> getSubject(
            @PathVariable String idOrSlug,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        try {
            SubjectResponse res = subjectService.getSubjectById(idOrSlug, currentUserId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            SubjectResponse res = subjectService.getSubjectBySlug(idOrSlug, currentUserId);
            return ResponseEntity.ok(res);
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectResponse> createSubject(
            @Valid @RequestBody SubjectRequest request,
            Authentication authentication
    ) {
        String adminUserId = (String) authentication.getPrincipal();
        SubjectResponse response = subjectService.createSubject(request, adminUserId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable String id,
            @Valid @RequestBody SubjectRequest request,
            Authentication authentication
    ) {
        String adminUserId = (String) authentication.getPrincipal();
        SubjectResponse response = subjectService.updateSubject(id, request, adminUserId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSubject(@PathVariable String id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok().body("{\"message\": \"Subject removed successfully.\"}");
    }
}
