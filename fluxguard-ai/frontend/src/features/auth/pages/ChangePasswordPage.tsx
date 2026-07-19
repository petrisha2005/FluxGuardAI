import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const ChangePasswordPage: React.FC = () => {
  const { changePassword } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 12) return 'Password must be at least 12 characters long.';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one digit.';
    if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (newPw !== confirmPw) {
      setErrorMsg('New password and password confirmation do not match.');
      return;
    }

    const policyError = validatePassword(newPw);
    if (policyError) {
      setErrorMsg(policyError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      setSuccessMsg('Password changed successfully. Your credentials are now updated.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to update credentials. Please check your current password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-surface-elevated border border-white/5 p-6 rounded-lg shadow-command relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

        <div className="border-b border-white/5 pb-4 mb-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-ink">
            Update Clearance Key
          </h2>
          <p className="text-xs font-mono text-ink-subdued uppercase tracking-widest mt-1">
            System Password Administration
          </p>
        </div>

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3.5 text-xs text-green-400 font-mono flex items-start gap-2.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                Clearance Confirmed
              </span>
              {successMsg}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3.5 text-xs text-red-400 font-mono flex items-start gap-2.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                Authorization Error
              </span>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="current-pw"
              className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
            >
              Current Key
            </label>
            <input
              id="current-pw"
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="new-pw"
              className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
            >
              New Key
            </label>
            <input
              id="new-pw"
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-pw"
              className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
            >
              Confirm New Key
            </label>
            <input
              id="confirm-pw"
              type="password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              placeholder="••••••••••••"
            />
          </div>

          <div className="bg-white/5 border border-white/5 rounded-md p-3 text-[10px] font-mono text-ink-subdued space-y-1.5">
            <span className="font-bold uppercase tracking-wider block text-ink">
              Key Guidelines:
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-1 h-1 rounded-full ${newPw.length >= 12 ? 'bg-brand-primary' : 'bg-white/20'}`}
              />
              <span>Minimum length of 12 characters</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1 h-1 rounded-full ${/[A-Z]/.test(newPw) && /[a-z]/.test(newPw) ? 'bg-brand-primary' : 'bg-white/20'}`}
              />
              <span>Mixed case alpha characters (A-Z, a-z)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1 h-1 rounded-full ${/[0-9]/.test(newPw) ? 'bg-brand-primary' : 'bg-white/20'}`}
              />
              <span>Numerical values (0-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1 h-1 rounded-full ${/[^a-zA-Z0-9]/.test(newPw) ? 'bg-brand-primary' : 'bg-white/20'}`}
              />
              <span>Special symbols (!, @, #, etc.)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 uppercase font-mono tracking-wider text-xs py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Authorizing Key Registry...</span>
                </>
              ) : (
                <span>Update Clearance Key</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
