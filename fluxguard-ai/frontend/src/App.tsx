import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/features/dashboard';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { CopilotPage } from '@/features/copilot/CopilotPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { AppLayout } from '@/layouts/AppLayout';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="copilot" element={<CopilotPage />} />
        <Route path="operations" element={<OperationsPage />} />
      </Route>
    </Routes>
  );
}
