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
          setToken(savedToken);
          
          // Verify with backend
          try {
            const currentUser = await apiClient.getCurrentUser() as User;
            setUser(currentUser);
          } catch (error) {
            // Fallback to saved user if backend is not available
            setUser(parsedUser);
          }
        } catch (error) {
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
      // Try backend authentication first
      const response = await apiClient.login(username, password) as any;
      
      if (response.token && response.user) {
        const userData: User = {
          id: response.user.id?.toString() || "1",
          username: response.user.username,
          role: response.user.role || "worker",
          name: response.user.name || response.user.username,
          email: response.user.email,
        };

        setUser(userData);
        setToken(response.token);
        localStorage.setItem("callmemobiles_token", response.token);
        localStorage.setItem("callmemobiles_user", JSON.stringify(userData));
        setLoading(false);
        return true;
      } else {
        throw new Error("Invalid response from backend");
      }
    } catch (error) {
      // Fallback to local authentication with fixed usernames
      console.warn("Backend login failed, using local auth:", error);

      // Fixed usernames and credentials matching backend
      const fixedUsers = {
        rithesh: {
          id: "1",
          username: "rithesh",
          password: "7989002273",
          role: "admin" as UserRole,
          name: "Rithesh",
          email: "rithesh@callmemobiles.com",
        },
        rajashekar: {
          id: "2",
          username: "rajashekar",
          password: "raj99481",
          role: "owner" as UserRole,
          name: "Rajashekar",
          email: "rajashekar@callmemobiles.com",
        },
        sravan: {
          id: "3",
          username: "sravan",
          password: "sravan6565",
          role: "worker" as UserRole,
          name: "Sravan",
          email: "sravan@callmemobiles.com",
        },
        demo: {
          id: "4",
          username: "demo",
          password: "demo123",
          role: "demo" as UserRole,
          name: "Demo User",
          email: "demo@callmemobiles.com",
        },
      };

      // Check if username and password match any fixed user
      const userEntry = Object.entries(fixedUsers).find(
        ([key, user]) =>
          user.username === username.toLowerCase() &&
          user.password === password,
      );

      if (userEntry) {
        const [key, userInfo] = userEntry;
        const mockUser: User = {
          id: userInfo.id,
          username: userInfo.username,
          role: userInfo.role,
          name: userInfo.name,
          email: userInfo.email,
        };

        // Create a mock token for local auth
        const mockToken = `mock_token_${userInfo.id}_${Date.now()}`;
        
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem("callmemobiles_token", mockToken);
        localStorage.setItem("callmemobiles_user", JSON.stringify(mockUser));
        setLoading(false);
        return true;
      }

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
