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
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { SuccessConfetti } from "@/components/ui/SuccessConfetti";
import { DashboardTour } from "@/components/ui/DashboardTour";
import CountUp from "@/components/ui/CountUp";
import AnimatedList from "@/components/ui/AnimatedList";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirm } from "@/components/ui/ConfirmModal";

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
  const { confirm, ConfirmModalElement } = useConfirm();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

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
        const timeA = new Date(a.createdAt || a.created_at || a.date).getTime();
        const timeB = new Date(b.createdAt || b.created_at || b.date).getTime();
        const dateA = isNaN(timeA) ? 0 : timeA;
        const dateB = isNaN(timeB) ? 0 : timeB;
        return dateB - dateA;
      });
      
      setRecentTransactions(sortedTxns.slice(0, 5));
      setAllTransactions(raw);

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
                  'https://backendmobile-4swg.onrender.com';
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

  // ── calculations for expanded panels ──────────────────────────────────
  const unpaidTransactionsList = useMemo(() => {
    return allTransactions.filter((tx: any) => (tx.status || "").toLowerCase() === "unpaid");
  }, [allTransactions]);

  const unpaidCount = unpaidTransactionsList.length;

  const unpaidOutstanding = useMemo(() => {
    return unpaidTransactionsList.reduce((sum: number, tx: any) => {
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
      const amountGiven = Number(tx.amountGiven ?? tx.amount_given ?? 0);
      return sum + Math.max(0, cost - amountGiven);
    }, 0);
  }, [unpaidTransactionsList]);

  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toDateString();
    return allTransactions.filter((tx: any) => {
      const dStr = tx.createdAt || tx.created_at || tx.date;
      if (!dStr) return false;
      const txDate = new Date(dStr);
      if (isNaN(txDate.getTime())) return false;
      return txDate.toDateString() === todayStr;
    });
  }, [allTransactions]);

  const todayTotal = useMemo(() => {
    return todayTransactions.reduce((sum: number, tx: any) => {
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
      return sum + cost;
    }, 0);
  }, [todayTransactions]);

  const weekTransactionsGrouped = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTx = allTransactions.filter((tx: any) => {
      const dStr = tx.createdAt || tx.created_at || tx.date;
      if (!dStr) return false;
      const txDate = new Date(dStr);
      return !isNaN(txDate.getTime()) && txDate >= startOfWeek;
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const grouped: { [key: string]: { txs: any[]; total: number } } = {};
    
    days.forEach(d => {
      grouped[d] = { txs: [], total: 0 };
    });

    weekTx.forEach((tx: any) => {
      const dStr = tx.createdAt || tx.created_at || tx.date;
      if (!dStr) return;
      const txDate = new Date(dStr);
      const dayIdx = txDate.getDay();
      if (isNaN(dayIdx)) return;
      const dayName = days[dayIdx];
      if (!dayName || !grouped[dayName]) return;
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
      grouped[dayName].txs.push(tx);
      grouped[dayName].total += cost;
    });

    return Object.entries(grouped)
      .filter(([_, data]) => data.txs.length > 0)
      .map(([day, data]) => ({ day, ...data }));
  }, [allTransactions]);

  const weekTotal = useMemo(() => {
    return weekTransactionsGrouped.reduce((sum, day) => sum + day.total, 0);
  }, [weekTransactionsGrouped]);

  const totalBreakdown = useMemo(() => {
    let repairTotal = 0;
    let saleTotal = 0;
    allTransactions.forEach((tx: any) => {
      const type = (tx.repairType || "").toLowerCase();
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
      if (type === "sale") {
        saleTotal += cost;
      } else if (type !== "internal-repair") {
        repairTotal += cost;
      }
    });
    return { repairTotal, saleTotal };
  }, [allTransactions]);

  const top5Transactions = useMemo(() => {
    return [...allTransactions]
      .sort((a, b) => {
        const costA = Number(a.repairCost ?? a.repair_cost ?? a.cost ?? 0);
        const costB = Number(b.repairCost ?? b.repair_cost ?? b.cost ?? 0);
        return costB - costA;
      })
      .slice(0, 5);
  }, [allTransactions]);

  const pendingRepairsList = useMemo(() => {
    return allTransactions.filter((tx: any) => (tx.status || "").toLowerCase() === "pending");
  }, [allTransactions]);

  const calculateDaysAgo = (dateVal: string | Date) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffTime = nowTime - dTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  const handleMarkAsPaid = async (tx: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
    const customer = getField(tx, "customerName", "customer_name", "customer") || "Customer";
    
    const isConfirmed = await confirm({
      title: "Mark as Paid?",
      description: `Are you sure you want to mark transaction for ${customer} (₹${formatCurrency(cost)}) as completed and paid?`,
      confirmText: "Yes, Mark as Paid",
      cancelText: "Cancel",
    });

    if (!isConfirmed) return;

    try {
      const updatedTx = {
        ...tx,
        customerName: tx.customerName || tx.customer_name || tx.customer || "Customer",
        mobileNumber: tx.mobileNumber || tx.mobile_number || tx.phone || "0000000000",
        deviceModel: tx.deviceModel || tx.device_model || tx.device || "Unknown",
        repairType: tx.repairType || tx.repair_type || "other",
        paymentMethod: tx.paymentMethod || tx.payment_method || "cash",
        repairCost: cost,
        amountGiven: cost,
        changeReturned: 0,
        status: "Completed",
      };

      const res = await apiClient.updateTransaction(tx.id, updatedTx);
      if (res.success) {
        toast({
          title: "Payment Recorded",
          description: `Transaction for ${customer} has been updated to completed and paid.`,
        });
        fetchDashboardData();
      } else {
        throw new Error(res.error || "Update failed");
      }
    } catch (err: any) {
      console.error("Failed to mark as paid:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to mark transaction as paid",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 relative animate-in fade-in duration-500">
      {/* ── Onboarding Tour (shows once per browser) ── */}
      {/* <DashboardTour /> Disabled due to mobile touch issues */}
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
          <Link to="/transactions/new" className="hidden md:block" data-tour="new-txn">
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
            <Tippy
              content="Show or hide profit data — visible to owners and admins only"
              placement="bottom"
              animation="scale"
              delay={[300, 0]}
            >
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
            </Tippy>
          )}
        </div>
      </div>

      {/* ── Premium Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Today Revenue */}
        <Card 
          id="dashboard-today-card" 
          onClick={() => toggleCard('today')}
          className={cn(
            "relative overflow-hidden border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'today' ? "col-span-1 ring-2 ring-brand-green/50" : "col-span-1"
          )}
        >
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
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center">
              ₹<CountUp to={dashboardData.todayRevenue} separator="," duration={0.7} />
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-brand-green font-medium bg-brand-green/10 px-1.5 py-0.5 rounded-sm gap-0.5">
                  Profit: ₹<CountUp to={dashboardData.todayProfit} separator="," duration={0.7} />
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-brand-green" />
              <span className="text-brand-green font-medium">+₹{formatCurrency(dashboardData.todayRevenue)}</span> today
            </p>


          </CardContent>
        </Card>

        {/* Week Overview */}
        <Card 
          id="dashboard-week-card" 
          onClick={() => toggleCard('week')}
          className={cn(
            "relative overflow-hidden border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'week' ? "col-span-1 ring-2 ring-brand-blue/50" : "col-span-1"
          )}
        >
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
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center">
              ₹<CountUp to={dashboardData.weekRevenue} separator="," duration={0.7} />
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-brand-blue font-medium bg-brand-blue/10 px-1.5 py-0.5 rounded-sm gap-0.5">
                  Profit: ₹<CountUp to={dashboardData.weekProfit} separator="," duration={0.7} />
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-brand-blue font-medium">{dashboardData.completedTransactions}</span> completed this week
            </p>


          </CardContent>
        </Card>

        {/* Total Lifetime Revenue */}
        <Card 
          onClick={() => toggleCard('total')}
          className={cn(
            "relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'total' ? "col-span-1 ring-2 ring-primary/50" : "col-span-1"
          )}
        >
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
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center">
              ₹<CountUp to={dashboardData.totalRevenue} separator="," duration={0.7} />
            </div>
            {isOwnerOrAdmin && showProfits && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 animate-in slide-in-from-bottom-1 fade-in">
                <span className="inline-flex items-center text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-sm gap-0.5">
                  Profit: ₹<CountUp to={dashboardData.totalProfit} separator="," duration={0.7} />
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Over <span className="font-medium text-foreground">{dashboardData.totalTransactions}</span> lifetime transactions
            </p>


          </CardContent>
        </Card>

        {/* Pending Repairs */}
        <Card 
          onClick={() => toggleCard('pending')}
          className={cn(
            "relative overflow-hidden border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'pending' ? "col-span-1 ring-2 ring-red-500/50" : "col-span-1"
          )}
        >
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
              <CountUp to={pendingCount} duration={0.6} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="font-medium text-red-500">{pendingCount}</span> repairs awaiting completion
            </p>


          </CardContent>
        </Card>

        {/* Unpaid Transactions */}
        <Card 
          id="dashboard-unpaid-card" 
          onClick={() => toggleCard('unpaid')}
          className={cn(
            "relative overflow-hidden border-brand-orange/20 bg-gradient-to-br from-brand-orange/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'unpaid' ? "col-span-1 ring-2 ring-brand-orange/50" : "col-span-1"
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-orange/10 blur-2xl group-hover:bg-brand-orange/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Transactions
            </CardTitle>
            <div className="rounded-xl bg-brand-orange/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              <CountUp to={unpaidCount} duration={0.6} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-1">
              <span className="font-semibold text-brand-orange-light">{unpaidCount} unpaid</span>
              <span>· ₹{formatCurrency(unpaidOutstanding)} outstanding</span>
            </p>


          </CardContent>
        </Card>
      </div>

      {/* ── Apple Glassmorphism Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {expandedCard && (() => {
          const cardMeta: Record<string, { label: string; accent: string; accentBg: string; icon: React.ReactNode }> = {
            today:   { label: "Today's Revenue",     accent: 'text-brand-green',  accentBg: 'from-brand-green/20',   icon: <DollarSign className="h-4 w-4 text-brand-green" /> },
            week:    { label: 'This Week',             accent: 'text-brand-blue',   accentBg: 'from-brand-blue/20',    icon: <TrendingUp className="h-4 w-4 text-brand-blue" /> },
            total:   { label: 'Total Revenue',         accent: 'text-primary',      accentBg: 'from-primary/20',       icon: <CheckCircle2 className="h-4 w-4 text-primary" /> },
            pending: { label: 'Pending Repairs',       accent: 'text-red-400',      accentBg: 'from-red-500/20',       icon: <Wallet className="h-4 w-4 text-red-400" /> },
            unpaid:  { label: 'Unpaid Transactions',   accent: 'text-brand-orange', accentBg: 'from-brand-orange/20',  icon: <AlertCircle className="h-4 w-4 text-brand-orange" /> },
          };
          const meta = cardMeta[expandedCard];
          return (
            <>
              {/* Dim backdrop */}
              <motion.div
                key="glass-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setExpandedCard(null)}
              />
              {/* Glass panel */}
              <motion.div
                key="glass-panel"
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.8 }}
                className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm"
                style={{
                  background: 'rgba(12, 12, 20, 0.82)',
                  backdropFilter: 'blur(28px) saturate(180%) brightness(1.1)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%) brightness(1.1)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '24px',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {/* Gradient glow top */}
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${meta.accentBg} to-transparent rounded-t-[24px]`} />
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`rounded-xl p-2 bg-white/5 border border-white/10`}>{meta.icon}</div>
                    <span className={`text-sm font-semibold ${meta.accent}`}>{meta.label}</span>
                  </div>
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="rounded-full h-7 w-7 flex items-center justify-center bg-white/8 hover:bg-white/15 border border-white/10 transition-colors text-muted-foreground hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <div className="h-px bg-white/6 mx-5" />
                {/* Scrollable body */}
                <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-2 scrollbar-thin" onClick={(e) => e.stopPropagation()}>

                  {/* TODAY content */}
                  {expandedCard === 'today' && (
                    <>
                      {todayTransactions.length > 0 ? todayTransactions.map((tx: any) => {
                        const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
                        return (
                          <div key={tx.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                            <div className="min-w-0">
                              <p className="font-semibold truncate text-white">{tx.customerName || tx.customer_name || tx.customer || 'Customer'}</p>
                              <p className="text-[10px] text-white/50 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'} · {tx.repairType}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="font-bold text-white">₹{formatCurrency(cost)}</p>
                              <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase mt-0.5', getStatusColor(tx.status))}>{tx.status}</span>
                            </div>
                          </div>
                        );
                      }) : <p className="text-xs text-white/40 text-center py-6">No transactions today.</p>}
                      {todayTransactions.length > 0 && (
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/8 text-xs font-bold">
                          <span className="text-white/60">Today Total</span>
                          <span className="text-brand-green">₹{formatCurrency(todayTotal)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* WEEK content */}
                  {expandedCard === 'week' && (
                    <>
                      {weekTransactionsGrouped.length > 0 ? weekTransactionsGrouped.map((dayData: any) => (
                        <div key={dayData.day} className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-brand-blue/70 pb-0.5 border-b border-white/6">
                            <span>{dayData.day}</span><span>₹{formatCurrency(dayData.total)}</span>
                          </div>
                          {dayData.txs.map((tx: any) => {
                            const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
                            return (
                              <div key={tx.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/5 border border-white/8">
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-white">{tx.customerName || tx.customer_name || 'Customer'}</p>
                                  <p className="text-[10px] text-white/40 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'}</p>
                                </div>
                                <span className="font-semibold text-white shrink-0 ml-2">₹{formatCurrency(cost)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )) : <p className="text-xs text-white/40 text-center py-6">No transactions this week.</p>}
                      {weekTransactionsGrouped.length > 0 && (
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/8 text-xs font-bold">
                          <span className="text-white/60">Week Total</span>
                          <span className="text-brand-blue">₹{formatCurrency(weekTotal)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* TOTAL content */}
                  {expandedCard === 'total' && (
                    <>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-white/50">Repairs</span><span className="font-semibold text-white">₹{formatCurrency(totalBreakdown.repairTotal)}</span></div>
                        <div className="flex justify-between"><span className="text-white/50">Sales</span><span className="font-semibold text-white">₹{formatCurrency(totalBreakdown.saleTotal)}</span></div>
                        <p className="text-[10px] text-white/30 italic border-t border-white/8 pt-1.5">* Internal repairs excluded</p>
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest pt-1">Top 5 Highest Value</p>
                      {top5Transactions.length > 0 ? top5Transactions.map((tx: any) => {
                        const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
                        return (
                          <div key={tx.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/5 border border-white/8">
                            <div className="min-w-0">
                              <p className="font-medium truncate text-white">{tx.customerName || tx.customer_name || 'Customer'}</p>
                              <p className="text-[10px] text-white/40 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'} · {tx.repairType}</p>
                            </div>
                            <span className="font-bold text-primary shrink-0 ml-2">₹{formatCurrency(cost)}</span>
                          </div>
                        );
                      }) : <p className="text-[10px] text-white/40 text-center py-2">No transactions recorded.</p>}
                    </>
                  )}

                  {/* PENDING content */}
                  {expandedCard === 'pending' && (
                    <>
                      {pendingRepairsList.length > 0 ? pendingRepairsList.map((tx: any) => {
                        const dateStr = formatDate(tx.createdAt || tx.created_at || tx.date);
                        const daysAgo = calculateDaysAgo(tx.createdAt || tx.created_at || tx.date);
                        return (
                          <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2.5 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{tx.customerName || tx.customer_name || 'Customer'}</p>
                              <p className="text-white/50 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'} · {tx.repairType}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">{dateStr} · {daysAgo}</p>
                            </div>
                            <Link to={`/transactions/${tx.id}/edit`} onClick={() => setExpandedCard(null)}>
                              <Button size="sm" className="w-full min-h-[44px] bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">Take Action</Button>
                            </Link>
                          </div>
                        );
                      }) : <p className="text-xs text-white/40 text-center py-6">No pending repairs.</p>}
                    </>
                  )}

                  {/* UNPAID content */}
                  {expandedCard === 'unpaid' && (
                    <>
                      {unpaidTransactionsList.length > 0 ? unpaidTransactionsList.map((tx: any) => {
                        const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
                        const amountGiven = Number(tx.amountGiven ?? tx.amount_given ?? 0);
                        const owed = Math.max(0, cost - amountGiven);
                        const dateStr = formatDate(tx.createdAt || tx.created_at || tx.date);
                        return (
                          <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{tx.customerName || tx.customer_name || 'Customer'}</p>
                              <p className="text-white/50 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'} · {dateStr}</p>
                              <p className="text-brand-orange font-bold mt-1">₹{formatCurrency(owed)} owed</p>
                            </div>
                            <Button size="sm" onClick={(e) => handleMarkAsPaid(tx, e)} className="w-full min-h-[44px] bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold rounded-xl">Mark as Paid</Button>
                          </div>
                        );
                      }) : <p className="text-xs text-white/40 text-center py-6">No unpaid transactions.</p>}
                    </>
                  )}

                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Revenue Chart ─────────────────────────────────────────────── */}
        <Card id="revenue-chart" className="col-span-1 lg:col-span-2 border-muted shadow-sm hover:shadow-md transition-shadow flex flex-col">
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
              <AnimatedList
                items={recentTransactions}
                showGradients={false}
                displayScrollbar={false}
                enableArrowNavigation={false}
                className="border-0 bg-transparent rounded-none p-0 h-auto"
                listClassName="divide-y divide-border/50 p-0 flex flex-col"
                renderItem={(tx: any) => {
                  const customerName =
                    getField(tx, "customerName", "customer_name", "name") ||
                    `Customer #${tx.id}`;
                  const deviceModel =
                    getField(tx, "deviceModel", "device_model", "device_type", "device") || "—";
                  const repairType =
                    getField(tx, "repairType", "repair_type", "repair") || "—";
                  const cost = getField(tx, "repairCost", "repair_cost", "amountGiven", "amount_given");
                  const status = getField(tx, "status") || "pending";

                  return (
                    <div
                      className="flex items-center gap-3 px-4 py-3 sm:px-5 hover:bg-muted/30 transition-colors w-full"
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
                }}
              />
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
      {ConfirmModalElement}
    </div>
  );
}

