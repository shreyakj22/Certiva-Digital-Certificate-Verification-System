/**
 * tamperDemo.js
 *
 * Demonstrates Certiva's tamper detection for the CNS project viva.
 *
 * This script connects DIRECTLY to MongoDB (bypassing the API, the way a
 * malicious actor with raw database access might) and modifies a stored
 * certificate's "course" field in place, without touching the Ascon-128
 * encrypted blob, the SHA-512/256 hash, or the Ed448 signature.
 *
 * Usage:
 *   node scripts/tamperDemo.js CERT-2026-0001
 *
 * After running this, verify the same certificate ID through the app
 * (Verify Certificate page, or POST /api/certificates/:id/verify) and
 * observe the result flip to "Certificate Invalid / Tampered", with
 * checks.displayDataMatches = false (the decrypted-vs-displayed
 * cross-check is what catches this specific kind of tampering).
 */





const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require("dotenv").config();
const mongoose = require("mongoose");
const Certificate = require("../models/Certificate");

async function main() {
  const certificateId = process.argv[2];

  if (!certificateId) {
    console.error("Usage: node scripts/tamperDemo.js <CERTIFICATE_ID>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) {
    console.error(`No certificate found with ID "${certificateId}".`);
    process.exit(1);
  }

  console.log("BEFORE tampering:");
  console.log("  course:", certificate.course);

  certificate.course =
    certificate.course === "Java" ? "Python (tampered)" : "Java (tampered)";
  await certificate.save();

  console.log("AFTER tampering:");
  console.log("  course:", certificate.course);
  console.log(
    "\nNow verify this certificate ID through the app - it should report:\n" +
      "  Certificate Invalid / Tampered"
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
