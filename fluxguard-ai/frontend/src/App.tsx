import { Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layouts/AppLayout';
import { HomePage } from '@/pages/HomePage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
      </Route>
    </Routes>
  );
}
