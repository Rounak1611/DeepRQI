import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles: optional array of allowed roles for this route (Milestone 10).
// Omit it for routes both roles can see. On mismatch, redirect to each
// role's own landing page rather than /login -- they ARE authenticated,
// just not permitted here.
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/dashboard" : "/upload"} replace />;
  }
  return children;
}
