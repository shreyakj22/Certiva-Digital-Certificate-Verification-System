# 🔐 Certiva – Digital Certificate Verification System

Certiva is a secure web-based system for creating and verifying digital certificates using cryptographic techniques.

The system helps prevent certificate forgery and tampering by protecting certificate data and verifying its authenticity.

---

## 📌 Features

- Create digital certificates
- Generate unique certificate IDs
- Protect certificate data using Ascon-128
- Generate certificate hash using SHA-512/256
- Create and verify digital signatures using Ed448
- Generate QR codes for certificate verification
- Verify certificates using Certificate ID
- Detect certificate tampering
- Download/view digital certificates
- Store certificate information in MongoDB

---

## 🔐 Cryptographic Algorithms

### 1. Ascon-128

Used to protect sensitive certificate data using authenticated encryption.

### 2. SHA-512/256

Used to generate a unique hash of certificate data.

If the certificate data is modified, the hash changes and tampering can be detected.

### 3. Ed448

Used for digital signatures.

The private key is used to sign the certificate, while the public key is used to verify its authenticity.

---

## 🔄 System Workflow

```text
Admin
  │
  ▼
Enter Certificate Details
  │
  ▼
Generate Certificate ID
  │
  ▼
Ascon-128
Protect Certificate Data
  │
  ▼
SHA-512/256
Generate Hash
  │
  ▼
Ed448
Generate Digital Signature
  │
  ▼
Generate Certificate + QR Code
  │
  ▼
Store in MongoDB
  │
  ▼
User Scans QR / Enters Certificate ID
  │
  ▼
Verify Hash + Digital Signature
  │
  ├───────────────┐
  ▼               ▼
VALID          INVALID
  │               │
  ▼               ▼
✅ Authentic    ❌ Tampered
