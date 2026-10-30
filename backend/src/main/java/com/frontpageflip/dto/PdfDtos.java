package com.frontpageflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PdfDtos {

    public static class PdfUploadRequest {
        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
        private String title;

        @NotBlank(message = "Topic is required")
        private String topic;

        @NotBlank(message = "Subject ID is required")
        private String subjectId;

        private String course = "B.Tech / B.Sc";
        private String semester = "Semester 1";
        private String description;
        private int pageCount = 1;
        private boolean downloadAllowed = true;
        private boolean published = true;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }

        public String getSubjectId() { return subjectId; }
        public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

        public String getCourse() { return course; }
        public void setCourse(String course) { this.course = course; }

        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public int getPageCount() { return pageCount; }
        public void setPageCount(int pageCount) { this.pageCount = pageCount; }

        public boolean isDownloadAllowed() { return downloadAllowed; }
        public void setDownloadAllowed(boolean downloadAllowed) { this.downloadAllowed = downloadAllowed; }

        public boolean isPublished() { return published; }
        public void setPublished(boolean published) { this.published = published; }
    }

    public static class PdfResponse {
        private String id;
        private String title;
        private String topic;
        private String subjectId;
        private String subjectName;
        private String course;
        private String semester;
        private String description;
        private String fileName;
        private String fileSize;
        private int pageCount;
        private String downloadUrl;
        private String viewUrl;
        private boolean downloadAllowed;
        private boolean published;
        private String createdAt;
        private boolean isSaved;
        private Integer lastPageRead;
        private Integer readProgressPercent;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }

        public String getSubjectId() { return subjectId; }
        public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

        public String getCourse() { return course; }
        public void setCourse(String course) { this.course = course; }

        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }

        public String getFileSize() { return fileSize; }
        public void setFileSize(String fileSize) { this.fileSize = fileSize; }

        public int getPageCount() { return pageCount; }
        public void setPageCount(int pageCount) { this.pageCount = pageCount; }

        public String getDownloadUrl() { return downloadUrl; }
        public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }

        public String getViewUrl() { return viewUrl; }
        public void setViewUrl(String viewUrl) { this.viewUrl = viewUrl; }

        public boolean isDownloadAllowed() { return downloadAllowed; }
        public void setDownloadAllowed(boolean downloadAllowed) { this.downloadAllowed = downloadAllowed; }

        public boolean isPublished() { return published; }
        public void setPublished(boolean published) { this.published = published; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

        public boolean isSaved() { return isSaved; }
        public void setSaved(boolean saved) { isSaved = saved; }

        public Integer getLastPageRead() { return lastPageRead; }
        public void setLastPageRead(Integer lastPageRead) { this.lastPageRead = lastPageRead; }

        public Integer getReadProgressPercent() { return readProgressPercent; }
        public void setReadProgressPercent(Integer readProgressPercent) { this.readProgressPercent = readProgressPercent; }
    }
}
