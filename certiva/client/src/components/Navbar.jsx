import { Link, NavLink } from "react-router-dom";

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#C9A227" strokeWidth="2" />
      <path
        d="M20 8l3.09 6.26 6.91 1-5 4.87 1.18 6.87L20 23.77l-6.18 3.23L15 20.13l-5-4.87 6.91-1L20 8z"
        fill="#C9A227"
      />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <BrandMark />
          <span className="brand-name">Certiva</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Home
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Create Certificate
          </NavLink>
          <NavLink to="/verify" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Verify Certificate
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
