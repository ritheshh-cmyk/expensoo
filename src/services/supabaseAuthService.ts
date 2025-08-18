import { supabase } from '../../supabase/config';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'owner' | 'worker';
  name: string;
  shop_id?: number;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  user: AuthUser;
}

export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
  token: string;
}

class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting initial session:', error);
        return;
      }

      if (session) {
        await this.setSession(session);
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              await this.setSession(session);
            }
            break;
          case 'SIGNED_OUT':
            this.clearSession();
            break;
          case 'TOKEN_REFRESHED':
            if (session) {
              await this.setSession(session);
            }
            break;
        }
      });

    } catch (error) {
      console.error('❌ Error initializing auth:', error);
    }
  }

  private async setSession(session: Session) {
    this.currentSession = session;
    
    try {
      // Get user profile from backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
        
        // Store token in localStorage for API calls
        localStorage.setItem('callmemobiles_token', session.access_token);
        localStorage.setItem('callmemobiles_user', JSON.stringify(this.currentUser));
        
      } else {
        console.warn('⚠️ Failed to get user profile from backend');
        this.currentUser = {
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'worker',
          name: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
          shop_id: session.user.user_metadata?.shop_id
        };
      }
    } catch (error) {
      console.error('❌ Error setting session:', error);
    }
  }

  private clearSession() {
    this.currentUser = null;
    this.currentSession = null;
    localStorage.removeItem('callmemobiles_token');
    localStorage.removeItem('callmemobiles_user');
  }

  /**
   * Sign in with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login with Supabase Auth for:', username);

      // Try to sign in with username first (backend handles username to email conversion)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Set the session manually
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });

      if (setSessionError) {
        console.error('❌ Error setting session:', setSessionError);
        throw setSessionError;
      }

      console.log('✅ Login successful for:', data.user.username);

      return {
        user: data.user,
        session: data.session,
        token: data.session.access_token
      };

    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      console.log('🔐 Logging out user...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        // Don't throw error for logout - clear local session anyway
      }

      this.clearSession();
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear local session even if server logout fails
      this.clearSession();
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    // First try to get from memory
    if (this.currentUser) {
      return this.currentUser;
    }

    // Then try to get from localStorage
    try {
      const storedUser = localStorage.getItem('callmemobiles_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }
    } catch (error) {
      console.warn('⚠️ Error parsing stored user:', error);
    }

    return null;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (this.currentSession) {
      return this.currentSession.access_token;
    }

    // Fallback to localStorage
    return localStorage.getItem('callmemobiles_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getAccessToken();
    return !!(user && token);
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if current user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        throw error;
      }

      if (data.session) {
        await this.setSession(data.session);
        console.log('✅ Session refreshed successfully');
      }
      
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password change failed:', error);
        throw error;
      }

      console.log('✅ Password changed successfully');
      
    } catch (error) {
      console.error('❌ Password change error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await this.setSession(session);
          callback(this.currentUser);
        } else {
          this.clearSession();
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }
}

// Create singleton instance
export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;
