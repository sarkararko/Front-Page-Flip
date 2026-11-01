package com.frontpageflip;

import com.frontpageflip.dto.SubjectDtos.SubjectRequest;
import com.frontpageflip.dto.SubjectDtos.SubjectResponse;
import com.frontpageflip.dto.PdfDtos.PdfResponse;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.model.PdfDocument;
import com.frontpageflip.model.Role;
import com.frontpageflip.model.Subject;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.FavoriteRepository;
import com.frontpageflip.repository.PdfDocumentRepository;
import com.frontpageflip.repository.ReadLaterRepository;
import com.frontpageflip.repository.RecentlyViewedRepository;
import com.frontpageflip.repository.SubjectRepository;
import com.frontpageflip.repository.UserRepository;
import com.frontpageflip.service.FileStorageService;
import com.frontpageflip.service.PdfDocumentService;
import com.frontpageflip.service.SubjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubjectPdfServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private PdfDocumentRepository pdfRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ReadLaterRepository readLaterRepository;

    @Mock
    private RecentlyViewedRepository recentlyViewedRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private com.frontpageflip.service.CloudinaryService cloudinaryService;

    private SubjectService subjectService;
    private PdfDocumentService pdfDocumentService;

    @BeforeEach
    void setUp() {
        subjectService = new SubjectService(
                subjectRepository,
                pdfRepository,
                favoriteRepository,
                userRepository
        );

        pdfDocumentService = new PdfDocumentService(
                pdfRepository,
                subjectRepository,
                readLaterRepository,
                recentlyViewedRepository,
                userRepository,
                fileStorageService,
                cloudinaryService
        );
    }

    @Test
    @DisplayName("Admin can create new subject with unique slug")
    void testCreateSubjectSuccess() {
        SubjectRequest request = new SubjectRequest();
        request.setName("Computer Networks");
        request.setDescription("OSI model, TCP/IP protocol suite, routing algorithms.");
        request.setIcon("network");
        request.setIconBgColor("#EEF2FF");
        request.setIconColor("#4F46E5");

        User admin = new User();
        admin.setId("usr-admin");
        admin.setRole(Role.ADMIN);

        when(subjectRepository.existsBySlug("computer-networks")).thenReturn(false);
        when(userRepository.findById("usr-admin")).thenReturn(Optional.of(admin));
        when(subjectRepository.save(any(Subject.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubjectResponse response = subjectService.createSubject(request, "usr-admin");

        assertNotNull(response);
        assertEquals("Computer Networks", response.getName());
        assertEquals("computer-networks", response.getSlug());
        verify(subjectRepository, times(1)).save(any(Subject.class));
    }

    @Test
    @DisplayName("Create subject throws BadRequestException on duplicate slug")
    void testCreateSubjectDuplicateSlugThrows() {
        SubjectRequest request = new SubjectRequest();
        request.setName("Mathematics");

        when(subjectRepository.existsBySlug("mathematics")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> subjectService.createSubject(request, "usr-admin"));
        verify(subjectRepository, never()).save(any(Subject.class));
    }

    @Test
    @DisplayName("Returns empty list when no published PDFs exist without error")
    void testGetPublishedPdfsEmptyState() {
        when(pdfRepository.findByPublishedTrueOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());

        List<PdfResponse> list = pdfDocumentService.getAllPublishedPdfs(null);

        assertNotNull(list);
        assertTrue(list.isEmpty());
        verify(pdfRepository, times(1)).findByPublishedTrueOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("Cloudinary upload populates cloudinary_public_id and cloudinary_secure_url in MySQL")
    void testUploadPdfWithCloudinary() {
        org.springframework.mock.web.MockMultipartFile mockFile =
                new org.springframework.mock.web.MockMultipartFile("file", "lecture_1.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        Subject subject = new Subject();
        subject.setId("sub_1");
        subject.setName("Data Structures");

        when(subjectRepository.findById("sub_1")).thenReturn(Optional.of(subject));
        when(cloudinaryService.isConfigured()).thenReturn(true);
        when(cloudinaryService.uploadPdf(any(), any())).thenReturn(
                new com.frontpageflip.service.CloudinaryService.CloudinaryUploadResult(
                        "front-page-flip/pdfs/cld_test_123",
                        "https://res.cloudinary.com/testcloud/raw/upload/v1234/front-page-flip/pdfs/cld_test_123.pdf",
                        "lecture_1.pdf",
                        1024L
                )
        );
        when(pdfRepository.save(any(PdfDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PdfResponse response = pdfDocumentService.uploadPdf(
                mockFile, "Lecture 1 Notes", "Arrays & Linked Lists", "sub_1", "B.Tech", "Semester 3", "Notes", 12, true, "usr_admin"
        );

        assertNotNull(response);
        assertEquals("front-page-flip/pdfs/cld_test_123", response.getCloudinaryPublicId());
        assertEquals("https://res.cloudinary.com/testcloud/raw/upload/v1234/front-page-flip/pdfs/cld_test_123.pdf", response.getCloudinarySecureUrl());
        verify(cloudinaryService, times(1)).uploadPdf(any(), any());
        verify(pdfRepository, times(1)).save(any(PdfDocument.class));
    }

    @Test
    @DisplayName("Deleting PDF calls Cloudinary destroy and removes database record")
    void testDeletePdfCloudinarySuccess() {
        PdfDocument doc = new PdfDocument();
        doc.setId("pdf_1");
        doc.setCloudinaryPublicId("front-page-flip/pdfs/cld_test_123");
        doc.setStorageKey("front-page-flip/pdfs/cld_test_123");

        when(pdfRepository.findById("pdf_1")).thenReturn(Optional.of(doc));

        pdfDocumentService.deletePdf("pdf_1");

        verify(cloudinaryService, times(1)).deletePdf("front-page-flip/pdfs/cld_test_123");
        verify(pdfRepository, times(1)).delete(doc);
    }

    @Test
    @DisplayName("If Cloudinary deletion fails, database record is NOT deleted")
    void testDeletePdfCloudinaryFailureDoesNotDeleteDbRecord() {
        PdfDocument doc = new PdfDocument();
        doc.setId("pdf_1");
        doc.setCloudinaryPublicId("front-page-flip/pdfs/cld_test_123");

        when(pdfRepository.findById("pdf_1")).thenReturn(Optional.of(doc));
        doThrow(new RuntimeException("Cloudinary API unreachable"))
                .when(cloudinaryService).deletePdf("front-page-flip/pdfs/cld_test_123");

        assertThrows(RuntimeException.class, () -> pdfDocumentService.deletePdf("pdf_1"));

        // Crucial requirement: database record is NOT deleted on Cloudinary failure
        verify(pdfRepository, never()).delete(any(PdfDocument.class));
    }
}
