import React from "react";
import { Navigate } from "react-router-dom";

const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const payload = decodeJWT(token);

  if (!payload) {
    localStorage.removeItem("access");
    return <Navigate to="/login" replace />;
  }

  const isExpired = payload.exp * 1000 < Date.now();

  if (isExpired) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;