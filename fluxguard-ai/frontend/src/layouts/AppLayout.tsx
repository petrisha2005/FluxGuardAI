import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { Navigation } from '@/components/Navigation';
import { startSimulation } from '@/features/simulation/simulationStore';

export function AppLayout() {
  useEffect(() => {
    startSimulation();
  }, []);

  return (
    <div className="min-h-screen text-ink">
      <Navigation />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
