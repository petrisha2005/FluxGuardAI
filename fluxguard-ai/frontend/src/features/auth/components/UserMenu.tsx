import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const UserMenu: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={() => navigate('/login')}
        className="uppercase font-mono tracking-wider text-[11px] py-1.5 px-4 h-auto"
      >
        Sign In
      </Button>
    );
  }

  // Get initials for profile avatar
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-150 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-[10px] font-black font-mono text-brand-primary shadow-[0_0_10px_rgba(56,189,248,0.1)]">
          {initials}
        </div>
        {/* Name and dropdown arrow */}
        <div className="hidden sm:block text-left">
          <div className="text-[10px] font-black uppercase text-ink tracking-wide leading-none">
            {user.name}
          </div>
          <div className="text-[8px] font-mono uppercase text-ink-subdued tracking-widest mt-0.5">
            {user.role}
          </div>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-ink-subdued transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-surface-elevated border border-white/5 shadow-command py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-[10px] text-ink-subdued uppercase tracking-widest font-mono font-bold">
              Signed in as
            </p>
            <p className="text-xs text-ink truncate font-mono mt-0.5">{user.email}</p>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-xs font-mono text-ink-subdued hover:text-ink hover:bg-white/5 transition-all duration-150 uppercase tracking-wider"
          >
            My Profile
          </Link>

          <Link
            to="/change-password"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-xs font-mono text-ink-subdued hover:text-ink hover:bg-white/5 transition-all duration-150 uppercase tracking-wider"
          >
            Update Password
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left block px-4 py-2 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-all duration-150 border-t border-white/5 uppercase tracking-wider"
          >
            Terminate Session
          </button>
        </div>
      )}
    </div>
  );
};
