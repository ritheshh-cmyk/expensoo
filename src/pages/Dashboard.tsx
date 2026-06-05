import { io } from "socket.io-client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  ArrowUpRight,
  Wallet,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────

function getField(tx: any, ...keys: string[]): string {
  for (const k of keys) {
    if (tx[k] !== undefined && tx[k] !== null && tx[k] !== "") return String(tx[k]);
  }
  return "";
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: any): string {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? "0" : num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-brand-green-50 text-brand-green-600 border-brand-green/20 dark:bg-brand-green/15 dark:text-brand-green dark:border-brand-green/20";
    case "pending":   return "bg-brand-orange-50 text-brand-orange-600 border-brand-orange/20 dark:bg-brand-orange/15 dark:text-brand-orange dark:border-brand-orange/20";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();

  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    weekProfit: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    avgTransactionValue: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const toggleProfits = () => {
    const next = !showProfits;
    setShowProfits(next);
    localStorage.setItem("showProfits", String(next));
  };

  // BUG 1 FIX: wrap in useCallback so socket listeners always hold a stable
  // reference to the latest function rather than a stale closure.
  const fetchDashboardData = useCallback(async (showToast = false) => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    try {
      const [dash, txns] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransactions(),
      ]);

      if (dash && typeof dash === 'object' && 'success' in dash && !dash.success) {
        throw new Error(`Dashboard API Error: ${dash.error || 'Unknown error'}`);
      }
      if (txns && typeof txns === 'object' && 'success' in txns && !txns.success) {
        throw new Error(`Transactions API Error: ${txns.error || 'Unknown error'}`);
      }

      // ── dashboard metrics ─────────────────────────────────────────────────
      const dashData = dash?.data ?? dash;
      if (dashData?.totals) {
        const tObj = dashData.totals;
        const td = dashData.today ?? {};
        const wk = dashData.week ?? {};
        
        setDashboardData({
          totalRevenue:        Number(tObj.totalRevenue)        || 0,
          todayRevenue:        Number(td.totalRevenue)          || 0,
          weekRevenue:         Number(wk.totalRevenue)          || 0,
          totalProfit:         Number(tObj.totalProfit)         || 0,
          todayProfit:         Number(td.totalProfit)           || 0,
          weekProfit:          Number(wk.totalProfit)           || 0,
          totalTransactions:   Number(tObj.totalTransactions)   || 0,
          pendingTransactions: Number(tObj.pendingTransactions) || 0,
          completedTransactions: Number(tObj.completedTransactions) || 0,
          avgTransactionValue: Number(tObj.avgTransactionValue) || 0,
        });
      }

      // ── recent transactions & chart data ──────────────────────────────────
      const raw: any[] = Array.isArray(txns)
        ? txns
        : Array.isArray(txns?.data)
        ? txns.data
        : Array.isArray(txns?.transactions)
        ? txns.transactions
        : [];
      
      const sortedTxns = [...raw].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.date).getTime();
        const dateB = new Date(b.createdAt || b.created_at || b.date).getTime();
        return dateB - dateA;
      });
      
      setRecentTransactions(sortedTxns.slice(0, 5));

      // Build 7-day chart data
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dateStr: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          dateObj: d,
          total: 0
        };
      });

      sortedTxns.forEach(tx => {
        const d = new Date(tx.createdAt || tx.created_at || tx.date);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
          const dayMatch = last7Days.find(day => day.dateStr === dateStr);
          if (dayMatch) {
            const cost = Number(getField(tx, "repairCost", "repair_cost", "amountGiven", "amount_given") || 0);
            dayMatch.total += cost;
          }
        }
      });

      setChartData(last7Days.map(d => ({ name: d.dateStr, total: d.total })));

      if (showToast) {
        toast({ title: "Refreshed", description: "Dashboard data updated." });
      }
    } catch (err: any) {
      console.error("[Dashboard] fetch error:", err);
      toast({
        title: "Sync Warning",
        description: err.message || "Could not refresh dashboard data. Displaying cached information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDashboardData(); }, [user]);

  // BUG 6 FIX: depend on stable fetchDashboardData (now a useCallback) so the
  // socket listeners always call the latest version, not a stale closure.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const wsUrl = import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL ||
                  import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
                  'https://expensoo-app-gu3wg.ondigitalocean.app';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message));
    
    const update = () => { if (!cancelled) fetchDashboardData(); };
    socket.on('transactionCreated', update);
    socket.on('transactionUpdated', update);
    socket.on('transactionDeleted', update);
    socket.on('expenditureCreated', update);
    socket.on('expenditureUpdated', update);
    socket.on('expenditureDeleted', update);

    return () => {
      cancelled = true;
      socket.off('transactionCreated', update);
      socket.off('transactionUpdated', update);
      socket.off('transactionDeleted', update);
      socket.off('expenditureCreated', update);
      socket.off('expenditureUpdated', update);
      socket.off('expenditureDeleted', update);
      socket.disconnect();
    };
  }, [user, fetchDashboardData]);

  const isOwnerOrAdmin = hasAccess(["admin", "owner"]);
  
  // BUG 10 FIX: removed bogus pendingTransactions × avgTransactionValue formula.
  // The card now shows plain pending count which is accurate and meaningful.
  const pendingCount = dashboardData.pendingTransactions;

  // Custom Tooltip for the Recharts graph
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold text-foreground font-heading flex items-center gap-1">
            <span className="text-primary">₹</span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 relative animate-in fade-in duration-500">
      {/* ── Mobile Floating Action Button (FAB) ── */}
      <div className="md:hidden fixed bottom-[72px] right-4 z-50 animate-in slide-in-from-bottom-8 duration-500 fade-in delay-200">
        <Link to="/transactions/new">
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* ── page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
            {t("welcome-back")},{" "}
            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1 sm:mt-0">
              {user?.name || user?.username || "Admin"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            {t("shop-overview")}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Link to="/transactions/new" className="hidden md:block">
            <Button className="min-h-[44px] px-4 gap-2 shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="min-h-[44px] px-4 shadow-sm hover:shadow-md transition-all bg-background"
            style={{ touchAction: "manipulation" }}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {loading ? t("loading") : t("refresh")}
          </Button>
          {isOwnerOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              id="toggle-profits-btn"
              data-testid="profits-toggle"
              onClick={toggleProfits}
              className="min-h-[44px] px-4 shadow-sm hover:shadow-md transition-all bg-background"
              style={{ touchAction: "manipulation" }}
            >
              {showProfits ? t("hide-profits") : t("show-profits")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Premium Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Today Revenue */}
        <Card className="relative overflow-hidden border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-transparent hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-green/10 blur-2xl group-hover:bg-brand-green/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("today-revenue")}
            </CardTitle>
            <div className="rounded-xl bg-brand-green/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4 text-brand-green" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              ₹{formatCurrency(dashboardData.todayRevenue)}
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-brand-green font-medium bg-brand-green/10 px-1.5 py-0.5 rounded-sm">
                  Profit: ₹{formatCurrency(dashboardData.todayProfit)}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-brand-green" />
              <span className="text-brand-green font-medium">+₹{formatCurrency(dashboardData.todayRevenue)}</span> today
            </p>
          </CardContent>
        </Card>

        {/* Week Overview (WoW Comparison Equivalent) */}
        <Card className="relative overflow-hidden border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-transparent hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-blue/10 blur-2xl group-hover:bg-brand-blue/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <div className="rounded-xl bg-brand-blue/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4 text-brand-blue" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              ₹{formatCurrency(dashboardData.weekRevenue)}
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-brand-blue font-medium bg-brand-blue/10 px-1.5 py-0.5 rounded-sm">
                  Profit: ₹{formatCurrency(dashboardData.weekProfit)}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-brand-blue font-medium">{dashboardData.completedTransactions}</span> completed this week
            </p>
          </CardContent>
        </Card>

        {/* Pending Repairs */}
        <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-500/10 blur-2xl group-hover:bg-red-500/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Repairs
            </CardTitle>
            <div className="rounded-xl bg-red-500/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <Wallet className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="font-medium text-red-500">{pendingCount}</span> repairs awaiting completion
            </p>
          </CardContent>
        </Card>

        {/* Total Lifetime Revenue */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("total-revenue")}
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              ₹{formatCurrency(dashboardData.totalRevenue)}
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-sm">
                  Profit: ₹{formatCurrency(dashboardData.totalProfit)}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Over <span className="font-medium text-foreground">{dashboardData.totalTransactions}</span> lifetime transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Revenue Chart ─────────────────────────────────────────────── */}
        <Card className="col-span-1 lg:col-span-2 border-muted shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="w-full h-[250px] bg-muted/20 animate-pulse rounded-lg" />
            ) : chartData.length > 0 ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
                No data for the past 7 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── recent transactions ─────────────────────────────────────────── */}
        <Card className="col-span-1 border-muted shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest 5 transactions</CardDescription>
              </div>
              <Link to="/transactions">
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {loading ? (
              <div className="space-y-0 divide-y divide-border/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[76px] bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentTransactions.map((tx, i) => {
                  // Backend returns camelCase — map correctly
                  const customerName =
                    getField(tx, "customerName", "customer_name", "name") ||
                    `Customer #${tx.id}`;
                  const deviceModel =
                    getField(tx, "deviceModel", "device_model", "device_type", "device") || "—";
                  const repairType =
                    getField(tx, "repairType", "repair_type", "repair") || "—";
                  const dateStr = formatDate(
                    tx.createdAt ?? tx.created_at ?? tx.date
                  );
                  const cost = getField(tx, "repairCost", "repair_cost", "amountGiven", "amount_given");
                  const status = getField(tx, "status") || "pending";

                  return (
                    <div
                      key={tx.id ?? i}
                      className="flex items-center gap-3 px-4 py-3 sm:px-5 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                    >
                      {/* Avatar initial */}
                      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border border-primary/20 shadow-sm">
                        {customerName.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{customerName}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {deviceModel} • {repairType}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 text-right space-y-1">
                        <div className="font-semibold text-sm text-foreground">₹{formatCurrency(cost)}</div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize",
                            getStatusColor(status),
                          )}
                        >
                          {status === "Completed" ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          )}
                          {t(status.toLowerCase())}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 ring-8 ring-background">
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-lg">{t("no-transactions-yet")}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                  {t("add-first-transaction")}
                </p>
                <Link to="/transactions/new" className="mt-6">
                  <Button className="shadow-sm gap-2">
                    <Plus className="h-4 w-4" />
                    {t("add-transaction")}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

