package com.frontpageflip.dto;

import java.util.List;

public class LibraryDtos {

    public static class LibraryOverviewResponse {
        private List<PdfDtos.PdfResponse> readLater;
        private List<PdfDtos.PdfResponse> recentlyViewed;
        private List<SubjectDtos.SubjectResponse> favoriteSubjects;

        public LibraryOverviewResponse() {}

        public LibraryOverviewResponse(List<PdfDtos.PdfResponse> readLater, List<PdfDtos.PdfResponse> recentlyViewed, List<SubjectDtos.SubjectResponse> favoriteSubjects) {
            this.readLater = readLater;
            this.recentlyViewed = recentlyViewed;
            this.favoriteSubjects = favoriteSubjects;
        }

        public List<PdfDtos.PdfResponse> getReadLater() { return readLater; }
        public void setReadLater(List<PdfDtos.PdfResponse> readLater) { this.readLater = readLater; }

        public List<PdfDtos.PdfResponse> getRecentlyViewed() { return recentlyViewed; }
        public void setRecentlyViewed(List<PdfDtos.PdfResponse> recentlyViewed) { this.recentlyViewed = recentlyViewed; }

        public List<SubjectDtos.SubjectResponse> getFavoriteSubjects() { return favoriteSubjects; }
        public void setFavoriteSubjects(List<SubjectDtos.SubjectResponse> favoriteSubjects) { this.favoriteSubjects = favoriteSubjects; }
    }

    public static class ProgressUpdateRequest {
        private int currentPage;
        private int totalPages;

        public int getCurrentPage() { return currentPage; }
        public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }

        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    }

    public static class AdminStatsResponse {
        private long totalSubjects;
        private long totalPdfs;
        private long totalStudents;
        private long totalDownloads;

        public AdminStatsResponse() {}

        public AdminStatsResponse(long totalSubjects, long totalPdfs, long totalStudents, long totalDownloads) {
            this.totalSubjects = totalSubjects;
            this.totalPdfs = totalPdfs;
            this.totalStudents = totalStudents;
            this.totalDownloads = totalDownloads;
        }

        public long getTotalSubjects() { return totalSubjects; }
        public void setTotalSubjects(long totalSubjects) { this.totalSubjects = totalSubjects; }

        public long getTotalPdfs() { return totalPdfs; }
        public void setTotalPdfs(long totalPdfs) { this.totalPdfs = totalPdfs; }

        public long getTotalStudents() { return totalStudents; }
        public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

        public long getTotalDownloads() { return totalDownloads; }
        public void setTotalDownloads(long totalDownloads) { this.totalDownloads = totalDownloads; }
    }
}
