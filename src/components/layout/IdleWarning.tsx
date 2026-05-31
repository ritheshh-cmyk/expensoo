import { useEffect, useState } from 'react';

/**
 * IdleWarning — shows a floating countdown when the session is about to expire.
 * 
 * The session lifetime is set in AuthContext (SESSION_DURATION_MS = 15 min).
 * We warn the user 2 minutes before expiry.
 * 
 * AuthContext stores `loginTime` in localStorage when the user signs in.
 * We read that value to calculate how much time is left.
 */

const SESSION_MS = 15 * 60 * 1000;   // 15 minutes — must match AuthContext
const WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before expiry

export function IdleWarning() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      // AuthContext may use 'loginTime', 'session_started_at', or similar key.
      // Try both so we don't need to edit AuthContext.
      const raw =
        localStorage.getItem('loginTime') ??
        localStorage.getItem('session_started_at') ??
        sessionStorage.getItem('loginTime');

      if (!raw) {
        setRemaining(null);
        return;
      }

      const loginAt = parseInt(raw, 10);
      if (isNaN(loginAt)) { setRemaining(null); return; }

      const elapsed = Date.now() - loginAt;
      const left = SESSION_MS - elapsed;

      if (left > 0 && left <= WARN_BEFORE_MS) {
        setRemaining(Math.ceil(left / 1000));
      } else {
        setRemaining(null);
      }
    };

    tick(); // run immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const paddedSecs = String(secs).padStart(2, '0');
  const isUrgent = remaining <= 60; // turn red in the last minute

  return (
    <div
      className={`
        fixed bottom-[72px] sm:bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
        text-sm font-semibold select-none pointer-events-none
        transition-colors duration-300
        ${isUrgent
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-amber-400 text-amber-900'}
      `}
      role="alert"
      aria-live="polite"
    >
      <span>⏰</span>
      <span>
        Session expires in {mins}:{paddedSecs}
      </span>
    </div>
  );
}
