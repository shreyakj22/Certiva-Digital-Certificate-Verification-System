import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCertificate } from "../services/api.js";
import CertificateCard from "../components/CertificateCard.jsx";

export default function CertificateView() {
  const { certificateId } = useParams();
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: "", data: null });

    getCertificate(certificateId)
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: "", data });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  async function handleDownloadPdf() {
    if (!state.data) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { certificate } = state.data;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Border
      doc.setDrawColor(201, 162, 39);
      doc.setLineWidth(2);
      doc.rect(24, 24, pageWidth - 48, pageHeight - 48);

      doc.setTextColor(120, 105, 65);
      doc.setFontSize(11);
      doc.text("CERTIVA VERIFIED CERTIFICATE", pageWidth / 2, 90, { align: "center" });

      doc.setTextColor(40, 35, 24);
      doc.setFontSize(16);
      doc.text("CERTIFICATE OF ACHIEVEMENT", pageWidth / 2, 130, { align: "center" });

      doc.setFontSize(30);
      doc.text(certificate.studentName, pageWidth / 2, 185, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(90, 80, 55);
      doc.text("has successfully completed", pageWidth / 2, 210, { align: "center" });

      doc.setFontSize(18);
      doc.setTextColor(40, 35, 24);
      doc.text(certificate.course, pageWidth / 2, 240, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(90, 80, 55);
      doc.text(
        `issued by ${certificate.organization} on ${new Date(certificate.issueDate).toLocaleDateString()}`,
        pageWidth / 2,
        265,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.text(`Certificate ID: ${certificate.certificateId}`, 60, pageHeight - 60);
      doc.text("Protected with Ascon-128, SHA-512/256 and Ed448", 60, pageHeight - 46);

      if (state.data.qrDataUrl) {
        doc.addImage(state.data.qrDataUrl, "PNG", pageWidth - 160, pageHeight - 160, 100, 100);
        doc.text("Scan to verify", pageWidth - 130, pageHeight - 46);
      }

      doc.save(`${certificate.certificateId}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  if (state.loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <span className="spinner" /> Loading certificate...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Certificate not found</h2>
        <p>{state.error}</p>
        <Link to="/create" className="btn btn-primary">
          Create a certificate
        </Link>
      </div>
    );
  }

  const { certificate, qrDataUrl } = state.data;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="eyebrow">Issued Certificate</div>
      <h1>{certificate.certificateId}</h1>

      <CertificateCard certificate={certificate} qrDataUrl={qrDataUrl} />

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? "Preparing PDF..." : "Download as PDF"}
        </button>
        <Link to={`/verify/${certificate.certificateId}`} className="btn btn-secondary">
          Verify this certificate
        </Link>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="eyebrow">Cryptographic proof</div>
        <div className="data-row">
          <span className="label">SHA-512/256 hash</span>
          <span className="value">{certificate.hash}</span>
        </div>
        <div className="data-row">
          <span className="label">Ed448 signature</span>
          <span className="value">{certificate.signature}</span>
        </div>
      </div>
    </div>
  );
}
