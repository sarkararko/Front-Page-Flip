package com.frontpageflip.controller;

import com.frontpageflip.exception.BadRequestException;
import com.frontpageflip.exception.UnauthorizedException;
import com.frontpageflip.model.User;
import com.frontpageflip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
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
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/golden", "/api/golden", "/api"})
public class GoldenController {

    private final UserRepository userRepository;

    @Value("${app.razorpay.key-id:rzp_test_TwQeY3q2SKyMCY}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:OkRPe0KeGpoqRbDM1rRB5mLk}")
    private String razorpayKeySecret;

    public GoldenController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Check Golden status for current student.
     */
    @GetMapping({"/status", "/golden/status"})
    public ResponseEntity<Map<String, Object>> getGoldenStatus(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;

        Map<String, Object> resp = new HashMap<>();
        resp.put("isGolden", user != null && user.isGolden());
        resp.put("goldenPlan", (user != null && user.getGoldenPlan() != null) ? user.getGoldenPlan() : "Lifetime Golden");
        resp.put("paymentStatus", user != null ? user.getPaymentStatus() : "NONE");
        resp.put("price", 149);
        resp.put("priceInPaise", 14900);
        resp.put("currency", "INR");
        resp.put("key_id", razorpayKeyId);
        resp.put("available", true);
        resp.put("message", "Unlock PDF downloads for all study materials, permanently.");
        return ResponseEntity.ok(resp);
    }

    /**
     * STEP 1: BACKEND - Create Order
     * Endpoint: POST /api/create-order, /api/v1/create-order, /api/v1/golden/create-order
     * Call Razorpay API: POST https://api.razorpay.com/v1/orders
     * Request: { amount (paise), currency, receipt }
     * Return: { order_id, amount, currency, key_id }
     * Minimum amount: 100 paise
     */
    @PostMapping({"/create-order", "/v1/create-order", "/golden/create-order", "/v1/golden/create-order"})
    public ResponseEntity<?> createOrder(@RequestBody(required = false) Map<String, Object> body) {
        try {
            int amount = 14900; // Default ₹149 = 14900 paise
            if (body != null && body.containsKey("amount")) {
                Object rawAmount = body.get("amount");
                if (rawAmount instanceof Number) {
                    amount = ((Number) rawAmount).intValue();
                }
            }

            if (amount < 100) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be at least 100 paise (₹1.00)"));
            }

            String currency = (body != null && body.containsKey("currency")) ? body.get("currency").toString().toUpperCase() : "INR";
            String receipt = (body != null && body.containsKey("receipt")) ? body.get("receipt").toString() : "order_rcptid_" + System.currentTimeMillis();

            // Prepare HTTP request to Razorpay Orders API
            String jsonPayload = String.format("{\"amount\":%d,\"currency\":\"%s\",\"receipt\":\"%s\"}", amount, currency, receipt);
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((razorpayKeyId + ":" + razorpayKeySecret).getBytes(StandardCharsets.UTF_8));

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", authHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                // Parse order_id from response
                String responseBody = response.body();
                String orderId = extractJsonValue(responseBody, "id");

                Map<String, Object> result = new HashMap<>();
                result.put("order_id", orderId);
                result.put("id", orderId);
                result.put("amount", amount);
                result.put("currency", currency);
                result.put("receipt", receipt);
                result.put("key_id", razorpayKeyId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(response.statusCode()).body(Map.of(
                        "error", "Failed to create order on Razorpay",
                        "status", response.statusCode(),
                        "details", response.body()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * STEP 3: BACKEND - Verify Signature
     * Endpoint: POST /api/verify-payment, /api/v1/verify-payment, /api/v1/golden/verify-payment
     * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
     * Compare generated signature with razorpay_signature
     * Return success only if signatures match
     */
    @PostMapping({"/verify-payment", "/v1/verify-payment", "/golden/verify-payment", "/v1/golden/verify-payment"})
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

        try {
            // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String generatedSignature = hexString.toString();

            if (!generatedSignature.equalsIgnoreCase(signature.trim())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "verified", false,
                        "error", "Payment verification failed: Signature mismatch. Payment could not be validated."
                ));
            }

            // Signature matched: Mark authenticated user as Golden
            String currentUserId = authentication != null ? (String) authentication.getPrincipal() : body.get("userId");
            if (currentUserId != null) {
                userRepository.findById(currentUserId).ifPresent(user -> {
                    user.setGolden(true);
                    user.setGoldenPlan("Lifetime Golden");
                    user.setPaymentStatus("COMPLETED");
                    user.setPaymentOrderId(orderId);
                    user.setGoldenPurchasedAt(Instant.now());
                    userRepository.save(user);
                });
            }

            Map<String, Object> successResp = new HashMap<>();
            successResp.put("success", true);
            successResp.put("verified", true);
            successResp.put("isGolden", true);
            successResp.put("order_id", orderId);
            successResp.put("payment_id", paymentId);
            successResp.put("message", "Payment verified successfully. Lifetime Golden membership activated!");
            return ResponseEntity.ok(successResp);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Failed to compute HMAC verification: " + e.getMessage()
            ));
        }
    }

    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":\"";
        int idx = json.indexOf(searchKey);
        if (idx != -1) {
            int start = idx + searchKey.length();
            int end = json.indexOf("\"", start);
            if (end != -1) {
                return json.substring(start, end);
            }
        }
        return "";
    }
}
