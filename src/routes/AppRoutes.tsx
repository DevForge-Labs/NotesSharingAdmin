import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import { Subjects } from '@/pages/Subjects';
import { InteractiveHub } from '@/pages/InteractiveHub';

// Root Protected Admin Layout Component
const ProtectedLayout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
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

      {/* Protected Admin Routes (Rendered inside persistent ProtectedLayout & DashboardLayout) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interactive-hub" element={<InteractiveHub />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/pyqs" element={<Pyqs />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/cheatsheets" element={<Cheatsheets />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Unknown Routes Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
