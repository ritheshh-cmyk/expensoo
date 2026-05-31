import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Receipt, Package, Monitor, TrendingUp,
  RefreshCw, IndianRupee, Activity, Clock, AlertCircle
} from 'lucide-react';

const getApiUrl = () => {
  const envBaseUrl = import.meta.env.VITE_BACKEND_URL;
  const prodUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
  return envBaseUrl !== undefined && envBaseUrl !== ''
    ? envBaseUrl
    : (import.meta.env.PROD ? prodUrl : '');
};
const BASE = getApiUrl();

interface Stats {
  users: { total: number; admins: number; owners: number; workers: number };
  transactions: { total: number; today: number; totalRevenue: number; todayRevenue: number };
  suppliers: { total: number };
  sessions: { active: number };
  auditLogs: { total: number };
  serverTime: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1 truncate">{value}</p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemStatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await window.fetch(`${BASE}/api/auth/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setLastRefresh(new Date());
      } else throw new Error(json.error || 'Failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [fetch]);

  const fmt = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n.toLocaleString()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Live System Stats</h2>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              · Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error} — showing cached data or defaults
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.users.total ?? '—'}
          sub={stats ? `${stats.users.admins} admin · ${stats.users.owners} owner · ${stats.users.workers} worker` : undefined}
          color="bg-blue-500/10 text-blue-500"
          loading={loading && !stats}
        />
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={stats?.transactions.total ?? '—'}
          sub={stats ? `${stats.transactions.today} today` : undefined}
          color="bg-green-500/10 text-green-500"
          loading={loading && !stats}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={stats ? fmt(stats.transactions.totalRevenue) : '—'}
          sub={stats ? `${fmt(stats.transactions.todayRevenue)} today` : undefined}
          color="bg-orange-500/10 text-orange-500"
          loading={loading && !stats}
        />
        <StatCard
          icon={Package}
          label="Suppliers"
          value={stats?.suppliers.total ?? '—'}
          color="bg-purple-500/10 text-purple-500"
          loading={loading && !stats}
        />
        <StatCard
          icon={Monitor}
          label="Active Sessions"
          value={stats?.sessions.active ?? '—'}
          color="bg-cyan-500/10 text-cyan-500"
          loading={loading && !stats}
        />
        <StatCard
          icon={TrendingUp}
          label="Audit Events"
          value={stats?.auditLogs.total ?? '—'}
          color="bg-yellow-500/10 text-yellow-600"
          loading={loading && !stats}
        />
        <StatCard
          icon={Clock}
          label="Server Time"
          value={stats ? new Date(stats.serverTime).toLocaleTimeString() : '—'}
          sub="IST / UTC"
          color="bg-slate-500/10 text-slate-500"
          loading={loading && !stats}
        />
      </div>
    </div>
  );
}
