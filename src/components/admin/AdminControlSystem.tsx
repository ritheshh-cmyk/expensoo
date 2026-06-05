import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import {
  Settings,
  Users,
  Shield,
  Eye,
  EyeOff,
  Save,
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
  Calculator
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
      
      if (response.success && response.data) {
        // Map icons back from defaultPermissions
        const dataWithIcons = response.data.map((p: any) => {
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

  const savePermissions = async () => {
    try {
      setSaving(true);
      const response = await apiClient.makeRequest('/api/admin/permissions', {
        method: 'POST',
        body: JSON.stringify({ permissions })
      });

      if (response.success) {
        setHasChanges(false);
        toast({
          title: 'Permissions Updated',
          description: 'Role-based access controls have been updated successfully.',
        });
      } else {
        throw new Error(response.error || 'Failed to save permissions');
      }
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to update permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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

  const groupedPermissions = permissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

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
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                Admin Control System
              </CardTitle>
              <CardDescription className="mt-1">
                Control access to pages and features for Owners and Workers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={savePermissions}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
                size="sm"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
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
              <CardDescription>
                Manage access to {category.toLowerCase()} related features
              </CardDescription>
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
              <p className="text-sm text-muted-foreground">
                Restore default access controls for all roles
              </p>
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
    </div>
  );
}
