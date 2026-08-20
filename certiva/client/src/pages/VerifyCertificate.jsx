import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyCertificate } from "../services/api.js";
import SealBadge from "../components/SealBadge.jsx";

const CHECK_LABELS = {
  decryptionAuthentic: "Ascon-128 decryption authenticated the sealed data",
  hashMatches: "SHA-512/256 hash matches the stored fingerprint",
  displayDataMatches: "Decrypted data matches the stored certificate fields",
  signatureValid: "Ed448 signature is valid",
};

/** Pull a certificate ID out of a scanned QR value, which is a verify URL. */
function extractCertificateId(scannedText) {
  try {
    const url = new URL(scannedText);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || scannedText;
  } catch {
    return scannedText.trim();
  }
}

export default function VerifyCertificate() {
  const { certificateId: routeCertificateId } = useParams();
  const navigate = useNavigate();

  const [certificateId, setCertificateId] = useState(routeCertificateId || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [qrError, setQrError] = useState("");
  const fileInputRef = useRef(null);

  async function runVerification(id) {
    if (!id || !id.trim()) {
      setError("Please enter a certificate ID.");
      return;
    }
    setError("");
    setQrError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await verifyCertificate(id.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (routeCertificateId) {
      runVerification(routeCertificateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCertificateId]);

  function handleSubmit(e) {
    e.preventDefault();
    navigate(`/verify/${encodeURIComponent(certificateId.trim())}`);
  }

  async function handleQrFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError("");

    try {
      const jsQR = (await import("jsqr")).default;
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageBitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);

      if (!decoded) {
        setQrError("Could not read a QR code in that image. Try a clearer photo/screenshot.");
        return;
      }

      const id = extractCertificateId(decoded.data);
      setCertificateId(id);
      navigate(`/verify/${encodeURIComponent(id)}`);
    } catch (err) {
      setQrError("Failed to read the QR image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="eyebrow">Public Verification</div>
      <h1>Verify Certificate</h1>
      <p style={{ marginBottom: 28 }}>
        Enter a certificate ID, or upload a photo/screenshot of its QR code, to check whether it's
        authentic and unmodified.
      </p>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="certificateId">Certificate ID</label>
          <input
            id="certificateId"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="e.g. CERT-2026-0001"
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Verifying...
            </>
          ) : (
            "Verify Certificate"
          )}
        </button>

        <div style={{ margin: "18px 0 6px", fontSize: "0.82rem", color: "var(--muted)", textAlign: "center" }}>
          or
        </div>

        <label className="dropzone" htmlFor="qrUpload">
          Upload a QR code image to verify
        </label>
        <input
          ref={fileInputRef}
          id="qrUpload"
          type="file"
          accept="image/*"
          onChange={handleQrFile}
          style={{ display: "none" }}
        />
        {qrError && <div className="field-error" style={{ marginTop: 8 }}>{qrError}</div>}
      </form>

      {result && (
        <div style={{ marginTop: 28 }}>
          <div className={`status-banner ${result.valid ? "valid" : "invalid"}`}>
            <SealBadge valid={result.valid} />
            <div>
              <h2>{result.valid ? "✅ Certificate Valid" : "❌ Certificate Invalid / Tampered"}</h2>
              <p>{result.certificate?.certificateId}</p>
            </div>
          </div>

          <div className="card">
            <div className="eyebrow">Certificate details</div>
            <div className="data-row">
              <span className="label">Student Name</span>
              <span className="value">{result.certificate.studentName}</span>
            </div>
            <div className="data-row">
              <span className="label">Course / Achievement</span>
              <span className="value">{result.certificate.course}</span>
            </div>
            <div className="data-row">
              <span className="label">Organization</span>
              <span className="value">{result.certificate.organization}</span>
            </div>
            <div className="data-row">
              <span className="label">Issue Date</span>
              <span className="value">{result.certificate.issueDate}</span>
            </div>

            <div className="eyebrow" style={{ marginTop: 20 }}>
              Verification checks
            </div>
            <div className="check-list">
              {Object.entries(result.checks).map(([key, passed]) => (
                <div key={key} className={`check-item ${passed ? "pass" : "fail"}`}>
                  <span className="dot" />
                  {CHECK_LABELS[key] || key}: {passed ? "Passed" : "Failed"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
