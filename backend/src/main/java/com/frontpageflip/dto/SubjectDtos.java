package com.frontpageflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubjectDtos {

    public static class SubjectRequest {
        @NotBlank(message = "Subject name is required")
        @Size(min = 2, max = 100, message = "Subject name must be between 2 and 100 characters")
        private String name;

        private String slug;

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        private String description;

        private String icon = "sigma";
        private String iconColor = "#1677FF";
        private String iconBgColor = "#EFF6FF";

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }

        public String getIconColor() { return iconColor; }
        public void setIconColor(String iconColor) { this.iconColor = iconColor; }

        public String getIconBgColor() { return iconBgColor; }
        public void setIconBgColor(String iconBgColor) { this.iconBgColor = iconBgColor; }
    }

    public static class SubjectResponse {
        private String id;
        private String name;
        private String slug;
        private String description;
        private String icon;
        private String iconColor;
        private String iconBgColor;
        private long pdfCount;
        private boolean isFavorite;

        public SubjectResponse() {}

        public SubjectResponse(String id, String name, String slug, String description, String icon, String iconColor, String iconBgColor, long pdfCount) {
            this.id = id;
            this.name = name;
            this.slug = slug;
            this.description = description;
            this.icon = icon;
            this.iconColor = iconColor;
            this.iconBgColor = iconBgColor;
            this.pdfCount = pdfCount;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }

        public String getIconColor() { return iconColor; }
        public void setIconColor(String iconColor) { this.iconColor = iconColor; }

        public String getIconBgColor() { return iconBgColor; }
        public void setIconBgColor(String iconBgColor) { this.iconBgColor = iconBgColor; }

        public long getPdfCount() { return pdfCount; }
        public void setPdfCount(long pdfCount) { this.pdfCount = pdfCount; }

        public boolean isFavorite() { return isFavorite; }
        public void setFavorite(boolean favorite) { isFavorite = favorite; }
    }
}
