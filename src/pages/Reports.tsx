import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Download,
  TrendingUp,
  PieChart,
  Eye,
  EyeOff,
  Smartphone,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { io } from "socket.io-client";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import { usePermissions } from "@/hooks/usePermissions";
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidRepairType = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.includes('+')) return false;
  const words = trimmed.split(/[\s_-]+/).filter(Boolean);
  if (words.length < 2) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('test') || lower.includes('battan')) return false;
  return true;
};

const CHART_COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F43F5E', '#64748B',
];



const getSliceColor = (name: string, index: number): string => {
  if (name.toLowerCase() === 'others') return '#64748B';
  return CHART_COLORS[index % (CHART_COLORS.length - 1)];
};

// ─── Custom tooltips ─────────────────────────────────────────────────────────

const RepairTypeTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 shadow-xl">
        <p className="text-sm font-semibold capitalize mb-1 text-foreground">{d.name}</p>
        <p className="text-xs text-muted-foreground">Count: <span className="font-semibold text-foreground">{d.count}</span></p>
        <p className="text-xs text-muted-foreground">Share: <span className="font-semibold text-brand-orange-light">{d.percentage.toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const RevTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 shadow-xl text-foreground min-w-[160px]">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span>₹{Number(p.value).toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 shadow-xl text-foreground">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name === 'revenue' ? 'Revenue' : 'Repairs'}</span>
            <span>{p.name === 'revenue' ? `₹${Number(p.value).toLocaleString()}` : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Section skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}



// ─── Growth badge helper ──────────────────────────────────────────────────────

