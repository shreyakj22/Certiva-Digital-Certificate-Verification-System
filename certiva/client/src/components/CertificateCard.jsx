function formatDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Renders the professional certificate itself (student name, course,
 * organization, ID, QR code). Used on the Certificate view page and
 * captured for PDF export.
 */
export default function CertificateCard({ certificate, qrDataUrl, forwardRef }) {
  return (
    <div className="certificate" ref={forwardRef} id="certificate-capture">
      <div className="certificate-header">
        <div>
          <div className="certificate-brand">Certiva Verified Certificate</div>
        </div>
        <div className="certificate-id">{certificate.certificateId}</div>
      </div>

      <div className="certificate-title">Certificate of Achievement</div>
      <div className="certificate-student">{certificate.studentName}</div>
      <div className="certificate-sub">has successfully completed</div>
      <div className="certificate-course">{certificate.course}</div>
      <div className="certificate-sub">
        issued by <strong>{certificate.organization}</strong> on {formatDate(certificate.issueDate)}
      </div>

      <div className="certificate-footer">
        <div className="certificate-meta">
          Certificate ID: {certificate.certificateId}
          <br />
          Protected with Ascon-128 · SHA-512/256 · Ed448
          <br />
          Scan the QR code, or visit the Verify Certificate page, to confirm authenticity.
        </div>
        {qrDataUrl && (
          <div className="certificate-qr">
            <img src={qrDataUrl} alt={`QR code to verify certificate ${certificate.certificateId}`} />
            <span>Scan to verify</span>
          </div>
        )}
      </div>
    </div>
  );
}
