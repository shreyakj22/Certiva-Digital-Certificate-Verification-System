import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import CreateCertificate from "./pages/CreateCertificate.jsx";
import CertificateView from "./pages/CertificateView.jsx";
import VerifyCertificate from "./pages/VerifyCertificate.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCertificate />} />
            <Route path="/certificate/:certificateId" element={<CertificateView />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <footer className="site-footer">
        Certiva — Digital Certificate Verification System
      </footer>
    </div>
  );
}
