import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import HomePage from "../pages/HomePage";
import ArtifactPage from "../pages/ArtifactPage";
import LoginPage from "../pages/LoginPage";
import ArtifactSearchPage from "../pages/ArtifactSearchPage"; // <-- NEW

/**
 * ProtectRoute: If user is not authenticated, redirect to login.
 */
const ProtectRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <ProtectRoute>
          <HomePage />
        </ProtectRoute>
      }
    />
    <Route
      path="/artifact/:id"
      element={
        <ProtectRoute>
          <ArtifactPage />
        </ProtectRoute>
      }
    />
    <Route
      path="/search"
      element={
        <ProtectRoute>
          <ArtifactSearchPage />
        </ProtectRoute>
      }
    />
    <Route path="/login" element={<LoginPage />} />
    {/* Catch-all: redirect to home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;