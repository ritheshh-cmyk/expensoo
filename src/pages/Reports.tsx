import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Download,
  TrendingUp,
  Calendar,
  PieChart,
  Eye,
  EyeOff,
  Users,
  Smartphone,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Plus,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
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

const SEG_COLORS = {
  frequent: '#10B981',
  regular:  '#3B82F6',
  oneTime:  '#F59E0B',
};

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

// ─── Customer tier helper ─────────────────────────────────────────────────────

function customerTier(repairs: number): { label: string; color: string; border: string } {
  if (repairs > 3) return { label: 'High',   color: 'text-emerald-400', border: 'border-l-4 border-emerald-500' };
  if (repairs >= 2) return { label: 'Medium', color: 'text-amber-400',   border: 'border-l-4 border-amber-500' };
  return               { label: 'Low',    color: 'text-muted-foreground', border: 'border-l-4 border-border' };
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
  const [topCustomersData, setTopCustomersData] = useState<any[]>([]);
  const [freeItemsData,    setFreeItemsData]    = useState<any[]>([]);
  const [customerSegments, setCustomerSegments] = useState({ frequent: 0, regular: 0, oneTime: 0 });
  const [supplierData,     setSupplierData]     = useState<any[]>([]);

  const [showAllBrands, setShowAllBrands] = useState(false);

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
    setLoadingMain(true);
    try {
      const txnRes = await apiClient.getTransactions();
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
      const customersMap    = new Map<string, { name: string; repairs: number; revenue: number; lastVisit: string }>();

      let prevRevenue = 0;
      let prevRepairs = 0;
      let prevProfit  = 0;

      // FIX #5: free items also filtered by time range
      const freeItems: any[] = [];

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

        // ── Customers ─────────────────────────────────────────────────────
        const cId = tx.mobileNumber ?? tx.mobile_number ?? tx.customer ?? tx.customerName ?? tx.customer_name ?? 'Unknown';
        if (!customersMap.has(cId)) {
          customersMap.set(cId, {
            name: tx.customer ?? tx.customerName ?? tx.customer_name ?? `Customer ${cId}`,
            repairs: 0, revenue: 0,
            lastVisit: date.toISOString(),
          });
        }
        const cd = customersMap.get(cId)!;
        cd.repairs += 1;
        cd.revenue += txRevenue;
        if (date > new Date(cd.lastVisit)) cd.lastVisit = date.toISOString();

        // ── Free items (FIX #5: only within current period) ───────────────
        const fg = Number(tx.freeGlass ?? (tx.freeGlassInstallation ?? tx.free_glass_installation ? 1 : 0));
        const fc = Number(tx.freeCover ?? 0);
        if (fg > 0 || fc > 0) {
          freeItems.push({
            id:        String(tx.id || ''),
            date:      tx.createdAt || tx.created_at || tx.date || Date.now(),
            customer:  String(tx.customerName ?? tx.customer_name ?? tx.customer ?? 'Unknown'),
            freeGlass: fg,
            freeCover:  fc,
          });
        }
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

      // ── Customer segments ─────────────────────────────────────────────────
      let frequent = 0, regular = 0, oneTime = 0;
      customersMap.forEach(c => {
        if (c.repairs > 3) frequent++;
        else if (c.repairs >= 2) regular++;
        else oneTime++;
      });

      // ── Top customers ─────────────────────────────────────────────────────
      const topCustomersArr = Array.from(customersMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

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

      // FIX #2: no fallback to unrelated totalRepairs
      setReportsData({
        totalRevenue:  curRevenue,
        totalProfit:   curProfit,
        totalRepairs:  curRepairs,
        totalCustomers: customersMap.size,   // FIX #2
        avgTicketSize,
        revenueGrowth, profitGrowth, repairGrowth,
        hasPrevRevenue, hasPrevRepairs, hasPrevProfit,
      });
      setMonthlyData(monthlyChartData);
      setRepairTypesData(repairTypes);
      setDeviceBrandsData(deviceBrandsArr);
      setTopCustomersData(topCustomersArr);
      setCustomerSegments({ frequent, regular, oneTime });
      setFreeItemsData(freeItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error('[Reports] main fetch error:', err);
      toast({ title: 'Error', description: 'Failed to load reports data', variant: 'destructive' });
    } finally {
      setLoadingMain(false);
    }
  }, [timeRange]);

  // ─── Fetch supplier data (lifetime — expenditures don't have per-period dates always) ─
  // FIX #6: added timeRange as dep so re-fetches when range changes;
  //          if your expenditures API doesn't filter by date this is still a no-op refresh
  const fetchSupplier = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoadingSupplier(false); return; }
    setLoadingSupplier(true);
    try {
      const res = await apiClient.getExpenditures();
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
      console.error('[Reports] supplier fetch error:', err);
    } finally {
      setLoadingSupplier(false);
    }
  }, [timeRange]); // FIX #6: re-fetches when timeRange changes

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
    const update = () => Promise.all([fetchMain(), fetchSupplier()]);
    ['transactionCreated','transactionUpdated','transactionDeleted',
     'expenditureCreated','expenditureUpdated','expenditureDeleted'].forEach(ev => socket.on(ev, update));
    return () => {
      ['transactionCreated','transactionUpdated','transactionDeleted',
       'expenditureCreated','expenditureUpdated','expenditureDeleted'].forEach(ev => socket.off(ev, update));
      socket.disconnect();
    };
  }, [fetchMain, fetchSupplier]);

  // ── Derived values (all memoised) ────────────────────────────────────────────
  const totalSegments = customerSegments.frequent + customerSegments.regular + customerSegments.oneTime;
  const segPct = (n: number) => totalSegments > 0 ? Math.round((n / totalSegments) * 100) : 0;

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

  const freeGlassTotal = useMemo(() => freeItemsData.reduce((s, i) => s + i.freeGlass, 0), [freeItemsData]);
  const freeCoverTotal = useMemo(() => freeItemsData.reduce((s, i) => s + i.freeCover, 0), [freeItemsData]);

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

          {/* Customer Base — FIX #2: never shows totalRepairs as fallback */}
          <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Customer Base</span>
              <div className="p-2 rounded-lg bg-emerald-500/10"><Users className="h-4 w-4 text-emerald-400" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-heading">
              {reportsData.totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unique in period</p>
          </div>
        </div>
      )}

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue & Profit Trend — FIX #15: proper empty state; FIX #16: wider YAxis */}
        <div className="rounded-xl border border-border bg-background p-5">
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

        {/* Customer Segments */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Customer Segments</h3>
          {loadingMain ? (
            <SectionSkeleton rows={3} />
          ) : totalSegments === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-sm">No customer data yet</p>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {[
                { label: 'Frequent Customers', subtitle: '4+ transactions', count: customerSegments.frequent, color: SEG_COLORS.frequent, pct: segPct(customerSegments.frequent) },
                { label: 'Regular Customers',  subtitle: '2–3 transactions', count: customerSegments.regular,  color: SEG_COLORS.regular,  pct: segPct(customerSegments.regular) },
                { label: 'One-time Customers', subtitle: '1 transaction',    count: customerSegments.oneTime,  color: SEG_COLORS.oneTime,  pct: segPct(customerSegments.oneTime) },
              ].map(seg => (
                <div key={seg.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <div>
                        <span className="font-medium text-foreground">{seg.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({seg.subtitle})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{seg.count}</span>
                      <span className="text-xs text-muted-foreground ml-1">· {seg.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Total: <span className="font-medium text-foreground">{totalSegments}</span> unique customers in period
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Data Tables ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Customers */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Customers</h3>
          {loadingMain ? (
            <div className="space-y-1">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/30">
                      <TableHead className="text-muted-foreground">Customer</TableHead>
                      <TableHead className="text-muted-foreground">Repairs</TableHead>
                      <TableHead className="text-muted-foreground">Revenue</TableHead>
                      <TableHead className="text-muted-foreground">Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomersData.length > 0 ? topCustomersData.map((c, i) => {
                      const tier = customerTier(c.repairs);
                      const ago  = c.lastVisit ? (() => {
                        const d = new Date(c.lastVisit);
                        if (isNaN(d.getTime())) return '—';
                        const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
                        if (diff === 0) return 'Today';
                        if (diff === 1) return 'Yesterday';
                        return `${diff}d ago`;
                      })() : '—';
                      return (
                        <TableRow key={i} className={cn("border-border hover:bg-muted/30 transition-colors", tier.border)}>
                          <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                          <TableCell>
                            <span className={cn("font-semibold", tier.color)}>{c.repairs}</span>
                          </TableCell>
                          <TableCell className="text-foreground font-mono text-sm">
                            ₹{c.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">
                              {ago}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No customer data in this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {topCustomersData.length > 0 ? topCustomersData.map((c, i) => {
                  const tier = customerTier(c.repairs);
                  return (
                    <div key={i} className={cn("rounded-lg border border-border p-3 flex items-center justify-between", tier.border)}>
                      <div>
                        <p className="font-medium text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.repairs} repairs</p>
                      </div>
                      <p className="font-semibold text-foreground text-sm">₹{c.revenue.toLocaleString()}</p>
                    </div>
                  );
                }) : <p className="text-sm text-center text-muted-foreground py-6">No data in period.</p>}
              </div>
            </>
          )}
        </div>

        {/* Supplier Spending Analysis */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Supplier Spending Analysis</h3>
          {loadingSupplier ? (
            <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : supplierData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">No supplier payments yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Record expenditures with a supplier category to see spending here.
                </p>
              </div>
              {/* FIX #18: use <Link> instead of <a href> to avoid full page reload */}
              <Link
                to="/expenditures"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
              >
                <Plus className="h-3 w-3" /> Add your first supplier payment
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/30">
                      <TableHead className="text-muted-foreground">Supplier</TableHead>
                      <TableHead className="text-muted-foreground">Orders</TableHead>
                      <TableHead className="text-muted-foreground">Total Spent</TableHead>
                      <TableHead className="text-muted-foreground">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierData.map((s, i) => {
                      const barW = maxSupplierTotal > 0 ? Math.round((s.total / maxSupplierTotal) * 100) : 0;
                      return (
                        <TableRow key={i} className="border-border hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-foreground">{s.supplier}</TableCell>
                          <TableCell className="text-foreground">{s.orders}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span className="font-mono text-sm text-foreground">₹{s.total.toLocaleString()}</span>
                              <div className="h-1 rounded-full bg-white/5 w-24 overflow-hidden">
                                <div className="h-full rounded-full bg-brand-orange" style={{ width: `${barW}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">₹{s.avg.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total row */}
                    <TableRow className="border-t-2 border-border bg-muted/20 font-semibold">
                      <TableCell className="text-foreground">Total</TableCell>
                      <TableCell className="text-foreground">{supplierData.reduce((s, r) => s + r.orders, 0)}</TableCell>
                      <TableCell className="text-foreground font-mono">₹{supplierTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {supplierData.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.supplier}</p>
                      <p className="text-xs text-muted-foreground">{s.orders} orders</p>
                    </div>
                    <p className="font-semibold text-foreground text-sm">₹{s.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Report Summary ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">Report Summary</h3>
        {loadingMain ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-brand-orange/20 bg-brand-orange/10">
              <div className="text-sm font-medium text-brand-orange-light">Revenue Growth</div>
              <div className="text-lg font-bold text-foreground mt-1">
                {reportsData.hasPrevRevenue
                  ? `${reportsData.revenueGrowth >= 0 ? '+' : ''}${reportsData.revenueGrowth}%`
                  : 'N/A'}
              </div>
              <div className="text-xs text-brand-orange/70 mt-1">
                Total: ₹{reportsData.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <div className="text-sm font-medium text-emerald-400">Top Repair Type</div>
              <div className="text-lg font-bold text-foreground mt-1 truncate">
                {repairTypesData.length > 0 ? repairTypesData[0]?.name : 'No data'}
              </div>
              <div className="text-xs text-emerald-500/70 mt-1">
                {repairTypesData.length > 0
                  ? `${repairTypesData[0]?.value ?? 0}% of repairs · ${repairTypesData[0]?.count ?? 0} jobs`
                  : 'No repair type data'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/10">
              <div className="text-sm font-medium text-orange-400">Top Device Brand</div>
              <div className="text-lg font-bold text-foreground mt-1">
                {deviceBrandsData.length > 0 ? deviceBrandsData[0]?.brand : 'No data'}
              </div>
              <div className="text-xs text-orange-500/70 mt-1">
                {deviceBrandsData.length > 0
                  ? `${deviceBrandsData[0]?.repairs ?? 0} repairs · ₹${(deviceBrandsData[0]?.revenue ?? 0).toLocaleString()}`
                  : 'No device data'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-violet-500/20 bg-violet-500/10">
              <div className="text-sm font-medium text-violet-400">Customer Retention</div>
              <div className="text-lg font-bold text-foreground mt-1">
                {totalSegments > 0
                  ? `${segPct(customerSegments.frequent + customerSegments.regular)}% returning`
                  : 'No data'}
              </div>
              <div className="text-xs text-violet-500/70 mt-1">
                {customerSegments.frequent + customerSegments.regular} repeat out of {totalSegments}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Free Items Audit Log ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Free Items Audit Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complimentary tempered glass and back cover installations in selected period.
            </p>
          </div>
          {!loadingMain && freeItemsData.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Glass: {freeGlassTotal} units
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Cover: {freeCoverTotal} units
              </span>
            </div>
          )}
        </div>

        {loadingMain ? (
          <div className="space-y-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30">
                  <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Transaction ID</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Customer Name</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-center">Free Glass</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-center">Free Cover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freeItemsData.length > 0 ? freeItemsData.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="text-foreground font-medium text-sm">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-foreground">{item.customer}</TableCell>
                    <TableCell className="text-center">
                      {item.freeGlass > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          +{item.freeGlass}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.freeCover > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          +{item.freeCover}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No free items recorded in this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
