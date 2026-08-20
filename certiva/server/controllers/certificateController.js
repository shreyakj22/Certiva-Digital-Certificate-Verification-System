const Certificate = require("../models/Certificate");
const { generateCertificateId } = require("../utils/certificateId");
const { generateVerificationQr } = require("../utils/qr");
const {
  buildCanonicalCertificatePayload,
  canonicalStringify,
} = require("../utils/canonicalize");
const {
  encryptCertificateData,
  decryptCertificateData,
} = require("../crypto/asconService");
const {
  computeCertificateHash,
  computeHashFromCanonicalString,
  hashesMatch,
} = require("../crypto/hashService");
const { signHash, verifySignature } = require("../crypto/signatureService");

/**
 * Basic manual input validation (kept dependency-free on purpose).
 */
function validateCertificateInput(body) {
  const errors = [];
  const requiredFields = ["studentName", "course", "organization", "issueDate"];

  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      errors.push(`"${field}" is required.`);
    }
  }

  if (body.issueDate && isNaN(Date.parse(body.issueDate))) {
    errors.push('"issueDate" must be a valid date.');
  }

  for (const field of requiredFields) {
    if (typeof body[field] === "string" && body[field].length > 200) {
      errors.push(`"${field}" is too long (max 200 characters).`);
    }
  }

  return errors;
}

/**
 * POST /api/certificates
 * Create a new certificate:
 *   1. Validate input
 *   2. Generate certificate ID
 *   3. Build canonical data
 *   4. Ascon-128 encrypt canonical data
 *   5. SHA-512/256 hash canonical data
 *   6. Ed448 sign the hash
 *   7. Store in MongoDB
 *   8. Generate QR code
 */
async function createCertificate(req, res) {
  try {
    const errors = validateCertificateInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Invalid input.", errors });
    }

    const { studentName, course, organization, issueDate } = req.body;

    const certificateId = await generateCertificateId();

    const canonicalPayload = buildCanonicalCertificatePayload({
      certificateId,
      studentName,
      course,
      organization,
      issueDate,
    });
    const canonicalString = canonicalStringify(canonicalPayload);

    // Step: Ascon-128 authenticated encryption
    const { encryptedData, nonce } = encryptCertificateData(
      canonicalString,
      certificateId
    );

    // Step: SHA-512/256 hash of canonical data
    const hash = computeCertificateHash(canonicalPayload);

    // Step: Ed448 digital signature over the hash
    const signature = signHash(hash);

    const certificate = await Certificate.create({
      certificateId,
      studentName: canonicalPayload.studentName,
      course: canonicalPayload.course,
      organization: canonicalPayload.organization,
      issueDate: canonicalPayload.issueDate,
      encryptedData,
      nonce,
      hash,
      signature,
    });

    const { qrDataUrl, verifyUrl } = await generateVerificationQr(certificateId);

    return res.status(201).json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        course: certificate.course,
        organization: certificate.organization,
        issueDate: certificate.issueDate,
        hash: certificate.hash,
        signature: certificate.signature,
        createdAt: certificate.createdAt,
      },
      qrDataUrl,
      verifyUrl,
    });
  } catch (err) {
    console.error("createCertificate error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create certificate.",
      detail: err.message,
    });
  }
}

/**
 * GET /api/certificates/:certificateId
 * Fetch a certificate for display (does not run verification checks).
 */
async function getCertificate(req, res) {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `No certificate found with ID "${certificateId}".`,
      });
    }

    const { qrDataUrl, verifyUrl } = await generateVerificationQr(certificateId);

    return res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        course: certificate.course,
        organization: certificate.organization,
        issueDate: certificate.issueDate,
        hash: certificate.hash,
        signature: certificate.signature,
        createdAt: certificate.createdAt,
      },
      qrDataUrl,
      verifyUrl,
    });
  } catch (err) {
    console.error("getCertificate error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificate.",
      detail: err.message,
    });
  }
}

/**
 * POST /api/certificates/:certificateId/verify
 *
 * Full verification pipeline:
 *   1. Look up the certificate by ID
 *   2. Ascon-128 decrypt + authenticate the sealed data
 *   3. Recompute SHA-512/256 hash from the decrypted canonical data
 *   4. Compare recomputed hash to the stored hash
 *   5. Also compare the decrypted data to the stored plaintext display
 *      fields (catches direct tampering with the DB's display fields)
 *   6. Verify the Ed448 signature over the stored hash
 *
 * Every step is reported individually in the response so the result is
 * fully explainable (useful for the CNS project viva / demo).
 */
async function verifyCertificate(req, res) {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `No certificate found with ID "${certificateId}".`,
      });
    }

    const checks = {
      decryptionAuthentic: false,
      hashMatches: false,
      displayDataMatches: false,
      signatureValid: false,
    };

    // Step 1: Ascon-128 decrypt + authenticate
    const decryptedCanonicalString = decryptCertificateData(
      certificate.encryptedData,
      certificate.nonce,
      certificate.certificateId
    );
    checks.decryptionAuthentic = decryptedCanonicalString !== null;

    // Step 2: SHA-512/256 recompute + compare
    let recomputedHash = null;
    if (checks.decryptionAuthentic) {
      recomputedHash = computeHashFromCanonicalString(decryptedCanonicalString);
      checks.hashMatches = hashesMatch(recomputedHash, certificate.hash);

      // Step 3: cross-check decrypted data against the stored plaintext
      // display fields, to catch tampering with the display fields
      // themselves (rather than the encrypted blob).
      try {
        const decrypted = JSON.parse(decryptedCanonicalString);
        checks.displayDataMatches =
          decrypted.studentName === certificate.studentName &&
          decrypted.course === certificate.course &&
          decrypted.organization === certificate.organization &&
          decrypted.issueDate === certificate.issueDate;
      } catch {
        checks.displayDataMatches = false;
      }
    }

    // Step 4: Ed448 signature verification (checked against the stored
    // hash, since that is what was originally signed).
    checks.signatureValid = verifySignature(certificate.hash, certificate.signature);

    const isValid =
      checks.decryptionAuthentic &&
      checks.hashMatches &&
      checks.displayDataMatches &&
      checks.signatureValid;

    return res.json({
      success: true,
      valid: isValid,
      message: isValid
        ? "Certificate Valid"
        : "Certificate Invalid / Tampered",
      checks,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        course: certificate.course,
        organization: certificate.organization,
        issueDate: certificate.issueDate,
        hash: certificate.hash,
        signature: certificate.signature,
        createdAt: certificate.createdAt,
      },
    });
  } catch (err) {
    console.error("verifyCertificate error:", err);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Verification failed due to a server error.",
      detail: err.message,
    });
  }
}

module.exports = {
  createCertificate,
  getCertificate,
  verifyCertificate,
};
