/**
 * signatureService.js
 *
 * Real Ed448 (Edwards-curve Digital Signature Algorithm over Curve448,
 * a.k.a. "Ed448-Goldilocks") signing and verification.
 *
 * Ed448 is natively supported by Node.js's `crypto` module (via OpenSSL
 * 1.1.1+), through the generic `crypto.sign` / `crypto.verify` APIs using
 * an Ed448 KeyObject. No third-party library is required, and no digest
 * algorithm is passed to sign/verify - EdDSA schemes hash internally as
 * part of the signing algorithm itself.
 *
 * Ed448 proves AUTHENTICITY: only whoever holds the private key could
 * have produced a valid signature over a given piece of data. Certiva
 * signs the certificate's SHA-512/256 hash, so any change to the
 * certificate data changes the hash, which in turn invalidates the
 * signature.
 *
 * SECURITY NOTE: the private key never leaves this module / the backend
 * process. It is loaded once from a PEM file on disk (never hardcoded,
 * never sent to the frontend, never stored in MongoDB) and kept only in
 * server memory.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let cachedPrivateKey = null;
let cachedPublicKey = null;

function keysDir() {
  return path.resolve(process.env.ED448_KEYS_DIR || "./keys");
}

function privateKeyPath() {
  return path.join(keysDir(), "ed448_private.pem");
}

function publicKeyPath() {
  return path.join(keysDir(), "ed448_public.pem");
}

/**
 * Load the Ed448 key pair from disk (PEM files) into memory.
 * Throws a clear, actionable error if the keys have not been generated yet.
 */
function loadKeys() {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  if (!fs.existsSync(privateKeyPath()) || !fs.existsSync(publicKeyPath())) {
    throw new Error(
      `Ed448 key pair not found in "${keysDir()}". ` +
        "Generate it first by running: npm run generate-keys"
    );
  }

  const privatePem = fs.readFileSync(privateKeyPath(), "utf8");
  const publicPem = fs.readFileSync(publicKeyPath(), "utf8");

  cachedPrivateKey = crypto.createPrivateKey({ key: privatePem, format: "pem" });
  cachedPublicKey = crypto.createPublicKey({ key: publicPem, format: "pem" });

  if (cachedPrivateKey.asymmetricKeyType !== "ed448") {
    throw new Error("The configured private key is not an Ed448 key.");
  }

  return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
}

/**
 * Sign a hex-encoded SHA-512/256 hash with the Ed448 private key.
 * @returns {string} hex-encoded signature
 */
function signHash(hashHex) {
  const { privateKey } = loadKeys();
  const data = Buffer.from(hashHex, "hex");
  // For EdDSA (Ed448/Ed25519) the digest algorithm argument must be null -
  // the algorithm hashes internally as part of its own construction.
  const signature = crypto.sign(null, data, privateKey);
  return signature.toString("hex");
}

/**
 * Verify a hex-encoded signature against a hex-encoded hash using the
 * Ed448 public key.
 * @returns {boolean}
 */
function verifySignature(hashHex, signatureHex) {
  try {
    const { publicKey } = loadKeys();
    const data = Buffer.from(hashHex, "hex");
    const signature = Buffer.from(signatureHex, "hex");
    return crypto.verify(null, data, publicKey, signature);
  } catch (err) {
    return false;
  }
}

/**
 * Export the public key as PEM - safe to expose to the frontend/public if
 * ever needed (e.g. for an "about this system" page). Never call the
 * equivalent for the private key.
 */
function getPublicKeyPem() {
  const { publicKey } = loadKeys();
  return publicKey.export({ type: "spki", format: "pem" });
}

module.exports = {
  signHash,
  verifySignature,
  getPublicKeyPem,
};
