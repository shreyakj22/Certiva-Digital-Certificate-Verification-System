# Certiva — Digital Certificate Verification System

A CNS (Cryptography & Network Security) project demonstrating **confidentiality**,
**integrity**, **authenticity**, and **tamper detection** in a real, working web
application — not a simulation.

Certiva lets an administrator issue digital certificates that are:

- **Sealed** with **Ascon-128** (Ascon-AEAD128) authenticated encryption
- **Fingerprinted** with a **SHA-512/256** hash
- **Signed** with an **Ed448** digital signature

Anyone can then verify a certificate — by ID or by scanning its QR code — and
the system will cryptographically prove whether it is genuine and unmodified.

---

## 1. Architecture

```
┌────────────┐        REST/JSON         ┌────────────┐        ┌───────────┐
│  React SPA │  ───────────────────▶   │  Express API │ ───▶  │  MongoDB  │
│  (client)  │  ◀───────────────────   │  (server)    │ ◀───  │           │
└────────────┘                          └──────┬───────┘        └───────────┘
                                                │
                                   ┌────────────┼────────────┐
                                   ▼            ▼            ▼
                             Ascon-128     SHA-512/256      Ed448
                          (encrypt/seal)   (fingerprint)  (sign/verify)
```

All cryptographic operations happen **only** on the backend. The Ed448
private key and the Ascon-128 master key never reach the browser.

### How the three algorithms interact

| Step | Algorithm | Purpose |
|---|---|---|
| 1. Build canonical data | — | `{certificateId, studentName, course, organization, issueDate}`, keys sorted, so hashing/encryption is deterministic |
| 2. Seal | **Ascon-128** | Authenticated-encrypts the canonical JSON → `encryptedData` + `nonce`. Provides **confidentiality** and a first layer of **tamper detection** (decryption fails if ciphertext/nonce is altered) |
| 3. Fingerprint | **SHA-512/256** | Hashes the canonical JSON → `hash`. Provides **integrity**: any change to the data changes the hash |
| 4. Sign | **Ed448** | Signs `hash` with the issuer's private key → `signature`. Provides **authenticity**: proves Certiva issued it |
| 5. Store | MongoDB | Stores plaintext display fields + `encryptedData`, `nonce`, `hash`, `signature` |

**Verification** runs the pipeline in reverse: decrypt (Ascon-128) → re-hash
(SHA-512/256) → compare hash → cross-check decrypted data against the stored
display fields → verify signature (Ed448). All four checks must pass for a
certificate to be reported **Valid**.

---

## 2. Technology stack

