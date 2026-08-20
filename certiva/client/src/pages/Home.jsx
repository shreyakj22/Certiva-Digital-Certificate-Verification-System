import { Link } from "react-router-dom";

const pillars = [
  {
    title: "Confidentiality",
    desc: "Certificate data is sealed with Ascon-128 authenticated encryption before storage.",
  },
  {
    title: "Integrity",
    desc: "A SHA-512/256 fingerprint detects the smallest change to certificate data.",
  },
  {
    title: "Authenticity",
    desc: "An Ed448 digital signature proves the certificate was issued by Certiva.",
  },
  {
    title: "Tamper Detection",
    desc: "Any edit — to the data, the hash, or the signature — flips verification to Invalid.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">Certificate Security System</div>
          <h1>Certificates that prove themselves.</h1>
          <p className="lede">
            Certiva issues digital certificates sealed with authenticated encryption, fingerprinted
            with a cryptographic hash, and signed with a digital signature — so anyone can verify a
            certificate is genuine and unaltered, using only its ID or QR code.
          </p>
          <div className="algo-strip">
            <span className="algo-chip">Ascon-128</span>
            <span className="algo-chip">SHA-512/256</span>
            <span className="algo-chip">Ed448</span>
          </div>
          <div className="hero-actions">
            <Link to="/create" className="btn btn-primary">
              Create Certificate
            </Link>
            <Link to="/verify" className="btn btn-secondary">
              Verify Certificate
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">How verification works</div>
          <h2 style={{ marginTop: 10 }}>From ID to result</h2>
          <div className="data-row">
            <span className="label">1. Look up</span>
            <span className="value" style={{ textAlign: "left" }}>
              Fetch sealed certificate record from MongoDB
            </span>
          </div>
          <div className="data-row">
            <span className="label">2. Decrypt</span>
            <span className="value" style={{ textAlign: "left" }}>
              Ascon-128 opens the sealed data, authenticating it
            </span>
          </div>
          <div className="data-row">
            <span className="label">3. Re-hash</span>
            <span className="value" style={{ textAlign: "left" }}>
              SHA-512/256 is recomputed and compared
            </span>
          </div>
          <div className="data-row">
            <span className="label">4. Verify</span>
            <span className="value" style={{ textAlign: "left" }}>
              Ed448 signature is checked against the public key
            </span>
          </div>
        </div>
      </section>

      <div className="pillars">
        {pillars.map((p) => (
          <div className="pillar" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
