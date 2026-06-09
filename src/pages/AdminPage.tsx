import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Shield, Users, Activity, Download, Monitor,
  Zap, BarChart3, Loader2,
} from 'lucide-react';

// ── Lazy-load every heavy panel — only renders when its tab is active ──────────
const UserManagement   = lazy(() => import('@/components/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const AdminControlSystem = lazy(() => import('@/components/admin/AdminControlSystem').then(m => ({ default: m.AdminControlSystem })));
const AuditLogPanel    = lazy(() => import('@/components/admin/AuditLogPanel').then(m => ({ default: m.AuditLogPanel })));
const DataExportPanel  = lazy(() => import('@/components/admin/DataExportPanel').then(m => ({ default: m.DataExportPanel })));
const SessionsPanel    = lazy(() => import('@/components/admin/SessionsPanel').then(m => ({ default: m.SessionsPanel })));
const SystemStatsPanel = lazy(() => import('@/components/admin/SystemStatsPanel').then(m => ({ default: m.SystemStatsPanel })));

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     labelKey: 'overview',    shortLabelKey: 'stats',   icon: BarChart3, color: 'text-purple-500' },
  { id: 'users',        labelKey: 'users',       shortLabelKey: 'users',   icon: Users,     color: 'text-blue-500'   },
  { id: 'permissions',  labelKey: 'permissions', shortLabelKey: 'perms',   icon: Zap,       color: 'text-yellow-500' },
  { id: 'audit',        labelKey: 'audit-log',   shortLabelKey: 'audit',   icon: Activity,  color: 'text-indigo-500' },
  { id: 'export',       labelKey: 'export',      shortLabelKey: 'export',  icon: Download,  color: 'text-green-500'  },
  { id: 'sessions',     labelKey: 'sessions',    shortLabelKey: 'sessions',icon: Monitor,   color: 'text-cyan-500'   },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Skeleton loader for panels ─────────────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse pt-2">
      <div className="h-32 rounded-xl bg-muted/60" />
      <div className="h-20 rounded-xl bg-muted/40" />
      <div className="h-20 rounded-xl bg-muted/40" />
      <div className="h-20 rounded-xl bg-muted/40" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ── Loading state ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ── Admin gate ─────────────────────────────────────────────────────────────
  if (user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("admin-access-required")}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("admin-only-message")}
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
            {t("logged-in-as-status")} <strong>{user?.username}</strong> · {user?.role}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">

      {/* ── Page Header — compact on mobile ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {t("administration")}
            </h1>
            <Badge variant="outline" className="shrink-0 hidden sm:flex gap-1.5 text-xs">
              <Shield className="h-3 w-3 text-red-500" />
              {user?.username}
            </Badge>
          </div>

        </div>
        {/* Mobile admin badge */}
        <Badge variant="outline" className="sm:hidden shrink-0 gap-1 text-xs py-1 px-2">
          <Shield className="h-3 w-3 text-red-500" />
          {t("admin")}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabId)} className="w-full space-y-4">
        {/* ── Sticky tab bar — sticks below header on mobile ──────────────── */}
        <div className="sticky top-[57px] z-10 bg-background/95 backdrop-blur-sm py-2 border-b -mx-4 px-4 sm:mx-0 sm:px-0 sm:relative sm:top-auto sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:border-b-0 sm:py-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/60">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  data-tab={tab.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="sm:hidden">{t(tab.shortLabelKey)}</span>
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* ── Panel content — only active tab rendered ─────────────────────── */}
        <div className="pb-20 lg:pb-6">
          <Suspense fallback={<PanelSkeleton />}>
            <TabsContent value="overview" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <SystemStatsPanel />
            </TabsContent>
            <TabsContent value="users" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <UserManagement />
            </TabsContent>
            <TabsContent value="permissions" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <AdminControlSystem />
            </TabsContent>
            <TabsContent value="audit" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <AuditLogPanel />
            </TabsContent>
            <TabsContent value="export" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <DataExportPanel />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <SessionsPanel />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
