import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md w-full space-y-6 bg-surface-elevated border border-red-500/10 p-8 rounded-lg shadow-command relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
            <span className="text-red-400 font-bold text-lg font-mono">!</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-ink">
            Access Level Mismatch
          </h2>
          <p className="text-xs font-mono text-ink-subdued uppercase tracking-widest">
            Insufficient Operational Clearance
          </p>
        </div>

        <p className="text-sm text-ink-subdued leading-relaxed font-mono">
          Your current user credentials do not have authorization to view this terminal. If you
          require higher clearance, contact the system administrator.
        </p>

        <div className="pt-4 border-t border-white/5 flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/dashboard')}
            className="uppercase font-mono tracking-wider text-xs px-5 py-2.5"
          >
            Return to Dashboard
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="uppercase font-mono tracking-wider text-xs px-5 py-2.5"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
