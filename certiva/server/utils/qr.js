const QRCode = require("qrcode");

/**
 * Generate a QR code (as a PNG data URL) that encodes the verification
 * URL for a given certificate. Scanning it with any phone camera opens
 * Certiva's Verify Certificate page pre-filled with the certificate ID.
 */
async function generateVerificationQr(certificateId) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl.replace(/\/$/, "")}/verify/${certificateId}`;

  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });

  return { qrDataUrl: dataUrl, verifyUrl };
}

module.exports = { generateVerificationQr };
