package com.frontpageflip.controller;

import com.frontpageflip.dto.LibraryDtos.AdminStatsResponse;
import com.frontpageflip.dto.PdfDtos.PdfResponse;
import com.frontpageflip.service.LibraryService;
import com.frontpageflip.service.PdfDocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final LibraryService libraryService;
    private final PdfDocumentService pdfService;

    public AdminController(LibraryService libraryService, PdfDocumentService pdfService) {
        this.libraryService = libraryService;
        this.pdfService = pdfService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        AdminStatsResponse stats = libraryService.getAdminStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/all-pdfs")
    public ResponseEntity<List<PdfResponse>> getAllPdfs() {
        List<PdfResponse> list = pdfService.getAllPdfsAdmin();
        return ResponseEntity.ok(list);
    }
}
