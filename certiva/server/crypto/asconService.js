/**
 * asconService.js
 *
 * Real Ascon-128 authenticated encryption (AEAD), used to protect the
 * certificate's canonical data before it is stored in MongoDB.
 *
 * Library: js-ascon (https://www.npmjs.com/package/js-ascon)
 *   - Pure JS/TS implementation of the Ascon family of algorithms.
 *   - Chosen because Node's built-in `crypto` module does NOT implement
 *     Ascon (it only exposes AES/ChaCha family ciphers), and the project
 *     explicitly requires the real Ascon-128 algorithm rather than a
 *     substitute like AES-GCM.
 *   - The library exposes the cipher under the identifier
 *     "Ascon-AEAD128", which is the official name adopted by NIST SP
 *     800-232 (August 2025) for what was originally called "Ascon-128"
 *     in the Ascon v1.2 specification submitted to the NIST Lightweight
 *     Cryptography competition. It is the same 128-bit-key / 128-bit-nonce
 *     authenticated cipher — only the standardized name changed.
 *
 * Ascon-128 provides both confidentiality (encryption) AND integrity /
 * authenticity (a 128-bit authentication tag). If a single bit of the
 * ciphertext, nonce, or associated data is altered, decryption fails and
 * returns null instead of plaintext - this is what powers Certiva's
 * tamper detection at the encryption layer.
 */

const crypto = require("crypto");
const Ascon = require("js-ascon");

const ASCON_VARIANT = "Ascon-AEAD128";
const KEY_BYTES = 16; // 128-bit key
const NONCE_BYTES = 16; // 128-bit nonce

function loadMasterKey() {
  const hex = process.env.ASCON_KEY_HEX;

  if (!hex || hex === "REPLACE_WITH_32_HEX_CHARACTERS") {
    throw new Error(
      "ASCON_KEY_HEX is not configured. Set a 32-character hex string in your .env file " +
        '(generate one with: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))")'
    );
  }

  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
    throw new Error(
      "ASCON_KEY_HEX must be exactly 32 hex characters (16 bytes / 128 bits) for Ascon-128."
    );
  }

  return Ascon.hexToByteArray("0x" + hex);
}

/**
 * Encrypt the canonical certificate data with Ascon-128.
 *
 * @param {string} plaintext - canonical JSON string of the certificate data
 * @param {string} associatedData - non-secret data bound to the ciphertext
 *        (we use the certificateId) so the ciphertext cannot be silently
 *        re-associated with a different certificate ID.
 * @returns {{ encryptedData: string, nonce: string }} hex-encoded ciphertext+tag and nonce
 */
function encryptCertificateData(plaintext, associatedData) {
  const key = loadMasterKey();
  const nonceBytes = crypto.randomBytes(NONCE_BYTES); // secure random nonce
  const nonce = Array.from(nonceBytes);

  const ciphertextWithTag = Ascon.encrypt(
    key,
    nonce,
    associatedData,
    plaintext,
    ASCON_VARIANT
  );

  return {
    encryptedData: Ascon.byteArrayToHex(ciphertextWithTag).replace(/^0x/, ""),
    nonce: Ascon.byteArrayToHex(nonce).replace(/^0x/, ""),
  };
}

/**
 * Decrypt & authenticate certificate data with Ascon-128.
 *
 * @returns {string|null} the original plaintext string, or null if the
 *          authentication tag check failed (i.e. the data or nonce has
 *          been tampered with).
 */
function decryptCertificateData(encryptedDataHex, nonceHex, associatedData) {
  const key = loadMasterKey();

  let ciphertext, nonce;
  try {
    ciphertext = Ascon.hexToByteArray("0x" + encryptedDataHex);
    nonce = Ascon.hexToByteArray("0x" + nonceHex);
  } catch (err) {
    return null; // malformed hex => treat as tampered/corrupted
  }

  const result = Ascon.decrypt(
    key,
    nonce,
    associatedData,
    ciphertext,
    ASCON_VARIANT
  );

  if (result === null) {
    return null; // authentication failed - tampered ciphertext, nonce, or AD
  }

  return Ascon.byteArrayToStr(result);
}

module.exports = {
  encryptCertificateData,
  decryptCertificateData,
  ASCON_VARIANT,
};
