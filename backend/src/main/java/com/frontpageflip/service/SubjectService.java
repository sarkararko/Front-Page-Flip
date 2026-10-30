package com.frontpageflip.service;

import com.frontpageflip.dto.SubjectDtos.*;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ResourceNotFoundException;
import com.frontpageflip.model.Subject;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.FavoriteRepository;
import com.frontpageflip.repository.PdfDocumentRepository;
import com.frontpageflip.repository.SubjectRepository;
import com.frontpageflip.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final PdfDocumentRepository pdfRepository;
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository,
                          PdfDocumentRepository pdfRepository,
                          FavoriteRepository favoriteRepository,
                          UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.pdfRepository = pdfRepository;
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
    }

    public List<SubjectResponse> getAllSubjects(String currentUserId) {
        List<Subject> subjects = subjectRepository.findAll();
        return subjects.stream().map(s -> toResponse(s, currentUserId)).collect(Collectors.toList());
    }

    public SubjectResponse getSubjectBySlug(String slug, String currentUserId) {
        Subject subject = subjectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found for slug: " + slug));
        return toResponse(subject, currentUserId);
    }

    public SubjectResponse getSubjectById(String id, String currentUserId) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));
        return toResponse(subject, currentUserId);
    }

    @Transactional
    public SubjectResponse createSubject(SubjectRequest request, String adminUserId) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? request.getSlug().trim().toLowerCase().replaceAll("[^a-z0-9-]", "-")
                : request.getName().trim().toLowerCase().replaceAll("[^a-z0-9-]", "-");

        if (subjectRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        User admin = userRepository.findById(adminUserId).orElse(null);

        Subject subject = new Subject();
        subject.setId("sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        subject.setName(request.getName().trim());
        subject.setSlug(slug);
        subject.setDescription(request.getDescription());
        if (request.getIcon() != null) subject.setIcon(request.getIcon());
        if (request.getIconColor() != null) subject.setIconColor(request.getIconColor());
        if (request.getIconBgColor() != null) subject.setIconBgColor(request.getIconBgColor());
        subject.setCreatedBy(admin);

        Subject saved = subjectRepository.save(subject);
        return toResponse(saved, adminUserId);
    }

    @Transactional
    public SubjectResponse updateSubject(String id, SubjectRequest request, String adminUserId) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));

        subject.setName(request.getName().trim());
        if (request.getDescription() != null) subject.setDescription(request.getDescription());
        if (request.getIcon() != null) subject.setIcon(request.getIcon());
        if (request.getIconColor() != null) subject.setIconColor(request.getIconColor());
        if (request.getIconBgColor() != null) subject.setIconBgColor(request.getIconBgColor());

        Subject saved = subjectRepository.save(subject);
        return toResponse(saved, adminUserId);
    }

    @Transactional
    public void deleteSubject(String id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));
        subjectRepository.delete(subject);
    }

    public List<SubjectResponse> searchSubjects(String query, String currentUserId) {
        List<Subject> list = (query == null || query.isBlank())
                ? subjectRepository.findAll()
                : subjectRepository.searchSubjects(query.trim());
        return list.stream().map(s -> toResponse(s, currentUserId)).collect(Collectors.toList());
    }

    private SubjectResponse toResponse(Subject s, String currentUserId) {
        long pdfCount = pdfRepository.countBySubjectIdAndPublishedTrue(s.getId());
        SubjectResponse resp = new SubjectResponse(
                s.getId(),
                s.getName(),
                s.getSlug(),
                s.getDescription(),
                s.getIcon(),
                s.getIconColor(),
                s.getIconBgColor(),
                pdfCount
        );
        if (currentUserId != null) {
            resp.setFavorite(favoriteRepository.existsByUserIdAndSubjectId(currentUserId, s.getId()));
        }
        return resp;
    }
}
