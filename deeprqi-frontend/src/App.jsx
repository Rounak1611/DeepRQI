import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";
import RoadDetailPage from "./pages/RoadDetailPage";
import PendingPage from "./pages/PendingPage";
import ModelComparePage from "./pages/ModelComparePage";
import RepairPriorityPage from "./pages/RepairPriorityPage";
import ChatWidget from "./components/ChatWidget";

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
          {user.role === "ADMIN" && (
            <Link to="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Dashboard
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link to="/priority" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Repair priority
            </Link>
          )}
          <Link to="/upload" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            New Inspection
          </Link>
          <Link to="/pending" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Pending
          </Link>
          <span className="mono">{user.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}

function AuthedChatWidget() {
  const { user } = useAuth();
  if (!user) return null;
  return <ChatWidget />;
}

function AppRoutes() {
  const { user } = useAuth();
  // Milestone 10: ADMIN lands on the dashboard (aggregate view), INSPECTOR
  // lands on upload (field work) -- neither role has a route it can't reach
  // from its own default landing page.
  const homePath = user ? (user.role === "ADMIN" ? "/dashboard" : "/upload") : "/login";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homePath} /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/priority"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <RepairPriorityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roads/:id"
        element={
          <ProtectedRoute>
            <RoadDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <ProtectedRoute>
            <PendingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:imageId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare/:imageId"
        element={
          <ProtectedRoute>
            <ModelComparePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={homePath} />} />
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
          <AuthedChatWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
