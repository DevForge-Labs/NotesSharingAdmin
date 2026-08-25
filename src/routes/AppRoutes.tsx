import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

// Public Page Imports
import { LandingPage } from '@/pages/LandingPage';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { Login } from '@/pages/Login';
import { Unauthorized } from '@/pages/Unauthorized';

// Admin Page Imports
import { Dashboard } from '@/pages/Dashboard';
import { Notes } from '@/pages/Notes';
import { Assignments } from '@/pages/Assignments';
import { Pyqs } from '@/pages/Pyqs';
import { Cheatsheets } from '@/pages/Cheatsheets';
import { Videos } from '@/pages/Videos';
import { Users } from '@/pages/Users';
import { Settings } from '@/pages/Settings';
import { ReportsPage } from '@/pages/ReportsPage';

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
          Verifying security clearance...
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Admin Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Notes />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Assignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pyqs"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Pyqs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/videos"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Videos />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cheatsheets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Cheatsheets />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Unknown Routes Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
