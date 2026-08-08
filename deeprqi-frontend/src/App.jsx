import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";

function Topbar() {
  const { user, logout } = useAuth();

  return (
    <div className="topbar">
      <div className="topbar__brand">
        <h1>
          Deep<span className="mark">RQI</span>
        </h1>
      </div>
      {user && (
        <div className="topbar__nav">
          <Link to="/upload" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            New Inspection
          </Link>
          <span className="mono">{user.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/upload" /> : <LoginPage />} />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/upload" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Topbar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