function GrowthBadge({ value, hasPrevData }: { value: number; hasPrevData: boolean }) {
  if (!hasPrevData) {
    return <span className="text-xs text-muted-foreground">N/A — first period</span>;
  }
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {isPositive
        ? <ArrowUpRight className="h-3 w-3 text-emerald-400" />
        : <ArrowDownRight className="h-3 w-3 text-red-400" />}
      <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
        {isPositive ? '+' : ''}{value}%
      </span>
      <span className="text-muted-foreground">vs prev period</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Reports() {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const canViewProfits = can('reports.profits');

  const [showProfits, setShowProfits] = useState(
    canViewProfits && localStorage.getItem("showProfits") === "true",
  );
  const effectiveShowProfits = canViewProfits && showProfits;

  const [timeRange, setTimeRange] = useState("last6months");

  // ── Loading state per section ────────────────────────────────────────────────
  const [loadingMain, setLoadingMain]         = useState(true);
  const [loadingSupplier, setLoadingSupplier] = useState(true);

  // ── Data state ────────────────────────────────────────────────────────────────
  const [reportsData, setReportsData] = useState({
    totalRevenue:  0, totalProfit:  0, totalRepairs:    0,
    totalCustomers: 0, avgTicketSize: 0,
    revenueGrowth: 0, profitGrowth:  0, repairGrowth:  0,
    hasPrevRevenue: false, hasPrevRepairs: false, hasPrevProfit: false,
  });
    const [monthlyData,      setMonthlyData]      = useState<any[]>([]);
  const [repairTypesData,  setRepairTypesData]  = useState<any[]>([]);
  const [deviceBrandsData, setDeviceBrandsData] = useState<any[]>([]);
  const [supplierData,     setSupplierData]     = useState<any[]>([]);

  const [showAllBrands, setShowAllBrands] = useState(false);
  const abortRef = useRef(null);
  const abortSupplierRef = useRef(null);

  const toggleProfits = () => {
    if (!canViewProfits) return;
    const next = !showProfits;
    setShowProfits(next);
    localStorage.setItem("showProfits", String(next));
  };

    // ─── Fetch main data (transactions) ─────────────────────────────────────────
  const fetchMain = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoadingMain(false); return; }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingMain(true);
    try {
      const txnRes = await apiClient.getTransactions();
      if (controller.signal.aborted) return;
      const transactionsArr: any[] = Array.isArray(txnRes?.data) ? txnRes.data : [];

      // ── Time range cutoffs ────────────────────────────────────────────────
      const now = new Date();
      const cutoffMap: Record<string, number> = {
        last30days:  30,
        last3months: 90,
        last6months: 180,
        lastyear:    365,
      };
      const cutoffDays = cutoffMap[timeRange] ?? 180;
      const cutoff     = new Date(now.getTime() - cutoffDays * 86400000);
      // Previous period window (same length, ending at cutoff)
      const prevCutoff = new Date(cutoff.getTime() - cutoffDays * 86400000);

      // ── Maps ──────────────────────────────────────────────────────────────
      // FIX #7: monthly key includes year to prevent cross-year collision
      const monthlyStats    = new Map<string, { month: string; revenue: number; profit: number; repairs: number; year: number }>();
      const repairTypesMap  = new Map<string, number>();
      const deviceBrandsMap = new Map<string, { repairs: number; revenue: number }>();

      let prevRevenue = 0;
      let prevRepairs = 0;
      let prevProfit  = 0;

      transactionsArr.forEach((tx: any) => {
        const date = new Date(tx.createdAt || tx.created_at || tx.date || Date.now());
        const txRevenue = Number(
          tx.cost ?? tx.repairCost ?? tx.repair_cost ??
          tx.soldPrice ?? tx.sold_price ?? 0
        );
        const txProfit = Number(tx.profit ?? 0);

        // Accumulate previous period totals (for growth metrics)
        if (date >= prevCutoff && date < cutoff) {
          prevRevenue += txRevenue;
          prevRepairs += 1;
          prevProfit  += txProfit;
        }

        // Skip anything outside current period
        if (date < cutoff) return;

        // ── Monthly chart ─────────────────────────────────────────────────
        // FIX #7: key = "Jan 25" so two Januaries don't merge
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        const yearNum    = date.getFullYear();
        const monthKey   = `${monthLabel} '${String(yearNum).slice(2)}`;
        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, { month: monthKey, revenue: 0, profit: 0, repairs: 0, year: yearNum });
        }
        const m = monthlyStats.get(monthKey)!;
        m.revenue += txRevenue;
        m.profit  += txProfit;
        m.repairs += 1;

        // ── Repair types ──────────────────────────────────────────────────
        const rt = tx.repairType ?? tx.repair_type ?? 'Other';
        if (isValidRepairType(rt)) repairTypesMap.set(rt, (repairTypesMap.get(rt) || 0) + 1);

        // ── Device brands ─────────────────────────────────────────────────
        const brand = (tx.deviceModel ?? tx.device_model ?? 'Unknown').split(' ')[0];
        if (!deviceBrandsMap.has(brand)) deviceBrandsMap.set(brand, { repairs: 0, revenue: 0 });
        const bd = deviceBrandsMap.get(brand)!;
        bd.repairs += 1;
        bd.revenue += txRevenue;

        
      });

      // ── Monthly chart: sort by year then month ────────────────────────────
      const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthlyChartData = Array.from(monthlyStats.values())
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          const aM = a.month.split(' ')[0];
          const bM = b.month.split(' ')[0];
          return monthOrder.indexOf(aM) - monthOrder.indexOf(bM);
        });

      // ── Repair types with Others grouping ─────────────────────────────────
      const totalValidCount = Array.from(repairTypesMap.values()).reduce((s, c) => s + c, 0);
      const raw = Array.from(repairTypesMap.entries()).map(([name, count]) => ({
        name, count, percentage: totalValidCount > 0 ? (count / totalValidCount) * 100 : 0,
      }));
      const mainCats: any[] = []; let othersCount = 0; let othersPct = 0;
      raw.forEach(item => {
        if (item.percentage < 5) { othersCount += item.count; othersPct += item.percentage; }
        else mainCats.push(item);
      });
      mainCats.sort((a, b) => b.count - a.count);
      if (othersCount > 0) mainCats.push({ name: 'Others', count: othersCount, percentage: othersPct });
      const repairTypes = mainCats.map(item => ({
        name: item.name, value: Math.round(item.percentage),
        percentage: item.percentage, count: item.count,
      }));

      // ── Device brands (sorted desc by revenue) ────────────────────────────
      const deviceBrandsArr = Array.from(deviceBrandsMap.entries())
        .map(([brand, data]) => ({ brand, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      

      // ── FIX #1: All KPIs computed from filtered transactions ──────────────
      const curRevenue = monthlyChartData.reduce((s, m) => s + m.revenue, 0);
      const curRepairs = monthlyChartData.reduce((s, m) => s + m.repairs, 0);
      const curProfit  = monthlyChartData.reduce((s, m) => s + m.profit,  0);
      const avgTicketSize = curRepairs > 0 ? Math.round(curRevenue / curRepairs) : 0;

      // FIX #3 + #10: compute all three growth values; flag if no prev data
      const hasPrevRevenue = prevRevenue > 0;
      const hasPrevRepairs = prevRepairs > 0;
      const hasPrevProfit  = prevProfit  > 0;
      const revenueGrowth  = hasPrevRevenue ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100) : 0;
      const repairGrowth   = hasPrevRepairs ? Math.round(((curRepairs - prevRepairs) / prevRepairs) * 100) : 0;
      const profitGrowth   = hasPrevProfit  ? Math.round(((curProfit  - prevProfit)  / prevProfit)  * 100) : 0;

            if (controller.signal.aborted) return;

      // FIX #2: no fallback to unrelated totalRepairs
      setReportsData({
        totalRevenue:  curRevenue,
        totalProfit:   curProfit,
        totalRepairs:  curRepairs,
        totalCustomers: 0,   // FIX #2
        avgTicketSize,
        revenueGrowth, profitGrowth, repairGrowth,
        hasPrevRevenue, hasPrevRepairs, hasPrevProfit,
      });
      setMonthlyData(monthlyChartData);
      setRepairTypesData(repairTypes);
      setDeviceBrandsData(deviceBrandsArr);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('[Reports] main fetch error:', err);
      toast({ title: 'Error', description: 'Failed to load reports data', variant: 'destructive' });
    } finally {
      if (controller.signal.aborted) return;
      setLoadingMain(false);
    }
  }, [timeRange]);

  // ─── Fetch supplier data (lifetime — expenditures don't have per-period dates always) ─
  // FIX #6: added timeRange as dep so re-fetches when range changes;
  //          if your expenditures API doesn't filter by date this is still a no-op refresh
    const fetchSupplier = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoadingSupplier(false); return; }

    if (abortSupplierRef.current) abortSupplierRef.current.abort();
    const controller = new AbortController();
    abortSupplierRef.current = controller;

    setLoadingSupplier(true);
    try {
      const res = await apiClient.getExpenditures();
      if (controller.signal.aborted) return;
      const allExp: any[] = Array.isArray(res?.data) ? res.data : [];

      // Filter supplier-related categories
      const SUPPLIER_CATS = ['supplier', 'suppliers', 'vendor', 'purchase', 'stock', 'inventory'];
      const supplierExp = allExp.filter((e: any) => {
        const cat = (e.category ?? e.type ?? '').toLowerCase();
        return SUPPLIER_CATS.some(c => cat.includes(c));
      });

      // Group by supplier name
      const supplierMap = new Map<string, { orders: number; total: number }>();
      supplierExp.forEach((e: any) => {
        const name   = e.supplierName ?? e.supplier_name ?? e.vendor ?? e.description ?? e.name ?? 'Unknown';
        const amount = Number(e.amount ?? e.total ?? e.cost ?? 0);
        if (!supplierMap.has(name)) supplierMap.set(name, { orders: 0, total: 0 });
        const s = supplierMap.get(name)!;
        s.orders += 1;
        s.total  += amount;
      });

      const arr = Array.from(supplierMap.entries())
        .map(([supplier, data]) => ({
          supplier,
          orders: data.orders,
          total:  data.total,
          avg:    data.orders > 0 ? Math.round(data.total / data.orders) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      setSupplierData(arr);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('[Reports] supplier fetch error:', err);
    } finally {
      if (controller.signal.aborted) return;
      setLoadingSupplier(false);
    }
  }, [timeRange]); // FIX #6: re-fetches when timeRange changes

    // Keep latest callbacks in refs so socket connection doesn't restart
  const fetchMainRef = useRef(fetchMain);
  const fetchSupplierRef = useRef(fetchSupplier);

  useEffect(() => {
    fetchMainRef.current = fetchMain;
    fetchSupplierRef.current = fetchSupplier;
  }, [fetchMain, fetchSupplier]);

  // Run both in parallel on mount / timeRange change
  useEffect(() => {
    Promise.all([fetchMain(), fetchSupplier()]);
  }, [fetchMain, fetchSupplier]);

  // ── Socket.io real-time updates ──────────────────────────────────────────────
  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL ||
      import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
      'https://backendmobile-4swg.onrender.com';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socket.on('connect_error', (err: Error) => console.warn('Reports socket (non-fatal):', err.message));
    const update = () => {
      Promise.all([fetchMainRef.current(), fetchSupplierRef.current()]);
    };
    ['transactionCreated','transactionUpdated','transactionDeleted',
     'expenditureCreated','expenditureUpdated','expenditureDeleted'].forEach(ev => socket.on(ev, update));
    return () => {
      ['transactionCreated','transactionUpdated','transactionDeleted',
       'expenditureCreated','expenditureUpdated','expenditureDeleted'].forEach(ev => socket.off(ev, update));
      socket.disconnect();
    };
  }, []);

    // ── Derived values (all memoised) ────────────────────────────────────────────
  const visibleBrands = useMemo(
    () => showAllBrands ? deviceBrandsData : deviceBrandsData.slice(0, 5),
    [deviceBrandsData, showAllBrands]
  );

  const supplierTotal = useMemo(
    () => supplierData.reduce((s, r) => s + r.total, 0),
    [supplierData]
  );

  // FIX #14: memoize maxSupplierTotal
  const maxSupplierTotal = useMemo(
    () => supplierData.length > 0 ? supplierData[0].total : 1,
    [supplierData]
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
            {t("reports")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analytics &amp; business insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] bg-background border-border h-9">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" avoidCollisions={false}>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
          {canViewProfits && (
            <Button variant="outline" size="sm" onClick={toggleProfits} className="h-9 bg-background border-border">
              {effectiveShowProfits ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {effectiveShowProfits ? "Hide Profits" : "Show Profits"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 bg-background border-border">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {loadingMain ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Revenue — FIX #1: from filtered transactions, not all-time backend */}
          <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</span>
              <div className="p-2 rounded-lg bg-brand-orange/10"><DollarSign className="h-4 w-4 text-brand-orange" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-heading">
              ₹{reportsData.totalRevenue.toLocaleString()}
            </div>
            {/* FIX #10: show N/A when no previous period */}
            <GrowthBadge value={reportsData.revenueGrowth} hasPrevData={reportsData.hasPrevRevenue} />
          </div>

          {/* Total Repairs / Profit — FIX #1 + #3: from filtered data, real profit growth */}
          <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {effectiveShowProfits ? 'Total Profit' : 'Total Repairs'}
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10">
                {effectiveShowProfits ? <TrendingUp className="h-4 w-4 text-blue-400" /> : <Smartphone className="h-4 w-4 text-blue-400" />}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-heading">
              {effectiveShowProfits
                ? `₹${reportsData.totalProfit.toLocaleString()}`
                : reportsData.totalRepairs.toLocaleString()}
            </div>
            <GrowthBadge
              value={effectiveShowProfits ? reportsData.profitGrowth : reportsData.repairGrowth}
              hasPrevData={effectiveShowProfits ? reportsData.hasPrevProfit : reportsData.hasPrevRepairs}
            />
          </div>

          {/* Avg Ticket — FIX #4: now consistent with period revenue */}
          <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Ticket Size</span>
              <div className="p-2 rounded-lg bg-violet-500/10"><Target className="h-4 w-4 text-violet-400" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-heading">
              ₹{reportsData.avgTicketSize.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per repair in period</p>
          </div>

                    {/* Supplier Spend */}
          <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Supplier Spend</span>
              <div className="p-2 rounded-lg bg-emerald-500/10"><Package className="h-4 w-4 text-emerald-400" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-heading">
              ₹{supplierTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{supplierData.length} active suppliers</p>
          </div>
        </div>
      )}

            {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue & Profit Trend — FIX #15: proper empty state; FIX #16: wider YAxis */}
        <div className="rounded-xl border border-border bg-background p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Revenue &amp; Profit Trend</h3>
          {loadingMain ? (
            <div className="h-52 rounded-lg bg-white/5 animate-pulse" />
          ) : monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground gap-2">
              <TrendingDown className="h-8 w-8 opacity-30" />
              <p className="text-sm">No transactions in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} tickMargin={8} minTickGap={10} />
                {/* FIX #16: width=56 prevents large rupee values from clipping */}
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  width={56}
                />
                <Tooltip content={<RevTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#gradRev)" strokeWidth={2} name="Revenue" />
                {effectiveShowProfits && (
                  <Area type="monotone" dataKey="profit" stroke="#10B981" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Repair Types Distribution */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Repair Types Distribution</h3>
          {loadingMain ? (
            <div className="h-52 rounded-lg bg-white/5 animate-pulse" />
          ) : repairTypesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground gap-2">
              <PieChart className="h-8 w-8 opacity-30" />
              <p className="text-sm">No repair data yet</p>
            </div>
          ) : (() => {
            const total = repairTypesData.reduce((s, i) => s + i.count, 0);
            return (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={repairTypesData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%"
                           paddingAngle={2} dataKey="count">
                        {repairTypesData.map((e, i) => <Cell key={i} fill={getSliceColor(e.name, i)} />)}
                      </Pie>
                      <Tooltip content={<RepairTypeTooltip />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-foreground">{total}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">repairs</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-2 w-full">
                  {repairTypesData.map((e, i) => {
                    const color = getSliceColor(e.name, i);
                    return (
                      <div key={e.name} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            {e.name}
                          </span>
                          <span className="text-muted-foreground font-mono">{e.count} ({e.percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${e.percentage}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Device Brand Performance — FIX #16 YAxis width; FIX #17 LabelList offset */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Device Brand Performance</h3>
            {deviceBrandsData.length > 5 && (
              <button
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {showAllBrands ? 'Show less' : `Show all ${deviceBrandsData.length}`}
              </button>
            )}
          </div>
          {loadingMain ? (
            <div className="h-52 rounded-lg bg-white/5 animate-pulse" />
          ) : visibleBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground gap-2">
              <Smartphone className="h-8 w-8 opacity-30" />
              <p className="text-sm">No device data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsBarChart data={visibleBrands} margin={{ top: 24, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="barGradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="brand" tick={{ fill: '#71717a', fontSize: 10 }} tickMargin={8} />
                {/* FIX #16: wider to avoid clipping */}
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} width={40} />
                <Tooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="repairs" fill="url(#barGrad)" name="Repairs" radius={[4, 4, 0, 0]}>
                  {/* FIX #17: offset=4 prevents label-tick overlap on short bars */}
                  <LabelList dataKey="repairs" position="top" offset={4} style={{ fontSize: 10, fill: '#a1a1aa' }} />
                </Bar>
                {effectiveShowProfits && (
                  <Bar dataKey="revenue" fill="url(#barGradRev)" name="Revenue" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="revenue"
                      position="top"
                      offset={4}
                      style={{ fontSize: 9, fill: '#a1a1aa' }}
                      formatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                    />
                  </Bar>
                )}
              </RechartsBarChart>
            </ResponsiveContainer>
          )}
        </div>

        
      </div>

      {/* ── Data Tables ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Repair Analysis */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Repair Analysis</h3>
            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-full border border-border">
              {repairTypesData.reduce((s: number, r: any) => s + r.count, 0)} jobs
            </span>
          </div>
          {loadingMain ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="space-y-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            </div>
          ) : repairTypesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm">No repair data in this period.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Repair Types</p>
                  <p className="text-xl font-bold text-foreground">{repairTypesData.length}</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Top Type</p>
                  <p className="text-sm font-bold text-primary truncate">{repairTypesData[0]?.name ?? '—'}</p>
                </div>
              </div>

                            {/* Repair type breakdown */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Repair Type</p>
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {repairTypesData.map((r: any, i: number) => {
                    const REPAIR_COLORS = [
                      'bg-primary', 'bg-brand-orange', 'bg-brand-green',
                      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500',
                    ];
                    const col = REPAIR_COLORS[i % REPAIR_COLORS.length];
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", col)} />
                            <span className="font-medium text-foreground truncate">{r.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                            <span className="font-mono font-semibold text-foreground text-sm">{r.count}</span>
                            <span className="text-xs text-muted-foreground w-8 text-right">{r.value}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", col)}
                            style={{ width: `${r.value}%`, opacity: 0.85 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

                            {/* Top device brands mini-table */}
              {deviceBrandsData.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Top Device Brands</p>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {deviceBrandsData.slice(0, 4).map((b: any, i: number) => {
                      const maxRev = deviceBrandsData[0]?.revenue || 1;
                      const pct = Math.round((b.revenue / maxRev) * 100);
                      return (
                        <div key={i} className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-foreground truncate min-w-0">{b.brand}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{b.repairs} repairs</span>
                            <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-xs font-semibold text-foreground w-16 text-right">₹{b.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Supplier Analysis */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Supplier Analysis</h3>
            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-full border border-border">
              {supplierData.length} suppliers
            </span>
          </div>
          {loadingSupplier ? (
            <div className="space-y-3">
              {/* Summary skeletons */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            </div>
          ) : supplierData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">No supplier payments yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Record expenditures with a supplier to see spending analysis here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Suppliers</p>
                  <p className="text-xl font-bold text-foreground">{supplierData.length}</p>
                </div>
                <div className="rounded-lg border border-brand-orange/20 bg-brand-orange/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-brand-orange font-mono">₹{supplierTotal.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg / Order</p>
                  <p className="text-lg font-bold text-foreground font-mono">
                    ₹{supplierData.length > 0
                      ? Math.round(supplierTotal / supplierData.reduce((s, r) => s + r.orders, 0)).toLocaleString()
                      : 0}
                  </p>
                </div>
              </div>

                            {/* Per-supplier breakdown with visual bars */}
              <div className="space-y-3 max-h-[385px] overflow-y-auto pr-1">
                {supplierData.map((s, i) => {
                  const pct = maxSupplierTotal > 0 ? Math.round((s.total / maxSupplierTotal) * 100) : 0;
                  const barColors = [
                    'bg-brand-orange', 'bg-brand-green', 'bg-primary',
                    'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
                  ];
                  const barColor = barColors[i % barColors.length];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", barColor)} />
                          <span className="font-medium text-foreground truncate">{s.supplier}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{s.orders} orders</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-semibold text-foreground text-sm">₹{s.total.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", barColor)}
                          style={{ width: `${pct}%`, opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                <span className="text-muted-foreground">Total ({supplierData.reduce((s, r) => s + r.orders, 0)} orders)</span>
                <span className="font-mono font-bold text-foreground">₹{supplierTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>


      
    </div>
  );
}
