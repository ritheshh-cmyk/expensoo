import React from "react";
import { io } from "socket.io-client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ArrowDownRight,
  Eye,
  EyeOff,
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Filter period helpers ────────────────────────────────────────────────────
type FilterPeriod = 'today' | 'week' | 'month' | 'last30' | 'last6months' | 'year' | 'all';

const FILTER_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last6months', label: 'Last 6 Months' },
  { value: 'year',  label: 'This Year' },
  { value: 'all',   label: 'All Time' },
];

function getFilterStart(period: FilterPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    case 'week': {
      const d = new Date(now); d.setDate(now.getDate() - now.getDay()); d.setHours(0, 0, 0, 0); return d;
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1); return d;
    }
    case 'last30': {
      const d = new Date(now); d.setDate(now.getDate() - 30); d.setHours(0, 0, 0, 0); return d;
    }
    case 'last6months': {
      const d = new Date(now); d.setMonth(now.getMonth() - 6); d.setHours(0, 0, 0, 0); return d;
    }
    case 'year': {
      const d = new Date(now.getFullYear(), 0, 1); return d;
    }
    default: return null;
  }
}

function filterTxByPeriod(txs: any[], period: FilterPeriod): any[] {
  const start = getFilterStart(period);
  if (!start) return txs;
  return txs.filter((tx: any) => {
    const dStr = tx.createdAt || tx.created_at || tx.date;
    if (!dStr) return false;
    const d = new Date(dStr);
    return !isNaN(d.getTime()) && d >= start;
  });
}

