# Front-Page Flip — Production Spring Boot Backend

Production REST API and Content Management Service for **Front-Page Flip**, built with **Spring Boot 3.3.4**, **Java 21**, **Spring Security 6**, **JJWT 0.12.6**, **Flyway**, and **MySQL**.

---

## 1. Architecture & Security Highlights

1. **Compulsory Authentication & Strict RBAC**:
   - Only the designated creator account (`arkaparna.ds@gmail.com`) can obtain the `ADMIN` role.
   - Public registration strictly assigns the `STUDENT` role and blocks the creator email.
   - Client requests cannot spoof roles; role enforcement is evaluated server-side in Spring Security (`hasRole('ADMIN')`).
   - JWT tokens are signed using JJWT 0.12.6 with HMAC-SHA256.

2. **Genuine PDF Document Persistence**:
   - Files are validated against the standard magic byte header (`%PDF-`).
   - Max file size strictly enforced to 25MB (`spring.servlet.multipart.max-file-size=25MB`).
   - Storage abstraction supports both local filesystem and AWS S3 object storage.

3. **Database Schema & Migrations**:
   - Managed automatically via Flyway versioned migrations (`V1__init_schema.sql`).
   - Includes tables: `users`, `subjects`, `pdf_documents`, `favorites`, `read_later`, `recently_viewed`, and `verification_tokens`.

4. **Empty State & Data Integrity**:
   - Zero fabricated records. When no subjects or PDFs are published, clean JSON arrays are returned so frontends render clear, user-friendly empty states.

---

## 2. Prerequisites

- **Java Development Kit (JDK)**: 21 or higher
- **Apache Maven**: 3.9+
- **MySQL Database**: 8.0+

---

## 3. Quick Start

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` or export variables in your shell:
```bash
cp .env.example .env
```

Ensure MySQL is running and create the database:
```sql
CREATE DATABASE frontpageflip CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Build the Application
```bash
mvn clean package -DskipTests
```

### Step 3: Run Unit & Integration Tests
```bash
mvn test
```

### Step 4: Run the Backend
```bash
mvn spring-boot:run
```
The server will start on `http://localhost:8080`.

---

## 4. API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/student/register` | Public | Register new student account |
| `POST` | `/api/v1/auth/student/login` | Public | Student login with password or email |
| `POST` | `/api/v1/auth/admin/login` | Creator Only | Strict admin login for `arkaparna.ds@gmail.com` |
| `POST` | `/api/v1/auth/admin/setup` | Public (Initial) | Initial secure admin setup |
| `GET`  | `/api/v1/auth/verify?token=...` | Public | Verify student email address |
| `GET`  | `/api/v1/auth/me` | Authenticated | Fetch current authenticated user profile |

### Subjects (`/api/v1/subjects`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/subjects` | Authenticated | List all available subjects |
| `GET`  | `/api/v1/subjects/{id}` | Authenticated | Get subject details |
| `GET`  | `/api/v1/subjects/slug/{slug}` | Authenticated | Get subject details by slug |
| `POST` | `/api/v1/subjects` | Admin Only | Create a new subject |
| `PUT`  | `/api/v1/subjects/{id}` | Admin Only | Update existing subject |
| `DELETE` | `/api/v1/subjects/{id}` | Admin Only | Delete subject and associated materials |

### PDFs & Study Materials (`/api/v1/pdfs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/pdfs` | Authenticated | List all published PDFs |
| `GET`  | `/api/v1/pdfs/subject/{subjectId}` | Authenticated | Get published PDFs for a subject |
| `GET`  | `/api/v1/pdfs/{id}` | Authenticated | Get PDF document metadata |
| `GET`  | `/api/v1/pdfs/{id}/download` | Authenticated | Download PDF file stream |
| `POST` | `/api/v1/pdfs/upload` | Admin Only | Upload genuine PDF (multipart, max 25MB) |
| `PUT`  | `/api/v1/pdfs/{id}` | Admin Only | Update PDF metadata |
| `DELETE` | `/api/v1/pdfs/{id}` | Admin Only | Delete PDF document and storage file |
| `POST` | `/api/v1/pdfs/{id}/read-later` | Authenticated | Toggle Read Later bookmark |
| `POST` | `/api/v1/pdfs/{id}/progress` | Authenticated | Save reading progress (page number) |

