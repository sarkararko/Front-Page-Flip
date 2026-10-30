package com.frontpageflip.service;

import com.frontpageflip.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.storage.upload-dir:./uploads/pdfs}")
    private String uploadDir;

    public String storePdf(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded PDF file cannot be empty");
        }

        // Validate max 25MB
        if (file.getSize() > 25 * 1024 * 1024) {
            throw new BadRequestException("PDF file size exceeds maximum 25MB limit");
        }

        // Validate MIME and magic numbers
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[5];
            int read = is.read(header);
            if (read < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) { // %PDF
                throw new BadRequestException("Invalid file format. File must be a genuine PDF document.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Could not read uploaded PDF file stream");
        }

        try {
            Path storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(storageDirectory);

            String originalFilename = file.getOriginalFilename();
            String cleanFilename = (originalFilename != null && originalFilename.endsWith(".pdf"))
                    ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "document.pdf";

            String storageKey = UUID.randomUUID().toString() + "_" + cleanFilename;
            Path targetLocation = storageDirectory.resolve(storageKey);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to persist uploaded PDF file to disk: " + e.getMessage(), e);
        }
    }

    public Resource loadPdfAsResource(String storageKey) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(storageKey).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("PDF file not found in storage: " + storageKey);
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("Invalid PDF storage URL path");
        }
    }

    public void deletePdf(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) return;
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(storageKey).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
    }

    public static String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
