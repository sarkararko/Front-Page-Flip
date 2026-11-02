package com.frontpageflip.controller;

import com.frontpageflip.dto.AuthDtos.UserDto;
import com.frontpageflip.dto.LibraryDtos.AdminStatsResponse;
import com.frontpageflip.dto.PdfDtos.PdfResponse;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.service.LibraryService;
import com.frontpageflip.service.PdfDocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final LibraryService libraryService;
    private final PdfDocumentService pdfService;
    private final UserRepository userRepository;

    public AdminController(LibraryService libraryService, PdfDocumentService pdfService, UserRepository userRepository) {
        this.libraryService = libraryService;
        this.pdfService = pdfService;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        AdminStatsResponse stats = libraryService.getAdminStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/students")
    public ResponseEntity<List<UserDto>> getRegisteredStudents() {
        List<User> students = userRepository.findByRoleOrderByCreatedAtDesc(Role.STUDENT);
        List<UserDto> dtos = students.stream().map(u -> {
            UserDto dto = new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getAccountStatus(), u.isEmailVerified());
            String initials = (u.getName() != null && !u.getName().isBlank())
                    ? u.getName().substring(0, Math.min(2, u.getName().length())).toUpperCase()
                    : "ST";
            dto.setAvatar(initials);
            dto.setProvider(u.getProvider() != null ? u.getProvider() : "email");
            dto.setCreatedAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/all-pdfs")
    public ResponseEntity<List<PdfResponse>> getAllPdfs() {
        List<PdfResponse> list = pdfService.getAllPdfsAdmin();
        return ResponseEntity.ok(list);
    }
}
