const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDatabase } = require("./utils/db");
const certificateRoutes = require("./routes/certificateRoutes");
const { loadKeys } = (() => {
  // Re-export just to fail fast & loudly at boot if keys are missing,
  // instead of failing later on the first sign/verify request.
  const sig = require("./crypto/signatureService");
  return { loadKeys: () => sig.getPublicKeyPem() };
})();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "certiva-server" });
});

app.use("/api/certificates", certificateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Centralized error handler (catches anything unexpected)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

async function start() {
  try {
    // Fail fast if the Ed448 keys haven't been generated yet.
    loadKeys();

    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Certiva server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start Certiva server:", err.message);
    process.exit(1);
  }
}

start();
