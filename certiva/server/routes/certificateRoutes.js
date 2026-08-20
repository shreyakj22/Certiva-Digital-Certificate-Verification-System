const express = require("express");
const {
  createCertificate,
  getCertificate,
  verifyCertificate,
} = require("../controllers/certificateController");

const router = express.Router();

// POST /api/certificates - create a new certificate
router.post("/", createCertificate);

// GET /api/certificates/:certificateId - fetch certificate for display
router.get("/:certificateId", getCertificate);

// POST /api/certificates/:certificateId/verify - run full verification
router.post("/:certificateId/verify", verifyCertificate);

module.exports = router;
