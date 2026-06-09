import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  LayoutDashboard,
  Smartphone,
  Package,
  DollarSign,
  BarChart3,
  Wrench,
  Calculator,
  UserCog,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  ownerAccess: boolean;
  workerAccess: boolean;
}

interface AdminControlSystemProps {
  className?: string;
}

export function AdminControlSystem({ className }: AdminControlSystemProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // User Overrides States
  const [users, setUsers] = useState<{ id: number; username: string; role: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userOverrides, setUserOverrides] = useState<any[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [hasOverrideChanges, setHasOverrideChanges] = useState(false);

  // Load users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.makeRequest('/api/auth/users');
        if (response.success && response.data) {
          // Filter out admins from overrides list (since admins bypass all permissions anyway)
          const nonAdmins = response.data.filter((u: any) => u.role?.toLowerCase() !== 'admin');
          setUsers(nonAdmins);
        } else if (Array.isArray(response.data)) {
          const nonAdmins = response.data.filter((u: any) => u.role?.toLowerCase() !== 'admin');
          setUsers(nonAdmins);
        } else if (Array.isArray(response)) {
          const nonAdmins = (response as any).filter((u: any) => u.role?.toLowerCase() !== 'admin');
          setUsers(nonAdmins);
        }
      } catch (err) {
        console.warn("Failed to load users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Load user overrides when selectedUserId changes
  useEffect(() => {
    if (!selectedUserId) {
      setUserOverrides([]);
      setHasOverrideChanges(false);
      return;
    }
    const loadOverrides = async () => {
      try {
        setLoadingOverrides(true);
        const response = await apiClient.makeRequest(`/api/admin/permissions/users/${selectedUserId}`);
        const rawData = response.data?.data ?? response.data;
        if (response.success && Array.isArray(rawData)) {
          setUserOverrides(rawData);
        } else {
          setUserOverrides([]);
        }
      } catch (err) {
        console.error("Failed to load overrides:", err);
        setUserOverrides([]);
      } finally {
        setLoadingOverrides(false);
        setHasOverrideChanges(false);
      }
    };
    loadOverrides();
  }, [selectedUserId]);

  const updateOverride = (featureId: string, state: 'allow' | 'deny' | 'none') => {
    setUserOverrides(prev => prev.map(o => {
      if (o.id === featureId) {
        return { ...o, state };
      }
      return o;
    }));
    setHasOverrideChanges(true);
  };

  // Auto-save user overrides: debounce 400ms
  const overridesRef = useRef(userOverrides);
  overridesRef.current = userOverrides;
  const autoSaveOverridesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasOverrideChanges || !selectedUserId) return;
    if (autoSaveOverridesTimer.current) clearTimeout(autoSaveOverridesTimer.current);
    autoSaveOverridesTimer.current = setTimeout(async () => {
      try {
        setSavingOverrides(true);
        const response = await apiClient.makeRequest(`/api/admin/permissions/users/${selectedUserId}`, {
          method: 'POST',
          body: JSON.stringify({ overrides: overridesRef.current })
        });
        if (response.success) {
          setHasOverrideChanges(false);
          toast({ title: 'Overrides saved', description: 'User-specific access controls updated.' });
        }
      } catch { /* non-fatal */ }
      finally { setSavingOverrides(false); }
    }, 400);
    return () => { if (autoSaveOverridesTimer.current) clearTimeout(autoSaveOverridesTimer.current); };
  }, [userOverrides, hasOverrideChanges, selectedUserId]);

  // Default permissions structure
  const defaultPermissions: Permission[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Main business overview and analytics',
      category: 'Core',
      icon: LayoutDashboard,
      ownerAccess: true,
      workerAccess: true
    },
    {
      id: 'repairs',
      name: 'Repairs',
      description: 'Device repair management',
      category: 'Core',
      icon: Smartphone,
      ownerAccess: true,
      workerAccess: true
    },
    {
      id: 'customers',
      name: 'Customers',
      description: 'Customer management and history',
      category: 'Core',
      icon: Users,
      ownerAccess: true,
      workerAccess: true
    },
    {
      id: 'suppliers',
      name: 'Suppliers',
      description: 'Supplier management and payments',
      category: 'Operations',
      icon: Building2,
      ownerAccess: true,
      workerAccess: false
    },
    {
      id: 'transactions',
      name: 'Transactions',
      description: 'Transaction history and management',
      category: 'Finance',
      icon: DollarSign,
      ownerAccess: true,
      workerAccess: true
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Business reports and analytics',
      category: 'Analytics',
      icon: BarChart3,
      ownerAccess: true,
      workerAccess: false
    },
    {
      id: 'services',
      name: 'Services',
      description: 'Service types and pricing',
      category: 'Operations',
      icon: Wrench,
      ownerAccess: true,
      workerAccess: false
    },
    {
      id: 'calculations',
      name: 'Calculations',
      description: 'Profit/loss calculations',
      category: 'Finance',
      icon: Calculator,
      ownerAccess: true,
      workerAccess: false
    }
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest('/api/admin/permissions');
      
      const rawData = response.data?.data ?? response.data;
      if (response.success && Array.isArray(rawData)) {
        // Map icons back from defaultPermissions
        const dataWithIcons = rawData.map((p: any) => {
          const defaultPerm = defaultPermissions.find(dp => dp.id === p.id);
          return {
            ...p,
            icon: defaultPerm?.icon || LayoutDashboard
          };
        });
        setPermissions(dataWithIcons);
      } else {
        // Use default permissions if none exist
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.warn('Failed to load permissions, using defaults:', error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (permissionId: string, role: 'owner' | 'worker', value: boolean) => {
    setPermissions(prev => prev.map(permission => {
      if (permission.id === permissionId) {
        return {
          ...permission,
          [role === 'owner' ? 'ownerAccess' : 'workerAccess']: value
        };
      }
      return permission;
    }));
    setHasChanges(true);
  };

  // Auto-save: debounce 400ms after last toggle
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionsRef = useRef(permissions);
  permissionsRef.current = permissions;

  useEffect(() => {
    if (!hasChanges) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        const response = await apiClient.makeRequest('/api/admin/permissions', {
          method: 'POST',
          body: JSON.stringify({ permissions: permissionsRef.current })
        });
        if (response.success) {
          setHasChanges(false);
          toast({ title: 'Permissions saved', description: 'Access controls updated automatically.' });
        }
      } catch { /* non-fatal */ }
      finally { setSaving(false); }
    }, 400);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions, hasChanges]);

  const resetPermissions = () => {
    setPermissions(defaultPermissions);
    setHasChanges(true);
  };

  const toggleAllOwnerAccess = (enabled: boolean) => {
    setPermissions(prev => prev.map(permission => ({
      ...permission,
      ownerAccess: enabled
    })));
    setHasChanges(true);
  };

  const toggleAllWorkerAccess = (enabled: boolean) => {
    setPermissions(prev => prev.map(permission => ({
      ...permission,
      workerAccess: enabled
    })));
    setHasChanges(true);
  };

  const groupedPermissions = Array.isArray(permissions)
    ? permissions.reduce((groups, permission) => {
        const category = permission.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(permission);
        return groups;
      }, {} as Record<string, Permission[]>)
    : {};

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Control System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedOverrides = Array.isArray(userOverrides)
    ? userOverrides.reduce((groups, override) => {
        const category = override.category || "Core";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(override);
        return groups;
      }, {} as Record<string, any[]>)
    : {};

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Control System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs defaultValue="role" className="w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="sticky top-[57px] z-10 bg-background/95 backdrop-blur-sm py-2 border-b -mx-4 px-4 sm:mx-0 sm:px-0 sm:relative sm:top-auto sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:border-b-0 sm:py-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/60">
            <TabsTrigger
              value="role"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Role Permissions</span>
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all"
            >
              <UserCog className="h-4 w-4 shrink-0" />
              <span>User Overrides</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Role Permissions */}
        <TabsContent value="role" className="space-y-6 mt-0">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                    Role Permissions
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <Badge variant="secondary" className="inline-flex items-center gap-1">
                      {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                      {saving ? 'Saving…' : 'Unsaved Changes'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllOwnerAccess(true)}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Enable All Owner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllOwnerAccess(false)}
                  className="flex items-center gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Disable All Owner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllWorkerAccess(true)}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Enable All Worker
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllWorkerAccess(false)}
                  className="flex items-center gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Disable All Worker
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {permissions.filter(p => p.ownerAccess).length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Owner Access</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {permissions.filter(p => p.workerAccess).length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Worker Access</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {Object.keys(groupedPermissions).length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Categories</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {permissions.length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Features</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Groups */}
          <div className="grid gap-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">{category} Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryPermissions.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div key={permission.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{permission.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {permission.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium w-12 text-right">Owner:</span>
                              <Switch
                                checked={permission.ownerAccess}
                                onCheckedChange={(value) => updatePermission(permission.id, 'owner', value)}
                              />
                              {permission.ownerAccess ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            
                            <Separator orientation="vertical" className="h-6" />
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium w-12 text-right">Worker:</span>
                              <Switch
                                checked={permission.workerAccess}
                                onCheckedChange={(value) => updatePermission(permission.id, 'worker', value)}
                              />
                              {permission.workerAccess ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reset Option */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium">Reset Permissions</h3>
                </div>
                <Button
                  variant="outline"
                  onClick={resetPermissions}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: User Overrides */}
        <TabsContent value="user" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <UserCog className="h-5 w-5 sm:h-6 sm:w-6" />
                    User Overrides
                  </CardTitle>
                  <CardDescription>
                    Configure user-specific allowances or restrictions overriding role defaults
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasOverrideChanges && (
                    <Badge variant="secondary" className="inline-flex items-center gap-1">
                      {savingOverrides ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                      {savingOverrides ? 'Saving…' : 'Unsaved Changes'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* User Selector */}
              <div className="flex flex-col gap-2 max-w-sm mb-6">
                <label className="text-sm font-medium">Select a user to configure</label>
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                  ))}
                </select>
              </div>

              {!selectedUserId ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center space-y-3 bg-muted/10">
                  <ShieldAlert className="h-10 w-10 text-muted-foreground/60" />
                  <div>
                    <h3 className="font-bold">No User Selected</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Please select a worker or owner from the list above to set user-specific permission overrides.
                    </p>
                  </div>
                </div>
              ) : loadingOverrides ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin h-8 w-8 border-2 border-[#d97757] border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedOverrides).map(([category, overridesList]) => (
                    <Card key={category} className="border border-border/50">
                      <CardHeader className="py-3 bg-muted/20 border-b border-border/30">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{category} Features</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {overridesList.map((override: any) => {
                          const defaultPerm = defaultPermissions.find(dp => dp.id === override.id);
                          const Icon = defaultPerm?.icon || LayoutDashboard;
                          return (
                            <div key={override.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-border/50 rounded-lg hover:border-border transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon className="h-5 w-5 text-muted-foreground/85 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm text-foreground truncate">{override.name}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {defaultPerm?.description || `Configure overrides for ${override.name}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
                                  <button
                                    type="button"
                                    onClick={() => updateOverride(override.id, 'allow')}
                                    className={cn(
                                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all min-h-[36px]",
                                      override.state === 'allow'
                                        ? "bg-green-600/90 text-white shadow-sm font-bold"
                                        : "hover:bg-muted text-muted-foreground"
                                    )}
                                  >
                                    Allow
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateOverride(override.id, 'deny')}
                                    className={cn(
                                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all min-h-[36px]",
                                      override.state === 'deny'
                                        ? "bg-red-600/90 text-white shadow-sm font-bold"
                                        : "hover:bg-muted text-muted-foreground"
                                    )}
                                  >
                                    Deny
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateOverride(override.id, 'none')}
                                    className={cn(
                                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all min-h-[36px]",
                                      override.state === 'none'
                                        ? "bg-background border border-border/50 text-foreground shadow-sm font-bold"
                                        : "hover:bg-muted text-muted-foreground"
                                    )}
                                  >
                                    None
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
