package com.frontpageflip.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.frontpageflip.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);
    private static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

    @Value("${app.cloudinary.cloud-name:${CLOUDINARY_CLOUD_NAME:}}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:${CLOUDINARY_API_KEY:}}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:${CLOUDINARY_API_SECRET:}}")
    private String apiSecret;

    @Value("${app.cloudinary.folder:${CLOUDINARY_FOLDER:front-page-flip/pdfs}}")
    private String folder;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (isConfigured()) {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName.trim());
            config.put("api_key", apiKey.trim());
            config.put("api_secret", apiSecret.trim());
            config.put("secure", "true");
            this.cloudinary = new Cloudinary(config);
            logger.info("Cloudinary PDF service initialized successfully. cloud_name='{}', folder='{}', api_key=[CONFIGURED]",
                    cloudName.trim(), folder != null ? folder.trim() : "front-page-flip/pdfs");
        } else {
            logger.warn("Cloudinary credentials are not configured. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET missing. PDF operations will fallback to local storage.");
        }
    }

    public boolean isConfigured() {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }

    /**
     * Validates and uploads a PDF file to Cloudinary as a raw resource.
     * Enforces PDF file type, max size, and %PDF magic bytes check.
     *
     * @param file the uploaded MultipartFile
     * @param preferredFilename fallback filename
     * @return CloudinaryUploadResult containing public_id, secure_url, and file details
     */
    public CloudinaryUploadResult uploadPdf(MultipartFile file, String preferredFilename) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded PDF file cannot be empty");
        }

        // Validate max 25MB
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("PDF file size exceeds maximum 25MB limit (provided: "
                    + FileStorageService.formatFileSize(file.getSize()) + ")");
        }

        // Validate genuine PDF magic header (%PDF)
        validatePdfFormat(file);

        if (!isConfigured() || this.cloudinary == null) {
            throw new IllegalStateException("Cloudinary is not configured. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables are set.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : preferredFilename;
        String cleanFilename = (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf"))
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "document.pdf";

        try {
            logger.info("Uploading PDF '{}' ({} bytes) to Cloudinary folder '{}' as raw resource...",
                    cleanFilename, file.getSize(), folder);

            Map<String, Object> params = ObjectUtils.asMap(
                    "resource_type", "raw",
                    "folder", folder != null && !folder.isBlank() ? folder.trim() : "front-page-flip/pdfs",
                    "use_filename", true,
                    "unique_filename", true
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

            String publicId = (String) uploadResult.get("public_id");
            String secureUrl = (String) uploadResult.get("secure_url");

            if (publicId == null || secureUrl == null) {
                throw new RuntimeException("Cloudinary upload did not return a valid public_id or secure_url");
            }

            logger.info("PDF '{}' successfully uploaded to Cloudinary. public_id='{}', secure_url='{}'",
                    cleanFilename, publicId, secureUrl);

            return new CloudinaryUploadResult(publicId, secureUrl, cleanFilename, file.getSize());

        } catch (IOException e) {
            logger.error("Failed to read PDF file stream for Cloudinary upload: {}", e.getMessage());
            throw new BadRequestException("Could not read uploaded PDF file stream: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Cloudinary upload failed for PDF '{}': {}", cleanFilename, e.getMessage());
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a raw PDF resource from Cloudinary using its public_id.
     * Enforces resource_type: raw so Cloudinary deletes raw PDFs correctly.
     *
     * @param publicId the Cloudinary public_id of the PDF
     */
    public void deletePdf(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        if (!isConfigured() || this.cloudinary == null) {
            logger.warn("Cloudinary not configured. Skipping remote deletion for public_id='{}'", publicId);
            return;
        }

        try {
            logger.info("Deleting raw PDF resource from Cloudinary with public_id='{}'...", publicId);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
            String status = (String) result.get("result");

            logger.info("Cloudinary destroy result for public_id='{}': status='{}'", publicId, status);

            if ("error".equalsIgnoreCase(status)) {
                String errorMsg = "Cloudinary deletion returned error for public_id: " + publicId;
                logger.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }
        } catch (Exception e) {
            logger.error("Failed to delete PDF from Cloudinary with public_id='{}': {}", publicId, e.getMessage());
            throw new RuntimeException("Failed to delete PDF from Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Validates and uploads an optional thumbnail image (JPG, PNG, WEBP) to Cloudinary.
     */
    public CloudinaryUploadResult uploadThumbnail(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Thumbnail image size exceeds maximum 5MB limit");
        }

        validateImageFormat(file);

        if (!isConfigured() || this.cloudinary == null) {
            throw new IllegalStateException("Cloudinary is not configured. Please ensure Cloudinary environment variables are set.");
        }

        String thumbnailFolder = (folder != null && !folder.isBlank())
                ? folder.trim() + "/thumbnails"
                : "front-page-flip/thumbnails";

        try {
            logger.info("Uploading thumbnail image '{}' ({} bytes) to Cloudinary folder '{}'...",
                    file.getOriginalFilename(), file.getSize(), thumbnailFolder);

            Map<String, Object> params = ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", thumbnailFolder,
                    "use_filename", true,
                    "unique_filename", true
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

            String publicId = (String) uploadResult.get("public_id");
            String secureUrl = (String) uploadResult.get("secure_url");

            if (publicId == null || secureUrl == null) {
                throw new RuntimeException("Cloudinary thumbnail upload did not return a valid public_id or secure_url");
            }

            logger.info("Thumbnail successfully uploaded to Cloudinary. public_id='{}', secure_url='{}'",
                    publicId, secureUrl);

            return new CloudinaryUploadResult(publicId, secureUrl, file.getOriginalFilename(), file.getSize());

        } catch (IOException e) {
            logger.error("Failed to read thumbnail image file stream: {}", e.getMessage());
            throw new BadRequestException("Could not read uploaded thumbnail image file stream: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Cloudinary thumbnail upload failed: {}", e.getMessage());
            throw new RuntimeException("Cloudinary thumbnail upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes an image thumbnail resource from Cloudinary.
     */
    public void deleteThumbnail(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        if (!isConfigured() || this.cloudinary == null) {
            return;
        }

        try {
            logger.info("Deleting thumbnail resource from Cloudinary with public_id='{}'...", publicId);
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception e) {
            logger.warn("Failed to delete thumbnail from Cloudinary with public_id='{}': {}", publicId, e.getMessage());
        }
    }

    private void validateImageFormat(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BadRequestException("Thumbnail file name is missing");
        }
        String lower = filename.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png") && !lower.endsWith(".webp")) {
            throw new BadRequestException("Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String lowerContent = contentType.toLowerCase();
            if (!lowerContent.startsWith("image/") && !lowerContent.contains("jpeg") && !lowerContent.contains("png") && !lowerContent.contains("webp")) {
                throw new BadRequestException("Invalid image content type: " + contentType);
            }
        }
    }

    /**
     * Inspects stream magic bytes to guarantee file is a genuine PDF.
     */
    private void validatePdfFormat(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Invalid file extension. Only .pdf files are permitted.");
        }

        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[4];
            int read = is.read(header);
            // Magic bytes: 0x25 0x50 0x44 0x46 => %PDF
            if (read < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                throw new BadRequestException("Invalid file format. File content must be a genuine PDF document.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Unable to inspect uploaded file format header.");
        }
    }

    public static class CloudinaryUploadResult {
        private final String publicId;
        private final String secureUrl;
        private final String fileName;
        private final long sizeBytes;

        public CloudinaryUploadResult(String publicId, String secureUrl, String fileName, long sizeBytes) {
            this.publicId = publicId;
            this.secureUrl = secureUrl;
            this.fileName = fileName;
            this.sizeBytes = sizeBytes;
        }

        public String getPublicId() { return publicId; }
        public String getSecureUrl() { return secureUrl; }
        public String getFileName() { return fileName; }
        public long getSizeBytes() { return sizeBytes; }
    }
}
