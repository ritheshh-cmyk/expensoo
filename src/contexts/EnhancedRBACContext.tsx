import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  ownerAccess: boolean;
  workerAccess: boolean;
}

interface EnhancedRBACContextType {
  permissions: Permission[];
  hasPageAccess: (pageId: string) => boolean;
  hasFeatureAccess: (featureId: string) => boolean;
  userRole: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  isWorker: boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  updatePermissions: (newPermissions: Permission[]) => void;
}

const EnhancedRBACContext = createContext<EnhancedRBACContextType>({
  permissions: [],
  hasPageAccess: () => false,
  hasFeatureAccess: () => false,
  userRole: null,
  isAdmin: false,
  isOwner: false,
  isWorker: false,
  loading: true,
  refreshPermissions: async () => {},
  updatePermissions: () => {},
});

const defaultPermissions: Permission[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main business overview',
    category: 'Core',
    ownerAccess: true,
    workerAccess: true
  },
  {
    id: 'repairs',
    name: 'Repairs',
    description: 'Device repair management',
    category: 'Core',
    ownerAccess: true,
    workerAccess: true
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer management',
    category: 'Core',
    ownerAccess: true,
    workerAccess: true
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Supplier management',
    category: 'Operations',
    ownerAccess: true,
    workerAccess: false
  },
  {
    id: 'transactions',
    name: 'Transactions',
    description: 'Transaction history',
    category: 'Finance',
    ownerAccess: true,
    workerAccess: true
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Business reports',
    category: 'Analytics',
    ownerAccess: true,
    workerAccess: false
  }
];

export function EnhancedRBACProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role?.toLowerCase() || null;
  const isAdmin = userRole === 'admin';
  const isOwner = userRole === 'owner';
  const isWorker = userRole === 'worker';

  const loadPermissions = async () => {
    if (authLoading || !user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.makeRequest('/api/admin/permissions');
      
      if (response.success && response.data) {
        setPermissions(response.data);
      } else {
        // Use default permissions if none exist in database
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.warn('Failed to load permissions, using defaults:', error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [authLoading, user]);

  const hasPageAccess = (pageId: string): boolean => {
    // Admin always has full access
    if (isAdmin) return true;
    
    // If user is not authenticated, no access
    if (!user || !userRole) return false;

    // Find the permission for this page
    const permission = permissions.find(p => p.id === pageId);
    if (!permission) {
      // If no permission defined, default to restricted access
      return false;
    }

    // Check role-specific access
    if (isOwner) return permission.ownerAccess;
    if (isWorker) return permission.workerAccess;
    
    return false;
  };

  const hasFeatureAccess = (featureId: string): boolean => {
    return hasPageAccess(featureId);
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  const updatePermissions = (newPermissions: Permission[]) => {
    setPermissions(newPermissions);
  };

  const value: EnhancedRBACContextType = {
    permissions,
    hasPageAccess,
    hasFeatureAccess,
    userRole,
    isAdmin,
    isOwner,
    isWorker,
    loading: loading || authLoading,
    refreshPermissions,
    updatePermissions,
  };

  return (
    <EnhancedRBACContext.Provider value={value}>
      {children}
    </EnhancedRBACContext.Provider>
  );
}

export function useEnhancedRBAC() {
  const context = useContext(EnhancedRBACContext);
  if (context === undefined) {
    throw new Error('useEnhancedRBAC must be used within an EnhancedRBACProvider');
  }
  return context;
}

// HOC for protecting components based on permissions
export function withPageAccess<T extends {}>(
  Component: React.ComponentType<T>,
  requiredPageId: string
) {
  return function ProtectedComponent(props: T) {
    const { hasPageAccess, loading } = useEnhancedRBAC();

    if (loading) {
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!hasPageAccess(requiredPageId)) {
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl">🔒</div>
            <div>
              <h3 className="text-lg font-semibold">Access Restricted</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Component for conditionally rendering based on feature access
interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ featureId, children, fallback = null }: FeatureGateProps) {
  const { hasFeatureAccess, loading } = useEnhancedRBAC();

  if (loading) {
    return <div className="animate-pulse bg-muted/50 h-8 w-full rounded" />;
  }

  if (!hasFeatureAccess(featureId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook for checking multiple permissions at once
export function useMultiplePermissions(pageIds: string[]) {
  const { hasPageAccess } = useEnhancedRBAC();
  
  return {
    hasAnyAccess: pageIds.some(id => hasPageAccess(id)),
    hasAllAccess: pageIds.every(id => hasPageAccess(id)),
    permissions: pageIds.reduce((acc, id) => {
      acc[id] = hasPageAccess(id);
      return acc;
    }, {} as Record<string, boolean>)
  };
}
