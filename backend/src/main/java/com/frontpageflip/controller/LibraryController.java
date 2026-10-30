package com.frontpageflip.controller;

import com.frontpageflip.dto.LibraryDtos.*;
import com.frontpageflip.service.LibraryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final LibraryService libraryService;

    public LibraryController(LibraryService libraryService) {
        this.libraryService = libraryService;
    }

    @GetMapping
    public ResponseEntity<LibraryOverviewResponse> getLibrary(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        LibraryOverviewResponse overview = libraryService.getLibraryOverview(userId);
        return ResponseEntity.ok(overview);
    }

    @PostMapping("/favorites/{subjectId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable String subjectId, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean favorited = libraryService.toggleFavorite(userId, subjectId);
        return ResponseEntity.ok().body("{\"favorited\": " + favorited + "}");
    }

    @PostMapping("/read-later/{pdfId}")
    public ResponseEntity<?> toggleReadLater(@PathVariable String pdfId, Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean saved = libraryService.toggleReadLater(userId, pdfId);
        return ResponseEntity.ok().body("{\"saved\": " + saved + "}");
    }

    @PostMapping("/progress/{pdfId}")
    public ResponseEntity<?> updateProgress(
            @PathVariable String pdfId,
            @RequestBody ProgressUpdateRequest request,
            Authentication authentication
    ) {
        String userId = (String) authentication.getPrincipal();
        libraryService.recordReadingProgress(userId, pdfId, request.getCurrentPage(), request.getTotalPages());
        return ResponseEntity.ok().body("{\"status\": \"updated\"}");
    }
}
