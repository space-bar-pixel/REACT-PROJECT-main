import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(`${API}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        if (cancelled) return;

        setUsername(data.username);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username);
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
  }, [navigate]);

  const logout = async () => {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/", { replace: true });
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Welcome, {username || "User"} </h1>
      <p className="text-gray-600">You are now logged in.</p>
      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Log Out
      </button>
    </div>
  );
}