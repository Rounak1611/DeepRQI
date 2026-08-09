import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="center-column">
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px" }}>
            Deep<span style={{ color: "var(--accent)" }}>RQI</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>
            Road inspection &amp; quality scoring
          </p>
        </div>

        <div className="panel">
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="btn-primary"
              style={{
                flex: 1,
                background: mode === "login" ? "var(--accent)" : "var(--bg-road)",
                color: mode === "login" ? "#1a1a1a" : "var(--text-muted)",
                border: "1px solid var(--line)",
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="btn-primary"
              style={{
                flex: 1,
                background: mode === "register" ? "var(--accent)" : "var(--bg-road)",
                color: mode === "register" ? "#1a1a1a" : "var(--text-muted)",
                border: "1px solid var(--line)",
              }}
            >
              Register
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
