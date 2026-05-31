import { useRef } from 'react';
import { AdminControlSystem } from '@/components/admin/AdminControlSystem';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { DataExportPanel } from '@/components/admin/DataExportPanel';
import { SessionsPanel } from '@/components/admin/SessionsPanel';
import { SystemStatsPanel } from '@/components/admin/SystemStatsPanel';
import { ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield, Users, Settings, Activity, BarChart3,
  Download, Monitor, Clock, Zap,
} from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();

  // Section refs for scroll-to navigation
  const usersRef   = useRef<HTMLDivElement>(null);
  const rbacRef    = useRef<HTMLDivElement>(null);
  const auditRef   = useRef<HTMLDivElement>(null);
  const exportRef  = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Admin gate: only AuthContext ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isAdminUser = user?.role?.toLowerCase() === 'admin';

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

  return (
    <ResponsiveContainer maxWidth="full" padding="md">
      <div className="space-y-10">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Administration</h1>
            <p className="text-muted-foreground mt-1">
              Full system control — users, permissions, sessions, exports, audit trail
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 w-fit shrink-0 py-1.5 px-3">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="font-semibold">{user?.name ?? user?.username}</span>
            <span className="text-muted-foreground">· Admin</span>
          </Badge>
        </div>

        {/* ── Quick Action Nav ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => scrollTo(usersRef)}>
            <Users className="h-4 w-4 mr-1.5" /> Users
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollTo(rbacRef)}>
            <Settings className="h-4 w-4 mr-1.5" /> Permissions
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollTo(auditRef)}>
            <Activity className="h-4 w-4 mr-1.5" /> Audit Log
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollTo(exportRef)}>
            <Download className="h-4 w-4 mr-1.5" /> Export Data
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollTo(sessionRef)}>
            <Monitor className="h-4 w-4 mr-1.5" /> Sessions
          </Button>
        </div>

        {/* ── Live System Stats (real backend data) ────────────────────────── */}
        <SystemStatsPanel />

        {/* ── User Management ──────────────────────────────────────────────── */}
        <section ref={usersRef} className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Create accounts, change roles, force-reset passwords, delete users
          </p>
          <UserManagement />
        </section>

        {/* ── RBAC Permission Controls ──────────────────────────────────────── */}
        <section ref={rbacRef} className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Role Permissions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Control which pages and features Owner and Worker roles can access
          </p>
          <AdminControlSystem />
        </section>

        {/* ── Audit Log ─────────────────────────────────────────────────────── */}
        <section ref={auditRef} className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-semibold">Audit Log</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Last 200 security events — logins, role changes, password resets, deletions
          </p>
          <AuditLogPanel />
        </section>

        {/* ── Data Export ───────────────────────────────────────────────────── */}
        <section ref={exportRef} className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Data Export</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Download users, transactions and suppliers as CSV for accounting/backup
          </p>
          <DataExportPanel />
        </section>

        {/* ── Active Sessions ───────────────────────────────────────────────── */}
        <section ref={sessionRef} className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-semibold">Active Sessions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            All logged-in devices across all users — revoke any suspicious session instantly
          </p>
          <SessionsPanel />
        </section>

        {/* Bottom padding for mobile nav */}
        <div className="h-6" />
      </div>
    </ResponsiveContainer>
  );
}
