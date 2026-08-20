import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCertificate } from "../services/api.js";

const initialForm = {
  studentName: "",
  course: "",
  organization: "",
  issueDate: new Date().toISOString().slice(0, 10),
};

export default function CreateCertificate() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.studentName.trim()) return "Student name is required.";
    if (!form.course.trim()) return "Course / achievement is required.";
    if (!form.organization.trim()) return "Issuing organization is required.";
    if (!form.issueDate) return "Issue date is required.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await createCertificate(form);
      navigate(`/certificate/${data.certificate.certificateId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="eyebrow">Admin</div>
      <h1>Create Certificate</h1>
      <p style={{ marginBottom: 28 }}>
        Fill in the certificate details below. A certificate ID will be generated automatically, and
        the data will be sealed with Ascon-128, hashed with SHA-512/256, and signed with Ed448.
      </p>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="studentName">Student Name</label>
          <input
            id="studentName"
            name="studentName"
            value={form.studentName}
            onChange={handleChange}
            placeholder="e.g. Aditi Rao"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="course">Course / Achievement</label>
          <input
            id="course"
            name="course"
            value={form.course}
            onChange={handleChange}
            placeholder="e.g. Advanced Cryptography"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="organization">Issuing Organization</label>
          <input
            id="organization"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            placeholder="e.g. Certiva University"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="issueDate">Issue Date</label>
          <input
            id="issueDate"
            name="issueDate"
            type="date"
            value={form.issueDate}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Certificate ID</label>
          <input value="Generated automatically after submission" disabled />
          <div className="field-hint">Example format: CERT-2026-0001</div>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> Generating certificate...
            </>
          ) : (
            "Generate Certificate"
          )}
        </button>
      </form>
    </div>
  );
}
