package com.frontpageflip.service;

import com.frontpageflip.dto.PdfDtos.*;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ResourceNotFoundException;
import com.frontpageflip.model.PdfDocument;
import com.frontpageflip.model.RecentlyViewed;
import com.frontpageflip.model.Subject;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.PdfDocumentRepository;
import com.frontpageflip.repository.ReadLaterRepository;
import com.frontpageflip.repository.RecentlyViewedRepository;
import com.frontpageflip.repository.SubjectRepository;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.service.CloudinaryService.CloudinaryUploadResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PdfDocumentService {

    private final PdfDocumentRepository pdfRepository;
    private final SubjectRepository subjectRepository;
    private final ReadLaterRepository readLaterRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final CloudinaryService cloudinaryService;

    @Autowired
    public PdfDocumentService(PdfDocumentRepository pdfRepository,
                              SubjectRepository subjectRepository,
                              ReadLaterRepository readLaterRepository,
                              RecentlyViewedRepository recentlyViewedRepository,
                              UserRepository userRepository,
                              FileStorageService fileStorageService,
                              CloudinaryService cloudinaryService) {
        this.pdfRepository = pdfRepository;
        this.subjectRepository = subjectRepository;
        this.readLaterRepository = readLaterRepository;
        this.recentlyViewedRepository = recentlyViewedRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.cloudinaryService = cloudinaryService;
    }

    public List<PdfResponse> getPdfsBySubject(String subjectId, String currentUserId) {
        List<PdfDocument> list = pdfRepository.findBySubjectIdAndPublishedTrueOrderByCreatedAtDesc(subjectId);
        return list.stream().map(p -> toResponse(p, currentUserId)).collect(Collectors.toList());
    }

    public List<PdfResponse> getAllPublishedPdfs(String currentUserId) {
        List<PdfDocument> list = pdfRepository.findByPublishedTrueOrderByCreatedAtDesc();
        return list.stream().map(p -> toResponse(p, currentUserId)).collect(Collectors.toList());
    }

    public List<PdfResponse> getAllPdfsAdmin() {
        List<PdfDocument> list = pdfRepository.findAll();
        return list.stream().map(p -> toResponse(p, null)).collect(Collectors.toList());
    }

    public PdfResponse getPdfById(String id, String currentUserId) {
        PdfDocument doc = pdfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PDF document not found with ID: " + id));
        return toResponse(doc, currentUserId);
    }

    public Resource getPdfFileResource(String id) {
        PdfDocument doc = pdfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PDF document not found with ID: " + id));

        // If stored in Cloudinary, stream from Cloudinary secure URL
        if (doc.getCloudinarySecureUrl() != null && !doc.getCloudinarySecureUrl().isBlank()) {
            try {
                return new UrlResource(URI.create(doc.getCloudinarySecureUrl()));
            } catch (MalformedURLException e) {
                throw new BadRequestException("Invalid Cloudinary PDF resource URL: " + e.getMessage());
            }
        }

        return fileStorageService.loadPdfAsResource(doc.getStorageKey());
    }

    @Transactional
    public PdfResponse uploadPdf(MultipartFile file,
                                 String title,
                                 String topic,
                                 String subjectId,
                                 String course,
                                 String semester,
                                 String description,
                                 int pageCount,
                                 boolean downloadAllowed,
                                 String adminUserId) {

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new BadRequestException("Selected subject does not exist."));

        User admin = userRepository.findById(adminUserId).orElse(null);

        String storageKey;
        String cloudinaryPublicId = null;
        String cloudinarySecureUrl = null;
        String formattedSize = FileStorageService.formatFileSize(file.getSize());

        // Check if Cloudinary is configured (Render Production)
        if (cloudinaryService != null && cloudinaryService.isConfigured()) {
            CloudinaryUploadResult uploadResult = cloudinaryService.uploadPdf(file, file.getOriginalFilename());
            cloudinaryPublicId = uploadResult.getPublicId();
            cloudinarySecureUrl = uploadResult.getSecureUrl();
            storageKey = uploadResult.getPublicId();
        } else {
            // Local disk fallback
            storageKey = fileStorageService.storePdf(file);
        }

        PdfDocument doc = new PdfDocument();
        doc.setId("pdf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        doc.setTitle(title.trim());
        doc.setTopic(topic.trim());
        doc.setSubject(subject);
        doc.setCourse(course != null && !course.isBlank() ? course.trim() : "B.Tech / B.Sc");
        doc.setSemester(semester != null && !semester.isBlank() ? semester.trim() : "Semester 1");
        doc.setDescription(description);
        doc.setStorageKey(storageKey);
        doc.setCloudinaryPublicId(cloudinaryPublicId);
        doc.setCloudinarySecureUrl(cloudinarySecureUrl);
        doc.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf");
        doc.setFileSize(formattedSize);
        doc.setPageCount(Math.max(1, pageCount));
        doc.setDownloadAllowed(downloadAllowed);
        doc.setPublished(true);
        doc.setUploadedBy(admin);

        PdfDocument saved = pdfRepository.save(doc);
        return toResponse(saved, adminUserId);
    }

    @Transactional
    public PdfResponse updatePdfMetadata(String id,
                                         String title,
                                         String topic,
                                         String subjectId,
                                         String course,
                                         String semester,
                                         String description,
                                         int pageCount,
                                         boolean downloadAllowed,
                                         boolean published,
                                         String adminUserId) {

        PdfDocument doc = pdfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PDF document not found with ID: " + id));

        if (subjectId != null && !subjectId.equals(doc.getSubject().getId())) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new BadRequestException("Selected subject does not exist."));
            doc.setSubject(subject);
        }

        if (title != null && !title.isBlank()) doc.setTitle(title.trim());
        if (topic != null && !topic.isBlank()) doc.setTopic(topic.trim());
        if (course != null) doc.setCourse(course.trim());
        if (semester != null) doc.setSemester(semester.trim());
        if (description != null) doc.setDescription(description.trim());
        if (pageCount > 0) doc.setPageCount(pageCount);
        doc.setDownloadAllowed(downloadAllowed);
        doc.setPublished(published);

        PdfDocument saved = pdfRepository.save(doc);
        return toResponse(saved, adminUserId);
    }

    @Transactional
    public void deletePdf(String id) {
        PdfDocument doc = pdfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PDF document not found with ID: " + id));

        // 1. If stored in Cloudinary, delete from Cloudinary first.
        // If Cloudinary delete fails, an exception is thrown and the database record is NOT deleted.
        if (doc.getCloudinaryPublicId() != null && !doc.getCloudinaryPublicId().isBlank()) {
            if (cloudinaryService != null) {
                cloudinaryService.deletePdf(doc.getCloudinaryPublicId());
            }
        }

        // 2. If legacy local file existed, delete it
        if (doc.getStorageKey() != null && !doc.getStorageKey().equals(doc.getCloudinaryPublicId())) {
            fileStorageService.deletePdf(doc.getStorageKey());
        }

        // 3. Remove database record safely
        pdfRepository.delete(doc);
    }

    public List<PdfResponse> searchPdfs(String query, String currentUserId) {
        List<PdfDocument> list = (query == null || query.isBlank())
                ? pdfRepository.findByPublishedTrueOrderByCreatedAtDesc()
                : pdfRepository.searchPdfs(query.trim());
        return list.stream().map(p -> toResponse(p, currentUserId)).collect(Collectors.toList());
    }

    private PdfResponse toResponse(PdfDocument doc, String currentUserId) {
        PdfResponse resp = new PdfResponse();
        resp.setId(doc.getId());
        resp.setTitle(doc.getTitle());
        resp.setTopic(doc.getTopic());
        resp.setSubjectId(doc.getSubject().getId());
        resp.setSubjectName(doc.getSubject().getName());
        resp.setCourse(doc.getCourse());
        resp.setSemester(doc.getSemester());
        resp.setDescription(doc.getDescription());
        resp.setFileName(doc.getFileName());
        resp.setFileSize(doc.getFileSize());
        resp.setPageCount(doc.getPageCount());
        resp.setDownloadAllowed(doc.isDownloadAllowed());
        resp.setPublished(doc.isPublished());
        resp.setCreatedAt(doc.getCreatedAt().toString());
        resp.setViewUrl("/api/pdfs/" + doc.getId() + "/view");
        resp.setDownloadUrl("/api/pdfs/" + doc.getId() + "/download");
        resp.setCloudinaryPublicId(doc.getCloudinaryPublicId());
        resp.setCloudinarySecureUrl(doc.getCloudinarySecureUrl());

        if (currentUserId != null) {
            resp.setSaved(readLaterRepository.existsByUserIdAndPdfId(currentUserId, doc.getId()));
            Optional<RecentlyViewed> rv = recentlyViewedRepository.findByUserIdAndPdfId(currentUserId, doc.getId());
            if (rv.isPresent()) {
                int read = rv.get().getLastPageRead();
                int total = Math.max(1, doc.getPageCount());
                resp.setLastPageRead(read);
                resp.setReadProgressPercent(Math.min(100, (int) Math.round(((double) read / total) * 100)));
            }
        }

        return resp;
    }
}
