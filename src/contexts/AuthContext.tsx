import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export type UserRole = "admin" | "owner" | "worker" | "demo";

interface User {
  id: string;
  username: string;
  role: UserRole;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permissions mapping
const rolePermissions: Record<UserRole, UserRole[]> = {
  admin: ["admin", "owner", "worker", "demo"],
  owner: ["owner", "worker", "demo"],
  worker: ["worker", "demo"],
  demo: ["demo"],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("callmemobiles_token");
      const savedUser = localStorage.getItem("callmemobiles_user");
      
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          // Set token first, then user to ensure proper order
          setToken(savedToken);
          
          // Small delay to ensure token is set before making API calls
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Verify with backend
          try {
            const currentUser = await apiClient.getCurrentUser() as User;
            setUser(currentUser);
          } catch (error) {
            console.log('Backend verification failed, using saved user:', error);
            // Fallback to saved user if backend is not available
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem("callmemobiles_token");
          localStorage.removeItem("callmemobiles_user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🔐 AuthContext: Starting login process for:', username);
      
      // Try backend authentication first
      const response = await apiClient.login(username, password) as any;
      
      console.log('📥 AuthContext: Received response:', response);
      console.log('📥 AuthContext: Response type:', typeof response);
      console.log('📥 AuthContext: Response keys:', response ? Object.keys(response) : 'null');
      
      if (response && response.token && response.user) {
        console.log('✅ AuthContext: Valid response structure detected');
        console.log('🎫 AuthContext: Token present:', !!response.token);
        console.log('👤 AuthContext: User data:', response.user);
        
        // Set token first
        setToken(response.token);
        localStorage.setItem("callmemobiles_token", response.token);
        console.log('💾 AuthContext: Token saved to localStorage');
        
        // Use user data from login response directly
        const userData: User = {
          id: response.user.id?.toString() || "1",
          username: response.user.username || username,
          role: response.user.role || "admin",
          name: response.user.name || response.user.username || username,
          email: response.user.email,
        };
        
        console.log('👤 AuthContext: Processed user data:', userData);
        
        localStorage.setItem("callmemobiles_user", JSON.stringify(userData));
        setUser(userData);
        console.log('💾 AuthContext: User data saved to localStorage');
        
        setLoading(false);
        console.log('✅ AuthContext: Login successful!');
        return true;
      }
      
      console.error('❌ AuthContext: Invalid response structure:', {
        hasResponse: !!response,
        hasToken: response?.token,
        hasUser: response?.user,
        responseKeys: response ? Object.keys(response) : 'null'
      });
      
      throw new Error("Invalid response from backend");
    } catch (error) {
      console.error("❌ AuthContext: Backend login failed:", error);
      console.error("❌ AuthContext: Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("callmemobiles_token");
    localStorage.removeItem("callmemobiles_user");
    navigate("/login", { replace: true });
  };

  const hasAccess = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    // Admin and owner always have full access
    if (user.role === "admin" || user.role === "owner") return true;
    const userPermissions = rolePermissions[user.role];
    return requiredRoles.some((role) => userPermissions.includes(role));
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasAccess,
    loading,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
