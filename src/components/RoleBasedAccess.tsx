
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedAccessContextType {
  hasAccess: (requiredRoles: string[]) => boolean;
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
}

const RoleBasedAccessContext = createContext<RoleBasedAccessContextType>({
  hasAccess: () => false,
  userRole: null,
  isLoading: true,
  error: null,
});

export function RoleBasedAccessProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  const hasAccess = (requiredRoles: string[]): boolean => {
    if (!user || !user.role) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role.toLowerCase());
  };

  const value: RoleBasedAccessContextType = {
    hasAccess,
    userRole: user?.role || null,
    isLoading: loading,
    error: null,
  };

  return (
    <RoleBasedAccessContext.Provider value={value}>
      {children}
    </RoleBasedAccessContext.Provider>
  );
}

export function useRoleAccess() {
  const context = useContext(RoleBasedAccessContext);
  if (context === undefined) {
    throw new Error('useRoleAccess must be used within a RoleBasedAccessProvider');
  }
  return context;
}
