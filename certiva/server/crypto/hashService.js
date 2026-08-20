/**
 * hashService.js
 *
 * Real SHA-512/256 hashing, used to fingerprint the certificate's
 * canonical data and detect any tampering.
 *
 * SHA-512/256 is a distinct algorithm from both SHA-256 and SHA-512:
 * it runs the SHA-512 compression function (64-bit words, internally
 * more resistant to length-extension style issues than SHA-256) but
 * truncates the output to 256 bits using SHA-512's dedicated IV
 * generation process defined in FIPS 180-4. It is NOT simply
 * "SHA-512 truncated by string slicing".
 *
 * Node.js's `crypto` module (backed by OpenSSL) exposes this natively
 * as the digest name "sha512-256", so no extra third-party dependency
 * is required for this algorithm.
 */

const crypto = require("crypto");
const { canonicalStringify } = require("../utils/canonicalize");

const HASH_ALGORITHM = "sha512-256";

/**
 * Compute the SHA-512/256 hash of a canonical data object.
 * @param {object} canonicalDataObject
 * @returns {string} hex-encoded hash
 */
function computeCertificateHash(canonicalDataObject) {
  const canonicalString = canonicalStringify(canonicalDataObject);
  return crypto
    .createHash(HASH_ALGORITHM)
    .update(canonicalString, "utf8")
    .digest("hex");
}

/**
 * Compute the SHA-512/256 hash of an already-canonicalized string
 * (used when re-hashing data recovered from Ascon-128 decryption).
 */
function computeHashFromCanonicalString(canonicalString) {
  return crypto
    .createHash(HASH_ALGORITHM)
    .update(canonicalString, "utf8")
    .digest("hex");
}

/**
 * Constant-time comparison of two hex-encoded hashes to avoid timing
 * side-channels when checking hash equality.
 */
function hashesMatch(hashA, hashB) {
  const bufA = Buffer.from(hashA, "hex");
  const bufB = Buffer.from(hashB, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  HASH_ALGORITHM,
  computeCertificateHash,
  computeHashFromCanonicalString,
  hashesMatch,
};
