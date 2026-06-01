import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * IdleWarning — shows a floating countdown ONLY for admin users when the
 * session is about to expire (< 2 minutes remaining).
 *
 * Reads `session_started_at` written by AuthContext on every login.
 * SESSION_DURATION_MS must match the value in AuthContext (15 min).
 */

const SESSION_MS    = 15 * 60 * 1000;  // must match AuthContext SESSION_DURATION_MS
const WARN_BEFORE_MS = 30 * 1000; // warn 30 seconds before expiry
const SESSION_KEY   = 'session_started_at'; // must match AuthContext SESSION_START_KEY

export function IdleWarning() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);

  // Only admins see this warning — all other roles return null immediately
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Non-admins: skip entirely — no timer needed
    if (!isAdmin) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) { setRemaining(null); return; }

      const loginAt = parseInt(raw, 10);
      if (isNaN(loginAt)) { setRemaining(null); return; }

      const elapsed = Date.now() - loginAt;
      const left    = SESSION_MS - elapsed;

      if (left > 0 && left <= WARN_BEFORE_MS) {
        setRemaining(Math.ceil(left / 1000));
      } else {
        setRemaining(null);
      }
    };

    tick(); // run immediately on mount / role change
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isAdmin]);

  // Not admin or not in warning window — render nothing
  if (!isAdmin || remaining === null) return null;

  const mins       = Math.floor(remaining / 60);
  const secs       = remaining % 60;
  const paddedSecs = String(secs).padStart(2, '0');
  const isUrgent   = remaining <= 30; // always urgent since it's <= 30s

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2 rounded-full shadow-xl
        text-sm font-semibold select-none pointer-events-none
        transition-colors duration-300 whitespace-nowrap
        ${isUrgent
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-amber-400 text-amber-900'}
      `}
      role="alert"
      aria-live="polite"
    >
      <span>⏰</span>
      <span>Admin session expires in {mins}:{paddedSecs}</span>
    </div>
  );
}
