
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/api';

export type UserRole = 'admin' | 'owner' | 'worker';

interface User {
  id: string;
  name: string;
  username?: string;
  role: 'admin' | 'owner' | 'worker';
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Absolute session duration: 15 minutes from login, regardless of activity */
const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_START_KEY   = 'session_started_at';
const LOGOUT_CHANNEL      = 'callmemobiles_logout';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  // BroadcastChannel lets other open tabs receive the logout signal
  const channelRef            = useRef<BroadcastChannel | null>(null);

  /** Hard logout — clears everything and broadcasts to other tabs.
   *  @param reason 'session' = auto-expiry timer, 'user' = manual sign-out.
   *                Only 'session' logouts set the banner flag for Login page.
   */
  const logout = useCallback((reason: 'session' | 'user' = 'user', broadcast = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUser(null);
    localStorage.removeItem(SESSION_START_KEY);
    // Set flag BEFORE apiClient.logout() so it isn't wiped by any cleanup there
    if (reason === 'session' && broadcast) {
      localStorage.setItem('session_expired_flag', 'true');
    }
    apiClient.logout();
    if (broadcast && channelRef.current) {
      channelRef.current.postMessage({ type: LOGOUT_CHANNEL });
    }
  }, []);

  /** Schedule the hard logout timer from the original login timestamp */
  const scheduleSessionExpiry = useCallback((loginTimestamp: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const elapsed   = Date.now() - loginTimestamp;
    const remaining = SESSION_DURATION_MS - elapsed;

    if (remaining <= 0) {
      // Session already expired — logout immediately
      logout();
      return;
    }

    timerRef.current = setTimeout(() => {
      logout('session', true);
    }, remaining);
  }, [logout]);

  // ── Init: restore session & set expiry timer ──────────────────────────────
  useEffect(() => {
    // BroadcastChannel for cross-tab logout
    try {
      channelRef.current = new BroadcastChannel(LOGOUT_CHANNEL);
      channelRef.current.onmessage = (e) => {
        // Cross-tab logout signal received — logout without re-broadcasting
        if (e.data?.type === LOGOUT_CHANNEL) logout('user', false);
      };
    } catch {
      // BroadcastChannel not supported in some environments — silent fallback
    }

    const initializeAuth = async () => {
      const savedUser  = localStorage.getItem('auth_user');
      const token      = localStorage.getItem('auth_token');
      const sessionAt  = localStorage.getItem(SESSION_START_KEY);

      if (savedUser && token && sessionAt) {
        const loginTimestamp = parseInt(sessionAt, 10);
        const elapsed        = Date.now() - loginTimestamp;

        // If session is already older than 15 min — wipe it immediately
        if (elapsed >= SESSION_DURATION_MS) {
          logout('user', false);
          setLoading(false);
          return;
        }

        let parsedUser: User | null = null;
        try {
          parsedUser = JSON.parse(savedUser);
        } catch {
          // Corrupted auth_user in localStorage — clear and restart
          logout('user', false);
          setLoading(false);
          return;
        }

        try {
          const verifyResponse = await apiClient.verifyToken();
          if (verifyResponse.status === 401 || !verifyResponse.success) {
            // Token rejected by server — force clean logout
            logout('user', false);
          } else {
            setUser(parsedUser);
            scheduleSessionExpiry(loginTimestamp);
          }
        } catch {
          // Network failure — trust saved session (offline support)
          setUser(parsedUser);
          scheduleSessionExpiry(loginTimestamp);
        }
      }

      setLoading(false);
    };

    initializeAuth();

    return () => {
      if (timerRef.current)  clearTimeout(timerRef.current);
      if (channelRef.current) channelRef.current.close();
    };
  }, [logout, scheduleSessionExpiry]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await apiClient.login(username, password);

      if (response.success && response.data) {
        const raw           = response.data.user ?? response.data;
        const loginUsername = (raw.username || username) as string;

        const normalised: User = {
          id:       String(raw.id ?? '1'),
          name:     loginUsername,
          username: loginUsername,
          role:     ((raw.role || 'worker') as 'admin' | 'owner' | 'worker'),
          email:    raw.email || '',
        };

        const now = Date.now();
        localStorage.setItem(SESSION_START_KEY, String(now));
        localStorage.setItem('auth_user', JSON.stringify(normalised));
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }

        setUser(normalised);
        scheduleSessionExpiry(now);
        return true;
      } else {
        throw new Error(response.error || response.message || 'Invalid username or password');
      }
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Memoize the context value so consumers only re-render when the shape
  // actually changes — not on every unrelated AuthProvider render.
  const value = useMemo(
    () => ({ user, loading, login, logout: () => logout('user', true), hasAccess }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
