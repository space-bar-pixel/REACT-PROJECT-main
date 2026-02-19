import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        // Get user info
        const userRes = await fetch(`${API}/api/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!userRes.ok) throw new Error("Not authenticated");

        const userData = await userRes.json();
        if (cancelled) return;

        setUsername(userData.username);

        // Get profile data
        const profileRes = await fetch(`${API}/api/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (!profileRes.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileRes.json();
        if (cancelled) return;

        setProfileImage(profileData.profile_image);
        setImagePreview(profileData.profile_image);
        setTwitter(profileData.twitter || "");
        setInstagram(profileData.instagram || "");
        setLinkedin(profileData.linkedin || "");
        setGithub(profileData.github || "");
        setBio(profileData.bio || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/home", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => (cancelled = true);
  }, [navigate, API]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sanitizeHandle = (value) => {
    return value.replace(/@/g, "").trim();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_image: profileImage,
          twitter,
          instagram,
          linkedin,
          github,
          bio,
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your profile information</p>
        </div>

        <div className="profile-content">
          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="image-container">
              {imagePreview ? (
                <img src={imagePreview} alt={username} className="profile-image" />
              ) : (
                <div className="image-placeholder">
                  <span>📷</span>
                </div>
              )}
            </div>
            <label className="file-input-label">
              Change Profile Picture
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
            </label>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="form-input disabled"
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="form-textarea"
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Social Links</h2>

              <div className="form-group">
                <label>
                  <span className="social-icon">🐦</span> Twitter
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(sanitizeHandle(e.target.value))}
                  className="form-input"
                  placeholder="username (@ will be removed)"
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="social-icon">📷</span> Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(sanitizeHandle(e.target.value))}
                  className="form-input"
                  placeholder="username (@ will be removed)"
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="social-icon">💼</span> LinkedIn
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="form-input"
                  placeholder="Profile URL"
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="social-icon">💻</span> GitHub
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(sanitizeHandle(e.target.value))}
                  className="form-input"
                  placeholder="username (@ will be removed)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={handleSave}
                disabled={saving}
                className="save-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => navigate("/home")}
                className="cancel-btn"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}