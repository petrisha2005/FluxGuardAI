import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';

import { LayoutShell } from '@/components/layout';
import { ProtectedRoute, checkRoleAccess, useAuth } from '@/features/auth';

const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((module) => ({ default: module.DashboardPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  })),
);
const CopilotPage = lazy(() =>
  import('@/features/copilot/CopilotPage').then((module) => ({ default: module.CopilotPage })),
);
const OperationsPage = lazy(() =>
  import('@/features/operations/OperationsPage').then((module) => ({
    default: module.OperationsPage,
  })),
);
const SignagePage = lazy(() =>
  import('@/features/signage/SignagePage').then((module) => ({ default: module.SignagePage })),
);
const VolunteerPage = lazy(() =>
  import('@/features/volunteer/VolunteerPage').then((module) => ({
    default: module.VolunteerPage,
  })),
);
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((module) => ({ default: module.LandingPage })),
);
const CityHubPage = lazy(() =>
  import('@/features/city/CityHubPage').then((module) => ({ default: module.CityHubPage })),
);
const PredictiveTwinPage = lazy(() =>
  import('@/features/digital-twin/PredictiveTwinPage').then((module) => ({
    default: module.PredictiveTwinPage,
  })),
);
const GlobalOperationsDashboard = lazy(() =>
  import('@/features/global-command/GlobalOperationsDashboard').then((module) => ({
    default: module.GlobalOperationsDashboard,
  })),
);
const AutonomousCommandCenter = lazy(() =>
  import('@/features/autonomous-control/AutonomousCommandCenter').then((module) => ({
    default: module.AutonomousCommandCenter,
  })),
);
const LoginPage = lazy(() =>
  import('@/features/auth').then((module) => ({ default: module.LoginPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/auth').then((module) => ({ default: module.ProfilePage })),
);
const ChangePasswordPage = lazy(() =>
  import('@/features/auth').then((module) => ({ default: module.ChangePasswordPage })),
);
const UnauthorizedPage = lazy(() =>
  import('@/features/auth').then((module) => ({ default: module.UnauthorizedPage })),
);
const UserManagementPage = lazy(() =>
  import('@/features/auth').then((module) => ({ default: module.UserManagementPage })),
);

function RouteFallback() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      role="status"
      aria-live="polite"
      aria-label="Loading FluxGuard AI route"
    />
  );
}

// Route wrappers enforcing granular clearances
const DirectorOrAdminRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const hasAccess = checkRoleAccess(user.role, ['GLOBAL_OPERATIONS_DIRECTOR', 'SUPER_ADMIN']);
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

const OperatorOrAdminRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const hasAccess = checkRoleAccess(user.role, [
    'SECURITY_SUPERVISOR',
    'MEDICAL_COORDINATOR',
    'GLOBAL_OPERATIONS_DIRECTOR',
    'STADIUM_MANAGER',
    'SUPER_ADMIN',
    'operator',
    'organizer',
  ]);
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<LayoutShell />}>
          {/* Public Landing & Authentication Screens */}
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          {/* Authenticated Context Block */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="city-hub" element={<CityHubPage />} />

            {/* Operator Context Block */}
            <Route element={<OperatorOrAdminRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="copilot" element={<CopilotPage />} />
              <Route path="operations" element={<OperationsPage />} />
              <Route path="signage" element={<SignagePage />} />
              <Route path="volunteer" element={<VolunteerPage />} />
              <Route path="predictive-twin" element={<PredictiveTwinPage />} />
              <Route path="autonomous-control" element={<AutonomousCommandCenter />} />
            </Route>

            {/* Executive & Administrative Control Block */}
            <Route element={<DirectorOrAdminRoute />}>
              <Route path="global-command" element={<GlobalOperationsDashboard />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
