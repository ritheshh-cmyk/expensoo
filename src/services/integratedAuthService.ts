// Integrated Authentication Service for Frontend-Backend Connection
// Connects React frontend to Supabase Auth backend seamlessly

import { apiClient } from '../lib/api';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'owner' | 'worker';
  name: string;
  shop_id?: number;
}

export interface LoginResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
  };
}

class IntegratedAuthService {
  private currentUser: AuthUser | null = null;
  private currentToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  
  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const savedToken = localStorage.getItem('callmemobiles_token');
      const savedUser = localStorage.getItem('callmemobiles_user');
      
      if (savedToken && savedUser) {
        this.currentToken = savedToken;
        this.currentUser = JSON.parse(savedUser);
        
        // Verify token is still valid
        if (await this.verifyToken()) {
          console.log('✅ Session restored for user:', this.currentUser?.username);
        } else {
          console.log('⚠️ Saved session expired, clearing...');
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      this.clearSession();
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Integrated Auth: Starting login for', username);
      
      // Call backend authentication endpoint
      const response = await apiClient.login(username, password) as any;
      
      if (response && response.token && response.user) {
        // Store session data
        this.currentToken = response.token;
        this.currentUser = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          name: response.user.name || response.user.username,
          shop_id: response.user.shop_id
        };
        
        // Calculate expiry time
        if (response.session?.expires_in) {
          this.tokenExpiresAt = Date.now() + (response.session.expires_in * 1000);
        }
        
        // Save to localStorage
        localStorage.setItem('callmemobiles_token', this.currentToken);
        localStorage.setItem('callmemobiles_user', JSON.stringify(this.currentUser));
        
        console.log('✅ Login successful:', this.currentUser.username, 'Role:', this.currentUser.role);
        
        return {
          success: true,
          user: this.currentUser,
          token: this.currentToken,
          session: response.session || {
            access_token: this.currentToken,
            refresh_token: response.session?.refresh_token || '',
            expires_in: response.session?.expires_in || 3600
          }
        };
      } else {
        throw new Error('Invalid response format from backend');
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout if available
      if (this.currentToken) {
        try {
          await apiClient.logout();
        } catch (error) {
          console.log('⚠️ Backend logout failed, proceeding with local logout');
        }
      }
      
      this.clearSession();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear session anyway
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    this.currentToken = null;
    this.tokenExpiresAt = null;
    localStorage.removeItem('callmemobiles_token');
    localStorage.removeItem('callmemobiles_user');
  }

  async verifyToken(): Promise<boolean> {
    try {
      if (!this.currentToken) return false;
      
      // Check local expiry first
      if (this.tokenExpiresAt && Date.now() > this.tokenExpiresAt) {
        return false;
      }
      
      // Verify with backend
      const user = await apiClient.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.currentToken);
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  async refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing token...');
      
      if (!this.currentToken) {
        return false;
      }
      
      // Use API client's refresh method
      const newToken = await apiClient.refreshToken();
      
      if (newToken) {
        this.currentToken = newToken;
        localStorage.setItem('callmemobiles_token', newToken);
        
        // Reset expiry time
        this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 hour
        
        console.log('✅ Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Try to get from backend if token exists
    if (this.currentToken) {
      try {
        const user = await apiClient.getCurrentUser();
        if (user) {
          this.currentUser = user;
          localStorage.setItem('callmemobiles_user', JSON.stringify(this.currentUser));
        }
        return this.currentUser;
      } catch (error) {
        console.warn('⚠️ Failed to get current user from backend:', error);
      }
    }
    
    return null;
  }
  }

  // Get auth headers for API requests
  getAuthHeaders(): Record<string, string> {
    if (!this.currentToken) return {};
    
    return {
      'Authorization': `Bearer ${this.currentToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Auto-refresh token if needed
  async ensureValidToken(): Promise<string | null> {
    if (!this.currentToken) return null;
    
    // Check if token is about to expire (refresh 5 minutes before)
    if (this.tokenExpiresAt && (Date.now() + 300000) > this.tokenExpiresAt) {
      try {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) return this.currentToken;
        
        // If refresh fails, clear session
        this.clearSession();
        return null;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        this.clearSession();
        return null;
      }
    }
    
    return this.currentToken;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // Call backend refresh endpoint if available
      const response = await apiClient.refreshToken();
      
      if (response && response.token) {
        this.currentToken = response.token;
        localStorage.setItem('callmemobiles_token', this.currentToken);
        
        if (response.expires_in) {
          this.tokenExpiresAt = Date.now() + (response.expires_in * 1000);
        }
        
        console.log('✅ Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const integratedAuthService = new IntegratedAuthService();
export default integratedAuthService;
