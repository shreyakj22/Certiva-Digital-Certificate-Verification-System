const Certificate = require("../models/Certificate");

/**
 * Generate a certificate ID in the form CERT-<year>-<0001>, sequential
 * within each calendar year (e.g. CERT-2026-0001, CERT-2026-0002, ...).
 *
 * We derive the next sequence number from how many certificates already
 * exist for the current year, then defend against a rare race condition
 * (two admins creating a certificate at the same instant) by retrying on
 * a duplicate-key error, since certificateId has a unique index.
 */
async function generateCertificateId() {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;

  const countThisYear = await Certificate.countDocuments({
    certificateId: { $regex: `^${prefix}` },
  });

  let sequence = countThisYear + 1;
  let candidateId = `${prefix}${String(sequence).padStart(4, "0")}`;

  // Guard against collisions (e.g. concurrent creation requests).
  // Practically this loop runs once; it exists purely for correctness.
  // eslint-disable-next-line no-await-in-loop
  while (await Certificate.exists({ certificateId: candidateId })) {
    sequence += 1;
    candidateId = `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  return candidateId;
}

module.exports = { generateCertificateId };
