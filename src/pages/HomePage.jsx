import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [profile, setProfile] = useState({
    profile_image: null,
    twitter: "",
    instagram: "",
    linkedin: "",
    github: "",
    bio: "",
  });

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(`${API}/api/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        if (cancelled) return;

        setUsername(data.username);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username);

        // Fetch profile data
        const profileRes = await fetch(`${API}/api/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (cancelled) return;
          setProfile(profileData);
        }
      } catch {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        navigate("/", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();
    return () => (cancelled = true);
  }, [navigate, API]);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Profile Card Section */}
        <div className="profile-card-section">
          <div className="profile-card">
            <div className="profile-image-wrapper">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={username}
                  className="profile-image-home"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>👤</span>
                </div>
              )}
            </div>

            <div className="profile-info">
              <h2 className="profile-name">{username || "User"}</h2>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              {/* Social Links */}
              {(profile.twitter ||
                profile.instagram ||
                profile.linkedin ||
                profile.github) && (
                <div className="social-links-home">
                  {profile.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link-btn twitter"
                      title="Twitter"
                    >
                      🐦
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link-btn instagram"
                      title="Instagram"
                    >
                      📷
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link-btn linkedin"
                      title="LinkedIn"
                    >
                      💼
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link-btn github"
                      title="GitHub"
                    >
                      💻
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate("/profile")}
                className="edit-profile-btn"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="welcome-section">
          <h1 className="welcome-title">Age Calculater</h1>
          <div>
            <input ></input>
            <input ></input>
            <input ></input>
          </div>
        </div>

        <div className="features-section">
          <h2>Quick Actions</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>Manage Profile</h3>
              <p>Update your profile information and add social links.</p>
              <button
                onClick={() => navigate("/profile")}
                className="feature-btn"
              >
                Go to Profile
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Manage your account settings and preferences.</p>
              <button className="feature-btn" disabled>
                Coming Soon
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Notifications</h3>
              <p>Check your latest notifications and updates.</p>
              <button className="feature-btn" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* <div className="stats-section">
          <div className="stat-card">
            <p className="stat-label">Profile Status</p>
            <p className="stat-value">Active</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Account Created</p>
            <p className="stat-value">Today</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Last Login</p>
            <p className="stat-value">Just Now</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}