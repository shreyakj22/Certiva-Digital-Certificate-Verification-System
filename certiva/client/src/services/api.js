import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

/**
 * Extract a user-friendly error message from an axios error, falling back
 * gracefully if the backend is unreachable or returned an unexpected shape.
 */
function extractErrorMessage(err, fallback) {
  if (err.response?.data?.message) {
    const detail = err.response.data.errors?.join(" ");
    return detail ? `${err.response.data.message} ${detail}` : err.response.data.message;
  }
  if (err.code === "ECONNABORTED") return "The request timed out. Is the backend running?";
  if (err.message === "Network Error") return "Could not reach the Certiva server. Is it running?";
  return fallback;
}

export async function createCertificate(payload) {
  try {
    const { data } = await api.post("/certificates", payload);
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, "Failed to create certificate."));
  }
}

export async function getCertificate(certificateId) {
  try {
    const { data } = await api.get(`/certificates/${encodeURIComponent(certificateId)}`);
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, "Failed to fetch certificate."));
  }
}

export async function verifyCertificate(certificateId) {
  try {
    const { data } = await api.post(
      `/certificates/${encodeURIComponent(certificateId)}/verify`
    );
    return data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, "Verification failed."));
  }
}

export default api;
