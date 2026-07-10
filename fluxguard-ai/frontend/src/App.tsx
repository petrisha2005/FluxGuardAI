import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/features/dashboard';
import { AppLayout } from '@/layouts/AppLayout';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
