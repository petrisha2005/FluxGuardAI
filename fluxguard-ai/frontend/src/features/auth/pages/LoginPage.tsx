import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { config } from '@/services/config';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  interface LocationState {
    from?: {
      pathname?: string;
    };
  }
  const fromPath = (location.state as LocationState)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password || (isRegister && !name)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        // 1. Create account
        await authApi.register({ name, email, password, role });
        setSuccessMsg('Account registered successfully! Initializing session...');
        // 2. Auto login
        await login(email, password);
      } else {
        // Login
        await login(email, password);
      }
      navigate(fromPath, { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg('Opening local demo operations session...');
    setIsSubmitting(true);

    try {
      loginDemo();
      navigate(fromPath, { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Demo authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-surface-elevated border border-white/5 p-8 rounded-lg shadow-command relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-brand-secondary/5 blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <span className="inline-block w-3 h-3 rounded-full bg-brand-primary animate-pulse mb-3" />
          <h2 className="text-2xl font-black uppercase tracking-wider text-ink">
            System Authentication
          </h2>
          <p className="mt-2 text-xs font-mono text-ink-subdued uppercase tracking-widest">
            FluxGuard AI Operations Center
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 font-mono text-xs uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 pb-2.5 font-bold transition-colors ${
              !isRegister
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-ink-subdued hover:text-ink'
            }`}
          >
            Session Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 pb-2.5 font-bold transition-colors ${
              isRegister
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-ink-subdued hover:text-ink'
            }`}
          >
            Create Operator
          </button>
        </div>

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3.5 text-xs text-green-400 font-mono flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <div>{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3.5 text-xs text-red-400 font-mono flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                Authorization Alert
              </span>
              {errorMsg}
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label
                htmlFor="reg-name"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Operator Full Name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
                placeholder="E.g. Patricia"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email-address"
              className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
            >
              Operator Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150 placeholder-white/20"
              placeholder="email@stadiumops.org"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
            >
              Clearance Key
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150 placeholder-••••••••••••"
              placeholder="••••••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="reg-role"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Clearance Designation
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              >
                <option value="SUPER_ADMIN">SUPER ADMIN (Global Controls)</option>
                <option value="GLOBAL_OPERATIONS_DIRECTOR">GLOBAL OPERATIONS DIRECTOR</option>
                <option value="STADIUM_MANAGER">STADIUM MANAGER</option>
                <option value="SECURITY_SUPERVISOR">SECURITY SUPERVISOR</option>
                <option value="MEDICAL_COORDINATOR">MEDICAL COORDINATOR</option>
                <option value="VOLUNTEER_COORDINATOR">VOLUNTEER COORDINATOR</option>
                <option value="DATA_ANALYST">DATA ANALYST</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 uppercase font-mono tracking-wider text-xs py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Requesting Registry...</span>
                </>
              ) : (
                <span>
                  {isRegister ? 'Register Authorization' : 'Request Session Authorization'}
                </span>
              )}
            </Button>
          </div>
        </form>

        {config.enableDemoAuth ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-ink-subdued">
              <span className="h-px flex-1 bg-white/10" />
              <span>Local preview</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={handleDemoLogin}
              className="w-full font-mono text-xs uppercase tracking-wider"
            >
              Enter Demo Command Center
            </Button>
          </div>
        ) : null}

        <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-ink-subdued uppercase text-center space-y-1">
          <div>Clearance Level Required: SECURE ACCESS</div>
          <div>All sessions are actively logged and audited.</div>
        </div>
      </div>
    </div>
  );
};
