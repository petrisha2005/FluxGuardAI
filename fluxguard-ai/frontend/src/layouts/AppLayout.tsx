import { Outlet } from 'react-router-dom';

import { Navigation } from '@/components/Navigation';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navigation />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
