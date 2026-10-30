package com.frontpageflip.service;

import com.frontpageflip.dto.LibraryDtos.*;
import com.frontpageflip.dto.PdfDtos.PdfResponse;
import com.frontpageflip.dto.SubjectDtos.SubjectResponse;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.ResourceNotFoundException;
import com.frontpageflip.model.*;
import com.frontpageflip.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LibraryService {

    private final FavoriteRepository favoriteRepository;
    private final ReadLaterRepository readLaterRepository;
    private final RecentlyViewedRepository recentlyViewedRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final PdfDocumentRepository pdfRepository;
    private final PdfDocumentService pdfService;
    private final SubjectService subjectService;

    public LibraryService(FavoriteRepository favoriteRepository,
                          ReadLaterRepository readLaterRepository,
                          RecentlyViewedRepository recentlyViewedRepository,
                          UserRepository userRepository,
                          SubjectRepository subjectRepository,
                          PdfDocumentRepository pdfRepository,
                          PdfDocumentService pdfService,
                          SubjectService subjectService) {
        this.favoriteRepository = favoriteRepository;
        this.readLaterRepository = readLaterRepository;
        this.recentlyViewedRepository = recentlyViewedRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.pdfRepository = pdfRepository;
        this.pdfService = pdfService;
        this.subjectService = subjectService;
    }

    @Transactional
    public boolean toggleFavorite(String userId, String subjectId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        Optional<Favorite> existing = favoriteRepository.findByUserIdAndSubjectId(userId, subjectId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        } else {
            Favorite fav = new Favorite("fav_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16), user, subject);
            favoriteRepository.save(fav);
            return true;
        }
    }

    @Transactional
    public boolean toggleReadLater(String userId, String pdfId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        PdfDocument pdf = pdfRepository.findById(pdfId)
                .orElseThrow(() -> new ResourceNotFoundException("PDF not found"));

        Optional<ReadLater> existing = readLaterRepository.findByUserIdAndPdfId(userId, pdfId);
        if (existing.isPresent()) {
            readLaterRepository.delete(existing.get());
            return false;
        } else {
            ReadLater rl = new ReadLater("rl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16), user, pdf);
            readLaterRepository.save(rl);
            return true;
        }
    }

    @Transactional
    public void recordReadingProgress(String userId, String pdfId, int currentPage, int totalPages) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        PdfDocument pdf = pdfRepository.findById(pdfId)
                .orElseThrow(() -> new ResourceNotFoundException("PDF not found"));

        Optional<RecentlyViewed> existing = recentlyViewedRepository.findByUserIdAndPdfId(userId, pdfId);
        if (existing.isPresent()) {
            RecentlyViewed rv = existing.get();
            rv.setLastPageRead(currentPage);
            rv.setTotalPages(totalPages);
            rv.setViewedAt(Instant.now());
            recentlyViewedRepository.save(rv);
        } else {
            RecentlyViewed rv = new RecentlyViewed(
                    "rv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16),
                    user,
                    pdf,
                    currentPage,
                    totalPages
            );
            recentlyViewedRepository.save(rv);
        }
    }

    public LibraryOverviewResponse getLibraryOverview(String userId) {
        List<ReadLater> readLaters = readLaterRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<PdfResponse> readLaterList = readLaters.stream()
                .map(rl -> pdfService.getPdfById(rl.getPdf().getId(), userId))
                .collect(Collectors.toList());

        List<RecentlyViewed> recentList = recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId);
        List<PdfResponse> recentlyViewed = recentList.stream()
                .map(rv -> pdfService.getPdfById(rv.getPdf().getId(), userId))
                .collect(Collectors.toList());

        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<SubjectResponse> favoriteSubjects = favorites.stream()
                .map(f -> subjectService.getSubjectById(f.getSubject().getId(), userId))
                .collect(Collectors.toList());

        return new LibraryOverviewResponse(readLaterList, recentlyViewed, favoriteSubjects);
    }

    public AdminStatsResponse getAdminStats() {
        long totalSubjects = subjectRepository.count();
        long totalPdfs = pdfRepository.count();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        return new AdminStatsResponse(totalSubjects, totalPdfs, totalStudents, totalPdfs * 4);
    }
}
