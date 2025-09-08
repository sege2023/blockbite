// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // or check context/auth state

  if (!token) {
    return <Navigate to="/" replace />; // send back to login
  }

  return children;
};

export default ProtectedRoute;
