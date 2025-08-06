import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Define permission types for real-time features
export type Permission = 
  | 'view_dashboard'
  | 'view_analytics'
  | 'view_transactions'
  | 'view_inventory'
  | 'view_users'
  | 'view_reports'
  | 'manage_inventory'
  | 'manage_users'
  | 'manage_settings'
  | 'create_transactions'
  | 'edit_transactions'
  | 'delete_transactions'
  | 'view_notifications'
  | 'manage_notifications'
  | 'view_activity_feed'
  | 'export_data'
  | 'system_admin'
  | 'realtime_dashboard'
  | 'realtime_notifications'
  | 'realtime_activity_feed'
  | 'realtime_inventory_alerts'
  | 'realtime_transaction_updates'

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_analytics',
    'view_transactions',
    'view_inventory',
    'view_users',
    'view_reports',
    'manage_inventory',
    'manage_users',
    'manage_settings',
    'create_transactions',
    'edit_transactions',
    'delete_transactions',
    'view_notifications',
    'manage_notifications',
    'view_activity_feed',
    'export_data',
    'system_admin',
    'realtime_dashboard',
    'realtime_notifications',
    'realtime_activity_feed',
    'realtime_inventory_alerts',
    'realtime_transaction_updates',
  ],
  owner: [
    'view_dashboard',
    'view_analytics',
    'view_transactions',
    'view_inventory',
    'view_reports',
    'manage_inventory',
    'create_transactions',
    'edit_transactions',
    'view_notifications',
    'view_activity_feed',
    'export_data',
    'realtime_dashboard',
    'realtime_notifications',
    'realtime_activity_feed',
    'realtime_inventory_alerts',
    'realtime_transaction_updates',
  ],
  worker: [
    'view_dashboard',
    'view_transactions',
    'view_inventory',
    'create_transactions',
    'view_notifications',
    'view_activity_feed',
    'realtime_dashboard',
    'realtime_notifications',
    'realtime_activity_feed',
    'realtime_transaction_updates',
  ],
  demo: [
    'view_dashboard',
    'view_transactions',
    'view_notifications',
    'realtime_dashboard',
    'realtime_notifications',
  ],
}

// Feature access levels for real-time components
export interface FeatureAccess {
  dashboard: {
    canView: boolean
    canViewRevenue: boolean
    canViewAnalytics: boolean
    canViewUsers: boolean
    canExport: boolean
  }
  notifications: {
    canView: boolean
    canManage: boolean
    canReceiveRealtime: boolean
    canReceiveUrgent: boolean
  }
  activityFeed: {
    canView: boolean
    canViewAll: boolean
    canViewSystemLogs: boolean
    canFilter: boolean
  }
  inventory: {
    canView: boolean
    canManage: boolean
    canReceiveAlerts: boolean
    canViewLowStock: boolean
  }
  transactions: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canViewAll: boolean
  }
  realtime: {
    canConnect: boolean
    canReceiveUpdates: boolean
    canSendMessages: boolean
    maxConnections: number
  }
}

interface RoleBasedAccessContextType {
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  featureAccess: FeatureAccess
  canAccessFeature: (feature: keyof FeatureAccess, action?: string) => boolean
  getUserRole: () => string
  isAdmin: boolean
  isOwner: boolean
  isWorker: boolean
  isDemo: boolean
}

const RoleBasedAccessContext = createContext<RoleBasedAccessContextType | undefined>(undefined)

export const useRoleBasedAccess = () => {
  const context = useContext(RoleBasedAccessContext)
  if (!context) {
    throw new Error('useRoleBasedAccess must be used within a RoleBasedAccessProvider')
  }
  return context
}

interface RoleBasedAccessProviderProps {
  children: React.ReactNode
}

