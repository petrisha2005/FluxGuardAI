import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/features/dashboard';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { CopilotPage } from '@/features/copilot/CopilotPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { SignagePage } from '@/features/signage/SignagePage';
import { VolunteerPage } from '@/features/volunteer/VolunteerPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { CityHubPage } from '@/features/city/CityHubPage';
import { AppLayout } from '@/layouts/AppLayout';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="city-hub" element={<CityHubPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="copilot" element={<CopilotPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="signage" element={<SignagePage />} />
        <Route path="volunteer" element={<VolunteerPage />} />
      </Route>
    </Routes>
  );
}
