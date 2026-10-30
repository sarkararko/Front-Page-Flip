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

### Personal Library (`/api/v1/library`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/library` | Authenticated | Get user's favorites, read-later, & recently viewed |
| `POST` | `/api/v1/library/favorites/{subjectId}` | Authenticated | Toggle subject favorite |

### Admin Content Management (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/api/v1/admin/stats` | Admin Only | Get system totals (subjects, PDFs, students) |
| `GET`  | `/api/v1/admin/pdfs` | Admin Only | Get all PDFs including drafts |
| `PATCH` | `/api/v1/admin/pdfs/{id}/publish` | Admin Only | Toggle publication status |