- **Frontend:** React 18, React Router, Vite, plain CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB (via Mongoose)
- **Cryptography:**
  - Ascon-128 (`Ascon-AEAD128`) via the [`js-ascon`](https://www.npmjs.com/package/js-ascon) npm package — Node's built-in `crypto` module does not implement Ascon, so a dedicated library is required. `js-ascon` labels the cipher `Ascon-AEAD128`, the name NIST SP 800-232 (2025) standardized for the algorithm originally called "Ascon-128" — same algorithm, updated name.
  - SHA-512/256 via Node's native `crypto.createHash('sha512-256')` (OpenSSL-backed, no extra dependency needed).
  - Ed448 via Node's native `crypto.generateKeyPairSync('ed448')` / `crypto.sign` / `crypto.verify` (no extra dependency needed).
- **QR codes:** [`qrcode`](https://www.npmjs.com/package/qrcode) (generation, backend) and [`jsqr`](https://www.npmjs.com/package/jsqr) (decoding an uploaded QR image, frontend)
- **PDF certificate export:** [`jspdf`](https://www.npmjs.com/package/jspdf) (frontend)

---

## 3. Folder structure

```
certiva/
├── client/                      React frontend
│   ├── src/
│   │   ├── components/          Navbar, CertificateCard, SealBadge
│   │   ├── pages/                Home, CreateCertificate, CertificateView,
│   │   │                         VerifyCertificate, NotFound
│   │   ├── services/api.js      Axios wrapper for the REST API
│   │   ├── App.jsx               Routes
│   │   ├── main.jsx               Entry point
│   │   └── index.css             Design system / all styling
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── server/                      Express backend
│   ├── controllers/certificateController.js   create / get / verify logic
│   ├── routes/certificateRoutes.js            REST routes
│   ├── models/Certificate.js                  Mongoose schema
│   ├── crypto/
│   │   ├── asconService.js                     Ascon-128 encrypt/decrypt
│   │   ├── hashService.js                       SHA-512/256 hashing
│   │   └── signatureService.js                   Ed448 sign/verify
│   ├── utils/
│   │   ├── canonicalize.js                      deterministic JSON builder
│   │   ├── certificateId.js                     CERT-YYYY-NNNN generator
│   │   ├── qr.js                                 QR code generation
│   │   └── db.js                                 MongoDB connection
│   ├── scripts/
│   │   ├── generateKeys.js                      one-time Ed448 keygen
│   │   └── tamperDemo.js                        tampering demonstration
│   ├── keys/                                    Ed448 PEM files (gitignored)
│   ├── server.js                                Express entrypoint
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 4. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally, or a MongoDB Atlas connection string
- Windows, macOS, or Linux (commands below are given for Windows `cmd`/PowerShell;
  the same commands work on macOS/Linux without `.exe`/`\` differences)

---

## 5. Installation & setup (Windows commands)

### 5.1 Clone / unzip the project, then open two terminals

### 5.2 Backend setup

```bat
cd certiva\server
npm install
copy .env.example .env
```

Edit `server\.env` and set:
- `MONGODB_URI` — your MongoDB connection string
- `ASCON_KEY_HEX` — generate one with:
  ```bat
  node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  ```
  and paste the 32-character result in as `ASCON_KEY_HEX`.

### 5.3 Generate the Ed448 key pair (once)

```bat
npm run generate-keys
```

This writes `server\keys\ed448_private.pem` and `server\keys\ed448_public.pem`.
**Never commit these files** — they're already in `.gitignore`.

### 5.4 Start MongoDB

If using a local install:

```bat
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath="C:\data\db"
```

(Create `C:\data\db` first if it doesn't exist.) If using MongoDB Atlas, skip
this step — your `.env` connection string already points at the cloud cluster.

### 5.5 Start the backend

```bat
npm start
```

You should see: `Certiva server running on http://localhost:5000`

### 5.6 Frontend setup (second terminal)

```bat
cd certiva\client
npm install
copy .env.example .env
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

---

## 6. Testing procedure

1. Open the app, go to **Create Certificate**.
2. Fill in a student name, course, organization, and issue date. Submit.
3. You're taken to the certificate page — check that:
   - The certificate renders with a certificate ID like `CERT-2026-0001`
   - A QR code appears
   - "Download as PDF" produces a valid PDF
4. Copy the certificate ID (or scan/upload the QR image) and go to **Verify Certificate**.
5. Submit — you should see **✅ Certificate Valid** with all four checks passed.
6. Confirm via API directly, if desired:
   ```bash
   curl -X POST http://localhost:5000/api/certificates/CERT-2026-0001/verify
   ```

---

## 7. Tampering demonstration

This is the core CNS requirement — proving the system detects tampering.

1. Note a certificate ID you've already created, e.g. `CERT-2026-0001`.
2. In the `server` folder, run:
   ```bat
   node scripts\tamperDemo.js CERT-2026-0001
   ```
   This connects directly to MongoDB (as an attacker with raw DB access
   would) and silently changes the stored `course` field — without
   touching the Ascon-128 ciphertext, the SHA-512/256 hash, or the Ed448
   signature.
3. Go back to **Verify Certificate** and verify the same certificate ID again.
4. The result flips to **❌ Certificate Invalid / Tampered**, specifically
   failing the **"Decrypted data matches the stored certificate fields"**
   check — because the decrypted (sealed, authentic) copy of the data no
   longer matches what's displayed.

You can also demonstrate the other tamper vectors manually in a MongoDB
shell/Compass:
- Change one hex character in `hash` → fails the **hash match** check.
- Change one hex character in `signature` → fails the **Ed448 signature** check.
- Change one hex character in `encryptedData` or `nonce` → fails the **Ascon-128
  decryption/authentication** check (decryption itself fails).

---

## 8. Security notes

- The Ed448 **private key** is generated once via `npm run generate-keys`,
  stored only as a PEM file on disk, loaded once into server memory, and is
  **never** sent to the frontend, logged, or stored in MongoDB.
- The Ascon-128 master key lives only in the backend's `.env` file.
- `server.js` fails fast at startup if the Ed448 keys haven't been generated.
- All cryptographic randomness (nonces, keys) uses Node's `crypto` secure
  random generator.
- Input is validated server-side before any cryptographic operation runs.

---

## 9. Short viva explanation

> "Certiva issues a certificate by first building a canonical (deterministically
> ordered) JSON of the certificate's data. That data is sealed using Ascon-128
> authenticated encryption, which gives us confidentiality and a first layer of
> tamper-evidence, because Ascon-128's authentication tag makes decryption fail
> outright if the ciphertext is altered. Separately, we compute a SHA-512/256
> hash of the same canonical data as a fingerprint, and sign that hash with our
> Ed448 private key, which proves the certificate was issued by us and hasn't
> been altered since. During verification, we decrypt the sealed data, recompute
> the hash, compare it to the stored hash, cross-check the decrypted data
> against what's displayed, and verify the Ed448 signature. If any single one
> of those checks fails — whether someone tampered with the database record,
> the hash, or the signature — the certificate is reported invalid, and we show
> exactly which check failed."

---

## 10. REST API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/certificates` | Create a certificate. Body: `{studentName, course, organization, issueDate}` |
| `GET` | `/api/certificates/:certificateId` | Fetch a certificate for display |
| `POST` | `/api/certificates/:certificateId/verify` | Run the full verification pipeline |
| `GET` | `/api/health` | Health check |
