import { Navigate, Route, Routes } from "react-router-dom";
import { type ReactNode } from "react";

import { useAuth } from "../context/AuthContext";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Articles from "../pages/Articles/Articles";
import Stock from "../pages/Stock/Stock";
import Equipments from "../pages/Equipments/Equipments";
import NotFound from "../pages/NotFound/NotFound";

type UserRole =
  | "magasinier"
  | "viewer"
  | "bdm"
  | "responsable_bdm";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    user &&
    !allowedRoles.includes(user.role as UserRole)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "magasinier",
              "viewer",
              "bdm",
              "responsable_bdm",
            ]}
          >
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Articles */}
      <Route
        path="/articles"
        element={
          <ProtectedRoute
            allowedRoles={[
              "magasinier",
              "viewer",
              "bdm",
              "responsable_bdm",
            ]}
          >
            <DashboardLayout>
              <Articles />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Stock */}
      <Route
        path="/stock"
        element={
          <ProtectedRoute
            allowedRoles={[
              "magasinier",
              "viewer",
              "bdm",
              "responsable_bdm",
            ]}
          >
            <DashboardLayout>
              <Stock />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Equipments & BOM */}
      <Route
        path="/equipements"
        element={
          <ProtectedRoute
            allowedRoles={[
              "magasinier",
              "viewer",
              "bdm",
              "responsable_bdm",
            ]}
          >
            <DashboardLayout>
              <Equipments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}