const mongoose = require("mongoose");

/**
 * Certificate collection schema.
 *
 * Plaintext display fields (studentName, course, organization, issueDate)
 * are stored so the certificate can be rendered without needing to
 * decrypt anything just to show it on screen. The `encryptedData` +
 * `nonce` pair is the Ascon-128 authenticated-encryption "sealed" copy of
 * the same canonical data, and is what verification actually decrypts
 * and checks against - this is what lets Certiva detect if the plaintext
 * display fields were ever tampered with directly (e.g. someone editing
 * the database by hand), because the decrypted copy will no longer match.
 */
const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  studentName: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  issueDate: { type: String, required: true }, // stored as ISO date string (YYYY-MM-DD)

  // Ascon-128 authenticated encryption output (hex-encoded)
  encryptedData: { type: String, required: true },
  nonce: { type: String, required: true },

  // SHA-512/256 hash of the canonical certificate data (hex-encoded)
  hash: { type: String, required: true },

  // Ed448 digital signature over the hash (hex-encoded)
  signature: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Certificate", certificateSchema);
