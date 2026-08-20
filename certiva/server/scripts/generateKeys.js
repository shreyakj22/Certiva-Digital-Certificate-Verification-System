/**
 * generateKeys.js
 *
 * One-time setup script: generates a fresh Ed448 key pair and writes it
 * to server/keys/ as PEM files.
 *
 * Run with: npm run generate-keys
 *
 * SECURITY:
 *  - ed448_private.pem is listed in .gitignore and must never be committed.
 *  - This script refuses to overwrite existing keys unless --force is passed,
 *    to avoid accidentally invalidating already-issued certificates.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const keysDir = path.resolve(process.env.ED448_KEYS_DIR || "./keys");
const privatePath = path.join(keysDir, "ed448_private.pem");
const publicPath = path.join(keysDir, "ed448_public.pem");

const force = process.argv.includes("--force");

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

if ((fs.existsSync(privatePath) || fs.existsSync(publicPath)) && !force) {
  console.error(
    `Key files already exist in "${keysDir}".\n` +
      "Refusing to overwrite (this would invalidate all previously issued " +
      "certificate signatures).\n" +
      "Re-run with --force if you really want to replace them:\n" +
      "  npm run generate-keys -- --force"
  );
  process.exit(1);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed448");

const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
const publicPem = publicKey.export({ type: "spki", format: "pem" });

fs.writeFileSync(privatePath, privatePem, { mode: 0o600 });
fs.writeFileSync(publicPath, publicPem, { mode: 0o644 });

console.log("Ed448 key pair generated successfully:");
console.log("  Private key:", privatePath, "(keep secret, never commit)");
console.log("  Public key: ", publicPath);
