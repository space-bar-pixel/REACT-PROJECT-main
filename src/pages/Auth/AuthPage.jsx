import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

export default function AuthPage() {
    const navigate = useNavigate();
    const [isSignUpActive, setIsSignUpActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 

    const [username, setUsername] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [signUpError, setSignUpError] = useState(null);

    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [signInError, setSignInError] = useState(null);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    const API = import.meta.env.VITE_API_URL;

    const handleSignUp = async (e) => {
        e.preventDefault();
        setSignUpError(null);
        if (isLoading) return;

        if (!username || !signUpEmail || !signUpPassword || !confirmPassword)
            return setSignUpError("Please fill all fields!");
        if (!emailRegex.test(signUpEmail))
            return setSignUpError("Please enter a valid email!");
        if (!passwordRegex.test(signUpPassword))
            return setSignUpError(
                "Password must be at least 8 chars and contain uppercase, lowercase, number and symbol."
            );
        if (signUpPassword !== confirmPassword)
            return setSignUpError("Passwords do not match!");
        
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    email: signUpEmail,
                    password: signUpPassword,
                }),
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (response.ok) {
                setIsSignUpActive(false);
                setUsername('');
                setSignUpEmail('');
                setSignUpPassword('');
                setConfirmPassword('');
            } else {
                setSignUpError(data.error || "Sign up failed!");
            }
        } catch (err) {
            console.error("Sign up error:", err);
            setSignUpError("Network error, please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setSignInError(null);
        if (isLoading) return;

        if (!emailRegex.test(signInEmail)) return setSignInError("Enter a valid email!");
        if (!passwordRegex.test(signInPassword))
            return setSignInError(
                "Password must contain uppercase, lowercase, number and symbol."
            );
        
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: signInEmail,
                    password: signInPassword,
                }),
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (response.ok) {
                localStorage.setItem("isLoggedIn", "true");
                navigate("/home");
            } else {
                setSignInError(data.error || "Login failed!");
            }
        } catch (err) {
            console.error("Sign in error:", err);
            setSignInError("Network error, please check server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`container ${isSignUpActive ? "active" : ""}`}>
            <div className="form-container sign-up">
                <form onSubmit={handleSignUp}>
                    <h1 className="head1">Create Account</h1>

                    <input
                        type="text"
                        placeholder="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    {signUpError && <p className="error-message">{signUpError}</p>}
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            </div>

            <div className="form-container sign-in">
                <form onSubmit={handleSignIn}>
                    <h1 className="head1">Sign In</h1>

                    <input
                        type="email"
                        placeholder="Email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                    />

                    {signInError && (
                        <p className="error-message">{signInError}</p>
                    )}
                    <button type="submit" disabled={isLoading}>
                         {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <div className="toggle-container">
                <div className="toggle">
                    <div className="toggle-panel toggle-left">
                        <h1>Welcome Back!</h1>
                        <p>Enter your personal details to use all of our features</p>
                        <button onClick={() => setIsSignUpActive(false)}>Sign In</button>
                    </div>

                    <div className="toggle-panel toggle-right">
                        <h1>Hello, Friend!</h1>
                        <p>Register to use all of our site features</p>
                        <button onClick={() => setIsSignUpActive(true)}>Sign Up</button>
                    </div>
                </div>
            </div>
            
        </div>
    );
}