// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  // If there's no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, show the protected page
  return children;
}