export const RoleBasedAccessProvider: React.FC<RoleBasedAccessProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({} as FeatureAccess)

  useEffect(() => {
    if (user?.role) {
      const userPermissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.demo
      setPermissions(userPermissions)
      setFeatureAccess(generateFeatureAccess(user.role, userPermissions))
    } else {
      setPermissions(ROLE_PERMISSIONS.demo)
      setFeatureAccess(generateFeatureAccess('demo', ROLE_PERMISSIONS.demo))
    }
  }, [user?.role])

  const generateFeatureAccess = (role: string, userPermissions: Permission[]): FeatureAccess => {
    const hasPermission = (permission: Permission) => userPermissions.includes(permission)

    return {
      dashboard: {
        canView: hasPermission('view_dashboard'),
        canViewRevenue: hasPermission('view_analytics') || role === 'admin' || role === 'owner',
        canViewAnalytics: hasPermission('view_analytics'),
        canViewUsers: hasPermission('view_users'),
        canExport: hasPermission('export_data'),
      },
      notifications: {
        canView: hasPermission('view_notifications'),
        canManage: hasPermission('manage_notifications'),
        canReceiveRealtime: hasPermission('realtime_notifications'),
        canReceiveUrgent: role === 'admin' || role === 'owner',
      },
      activityFeed: {
        canView: hasPermission('view_activity_feed'),
        canViewAll: role === 'admin',
        canViewSystemLogs: role === 'admin',
        canFilter: role !== 'demo',
      },
      inventory: {
        canView: hasPermission('view_inventory'),
        canManage: hasPermission('manage_inventory'),
        canReceiveAlerts: hasPermission('realtime_inventory_alerts'),
        canViewLowStock: role !== 'demo',
      },
      transactions: {
        canView: hasPermission('view_transactions'),
        canCreate: hasPermission('create_transactions'),
        canEdit: hasPermission('edit_transactions'),
        canDelete: hasPermission('delete_transactions'),
        canViewAll: role === 'admin' || role === 'owner',
      },
      realtime: {
        canConnect: hasPermission('realtime_dashboard'),
        canReceiveUpdates: hasPermission('realtime_transaction_updates'),
        canSendMessages: role === 'admin' || role === 'owner',
        maxConnections: role === 'admin' ? 10 : role === 'owner' ? 5 : role === 'worker' ? 2 : 1,
      },
    }
  }

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission))
  }

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission))
  }

  const canAccessFeature = (feature: keyof FeatureAccess, action?: string): boolean => {
    const access = featureAccess[feature]
    if (!access) return false

    if (action) {
      const actionKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof typeof access
      return Boolean(access[actionKey])
    }

    // Default to checking 'canView' if no specific action is provided
    return Boolean(access.canView)
  }

  const getUserRole = (): string => {
    return user?.role || 'demo'
  }

  const value: RoleBasedAccessContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    featureAccess,
    canAccessFeature,
    getUserRole,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isWorker: user?.role === 'worker',
    isDemo: user?.role === 'demo',
  }

  return (
    <RoleBasedAccessContext.Provider value={value}>
      {children}
    </RoleBasedAccessContext.Provider>
  )
}

// Higher-order component for protecting routes/components
interface ProtectedComponentProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requiredRole?: string
  fallback?: React.ReactNode
  requireAll?: boolean // If true, user must have ALL permissions; if false, user needs ANY permission
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback = null,
  requireAll = false,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, getUserRole } = useRoleBasedAccess()

  // Check role requirement
  if (requiredRole && getUserRole() !== requiredRole) {
    return <>{fallback}</>
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)

    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessFeature } = useRoleBasedAccess()

  const canRender = (permission: Permission | Permission[], requireAll = false): boolean => {
    if (Array.isArray(permission)) {
      return requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission)
    }
    return hasPermission(permission)
  }

  return {
    canRender,
    canAccessFeature,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}

// Component for displaying role-based content
interface RoleBasedContentProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { getUserRole } = useRoleBasedAccess()
  const currentRole = getUserRole()

  if (roles.includes(currentRole)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// Component for feature-based access control
interface FeatureGateProps {
  feature: keyof FeatureAccess
  action?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  action,
  children,
  fallback = null,
}) => {
  const { canAccessFeature } = useRoleBasedAccess()

  if (canAccessFeature(feature, action)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// Utility function to get role hierarchy level (for comparison)
export const getRoleLevel = (role: string): number => {
  const levels: Record<string, number> = {
    demo: 0,
    worker: 1,
    owner: 2,
    admin: 3,
  }
  return levels[role] || 0
}

// Utility function to check if user has higher or equal role
export const hasMinimumRole = (userRole: string, minimumRole: string): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole)
}

export default RoleBasedAccessProvider