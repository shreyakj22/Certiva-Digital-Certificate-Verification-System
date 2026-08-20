/**
 * canonicalize.js
 *
 * Produces a deterministic (canonical) JSON string representation of an
 * object, regardless of the order in which its keys were originally set.
 *
 * This matters for a CNS project because both SHA-512/256 hashing and
 * Ascon-128 encryption must always be performed over the *exact same byte
 * sequence* for the same logical certificate data. If key order were
 * allowed to vary, two functionally identical certificate objects could
 * produce two different hashes / ciphertexts, breaking verification.
 *
 * Algorithm: recursively sort object keys alphabetically before
 * JSON-stringifying. Arrays keep their order (order is meaningful there).
 */

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const sortedObj = {};
    for (const key of Object.keys(value).sort()) {
      sortedObj[key] = sortValue(value[key]);
    }
    return sortedObj;
  }

  return value;
}

/**
 * Build the canonical certificate payload used consistently for hashing,
 * signing and encryption. Keeping this in one place guarantees the
 * creation flow and the verification flow always agree on what "the
 * certificate data" means.
 */
function buildCanonicalCertificatePayload({
  certificateId,
  studentName,
  course,
  organization,
  issueDate,
}) {
  return {
    certificateId: String(certificateId),
    studentName: String(studentName),
    course: String(course),
    organization: String(organization),
    // Normalize date to an ISO date string (YYYY-MM-DD) so formatting
    // differences never change the hash.
    issueDate: new Date(issueDate).toISOString().slice(0, 10),
  };
}

/**
 * Convert any JSON-serializable value into a canonical string.
 */
function canonicalStringify(value) {
  return JSON.stringify(sortValue(value));
}

module.exports = {
  canonicalStringify,
  buildCanonicalCertificatePayload,
};
