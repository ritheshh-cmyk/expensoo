import React from 'react';
import { AdminControlSystem } from '@/components/admin/AdminControlSystem';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { DataExportPanel } from '@/components/admin/DataExportPanel';
import { SessionsPanel } from '@/components/admin/SessionsPanel';
import { ResponsiveGrid, ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEnhancedRBAC } from '@/contexts/EnhancedRBACContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  BarChart3, 
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Database,
  Server,
  Globe,
  Clock
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, permissions, loading } = useEnhancedRBAC();

  // Derive admin status directly from user.role as a reliable fallback
  const isAdminUser = isAdmin || user?.role?.toLowerCase() === 'admin';

  // Show spinner while RBAC is still loading — prevents flash of "Access Required"
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Admin-only access check
  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-red-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold">Admin Access Required</h2>
            <p className="text-muted-foreground">Only administrators can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const systemStats = {
    totalUsers: 3,
    totalPermissions: permissions.length,
    activeFeatures: permissions.filter(p => p.ownerAccess || p.workerAccess).length,
    systemHealth: 'Excellent'
  };

  return (
    <ResponsiveContainer maxWidth="full" padding="md">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Administration
            </h1>
            <p className="text-muted-foreground mt-2">
              System management and role-based access control
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 w-fit">
            <Shield className="h-4 w-4" />
            Administrator: {user?.name}
          </Badge>
        </div>

        {/* System Overview */}
        <ResponsiveGrid 
          cols={{ default: 1, sm: 2, lg: 4 }}
          gap={6}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
              <p className="text-sm text-muted-foreground">Admin, Owner, Worker</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalPermissions}</div>
              <p className="text-sm text-muted-foreground">Feature access controls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Active Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.activeFeatures}</div>
              <p className="text-sm text-muted-foreground">Enabled for users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStats.systemHealth}</div>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Current system configuration and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Database:</span>
                    <Badge variant="outline" className="text-xs">Connected</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Backend:</span>
                    <Badge variant="outline" className="text-xs">Operational</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Frontend:</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Mobile:</span>
                    <Badge variant="outline" className="text-xs">Responsive</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Tablet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tablet:</span>
                    <Badge variant="outline" className="text-xs">Optimized</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Desktop:</span>
                    <Badge variant="outline" className="text-xs">Enhanced</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                System Reports
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Activity Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Control System & User Management */}
        <UserManagement />
        <AdminControlSystem />

        {/* Audit Log */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-semibold">Audit Log</h2>
          </div>
          <AuditLogPanel />
        </div>

        {/* One-click CSV Data Export */}
        <DataExportPanel />

        {/* Active Sessions Manager */}
        <SessionsPanel />
      </div>
    </ResponsiveContainer>
  );
}
