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
                fileStorageService
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
}
