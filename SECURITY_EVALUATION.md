# Evaluation Components & Marks Breakdown
**Project:** Online FIR Portal  
**Date:** 4 Feb 2026

## Legend
- **Met:** Implemented in codebase
- **Partial:** Implemented with limitations
- **Missing:** Not implemented

## 1) Authentication (3m) [Line 10]
### 1.1 Single-Factor Authentication (1.5) [Line 11]
**Status:** Met  
**Evidence:**
- Email/password login flow in [OnlineFirPortal.backend/src/routes/auth.ts](OnlineFirPortal.backend/src/routes/auth.ts#L205-L230)
- Password hashing & verification (bcrypt) in [OnlineFirPortal.backend/src/lib/security.ts](OnlineFirPortal.backend/src/lib/security.ts#L43-L55)

### 1.2 Multi-Factor Authentication (1.5) [Line 17]
**Status:** Met  
**Evidence:**
- OTP generation + email send in [OnlineFirPortal.backend/src/routes/auth.ts](OnlineFirPortal.backend/src/routes/auth.ts#L232-L261)
- MFA verification endpoint in [OnlineFirPortal.backend/src/routes/auth.ts](OnlineFirPortal.backend/src/routes/auth.ts#L305-L340)  
**Notes:**
- TOTP utilities exist in backend for verification ([OnlineFirPortal.backend/src/lib/security.ts](OnlineFirPortal.backend/src/lib/security.ts#L263-L314))
- Current login uses email OTP (Resend)

## 2) Authorization / Access Control (3m) [Line 26]
### 2.1 Access Control Model (1.5) [Line 27]
**Status:** Met  
**Evidence:**
- RBAC + ACL matrix defined in [OnlineFirPortal.backend/src/lib/access-control.ts](OnlineFirPortal.backend/src/lib/access-control.ts#L1-L77)
- Subjects: citizen, police, admin; objects: fir, documents, users, reports, settings

### 2.2 Policy Definition & Justification (1.5) [Line 33]
**Status:** Met  
**Evidence:**
- Documented role permissions and policy notes in [OnlineFirPortal.backend/src/lib/access-control.ts](OnlineFirPortal.backend/src/lib/access-control.ts#L1-L43)

### 2.3 Implementation of Access Control (1.5) [Line 38]
**Status:** Met  
**Evidence:**
- Token/MFA enforcement in [OnlineFirPortal.backend/src/lib/auth-middleware.ts](OnlineFirPortal.backend/src/lib/auth-middleware.ts#L14-L57)
- Permission checks in FIR routes [OnlineFirPortal.backend/src/routes/firs.ts](OnlineFirPortal.backend/src/routes/firs.ts#L42-L146)

## 3) Encryption (3m) [Line 44]
### 3.1 Key Exchange Mechanism (1.5) [Line 45]
**Status:** Met  
**Evidence:**
- Public key registry endpoints [OnlineFirPortal.backend/src/routes/auth.ts](OnlineFirPortal.backend/src/routes/auth.ts#L394-L437)
- Key storage for users [OnlineFirPortal.backend/src/lib/db.ts](OnlineFirPortal.backend/src/lib/db.ts#L100-L301)
- Client persists keys and registers public key [OnlineFirPortal.frontend/app/file-fir/page.tsx](OnlineFirPortal.frontend/app/file-fir/page.tsx#L160-L191)
- FIR creation enforces registered keys [OnlineFirPortal.backend/src/routes/firs.ts](OnlineFirPortal.backend/src/routes/firs.ts#L61-L75)

### 3.2 Encryption & Decryption (1.5) [Line 53]
**Status:** Met  
**Evidence:**
- AES-256-GCM encryption functions in [OnlineFirPortal.backend/src/lib/db.ts](OnlineFirPortal.backend/src/lib/db.ts#L6-L51)
- FIR payload stored encrypted in [OnlineFirPortal.backend/src/lib/db.ts](OnlineFirPortal.backend/src/lib/db.ts#L162-L181)
- Document content encrypted before storage [OnlineFirPortal.backend/src/lib/db.ts](OnlineFirPortal.backend/src/lib/db.ts#L256-L269)

## 4) Hashing & Digital Signature (3m) [Line 60]
### 4.1 Hashing with Salt (1.5) [Line 61]
**Status:** Met  
**Evidence:**
- bcrypt hashing & verification in [OnlineFirPortal.backend/src/lib/security.ts](OnlineFirPortal.backend/src/lib/security.ts#L43-L55)

### 4.2 Digital Signature using Hash (1.5) [Line 66]
**Status:** Met  
**Evidence:**
- Client signs FIR data [OnlineFirPortal.frontend/app/file-fir/page.tsx](OnlineFirPortal.frontend/app/file-fir/page.tsx#L158-L196)
- Signature verified on server [OnlineFirPortal.backend/src/routes/firs.ts](OnlineFirPortal.backend/src/routes/firs.ts#L60-L67)
- RSA-PSS verify implementation [OnlineFirPortal.backend/src/lib/security.ts](OnlineFirPortal.backend/src/lib/security.ts#L234-L252)

## 5) Encoding Techniques (1m) [Line 73]
### 5.1 Encoding & Decoding Implementation [Line 74]
**Status:** Met  
**Evidence:**
- Base64 utilities [OnlineFirPortal.frontend/lib/security.ts](OnlineFirPortal.frontend/lib/security.ts#L7-L15)
- QR payload encoded with Base64 [OnlineFirPortal.frontend/app/file-fir/page.tsx](OnlineFirPortal.frontend/app/file-fir/page.tsx#L231-L236)

## 6) Security Levels & Risks (Theory) (1) [Line 80]
**Status:** Met  
**Evidence:**
- Security levels and risks documented in [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md#L5-L10)

## 7) Possible Attacks (Theory) (1) [Line 85]
**Status:** Met  
**Evidence:**
- Possible attacks and mitigations documented in [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md#L11-L17)

## 6.a Viva Oral Examination (2) / 6.b Class Participation (3) / 7 Complete Viva (5) [Line 90]
**Status:** Not Applicable (outside codebase)

## Summary of Gaps / Improvements [Line 93]
- Residual risk: client-side key storage; recommend hardware-backed keys or secure key vaults.
- Ensure HTTPS in deployment for transport security.

## Lab Evaluation (Detailed Preparation Notes) [Line 97]

**Objective:** Demonstrate practical security implementation across authentication, authorization, encryption, signatures, encoding, and documentation.

### 1) Authentication (3m) [Line 101]
- **Demo Steps:**
  - Register a citizen user and show bcrypt password hashing is used (server verifies on login).
  - Login flow without MFA and show access token issuance.
  - Enable MFA for a user; show OTP generation and verification flow.
- **Expected Evidence:**
  - Registration and login endpoints, MFA verification endpoint.
  - OTP delivered via email/console log in test environment.

### 2) Authorization / Access Control (3m) [Line 111]
- **Demo Steps:**
  - Login as citizen: show FIR list is scoped to the user.
  - Login as police/admin: show access to all FIRs.
  - Attempt a restricted action with insufficient role and show 403 response.
- **Expected Evidence:**
  - RBAC matrix in access-control, permission checks in routes.

### 3) Encryption (3m) [Line 120]
- **Demo Steps:**
  - Create a FIR with documents and show server stores encrypted payloads.
  - Verify document content is stored encrypted (not raw Base64).
  - Explain how AES-256-GCM encrypt/decrypt helpers are used.
- **Expected Evidence:**
  - AES-256-GCM utilities and encrypted storage for FIR and documents.

### 4) Hashing & Digital Signature (3m) [Line 129]
- **Demo Steps:**
  - Generate a signing key pair on client, register public key, sign FIR data.
  - Submit FIR with signature and show server rejects invalid signatures.
- **Expected Evidence:**
  - RSA-PSS signing in client, verification on server, registered key enforcement.

### 5) Encoding Techniques (1m) [Line 137]
- **Demo Steps:**
  - Show QR payload Base64 encoding for FIR receipt.
- **Expected Evidence:**
  - Base64 encode/decode utilities and usage in FIR submission flow.

### 6) Security Levels & Risks (Theory) (1) [Line 144]
- **Preparation Notes:**
  - Explain confidentiality, integrity, availability, and authentication assurance.
  - Tie each to a concrete implementation in the project.

### 7) Possible Attacks (Theory) (1) [Line 149]
- **Preparation Notes:**
  - Describe common attacks (brute force, replay, session hijack, privilege escalation).
  - Map each to a mitigation in the codebase.

**Viva/Oral (if applicable)**  
- Be ready to justify design choices (key storage, OTP email in test env, access-control rules).</content>
<parameter name="filePath">/home/anuruprkris/Project/online-fir-portal/SECURITY_EVALUATION.md