package com.frontpageflip.controller;

import com.frontpageflip.dto.PdfDtos.*;
import com.frontpageflip.service.PdfDocumentService;
import com.frontpageflip.exception.ForbiddenException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/pdfs", "/api/pdfs"})
public class PdfController {

    private final PdfDocumentService pdfService;
    private final UserRepository userRepository;

    public PdfController(PdfDocumentService pdfService, UserRepository userRepository) {
        this.pdfService = pdfService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<PdfResponse>> getAllPublished(Authentication authentication) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        List<PdfResponse> list = pdfService.getAllPublishedPdfs(currentUserId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<PdfResponse>> getBySubject(
            @PathVariable String subjectId,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        List<PdfResponse> list = pdfService.getPdfsBySubject(subjectId, currentUserId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PdfResponse>> search(
            @RequestParam(required = false, defaultValue = "") String q,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        List<PdfResponse> list = pdfService.searchPdfs(q, currentUserId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PdfResponse> getPdf(
            @PathVariable String id,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? (String) authentication.getPrincipal() : null;
        PdfResponse resp = pdfService.getPdfById(id, currentUserId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<?> viewPdf(@PathVariable String id) {
        PdfResponse info = pdfService.getPdfById(id, null);
        if (info.getCloudinarySecureUrl() != null && !info.getCloudinarySecureUrl().isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(info.getCloudinarySecureUrl()))
                    .build();
        }

        Resource file = pdfService.getPdfFileResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + info.getFileName() + "\"")
                .body(file);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadPdf(@PathVariable String id, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Authentication required to download study materials.");
        }
        String currentUserId = (String) authentication.getPrincipal();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UnauthorizedException("User not found."));

        boolean isAuthorized = user.getRole() == Role.ADMIN || user.isGolden();
        if (!isAuthorized) {
            throw new ForbiddenException("Downloading study materials requires Lifetime Golden membership. Please upgrade to Golden.");
        }

        PdfResponse info = pdfService.getPdfById(id, currentUserId);
        if (info.getCloudinarySecureUrl() != null && !info.getCloudinarySecureUrl().isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(info.getCloudinarySecureUrl()))
                    .build();
        }

        Resource file = pdfService.getPdfFileResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + info.getFileName() + "\"")
                .body(file);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PdfResponse> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "subjectId", required = false) String subjectId,
            @RequestParam(value = "subjectName", required = false) String subjectName,
            @RequestParam(value = "course", defaultValue = "B.Tech / B.Sc") String course,
            @RequestParam(value = "semester", defaultValue = "Semester 1") String semester,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "pageCount", defaultValue = "1") int pageCount,
            @RequestParam(value = "downloadAllowed", defaultValue = "true") boolean downloadAllowed,
            Authentication authentication
    ) {
        String adminUserId = (String) authentication.getPrincipal();
        PdfResponse response = pdfService.uploadPdf(
                file, thumbnail, title, topic, subjectId, subjectName, course, semester, description, pageCount, downloadAllowed, adminUserId
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PdfResponse> updatePdf(
            @PathVariable String id,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestParam(value = "removeThumbnail", defaultValue = "false") boolean removeThumbnail,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "subjectId", required = false) String subjectId,
            @RequestParam(value = "subjectName", required = false) String subjectName,
            @RequestParam(value = "course", required = false) String course,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "pageCount", defaultValue = "1") int pageCount,
            @RequestParam(value = "downloadAllowed", defaultValue = "true") boolean downloadAllowed,
            @RequestParam(value = "published", defaultValue = "true") boolean published,
            Authentication authentication
    ) {
        String adminUserId = (String) authentication.getPrincipal();
        PdfResponse response = pdfService.updatePdfMetadata(
                id, thumbnail, removeThumbnail, title, topic, subjectId, subjectName, course, semester, description, pageCount, downloadAllowed, published, adminUserId
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePdf(@PathVariable String id) {
        pdfService.deletePdf(id);
        return ResponseEntity.ok().body("{\"message\": \"PDF deleted successfully.\"}");
    }
}