function buildChartData(txs: any[], period: FilterPeriod) {
  const now = new Date();
  let days: { dateStr: string; dateObj: Date; total: number }[] = [];

  if (period === 'today') {
    // Hourly buckets for today
    days = Array.from({ length: 24 }).map((_, h) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);
      return { dateStr: `${h}:00`, dateObj: d, total: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const h = d.getHours();
      days[h].total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  } else if (period === 'week') {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      return { dateStr: names[d.getDay()], dateObj: d, total: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const idx = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  } else if (period === 'month' || period === 'last30') {
    // Sliding 30 days window for last30, or days since start of month for month
    const start = getFilterStart(period);
    const numDays = period === 'last30' ? 30 : now.getDate();
    days = Array.from({ length: numDays }).map((_, i) => {
      const d = new Date(now);
      if (period === 'last30') {
        d.setDate(now.getDate() - (30 - 1 - i));
      } else {
        d.setDate(1 + i);
      }
      return { dateStr: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), dateObj: d, total: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      if (start && d < start) return;
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const match = days.find(day => day.dateStr === dateStr);
      if (match) match.total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  } else if (period === 'last6months') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    days = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { dateStr: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`, dateObj: d, total: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const match = days.find(day => day.dateObj.getMonth() === monthIdx && day.dateObj.getFullYear() === year);
      if (match) match.total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  } else if (period === 'year') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    days = months.map((m, i) => ({ dateStr: m, dateObj: new Date(now.getFullYear(), i, 1), total: 0 }));
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== now.getFullYear()) return;
      days[d.getMonth()].total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  } else {
    // all: group by month for all time
    let minDate = new Date();
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (!isNaN(d.getTime()) && d < minDate) minDate = d;
    });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let curr = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (curr <= now) {
      days.push({
        dateStr: `${months[curr.getMonth()]} ${curr.getFullYear().toString().slice(-2)}`,
        dateObj: new Date(curr),
        total: 0
      });
      curr.setMonth(curr.getMonth() + 1);
    }
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const match = days.find(day => day.dateObj.getMonth() === monthIdx && day.dateObj.getFullYear() === year);
      if (match) match.total += Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
    });
  }
  return days.map(d => ({ name: d.dateStr, total: d.total }));
}

function buildProfitChartData(txs: any[], period: FilterPeriod) {
  const now = new Date();
  let days: { dateStr: string; dateObj: Date; profit: number }[] = [];

  if (period === 'today') {
    days = Array.from({ length: 24 }).map((_, h) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);
      return { dateStr: `${h}:00`, dateObj: d, profit: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const h = d.getHours();
      days[h].profit += parseFloat(tx.profit || '0');
    });
  } else if (period === 'week') {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      return { dateStr: names[d.getDay()], dateObj: d, profit: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const idx = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].profit += parseFloat(tx.profit || '0');
    });
  } else if (period === 'month' || period === 'last30') {
    const start = getFilterStart(period);
    const numDays = period === 'last30' ? 30 : now.getDate();
    days = Array.from({ length: numDays }).map((_, i) => {
      const d = new Date(now);
      if (period === 'last30') {
        d.setDate(now.getDate() - (30 - 1 - i));
      } else {
        d.setDate(1 + i);
      }
      return { dateStr: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), dateObj: d, profit: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      if (start && d < start) return;
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const match = days.find(day => day.dateStr === dateStr);
      if (match) match.profit += parseFloat(tx.profit || '0');
    });
  } else if (period === 'last6months') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    days = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { dateStr: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`, dateObj: d, profit: 0 };
    });
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const match = days.find(day => day.dateObj.getMonth() === monthIdx && day.dateObj.getFullYear() === year);
      if (match) match.profit += parseFloat(tx.profit || '0');
    });
  } else if (period === 'year') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    days = months.map((m, i) => ({ dateStr: m, dateObj: new Date(now.getFullYear(), i, 1), profit: 0 }));
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== now.getFullYear()) return;
      days[d.getMonth()].profit += parseFloat(tx.profit || '0');
    });
  } else {
    let minDate = new Date();
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (!isNaN(d.getTime()) && d < minDate) minDate = d;
    });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let curr = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (curr <= now) {
      days.push({
        dateStr: `${months[curr.getMonth()]} ${curr.getFullYear().toString().slice(-2)}`,
        dateObj: new Date(curr),
        profit: 0
      });
      curr.setMonth(curr.getMonth() + 1);
    }
    txs.forEach(tx => {
      const d = new Date(tx.createdAt || tx.created_at || tx.date);
      if (isNaN(d.getTime())) return;
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const match = days.find(day => day.dateObj.getMonth() === monthIdx && day.dateObj.getFullYear() === year);
      if (match) match.profit += parseFloat(tx.profit || '0');
    });
  }
  return days.map(d => ({ name: d.dateStr, profit: d.profit }));
}

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
  const shouldReduceMotion = useReducedMotion();
  const { user, hasAccess } = useAuth();
  const { confirm, ConfirmModalElement } = useConfirm();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [backendWaking, setBackendWaking] = useState(false);
  const wakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');

  // Default to TRUE so the profit card is visible out-of-the-box.
  // Only hide it if the user has explicitly toggled it off (stored as "false").
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") !== "false",
  );
  // Eye toggle — masks all ₹ amounts with •••••• (banking-app style)
  const [showAmounts, setShowAmounts] = useState(
    localStorage.getItem("showAmounts") !== "false",
  );
  const [profitLocalExpanded, setProfitLocalExpanded] = useState(false);
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

  const toggleAmounts = () => {
    const next = !showAmounts;
    setShowAmounts(next);
    localStorage.setItem("showAmounts", String(next));
  };

  // Returns masked value when amounts are hidden, formatted currency otherwise
  const maskedAmount = (value: number) =>
    showAmounts ? `₹${formatCurrency(value)}` : "₹ ••••••";

  // BUG 1 FIX: wrap in useCallback so socket listeners always hold a stable
  // reference to the latest function rather than a stale closure.
  const fetchDashboardData = useCallback(async (showToast = false) => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Show "backend waking up" banner after 4 seconds of waiting
    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = setTimeout(() => setBackendWaking(true), 4000);

    try {
      // 25-second timeout — Render free tier cold starts ~20s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const [dash, txns] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransactions(),
      ]);

      clearTimeout(timeoutId);

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

      // Chart data is built reactively from filterPeriod — set raw txns only
      setChartData(buildChartData(sortedTxns, filterPeriod));

      if (showToast) {
        toast({ title: "Refreshed", description: "Dashboard data updated." });
      }
    } catch (err: any) {
      console.error("[Dashboard] fetch error:", err);
      toast({
        title: err?.name === 'AbortError' ? "Server timeout" : "Sync Warning",
        description: err?.name === 'AbortError'
          ? "Backend took too long to respond. It may be starting up — try refreshing in 30s."
          : err.message || "Could not refresh dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setBackendWaking(false);
      if (wakeTimerRef.current) { clearTimeout(wakeTimerRef.current); wakeTimerRef.current = null; }
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

  // ── Filtered transactions for the selected period ──────────────────────────
  const filteredTransactions = useMemo(
    () => filterTxByPeriod(allTransactions, filterPeriod),
    [allTransactions, filterPeriod]
  );

  // Recompute chart whenever filter or raw data changes
  const filteredChartData = useMemo(
    () => buildChartData(allTransactions, filterPeriod),
    [allTransactions, filterPeriod]
  );

  const periodDesc = useMemo(() => {
    switch (filterPeriod) {
      case 'today': return "Hourly revenue for today";
      case 'week': return "Daily revenue for this week";
      case 'month': return "Daily revenue for this month";
      case 'last30': return "Daily revenue for the past 30 days";
      case 'last6months': return "Monthly revenue for the past 6 months";
      case 'year': return "Monthly revenue for this year";
      case 'all': return "Monthly revenue overall";
      default: return "Daily revenue overview";
    }
  }, [filterPeriod]);

  const emptyDesc = useMemo(() => {
    switch (filterPeriod) {
      case 'today': return "No data for today";
      case 'week': return "No data for this week";
      case 'month': return "No data for this month";
      case 'last30': return "No data for the past 30 days";
      case 'last6months': return "No data for the past 6 months";
      case 'year': return "No data for this year";
      case 'all': return "No data available";
      default: return "No data available";
    }
  }, [filterPeriod]);

  // Filtered metric values
  const filteredRevenue = useMemo(() =>
    filteredTransactions.reduce((s, tx) => s + Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0), 0),
    [filteredTransactions]
  );
  const filteredCount = filteredTransactions.length;
  const filteredCompleted = useMemo(() =>
    filteredTransactions.filter(tx => (tx.status || '').toLowerCase() === 'completed').length,
    [filteredTransactions]
  );
  const filteredPending = useMemo(() =>
    filteredTransactions.filter(tx => (tx.status || '').toLowerCase() === 'pending').length,
    [filteredTransactions]
  );
  const filteredUnpaid = useMemo(() =>
    filteredTransactions.filter(tx => (tx.status || '').toLowerCase() === 'unpaid'),
    [filteredTransactions]
  );
  const filteredUnpaidOutstanding = useMemo(() =>
    filteredUnpaid.reduce((s, tx) => {
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
      const given = Number(tx.amountGiven ?? tx.amount_given ?? 0);
      return s + Math.max(0, cost - given);
    }, 0),
    [filteredUnpaid]
  );

  // The card now shows plain pending count which is accurate and meaningful.
  const pendingCount = filteredPending;

  const filteredProfit = useMemo(() =>
    filteredTransactions.reduce((s, tx) => s + parseFloat(tx.profit || '0'), 0),
    [filteredTransactions]
  );

  const profitPercentage = useMemo(() => {
    if (filteredRevenue === 0) return 0;
    return (filteredProfit / filteredRevenue) * 100;
  }, [filteredProfit, filteredRevenue]);

  const filteredProfitBreakdown = useMemo(() => {
    let repairProfit = 0;
    let saleProfit = 0;
    filteredTransactions.forEach((tx) => {
      const type = (tx.repairType || "").toLowerCase();
      const profit = parseFloat(tx.profit || '0');
      if (type === "sale") {
        saleProfit += profit;
      } else if (type !== "internal-repair") {
        repairProfit += profit;
      }
    });
    return { repairProfit, saleProfit };
  }, [filteredTransactions]);

  const top5ProfitableTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => parseFloat(b.profit || '0') - parseFloat(a.profit || '0'))
      .slice(0, 5);
  }, [filteredTransactions]);

  const filteredProfitChartData = useMemo(() =>
    buildProfitChartData(allTransactions, filterPeriod),
    [allTransactions, filterPeriod]
  );

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

  // Use the same filterTxByPeriod engine as filteredRevenue to guarantee
  // zero numerical discrepancy when both cards cover the same 'today' period.
  const todayTransactions = useMemo(() => filterTxByPeriod(allTransactions, 'today'), [allTransactions]);

  const todayTotal = useMemo(() => {
    return todayTransactions.reduce((sum: number, tx: any) => {
      const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.amountGiven ?? tx.amount_given ?? 0);
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
      confirmLabel: "Yes, Mark as Paid",
      cancelLabel: "Cancel",
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
      {/* ── Backend cold-start banner ── */}
      {backendWaking && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm animate-in slide-in-from-top-2 duration-300">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          <span>Server is waking up — this can take up to 30 seconds on first load. Please wait…</span>
        </div>
      )}
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
          {/* Eye toggle — masks/unmasks all ₹ amounts */}
          <Tippy
            content={showAmounts ? "Hide all amounts" : "Show all amounts"}
            placement="bottom"
            animation="scale"
            delay={[300, 0]}
          >
            <Button
              variant="outline"
              size="icon"
              id="toggle-amounts-btn"
              data-testid="amounts-toggle"
              onClick={toggleAmounts}
              className="min-h-[44px] w-11 shadow-sm hover:shadow-md transition-all bg-background"
              style={{ touchAction: "manipulation" }}
              aria-label={showAmounts ? "Hide amounts" : "Show amounts"}
            >
              {showAmounts ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </Tippy>
          {isOwnerOrAdmin && (
            <Tippy
              content="Show or hide profit card — visible to owners and admins only"
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

      {/* ── Date Filter Dropdown Select ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card/40 backdrop-blur-md border border-border/40 p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter Period:</span>
          <Select value={filterPeriod} onValueChange={(val: FilterPeriod) => setFilterPeriod(val)}>
            <SelectTrigger 
              className="w-[180px] bg-background/50 border-border/60 h-9 text-xs font-semibold rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex items-center justify-between"
              id="dashboard-filter-trigger"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="border border-border/80 bg-popover/95 backdrop-blur-md z-[9999]">
              {FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium cursor-pointer">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/40">
          {filteredCount} transaction{filteredCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Premium Metric Cards ───────────────────────────────────────── */}
      {loading ? (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6", showProfits ? "lg:grid-cols-6" : "lg:grid-cols-5")}>
          {Array.from({ length: showProfits ? 6 : 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6", showProfits ? "lg:grid-cols-6" : "lg:grid-cols-5")}>
        {/* Revenue for period */}
        <Card 
          id="dashboard-today-card" 
          onClick={() => toggleCard('total')}
          className={cn(
            "relative overflow-hidden border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'total' ? "col-span-1 ring-2 ring-brand-green/50" : "col-span-1"
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-green/10 blur-2xl group-hover:bg-brand-green/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <div className="rounded-xl bg-brand-green/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4 text-brand-green" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center transition-all duration-300">
              {showAmounts ? (
                <>₹<CountUp to={filteredRevenue} separator="," duration={0.7} /></>
              ) : (
                <span className="tracking-widest text-muted-foreground/60">₹ ••••••</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-brand-green" />
              <span className="text-brand-green font-medium">{filteredCount} txns</span>
              {' '}· {FILTER_OPTIONS.find(o => o.value === filterPeriod)?.label}
            </p>
          </CardContent>
        </Card>

        {/* Transactions count for period */}
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
              Transactions
            </CardTitle>
            <div className="rounded-xl bg-brand-blue/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4 text-brand-blue" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center">
              <CountUp to={filteredCount} duration={0.7} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-brand-blue font-medium">{filteredCompleted}</span> completed
            </p>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card 
          id="dashboard-total-card"
          onClick={() => toggleCard('today')}
          className={cn(
            "relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow group cursor-pointer",
            expandedCard === 'today' ? "col-span-1 ring-2 ring-primary/50" : "col-span-1"
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center transition-all duration-300">
              {showAmounts ? (
                <>₹<CountUp to={todayTotal} separator="," duration={0.7} /></>
              ) : (
                <span className="tracking-widest text-muted-foreground/60">₹ ••••••</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Today
            </p>
          </CardContent>
        </Card>

        {/* Pending Repairs */}
        <Card 
          id="dashboard-pending-card"
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
              <span className="font-medium text-red-500">{pendingCount}</span> repairs awaiting
            </p>
          </CardContent>
        </Card>

        {/* Unpaid */}
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
              Unpaid
            </CardTitle>
            <div className="rounded-xl bg-brand-orange/10 p-2 shrink-0 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
              <CountUp to={filteredUnpaid.length} duration={0.6} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-1">
              <span className="font-semibold text-brand-orange-light">{filteredUnpaid.length} unpaid</span>
              <span>· {showAmounts ? `₹${formatCurrency(filteredUnpaidOutstanding)} due` : "₹ •••••• due"}</span>
            </p>
          </CardContent>
        </Card>

        {/* Profit Card */}
        {showProfits && (
          <Card 
            id="dashboard-profit-card" 
            onClick={() => toggleCard('profit')}
            className={cn(
              "relative overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between",
              filteredProfit >= 0 
                ? "border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-transparent" 
                : "border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent",
              expandedCard === 'profit' ? "col-span-1 ring-2 ring-brand-green/50" : "col-span-1"
            )}
          >
            <div className={cn(
              "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl group-hover:opacity-100 transition-opacity",
              filteredProfit >= 0 ? "bg-brand-green/10" : "bg-red-500/10"
            )} />
            
            <div>
              <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profit
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfitLocalExpanded(!profitLocalExpanded);
                    }}
                    className={cn(
                      "p-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0 z-10",
                      filteredProfit >= 0 ? "text-brand-green" : "text-red-500"
                    )}
                    title="Toggle breakdown panel"
                  >
                    {profitLocalExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <div className={cn(
                    "rounded-xl p-2 shrink-0 group-hover:scale-110 transition-transform",
                    filteredProfit >= 0 ? "bg-brand-green/10 text-brand-green" : "bg-red-500/10 text-red-500"
                  )}>
                    {filteredProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 pb-3">
                <div className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight flex items-center transition-all duration-300">
                  {showAmounts ? (
                    <>₹<CountUp to={filteredProfit} separator="," duration={0.7} /></>
                  ) : (
                    <span className="tracking-widest text-muted-foreground/60">₹ ••••••</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 flex-wrap">
                  {filteredProfit >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-brand-green" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={filteredProfit >= 0 ? "text-brand-green font-medium" : "text-red-500 font-medium"}>
                    {showAmounts ? `${profitPercentage.toFixed(1)}% margin` : "••% margin"}
                  </span>
                  {' '}· {FILTER_OPTIONS.find(o => o.value === filterPeriod)?.label}
                </p>
              </CardContent>
            </div>

            <AnimatePresence initial={false}>
              {profitLocalExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full border-t border-border/40 bg-black/10 px-4 py-3 text-xs space-y-1.5 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Repairs Profit:</span>
                    <span className={cn("font-medium font-mono", filteredProfitBreakdown.repairProfit >= 0 ? "text-brand-green" : "text-red-500")}>
                      ₹{formatCurrency(filteredProfitBreakdown.repairProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sales Profit:</span>
                    <span className={cn("font-medium font-mono", filteredProfitBreakdown.saleProfit >= 0 ? "text-brand-green" : "text-red-500")}>
                      ₹{formatCurrency(filteredProfitBreakdown.saleProfit)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}
      </div>
      )}

      {/* ── Apple Glassmorphism Overlay (Portal — renders on document.body, never clipped) */}
      {createPortal(
        <AnimatePresence>
          {expandedCard && (() => {
            const isProfitPositive = filteredProfit >= 0;
            const cardMeta: Record<string, { label: string; accent: string; accentBg: string; icon: React.ReactNode }> = {
              today:   { label: "Today's Revenue",     accent: 'text-brand-green',  accentBg: 'from-brand-green/20',   icon: <DollarSign className="h-4 w-4 text-brand-green" /> },
              week:    { label: 'This Week',             accent: 'text-brand-blue',   accentBg: 'from-brand-blue/20',    icon: <TrendingUp className="h-4 w-4 text-brand-blue" /> },
              total:   { label: 'Revenue Details',       accent: 'text-primary',      accentBg: 'from-primary/20',       icon: <CheckCircle2 className="h-4 w-4 text-primary" /> },
              pending: { label: 'Pending Repairs',       accent: 'text-red-400',      accentBg: 'from-red-500/20',       icon: <Wallet className="h-4 w-4 text-red-400" /> },
              unpaid:  { label: 'Unpaid Transactions',   accent: 'text-brand-orange', accentBg: 'from-brand-orange/20',  icon: <AlertCircle className="h-4 w-4 text-brand-orange" /> },
              profit:  { 
                label: 'Profit Details', 
                accent: isProfitPositive ? 'text-brand-green' : 'text-red-400', 
                accentBg: isProfitPositive ? 'from-brand-green/20' : 'from-red-500/20', 
                icon: isProfitPositive ? <TrendingUp className="h-4 w-4 text-brand-green" /> : <TrendingDown className="h-4 w-4 text-red-400" /> 
              },
            };
            const meta = cardMeta[expandedCard];
            return (
              <React.Fragment key={expandedCard}>
                {/* Dim backdrop */}
                <motion.div
                  id="glassmorphism-overlay-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)' }}
                  onClick={() => setExpandedCard(null)}
                />
                {/* Centering Wrapper Container */}
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    padding: '16px',
                  }}
                >
                  {/* Glass panel */}
                  <motion.div
                    id="glassmorphism-overlay-panel"
                    initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.93 }}
                    transition={shouldReduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 32, mass: 0.8 }}
                    style={{
                      pointerEvents: 'auto',
                      width: 'min(100%, 520px)',
                      maxHeight: 'min(85dvh, 640px)',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(12, 12, 20, 0.92)',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '24px',
                      boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
                      overflow: 'hidden',   /* clips accent glow to border-radius */
                    }}
                  >
                  {/* Accent glow line at top */}
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${meta.accentBg} to-transparent`} />

                  {/* ── Sticky header — always visible regardless of scroll ── */}
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      flexShrink: 0,
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                      background: 'rgba(12, 12, 20, 0.6)',
                    }}
                  >
                    <div className="flex items-center justify-between px-5 pt-5 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-xl p-2 bg-white/5 border border-white/10">{meta.icon}</div>
                        <span className={`text-sm font-semibold ${meta.accent}`}>{meta.label}</span>
                      </div>
                      <button
                        onClick={() => setExpandedCard(null)}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', width: 32, height: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}
                        aria-label="Close"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px 0' }} />
                  </div>

                  {/* ── Scrollable body — grows to fill remaining panel height ── */}
                  <div
                    className="px-5 py-4 space-y-2"
                    style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}
                    onClick={(e) => e.stopPropagation()}
                  >

                    {/* TODAY */}
                    {expandedCard === 'today' && (
                      <>
                        {todayTransactions.length > 0 ? todayTransactions.map((tx: any) => {
                          const cost = Number(tx.repairCost ?? tx.repair_cost ?? tx.cost ?? 0);
                          return (
                            <div key={tx.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                              <div className="min-w-0">
                                <p className="font-semibold truncate text-white">{tx.customerName || tx.customer_name || 'Customer'}</p>
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

                    {/* WEEK */}
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

                    {/* TOTAL */}
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

                    {/* PENDING */}
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

                    {/* UNPAID */}
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

                    {/* PROFIT */}
                    {expandedCard === 'profit' && (
                      <>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2 text-xs mb-4">
                          <div className="flex justify-between">
                            <span className="text-white/50">Repairs Profit</span>
                            <span className={cn("font-semibold", filteredProfitBreakdown.repairProfit >= 0 ? "text-brand-green" : "text-red-400")}>
                              ₹{formatCurrency(filteredProfitBreakdown.repairProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Sales Profit</span>
                            <span className={cn("font-semibold", filteredProfitBreakdown.saleProfit >= 0 ? "text-brand-green" : "text-red-400")}>
                              ₹{formatCurrency(filteredProfitBreakdown.saleProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-white/8 pt-2 font-bold">
                            <span className="text-white/70">Total Profit</span>
                            <span className={filteredProfit >= 0 ? "text-brand-green" : "text-red-400"}>
                              ₹{formatCurrency(filteredProfit)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest pt-1 mb-2">
                          Top 5 Most Profitable Transactions
                        </p>
                        {top5ProfitableTransactions.length > 0 ? top5ProfitableTransactions.map((tx) => {
                          const profitVal = parseFloat(tx.profit || '0');
                          return (
                            <div key={tx.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/5 border border-white/8 mb-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate text-white">{tx.customerName || tx.customer_name || 'Customer'}</p>
                                <p className="text-[10px] text-white/40 truncate mt-0.5">{tx.deviceModel || tx.device_model || 'Device'} · {tx.repairType}</p>
                              </div>
                              <span className={cn("font-bold shrink-0 ml-2", profitVal >= 0 ? "text-brand-green" : "text-red-400")}>
                                ₹{formatCurrency(profitVal)}
                              </span>
                            </div>
                          );
                        }) : <p className="text-[10px] text-white/40 text-center py-2">No profitable transactions recorded.</p>}

                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest pt-3 mb-2">
                          Profit Trend
                        </p>
                        <div className="w-full h-[150px] bg-white/5 rounded-xl border border-white/8 p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredProfitChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={filteredProfit >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={filteredProfit >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                                tickFormatter={(value) => `₹${value}`}
                              />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[10px]">
                                        <p className="font-semibold text-white">{payload[0].payload.name}</p>
                                        <p className="text-brand-green font-bold mt-0.5">₹{formatCurrency(payload[0].value)}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="profit" 
                                stroke={filteredProfit >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorProfit)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}

                  </div>
                </motion.div>
                </div>
              </React.Fragment>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Revenue Chart ─────────────────────────────────────────────── */}
        <Card id="revenue-chart" className="col-span-1 lg:col-span-2 border-muted shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <CardDescription>{periodDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="w-full h-[250px] bg-muted/20 animate-pulse rounded-lg" />
            ) : chartData.length > 0 ? (
              <div className="w-full">
                <AspectRatio ratio={16 / 9} className="w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                </AspectRatio>
              </div>
            ) : (
              <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
                {emptyDesc}
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
                  <SkeletonRow key={i} />
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

