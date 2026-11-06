package com.frontpageflip.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1", "/api"})
public class GoldenController {

    private static final Logger log = LoggerFactory.getLogger(GoldenController.class);
    private static final int GOLDEN_PRICE_PAISE = 14900; // Exactly ₹149 one-time lifetime

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.razorpay.key-id:rzp_live_TwReofbXIfEGXk}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:ipp92NPh5OIoyX9bWr9qmRlF}")
    private String razorpayKeySecret;

    @Value("${app.razorpay.webhook-secret:}")
    private String razorpayWebhookSecret;

    public GoldenController(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Check Golden status for current student or general visitor.
     * Publicly accessible; shows user status if authenticated.
     */
    @GetMapping({"/golden/status", "/status"})
    public ResponseEntity<Map<String, Object>> getGoldenStatus(Authentication authentication) {
        String userId = (authentication != null && !"anonymousUser".equals(authentication.getPrincipal()))
                ? (String) authentication.getPrincipal()
                : null;
        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;

        Map<String, Object> resp = new HashMap<>();
        resp.put("isGolden", user != null && user.isGolden());
        resp.put("goldenPlan", (user != null && user.getGoldenPlan() != null) ? user.getGoldenPlan() : "Lifetime Golden");
        resp.put("paymentStatus", user != null ? user.getPaymentStatus() : "NONE");
        resp.put("price", 149);
        resp.put("priceInPaise", GOLDEN_PRICE_PAISE);
        resp.put("currency", "INR");
        resp.put("key_id", razorpayKeyId);
        resp.put("available", true);
        resp.put("message", "Unlock PDF downloads for all study materials, permanently.");
        return ResponseEntity.ok(resp);
    }

    /**
     * STEP 1: BACKEND - Create Order
     * Endpoint: POST /api/v1/create-order, /api/create-order, /api/v1/golden/create-order
     * Requires authenticated student via JWT.
     * Server-side strictly enforces ₹149 (14900 paise) and INR currency.
     */
    @PostMapping({"/create-order", "/golden/create-order"})
    public ResponseEntity<?> createOrder(
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication
    ) {
        String userId = (authentication != null && !"anonymousUser".equals(authentication.getPrincipal()))
                ? (String) authentication.getPrincipal()
                : null;

        if (userId == null || userId.isBlank() || "anonymousUser".equalsIgnoreCase(userId)) {
            // Also check fallback userId in request body if present
            if (body != null && body.containsKey("userId")) {
                userId = String.valueOf(body.get("userId"));
            }
        }

        User user = null;
        if (userId != null && !userId.isBlank() && !"anonymousUser".equalsIgnoreCase(userId)) {
            user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                user = userRepository.findByEmailIgnoreCase(userId).orElse(null);
            }
        }

        if (user == null && authentication != null && authentication.getName() != null && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
            if (user == null) {
                user = userRepository.findById(authentication.getName()).orElse(null);
            }
        }

        if (user == null && body != null && body.containsKey("userEmail")) {
            user = userRepository.findByEmailIgnoreCase(String.valueOf(body.get("userEmail"))).orElse(null);
        }

        if (user == null && body != null && body.containsKey("email")) {
            user = userRepository.findByEmailIgnoreCase(String.valueOf(body.get("email"))).orElse(null);
        }

        if (user == null) {
            log.warn("createOrder rejected: unable to identify student for principal='{}' body={}",
                    authentication != null ? authentication.getPrincipal() : null, body);
            throw new UnauthorizedException("Please sign in to your student account to purchase Lifetime Golden membership.");
        }

        if (user.isGolden()) {
            return ResponseEntity.ok(Map.of(
                    "alreadyGolden", true,
                    "message", "Your account already has an active Lifetime Golden membership! All downloads are unlocked."
            ));
        }

        try {
            // Enforce price server-side: ₹149 one-time (14900 paise)
            int amount = GOLDEN_PRICE_PAISE;
            String currency = "INR";
            // Receipt ID: Razorpay requires max 40 characters
            String cleanUserId = userId.replaceAll("[^a-zA-Z0-9]", "");
            String receiptPrefix = cleanUserId.substring(0, Math.min(cleanUserId.length(), 12));
            String receipt = "gld_" + receiptPrefix + "_" + (System.currentTimeMillis() % 100000000);

            Map<String, Object> orderPayload = new HashMap<>();
            orderPayload.put("amount", amount);
            orderPayload.put("currency", currency);
            orderPayload.put("receipt", receipt);

            Map<String, String> notes = new HashMap<>();
            notes.put("userId", userId);
            notes.put("userEmail", user.getEmail());
            notes.put("userName", user.getName());
            notes.put("package", "Lifetime Golden");
            orderPayload.put("notes", notes);

            String jsonPayload = objectMapper.writeValueAsString(orderPayload);
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                    (razorpayKeyId.trim() + ":" + razorpayKeySecret.trim()).getBytes(StandardCharsets.UTF_8)
            );

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", authHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String orderId = root.path("id").asText();

                // Save pending order info on user
                user.setPaymentOrderId(orderId);
                user.setPaymentStatus("PENDING");
                userRepository.save(user);

                Map<String, Object> result = new HashMap<>();
                result.put("order_id", orderId);
                result.put("id", orderId);
                result.put("amount", amount);
                result.put("currency", currency);
                result.put("receipt", receipt);
                result.put("key_id", razorpayKeyId);
                return ResponseEntity.ok(result);
            } else {
                log.error("Failed to create Razorpay order: status={}, body={}", response.statusCode(), response.body());
                JsonNode errNode = null;
                try {
                    errNode = objectMapper.readTree(response.body());
                } catch (Exception ignored) {}

                String desc = (errNode != null && errNode.has("error") && errNode.path("error").has("description"))
                        ? errNode.path("error").path("description").asText()
                        : "Failed to initialize checkout with Razorpay";

                return ResponseEntity.status(response.statusCode()).body(Map.of(
                        "error", desc,
                        "status", response.statusCode(),
                        "details", response.body()
                ));
            }
        } catch (Exception e) {
            log.error("Internal error creating Razorpay order: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * STEP 3: BACKEND - Verify Signature
     * Endpoint: POST /api/v1/verify-payment, /api/verify-payment, /api/v1/golden/verify-payment
     * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
     * Compares generated signature with razorpay_signature using timing-safe comparison.
     * On match: marks user as Lifetime Golden in Aiven MySQL.
     */
    @PostMapping({"/verify-payment", "/golden/verify-payment"})
    public ResponseEntity<?> verifyPayment(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String orderId = body.get("razorpay_order_id");
        String paymentId = body.get("razorpay_payment_id");
        String signature = body.get("razorpay_signature");

        if (orderId == null || orderId.isBlank() ||
                paymentId == null || paymentId.isBlank() ||
                signature == null || signature.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "verified", false,
                    "error", "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required."
            ));
        }

        // Verify cryptographic HMAC-SHA256 signature
        String payload = orderId.trim() + "|" + paymentId.trim();
        boolean isValid = verifyHmacSignature(payload, signature.trim(), razorpayKeySecret.trim());

        if (!isValid) {
            log.warn("Razorpay payment signature mismatch for orderId: {}", orderId);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "verified", false,
                    "error", "Payment verification failed: Signature mismatch. Payment could not be validated."
            ));
        }

        // Signature matched: update user in Aiven MySQL
        String userId = (authentication != null && !"anonymousUser".equals(authentication.getPrincipal()))
                ? (String) authentication.getPrincipal()
                : body.get("userId");

        User targetUser = null;
        if (userId != null && !userId.isBlank() && !"anonymousUser".equalsIgnoreCase(userId)) {
            targetUser = userRepository.findById(userId).orElse(null);
            if (targetUser == null) {
                targetUser = userRepository.findByEmailIgnoreCase(userId).orElse(null);
            }
        }
        if (targetUser == null && authentication != null && authentication.getName() != null && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            targetUser = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
            if (targetUser == null) {
                targetUser = userRepository.findById(authentication.getName()).orElse(null);
            }
        }
        if (targetUser == null && body.containsKey("userEmail")) {
            targetUser = userRepository.findByEmailIgnoreCase(body.get("userEmail")).orElse(null);
        }
        if (targetUser == null && body.containsKey("email")) {
            targetUser = userRepository.findByEmailIgnoreCase(body.get("email")).orElse(null);
        }
        if (targetUser == null) {
            targetUser = userRepository.findByPaymentOrderId(orderId).orElse(null);
        }

        if (targetUser != null) {
            targetUser.setGolden(true);
            targetUser.setGoldenPlan("Lifetime Golden");
            targetUser.setPaymentStatus("COMPLETED");
            targetUser.setPaymentOrderId(orderId);
            if (targetUser.getGoldenPurchasedAt() == null) {
                targetUser.setGoldenPurchasedAt(Instant.now());
            }
            userRepository.save(targetUser);
            log.info("Student {} ({}) successfully upgraded to Lifetime Golden!", targetUser.getId(), targetUser.getEmail());
        } else {
            log.warn("Payment signature verified for orderId {}, but no user found in database to link.", orderId);
        }

        Map<String, Object> successResp = new HashMap<>();
        successResp.put("success", true);
        successResp.put("verified", true);
        successResp.put("isGolden", true);
        successResp.put("order_id", orderId);
        successResp.put("payment_id", paymentId);
        successResp.put("message", "Payment verified successfully. Lifetime Golden membership activated!");
        return ResponseEntity.ok(successResp);
    }

    /**
     * Razorpay Server-to-Server Webhook Endpoint
     * Endpoint: POST /api/v1/golden/webhook, /api/golden/webhook, /api/v1/webhook/razorpay
     * Validates X-Razorpay-Signature with RAZORPAY_WEBHOOK_SECRET if configured.
     * Handles payment.captured and order.paid idempotently.
     */
    @PostMapping({"/golden/webhook", "/webhook/razorpay"})
    public ResponseEntity<?> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String webhookSignature
    ) {
        log.info("Received Razorpay webhook notification");

        // If webhook secret configured, verify HMAC signature
        if (razorpayWebhookSecret != null && !razorpayWebhookSecret.isBlank()) {
            if (webhookSignature == null || !verifyHmacSignature(rawPayload, webhookSignature.trim(), razorpayWebhookSecret.trim())) {
                log.warn("Razorpay webhook signature verification failed");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid webhook signature"));
            }
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String event = root.path("event").asText();
            log.info("Razorpay webhook event: {}", event);

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                JsonNode payloadNode = root.path("payload");
                JsonNode paymentEntity = payloadNode.path("payment").path("entity");
                JsonNode orderEntity = payloadNode.path("order").path("entity");

                String orderId = paymentEntity.path("order_id").asText();
                if (orderId == null || orderId.isBlank()) {
                    orderId = orderEntity.path("id").asText();
                }

                String userId = paymentEntity.path("notes").path("userId").asText();
                if (userId == null || userId.isBlank()) {
                    userId = orderEntity.path("notes").path("userId").asText();
                }

                User user = null;
                if (userId != null && !userId.isBlank()) {
                    user = userRepository.findById(userId).orElse(null);
                }
                if (user == null && orderId != null && !orderId.isBlank()) {
                    user = userRepository.findByPaymentOrderId(orderId).orElse(null);
                }

                if (user != null) {
                    user.setGolden(true);
                    user.setGoldenPlan("Lifetime Golden");
                    user.setPaymentStatus("COMPLETED");
                    if (orderId != null && !orderId.isBlank()) {
                        user.setPaymentOrderId(orderId);
                    }
                    if (user.getGoldenPurchasedAt() == null) {
                        user.setGoldenPurchasedAt(Instant.now());
                    }
                    userRepository.save(user);
                    log.info("Webhook: Upgraded student {} ({}) to Lifetime Golden", user.getId(), user.getEmail());
                } else {
                    log.warn("Webhook: Could not locate user for orderId={} userId={}", orderId, userId);
                }
            }

            return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
        } catch (Exception e) {
            log.error("Failed to parse Razorpay webhook payload: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to parse webhook: " + e.getMessage()));
        }
    }

    /**
     * Compute HMAC-SHA256 signature and compare in constant time.
     */
    private boolean verifyHmacSignature(String payload, String signature, String secret) {
        if (payload == null || signature == null || secret == null || secret.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculatedSignature = hexString.toString();

            byte[] a = calculatedSignature.getBytes(StandardCharsets.UTF_8);
            byte[] b = signature.trim().getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(a, b);
        } catch (Exception e) {
            log.error("Error computing HMAC-SHA256: ", e);
            return false;
        }
    }
}
