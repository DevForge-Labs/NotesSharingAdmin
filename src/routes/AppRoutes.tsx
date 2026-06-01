import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

// Direct Page Imports
import { Login } from '@/pages/Login';
import { Unauthorized } from '@/pages/Unauthorized';
import { Dashboard } from '@/pages/Dashboard';
import { Notes } from '@/pages/Notes';
import { Assignments } from '@/pages/Assignments';
import { Pyqs } from '@/pages/Pyqs';
import { Cheatsheets } from '@/pages/Cheatsheets';
import { Users } from '@/pages/Users';
import { Settings } from '@/pages/Settings';

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
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Panel Layout Wrapped Routes (Protected) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="notes" element={<Notes />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="pyqs" element={<Pyqs />} />
                <Route path="cheatsheets" element={<Cheatsheets />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
                
                {/* Fallbacks */}
                <Route path="" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
