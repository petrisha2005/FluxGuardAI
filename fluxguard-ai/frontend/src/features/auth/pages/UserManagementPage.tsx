import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { demoDirectoryUsers, isDemoAccessToken } from '../demoAuth';
import { config } from '@/services/config';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { UserProfile } from '../types';

const DIRECTORY_TIMEOUT_MS = 5_000;

function isDemoModeActive() {
  return localStorage.getItem('fluxguard_demo_mode') === 'true';
}

function getDemoDirectory() {
  return demoDirectoryUsers.map((item) => ({ ...item }));
}

export const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setErrorMsg(null);

    const accessToken = localStorage.getItem('fluxguard_access_token');
    if (isDemoModeActive() || isDemoAccessToken(accessToken)) {
      setUsers(getDemoDirectory());
      setIsLoadingUsers(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DIRECTORY_TIMEOUT_MS);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/auth/users`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve user directory.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      if (isDemoModeActive()) {
        setUsers(getDemoDirectory());
        setErrorMsg(null);
        return;
      }

      setErrorMsg(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'User directory request timed out. Switch to demo mode or retry when the backend is running.'
          : err instanceof Error
            ? err.message
            : 'Failed to load user records.',
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser: UserProfile) => {
    setActioningId(targetUser.id);
    setErrorMsg(null);

    const accessToken = localStorage.getItem('fluxguard_access_token');
    const newStatus = !targetUser.is_active;

    if (isDemoModeActive() || isDemoAccessToken(accessToken)) {
      window.setTimeout(() => {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === targetUser.id ? { ...item, is_active: newStatus } : item,
          ),
        );
        setActioningId(null);
      }, 250);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DIRECTORY_TIMEOUT_MS);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/auth/users/${targetUser.id}/status`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update operator authorization status.');
      }

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: newStatus } : u)),
      );
    } catch (err) {
      setErrorMsg(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Authorization update timed out. Retry when the backend is available.'
          : err instanceof Error
            ? err.message
            : 'Operation failed.',
      );
    } finally {
      window.clearTimeout(timeoutId);
      setActioningId(null);
    }
  };

  // Only SUPER_ADMIN can modify account status
  const canModifyStatus = user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="bg-surface-elevated border border-white/5 p-6 rounded-lg shadow-command relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

        <div className="border-b border-white/5 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-ink">
              Enterprise Identity Directory
            </h2>
            <p className="text-xs font-mono text-ink-subdued uppercase tracking-widest mt-1">
              Role-Based Access Control Audit
            </p>
          </div>
          <Button
            onClick={fetchUsers}
            variant="secondary"
            className="uppercase font-mono text-[10px] py-1.5 px-4 self-start sm:self-auto"
          >
            Refresh Directory
          </Button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3.5 text-xs text-red-400 font-mono flex items-start gap-2.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                Directory Alert
              </span>
              {errorMsg}
            </div>
          </div>
        )}

        {isLoadingUsers ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-center font-mono text-xs text-ink-subdued">
            No identity records are available. Enable demo mode or connect the backend directory
            service.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs font-mono">
              <thead>
                <tr className="text-ink-subdued uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Operator Name</th>
                  <th className="py-3.5 px-4 font-bold">Email Registry</th>
                  <th className="py-3.5 px-4 font-bold">Classification Role</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  {canModifyStatus && <th className="py-3.5 px-4 text-right font-bold">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150 text-ink"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ink-subdued">{item.name}</td>
                    <td className="py-3.5 px-4">{item.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 text-[9px] font-bold text-brand-primary uppercase">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full border ${
                          item.is_active
                            ? 'bg-emerald-500 border-emerald-400/35 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800 border-zinc-700/50'
                        }`}
                        title={item.is_active ? 'Active authorization session' : 'Disabled account'}
                      />
                    </td>
                    {canModifyStatus && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={actioningId === item.id || item.id === user?.id}
                          className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded transition-all duration-150 ${
                            item.is_active
                              ? 'text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15'
                              : 'text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {actioningId === item.id ? (
                            <Spinner size="sm" />
                          ) : item.is_active ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
