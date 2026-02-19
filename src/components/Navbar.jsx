import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === "/";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const handleLogout = async () => {
    const API = import.meta.env.VITE_API_URL;
    try {
      await fetch(`${API}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      navigate("/", { replace: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-text">NANTAWAT</span>
        </div>

        {!isAuthPage && isLoggedIn && (
          <ul className="nav-menu">
            <li className="nav-item">
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/home");
                }}
                className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
              >
                Home
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#/profile"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/profile");
                }}
                className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
              >
                Profile Edit
              </a>
            </li>
          </ul>
        )}

        {!isAuthPage && isLoggedIn && (
          <div className="nav-actions">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
