# Online FIR Portal - System Architecture & Security Design

## 1. Role-Based Access Control (RBAC) Implementation
**Structure & Matrix:**
We implemented a strict **Role-Based Access Control (RBAC)** system using a defined policy matrix in `lib/access-control.ts`.  The system distinguishes between three primary roles: **Citizen**, **Police**, and **Admin**.

The permission structure is defined via a declarative **Access Control Matrix** (Javascript Object) mapping `Role -> Resource -> Actions[]`.
*   **Resources:** `fir`, `documents`, `users`, `reports`, `settings`.
*   **Actions:** `create`, `read`, `update`, `delete`, `assign`, `upload`.

**The Matrix:**
*   **Citizens:** STRICTLY limited to `create` FIRs and `read` *only* their own FIRs/documents. They have zero access to administrative modules.
*   **Police:** Can `read` all FIRs (to investigate), `update` status/notes on assigned cases, and `assign` officers. They typically cannot `delete` records (ensuring immutability).
*   **Admin:** Full `create/read/update/delete` privileges across all resources, including user management and system settings.

**Enforcement:**
Access is enforced at two levels:
1.  **Middleware Level (`auth-middleware.ts`):** Checks valid JWT presence.
2.  **Logic Level (`checkPermission`):** Before any operation, the helper function `checkPermission(user, resource, action, ownerId)` is called. This function performs the matrix lookup *and* adds a dynamic check: "If role is citizen, is `user.id === resource.ownerId`?" This prevents horizontal privilege escalation (citizens accessing other citizens' data).

## 2. AES-256-GCM Encryption Workflow
**Workflow:**
We use **AES-256-GCM** (Galois/Counter Mode) for securing FIR content at rest. This mode provides both confidentiality (encryption) and integrity (authentication tag).
1.  **Key Derivation:** The system does *not* use a static key directly. Inside `db.ts`, we use `scryptSync` (a memory-hard key derivation function) to derive a 256-bit key from a master `FIR_ENCRYPTION_KEY` (env variable) and a unique, random 16-byte `salt` generated for *each* encryption operation.
2.  **Encryption:**
    *   Generate random 16-byte `salt`.
    *   Generate random 12-byte `IV` (Initialization Vector).
    *   Derive Key = `scrypt(MASTER_KEY, salt)`.
    *   Encrypt payload using `createCipheriv('aes-256-gcm', Key, IV)`.
    *   Compute `AuthTag` (16 bytes).
3.  **Storage:** The database stores a single Base64 string combining: `[Salt (16B)] + [IV (12B)] + [AuthTag (16B)] + [Ciphertext]`.
4.  **Key Rotation:** Rotation is manual. To rotate, we would update the `FIR_ENCRYPTION_KEY` and run a migration script that decrypts all rows with the old key (if identifiable) and re-encrypts with the new one. Currently, since the salt is stored with the data, changing the master key would render data unreadable without a migration strategy.

## 3. RSA-PSS vs RSA-PKCS#1 v1.5
We chose **RSA-PSS (Probabilistic Signature Scheme)** over the older PKCS#1 v1.5.
*   **Security Advantage:** RSA-PSS has a security proof in the "random oracle model" that relates its security directly to the difficulty of the RSA problem. PKCS#1 v1.5 is deterministic (for the same message/key) and has historically suffered from padding oracle attacks (e.g., Bleichenbacher's attack).
*   **Implementation:** We use `SHA-256` as the hash function and a salt length of 32 bytes. This probabilistic nature means signing the same document twice results in different signatures, making crypto-analysis significantly harder for attackers.

## 4. FIR Submission Flow (End-to-End)
1.  **Client-Side Preparation:**
    *   User fills the FIR form.
    *   Browser generates a JSON payload.
    *   The `digital-signature.ts` module uses the User's private key (stored in IndexedDB/Local storage) to generate an **RSA-PSS Digital Signature** of the payload.
2.  **Transmission:**
    *   Client sends POST request to `/api/firs` containing: `{ data: {...FIRFields}, signature: "base64..." }`.
    *   Transmitted over HTTPS.
3.  **Server Verification:**
    *   Server retrieves the user's stored Public Key from the `user_keys` table.
    *   Verifies signature using `crypto.subtle.verify`. If INVALID, request is rejected (400 Bad Request).
4.  **Server Processing:**
    *   Server generates a unique FIR ID and Reference Number.
    *   Sensitive details (incident description, victim info) are serialized to JSON.
    *   Server encrypts this JSON blob using **AES-256-GCM** (as described in #2).
5.  **Storage:**
    *   Metadata (ID, Status, ReporterID) is stored in cleartext columns in the `FIR` table for indexing/searching.
    *   Encrypted content is stored in the `encryptedData` column.
    *   The original signature is stored for non-repudiation.

## 5. Least-Privilege Access Control
Our implementation adheres strictly to Least Privilege:
*   **Database Level:** The application connects using a service account (in production scenarios) that only has DML access (SELECT/INSERT/UPDATE), preventing it from altering schema structure.
*   **Application Level (Examples):**
    *   **Citizens:** Cannot view the "Assigned Officer" internal notes. They only see the public status.
    *   **Police:** A generic officer cannot *delete* an FIR. Even Admins are discouraged from deletion (soft delete preferred) to maintain legal audit trails.
    *   **Token Scopes:** Access tokens contain the `role` claim, preventing a token issued to a citizen from ever passing the `requireRole(['police'])` middleware check.

## 6. Audit Trail Schema & Integrity
*   **Schema (`AuditLog`):**
    *   `userId` & `userRole`: Who performed the action.
    *   `action`: Enum (e.g., `FIR_CREATED`, `LOGIN_FAILED`).
    *   `resourceId`: Specific FIR or User ID affected.
    *   `changes`: JSON diff storing the "before" and "after" state of modified fields.
    *   `ipAddress` & `userAgent`: Context for the request.
*   **Integrity:**
    *   Currently, integrity is ensured via **Database Permissions** (application cannot DELETE from AuditLog) and strict "Append-Only" logic in the code.
    *   For higher security (not fully implemented but planned), we would implement **Hash Chaining**, where each log entry includes the hash of the previous entry, creating a blockchain-like structure that makes tampering evident.

## 7. Rate Limiting Strategy
We employ a **Fixed Window Counter** (via `express-rate-limit`):
*   **Global API Limiter:** 100 requests per 15 minutes per IP. This prevents general DOS attacks.
*   **Auth Route Limiter:** Stricter limit of 100 requests per **hour** on `/api/auth/*`. This mitigates brute-force attacks on login credentials.
*   The middleware sets `X-RateLimit-*` headers to inform clients of their remaining quota.

## 8. CSRF Prevention
*   **Token Usage:** We primarily use **JWTs** sent in the `Authorization: Bearer` header. Unlike cookies, browsers do not automatically attach headers to cross-origin requests, which inherently mitigates CSRF.
*   **Cookie Fallback:** If tokens are stored in cookies (supported as fallback), we enforce `SameSite: 'Lax'` or `'Strict'` attributes, ensuring cookies are not sent on cross-site POST requests.
*   **CORS:** Strict `cors` middleware configuration allows requests ONLY from the specific frontend domain defined in `.env`.

## 9. XSS Prevention
*   **Input Sanitization:** Custom middleware `sanitizeInputs` recursively strips dangerous characters (e.g., tags, `javascript:`) from `req.body` and `req.query` before they reach controllers.
*   **Framework Defenses:** React (Frontend) automatically escapes content rendered in JSX, neutralizing injected scripts.
*   **Headers:** `Helmet` sets `Content-Security-Policy` (CSP) and `X-XSS-Protection` headers to prevent browsers from executing malicious scripts originating from untrusted sources.

## 10. Session Management
*   **Storage:** Sessions are stored in the database (`Session` table) rather than relying solely on stateless JWTs.
*   **Fixation/Hijacking Defense:**
    *   **Token Hashing:** The database stores `SHA-256` hashes of session tokens, not the tokens themselves. If the DB is leaked, active session tokens remain secure.
    *   **User-Agent/IP Binding:** We log the IP and U-A at creation. While we don't strictly invalidate on IP change (to support mobile network switching), abrupt changes can trigger heuristic alerts.
    *   **Rotation:** Refresh tokens are rotated on use.

## 11. Multi-Factor Authentication (MFA)
*   **Mechanism:** TOTP (Time-based One-Time Password) compliant with RFC 6238.
*   **Implementation:** We use the `speakeasy` library.
*   **Flow:**
    1.  User scans QR Code (generated via `qrcode` lib) into Google Authenticator.
    2.  User enters 6-digit code.
    3.  Server verifies code against stored `mfaSecret` (using `verifyTOTP` window of ±30 seconds).
    4.  Upon success, `mfaVerified: true` is added to the JWT payload. Critical actions check for this claim.

## 12. Database Schema & Normalization
*   **Schema:** Relational schema designed in Prisma.
    *   `User`: (1) to (many) `FIR` (reporter).
    *   `User`: (1) to (many) `FIR` (assigned officer).
    *   `FIR`: (1) to (many) `Document`.
    *   `Encryption`: Sensitive fields segregated into `encryptedData` blob.
*   **Indexes:**
    *   Unique Index on `User.email` and `User.mobile` (Lookups).
    *   Index on `FIR.reporterId` (Dashboard queries).
    *   Index on `FIR.status` (Filtering/Stats).
    *   Index on `AuditLog.createdAt` (Timeline generation).

## 13. Concurrency Handling
*   **Isolation:** The database operates (conceptually) at **Read Committed** isolation. Our SQLite backend (dev/test) uses file locking (Serialized).
*   **Conflict Resolution:**
    *   For officer updates (e.g., status change), the last write wins.
    *   Since FIRs are "owned" by one officer at a time, high concurrency on a *single* record is operationally rare.
    *   Critical state changes are logged in the `Timeline`, preserving a history of who changed what, even if the final status acts as a naive overwrite.

## 14. RSA Signature Verification Failure
If `verifySignature(payload, signature, publicKey)` returns `false`:
1.  **Immediate Rejection:** The controller halts execution.
2.  **Audit Log:** An event `SECURITY_ALERT` or `FIR_TEMPERING_ATTEMPT` is logged with the user's IP.
3.  **Response:** Return HTTP `400 Bad Request` with error "Digital Signature Verification Failed - Data integrity cannot be verified."
4.  No data is persisted to the database.

## 15. Encrypted FIR Backup Strategy
*   **Data Backup:** A shell script `backup.sh` performs regular dumps of the PostgreSQL database. Since data is encrypted *at rest*, the dump file contains only ciphertexts.
*   **Key Management (DR):** The `FIR_ENCRYPTION_KEY` is NOT stored in the database.
    *   Strategy: The master key is stored in a secure secret manager (e.g., AWS Secrets Manager / HashiCorp Vault).
    *   Disaster Recovery: To restore, we need BOTH the database dump AND the specific version of the Environment Variables (keys). Losing the encryption key renders the backups useless (Crypto-shredding).

## 16. Prevention of SQL Injection
*   **Primary Defense:** We use **Prisma ORM**. It conceptually maps objects to queries and uses parameterized inputs under the hood for all standard CRUD operations.
*   **Raw Queries:** In `db.ts`, where raw queries are used (via `better-sqlite3` wrapper logic), we use **Prepared Statements**:
    *   *Safe:* `d.prepare('SELECT * FROM users WHERE id = ?').get(id)`
    *   *Vulnerable (Avoided):* `d.exec('SELECT * FROM users WHERE id = ' + id)`
*   **Residual Risk:** Vulnerabilities could only exist if we manually concatenated strings into "raw" SQL execution blocks, which code review explicitly forbids.

## 17. Authentication Mechanism & Flow
We use a **Hybrid JWT + Session System**.
1.  **Login:** User POSTs email/password.
2.  **Verify:** `bcrypt.compare(password, hash)`.
3.  **MFA Check:** If enabled, return "MFA Required" state. User submits code.
4.  **Token Issue:**
    *   **Access Token (JWT):** Short validity (15 mins), contains roles/permissions. Sent to Client.
    *   **Refresh Token (JWT):** Long validity (7 days), stored in HTTP-only Cookie or Secure Storage.
    *   **Session Record:** Created in DB `Session` table to track/revoke logins.
5.  **Requests:** Client sends Access Token in Header. Middleware verifies signature and expiry.

## 18. Password Storage
*   **Algorithm:** `bcrypt`.
*   **Salt Strategy:** We use `bcrypt.genSalt(10)`.
    *   The "10" work factor makes it computationally expensive (approx 100ms/hash) to slow down brute-force attacks.
    *   Bcrypt generates a random salt *automatically* and embeds it in the resulting hash string (e.g., `$2a$10$salt...hash`). We do not need to manage salts manually, though our legacy schema has a `passwordSalt` column, `lib/security.ts` relies on bcrypt's native handling.

## 19. Threat Modeling & Vectors identified
We performed a lightweight standard threat model:
*   **Vector 1: Insider Threat:** A DB admin dumping the database.
    *   *Mitigation:* AES Encryption prevents them from reading witness names/complaint details.
*   **Vector 2: Client-Side Key Theft:** Malware stealing the citizen's private key from LocalStorage.
    *   *Mitigation:* This is a known risk. We recommend clearing cache or using hardware tokens (future scope). Currently, we rely on browser sandbox.
*   **Vector 3: Session Hijacking:** Stolen valid JWT.
    *   *Mitigation:* Short 15-min expiry implies the attacker has a very small window. Refresh token rotation means if they try to refresh, the legitimate user's next refresh will fail (chain break), detecting the theft.

## 20. Scaling to Millions
*   **Bottlenecks:**
    1.  **Database I/O:** Encryption/Decryption is CPU intensive, but the real bottleneck is Postgres Write capability.
    2.  **Search:** Searching encrypted data is impossible with standard SQL. `SELECT * FROM firs WHERE description LIKE '%theft%'` fails.
*   **Scaling Strategy:**
    *   **Read Replicas:** Distribute "Read" traffic (dashboards) to Postgres Read Replicas.
    *   **Search:** Implement a sidecar search engine (Elasticsearch). Securely index *searchable keywords* (not full sensitive text) or rely on metadata tags (Crime Type, Station, Date) which are kept unencrypted.
    *   **Caching:** Redis for User Sessions and Config to reduce DB hits.
    *   **Horizontal:** The specific backend (Node.js) is stateless (auth is token-based), so we can auto-scale backend instances behind a Load Balancer (Nginx).
