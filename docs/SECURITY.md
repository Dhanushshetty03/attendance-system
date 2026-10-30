# Security Architecture & Data Protection Controls

## 1. Authentication & Session Management

- **Cryptographic Password Hashing**: Passwords are never stored in plaintext. Passwords are salted and hashed using `bcryptjs` with a cost factor of 10 rounds.
- **Stateless Bearer JWT Tokens**: Authenticated sessions issue signed JSON Web Tokens (JWT) containing non-sensitive identity claims (`userId`, `email`, `role`).
- **Token Verification Middleware**: Every protected API route enforces token signature verification, expiration checks, and validates that the account is active in the database.
- **Client Token Handling**: Tokens are stored securely in browser storage and transmitted via the standard `Authorization: Bearer <TOKEN>` header.

---

## 2. Authorization & Role-Based Access Control (RBAC)

Access control is enforced strictly on the backend via Express middleware, preventing parameter tampering:

```javascript
// Example: Strict Role Gate Middleware
router.use(authenticate);
router.use(authorize(['FACULTY', 'ADMIN']));
```

- **Student Scope Isolation**: Students are strictly scoped to their own attendance records. Attempting to access another student's report via `GET /api/reports/student/:id` results in a `403 Forbidden` response.
- **Faculty Teaching Boundaries**: Faculty members can only mark attendance for courses and sections to which they are assigned in the `FacultyAssignment` table.
- **Administrative Privileges**: Only users with the `ADMIN` role can access audit logs, modify institutional thresholds, or approve correction requests.

---

## 3. Defense-in-Depth Security Controls

### 3.1 Rate Limiting
- **Brute Force Defense**: An Express rate limiter is attached to `/api/auth/login`, restricting IP addresses to a maximum of 30 requests per 15-minute sliding window.

### 3.2 Security HTTP Headers (Helmet)
- **Content Security & Framing**: Express Helmet headers protect against Cross-Site Scripting (XSS), clickjacking, MIME-type sniffing, and download execution.

### 3.3 Strict Input Validation (Zod)
- All request payloads (logins, attendance submissions, corrections, settings) are validated against strict Zod schemas before reaching business logic. Unknown or malicious fields are stripped automatically.

### 3.4 Cross-Origin Resource Sharing (CORS)
- CORS origin is locked down via `process.env.CORS_ORIGIN` (defaulting to the trusted client port).

---

## 4. Immutable Audit Trails & Non-Repudiation

To guarantee academic record integrity, critical system events generate permanent entries in the `AuditLog` table:
- **`ATTENDANCE_SUBMITTED`**: Captures session ID, number of students evaluated, faculty user ID, and IP address.
- **`ATTENDANCE_MODIFIED`**: Records prior values, updated values, faculty ID, timestamp, and the mandatory reason.
- **`CORRECTION_APPROVED` / `CORRECTION_REJECTED`**: Documents the administrative decision and review remarks.
- **`USER_LOGIN`**: Logs successful authentications and source IP addresses.