### Student & Administrator Authentication (`/api/v1/auth` & `/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/student/register` | Public | Registers student, generates 6-digit OTP, dispatches Brevo verification email |
| `POST` | `/api/v1/auth/student/login` | Public | Authenticates student; rejects unverified students |
| `POST` | `/api/v1/auth/verify-email` | Public | Validates 6-digit OTP or verification token, activates account |
| `POST` | `/api/v1/auth/resend-verification` | Public | Rate-limited (60s cooldown) verification code resend |
| `POST` | `/api/v1/auth/forgot-password` | Public | Generates single-use 15-min recovery code, sends Brevo email |
| `POST` | `/api/v1/auth/reset-password` | Public | Resets password with single-use code and BCrypt hash |
| `POST` | `/api/admin/login` | Public | Independent Admin Login for configured creator (`arkaparna.ds@gmail.com`). No OTP required |
| `POST` | `/api/v1/auth/admin/login` | Public | Alias for independent Admin Login |
| `GET`  | `/api/v1/auth/me` | Authenticated | Fetches profile of current session user |

### Personal Library (`/api/v1/library`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/library` | Authenticated | Get user's favorites, read-later, & recently viewed |
| `POST` | `/api/v1/library/favorites/{subjectId}` | Authenticated | Toggle subject favorite |

### Live Presence & Student Tracking (`/api/v1/presence`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/presence/active-students-count` | Public | Live count of authenticated students active in the last 5 minutes from MySQL (excludes admins) |
| `POST` | `/api/v1/presence/heartbeat` | Student | Heartbeat updating student `last_active_at` timestamp in MySQL |
| `POST` | `/api/v1/presence/logout` | Authenticated | Clears user presence upon explicit sign out |

### Admin Content Management (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/admin/stats` | Admin Only | Get system totals (subjects, PDFs, students) |
| `GET`  | `/api/v1/admin/all-pdfs` | Admin Only | Get all PDFs including drafts |

---

## 5. Render.com & Aiven MySQL Deployment Guide

### Database & Flyway Migrations
Database tables are automatically created and updated by Flyway on startup:
1. `V1__init_schema.sql`: Base tables (`users`, `subjects`, `pdf_documents`, `favorites`, `read_later`, `verification_tokens`, `recently_viewed`).
2. `V2__add_user_last_active.sql`: Adds `last_active_at` timestamp and index for live presence tracking.
3. `V3__email_auth_and_tokens.sql`: Adds `password_reset_tokens` table and rate-limiting timestamp columns (`last_verification_sent_at`, `last_password_reset_sent_at`).

### Render Environment Variables
In your Render Dashboard (**Web Service** > **Environment** tab), configure the following:

| Variable | Example / Recommended Value | Description |
|---|---|---|
| `DB_HOST` | `mysql-xxxx.aivencloud.com` | Aiven MySQL Service Host |
| `DB_PORT` | `12345` | Aiven MySQL Port |
| `DB_NAME` | `defaultdb` (or `frontpageflip`) | MySQL Database Name |
| `DB_USERNAME` | `avnadmin` | Aiven MySQL User |
| `DB_PASSWORD` | `AVNS_xxxxxxxxxxxx` | Aiven MySQL Password |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit HMAC-SHA256 Secret |
| `CREATOR_EMAIL` | `arkaparna.ds@gmail.com` | Designated System Administrator Email |
| `ADMIN_INITIAL_PASSWORD` | `YourStrongAdminPassword2026!` | Initial Admin BCrypt Seed (applied only if no password set) |
| `MAIL_HOST` | `smtp-relay.brevo.com` | Brevo SMTP Host |
| `MAIL_PORT` | `587` | Brevo SMTP Port (STARTTLS) |
| `MAIL_USERNAME` | `your-brevo-login@domain.com` | Brevo SMTP Account Login |
| `MAIL_PASSWORD` | `your-brevo-smtp-master-key` | Brevo SMTP Key |
| `MAIL_FROM` | `no-reply@frontpageflip.com` | Verified Brevo Sender Email |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Frontend Origin (for 1-click verification/reset links) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,https://your-frontend.vercel.app` | Allowed CORS Origins |

### Render Service Configuration
- **Root Directory**: `backend`
- **Environment**: `Docker` (or `Java` with JDK 21)
- **Build Command** (if Java): `mvn clean package -DskipTests`
- **Start Command** (if Java): `java -jar target/frontpageflip-backend-1.0.0.jar`

---

## 6. How to Run Backend Tests

The project includes JUnit 5 and Mockito test suites:
- `AuthServiceTest`: Tests student registration, role enforcement, creator rejection in public signups, and admin authentication.
- `SecurityConfigTest`: Tests BCrypt password hashing, salt generation, and strict role definitions (`STUDENT`, `ADMIN`).
- `SubjectPdfServiceTest`: Tests admin-only subject and PDF creation logic.

To execute the tests locally:
```bash
cd backend
mvn test
```
All unit tests run against in-memory Mockito mocks without requiring a live MySQL instance.

