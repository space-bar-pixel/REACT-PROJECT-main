import React from "react";
import "../styles/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Us</h4>
            <p>This App is a web application built with React and Node.js.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/">Profile</a>
              </li>
              <li>
                <a href="/">Settings</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#" className="social-link" title="GitHub">
                Github
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} NANTAWAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
