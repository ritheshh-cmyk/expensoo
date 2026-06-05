import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionsData } from '@/constants/pages';

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsData[]>([]);
  const [loading, setLoading] = useState(true);
  // Track if we got any real response (success or failure) from backend
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setLoading(false);
      setPermissionsLoaded(true);
      return;
    }

    try {
      setLoading(true);
      // NOTE: apiClient.makeRequest does NOT exist — use apiClient.request
      const response = await (apiClient as any).request('/api/permissions/mine');
      if (response.success && response.data) {
        setPermissions(response.data);
      } else {
        // API responded but returned no data — use role-based fallback below
        setPermissions([]);
      }
    } catch (error) {
      console.warn('Permissions API unavailable, using role-based fallback:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
      setPermissionsLoaded(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (action: string) => {
      // Admin and owner always have full access
      const role = user?.role?.toLowerCase();
      if (role === 'admin' || role === 'owner') return true;

      // While permissions are still loading, optimistically allow to avoid
      // a flash-redirect to /unauthorized on first render
      if (loading || !permissionsLoaded) return true;

      // We have real permissions from the API — use them
      if (permissions && permissions.length > 0) {
        const [feature, permissionType] = action.split('.');
        const featurePerms = permissions.find((p) => p.featureId === feature);
        if (!featurePerms) return false;

        switch (permissionType) {
          case 'view':   return featurePerms.canView;
          case 'edit':   return featurePerms.canEdit;
          case 'delete': return featurePerms.canDelete;
          default:       return false;
        }
      }

      // Permissions API failed or returned nothing — fall back to role-based
      // defaults so workers can still view pages when backend is unreachable
      if (role === 'worker') {
        const [, permissionType] = action.split('.');
        return permissionType === 'view';
      }

      return false;
    },
    [permissions, permissionsLoaded, loading, user]
  );

  return { permissions, loading, can, refetch: fetchPermissions };
}
