import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [lang, setLang] = useState(user?.preferred_language || 'en');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMsg('Name and email are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        name,
        email,
        preferred_language: lang,
      });
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface-elevated border border-white/5 p-6 rounded-lg shadow-command relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

        <div className="border-b border-white/5 pb-4 mb-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-ink">
            Operator Profile Settings
          </h2>
          <p className="text-xs font-mono text-ink-subdued uppercase tracking-widest mt-1">
            System Identity Registry
          </p>
        </div>

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3.5 text-xs text-green-400 font-mono flex items-start gap-2.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">Success</span>
              {successMsg}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3.5 text-xs text-red-400 font-mono flex items-start gap-2.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">Error</span>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Operator Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Operator Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              />
            </div>

            <div>
              <label
                htmlFor="profile-role"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Role Classification
              </label>
              <input
                id="profile-role"
                type="text"
                disabled
                value={user?.role || ''}
                className="block w-full rounded-md border border-white/5 bg-surface/50 text-ink-subdued text-sm px-3.5 py-2 font-mono cursor-not-allowed uppercase"
              />
            </div>

            <div>
              <label
                htmlFor="profile-lang"
                className="block text-[10px] font-bold font-mono uppercase tracking-widest text-ink-subdued mb-1.5"
              >
                Preferred Language
              </label>
              <select
                id="profile-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="block w-full rounded-md border border-white/5 bg-surface text-ink text-sm px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-mono transition-all duration-150"
              >
                <option value="en">English (EN)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 uppercase font-mono tracking-wider text-xs px-6 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
