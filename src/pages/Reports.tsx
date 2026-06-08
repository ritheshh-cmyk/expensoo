import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Download,
  BarChart,
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
  Filter,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { usePermissions } from "@/hooks/usePermissions";

const isValidRepairType = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed) return false;
  // Contains a plus symbol
  if (trimmed.includes('+')) return false;
  // Fewer than 2 real words (splitting on space, hyphen, or underscore)
  const words = trimmed.split(/[\s_-]+/).filter(Boolean);
  if (words.length < 2) return false;
  // Looks like a test entry (case insensitive)
  const lower = trimmed.toLowerCase();
  if (lower.includes('test') || lower.includes('battan')) return false;
  return true;
};

const CHART_COLORS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#64748B'  // Slate for 'Others'
];

const getSliceColor = (name: string, index: number): string => {
  if (name.toLowerCase() === 'others') {
    return '#64748B'; // slate
  }
  const generalColors = CHART_COLORS.slice(0, -1);
  return generalColors[index % generalColors.length];
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 shadow-xl text-foreground">
        <p className="text-sm font-semibold capitalize mb-1">{data.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Count: <span className="font-semibold text-foreground">{data.count}</span>
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Percentage: <span className="font-semibold text-brand-orange-light">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// All reports data is loaded from backend and updated via socket.io

export default function Reports() {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const canViewProfits = can('reports.profits');
  
  const [showProfits, setShowProfits] = useState(
    canViewProfits && localStorage.getItem("showProfits") === "true",
  );
  
  const effectiveShowProfits = canViewProfits && showProfits;
  
  const [timeRange, setTimeRange] = useState("last6months");
  const [reportType, setReportType] = useState("overview");
  const [reportsData, setReportsData] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalRepairs: 0,
    totalCustomers: 0,
    avgTicketSize: 0,
    revenueGrowth: 0,
    profitGrowth: 0,
    repairGrowth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [repairTypesData, setRepairTypesData] = useState<any[]>([]);
  const [deviceBrandsData, setDeviceBrandsData] = useState<any[]>([]);
  const [topCustomersData, setTopCustomersData] = useState<any[]>([]);
  const [freeItemsData, setFreeItemsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleProfits = () => {
    if (!canViewProfits) return;
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  const fetchReportsData = useCallback(async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        setLoading(true);
        
        const dashboardResponse = await apiClient.getDashboardData();
        const dashboardData = dashboardResponse?.data || {};

        const txnResponse = await apiClient.getTransactions();
        const transactionsArr = Array.isArray(txnResponse?.data) ? txnResponse.data : [];

        const totalRevenue = Number(dashboardData.totalRevenue ?? 0);
        const totalProfit  = Number(dashboardData.totalProfit  ?? 0);
        const totalRepairs = Number(dashboardData.totalTransactions ?? 0);
        const avgTicketSize = totalRepairs > 0 ? Math.round(totalRevenue / totalRepairs) : 0;
        
        const monthlyChartData: any[] = [];
        const repairTypesMap = new Map<string, number>();
        const deviceBrandsMap = new Map<string, { repairs: number; revenue: number }>();
        const customersMap = new Map<string, { name: string; repairs: number; revenue: number; lastVisit: string }>();
        
        if (transactionsArr.length > 0) {
          const monthlyStats = new Map<string, { revenue: number; profit: number; repairs: number }>();

          transactionsArr.forEach((transaction: any) => {
            const date = new Date(transaction.createdAt || transaction.created_at || transaction.date || Date.now());
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (!monthlyStats.has(monthKey)) {
              monthlyStats.set(monthKey, { revenue: 0, profit: 0, repairs: 0 });
            }
            const monthData = monthlyStats.get(monthKey)!;
            const txRevenue = Number(transaction.cost ?? transaction.repairCost ?? transaction.repair_cost ?? transaction.soldPrice ?? transaction.sold_price ?? 0);
            monthData.revenue += txRevenue;
            monthData.profit  += Number(transaction.profit  ?? 0);
            monthData.repairs += 1;

            const repairType = transaction.repairType ?? transaction.repair_type ?? 'Other';
            if (isValidRepairType(repairType)) {
              repairTypesMap.set(repairType, (repairTypesMap.get(repairType) || 0) + 1);
            }

            const deviceBrand = (transaction.deviceModel ?? transaction.device_model ?? 'Unknown').split(' ')[0];
            if (!deviceBrandsMap.has(deviceBrand)) {
              deviceBrandsMap.set(deviceBrand, { repairs: 0, revenue: 0 });
            }
            const brandData = deviceBrandsMap.get(deviceBrand)!;
            brandData.repairs += 1;
            brandData.revenue += txRevenue;

            const customerId = transaction.mobileNumber ?? transaction.mobile_number ?? transaction.customer ?? transaction.customerName ?? transaction.customer_name ?? 'Unknown';
            if (!customersMap.has(customerId)) {
              customersMap.set(customerId, {
                name: transaction.customer ?? transaction.customerName ?? transaction.customer_name ?? `Customer ${customerId}`,
                repairs: 0,
                revenue: 0,
                lastVisit: date.toISOString(),
              });
            }
            const customerData = customersMap.get(customerId)!;
            customerData.repairs += 1;
            customerData.revenue += txRevenue;
            const txnDate = new Date(transaction.createdAt ?? transaction.created_at ?? transaction.date);
            if (txnDate > new Date(customerData.lastVisit)) {
              customerData.lastVisit = transaction.createdAt ?? transaction.created_at ?? transaction.date;
            }
          });
          
          monthlyStats.forEach((data, month) => {
            monthlyChartData.push({ month, ...data });
          });
        }
        
        const totalValidCount = Array.from(repairTypesMap.values()).reduce((sum, count) => sum + count, 0);
        const rawRepairTypes = Array.from(repairTypesMap.entries()).map(([name, count]) => {
          const percentage = totalValidCount > 0 ? (count / totalValidCount) * 100 : 0;
          return { name, count, percentage };
        });

        const mainCategories: any[] = [];
        let othersCount = 0;
        let othersPercentage = 0;

        rawRepairTypes.forEach(item => {
          if (item.percentage < 5) {
            othersCount += item.count;
            othersPercentage += item.percentage;
          } else {
            mainCategories.push(item);
          }
        });

        mainCategories.sort((a, b) => b.count - a.count);

        if (othersCount > 0) {
          mainCategories.push({
            name: 'Others',
            count: othersCount,
            percentage: othersPercentage
          });
        }

        const repairTypes = mainCategories.map(item => ({
          name: item.name,
          value: Math.round(item.percentage),
          percentage: item.percentage,
          count: item.count
        }));
        
        const deviceBrandsArr = Array.from(deviceBrandsMap.entries())
          .map(([brand, data]) => ({ brand, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        const topCustomersArr = Array.from(customersMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
        
        setReportsData({
          totalRevenue,
          totalProfit,
          totalRepairs,
          totalCustomers: customersMap.size || totalRepairs,
          avgTicketSize,
          revenueGrowth: 0,
          profitGrowth: 0,
          repairGrowth: 0,
        });
        
        setMonthlyData(monthlyChartData);
        setRepairTypesData(repairTypes);
        setDeviceBrandsData(deviceBrandsArr);
        setTopCustomersData(topCustomersArr);

        const freeItems = transactionsArr
          .filter((tx: any) => {
            const freeGlass = Number(tx.freeGlass ?? (tx.freeGlassInstallation ?? tx.free_glass_installation ? 1 : 0));
            const freeCover = Number(tx.freeCover ?? 0);
            return freeGlass > 0 || freeCover > 0;
          })
          .map((tx: any) => ({
            id: String(tx.id || ''),
            date: tx.createdAt || tx.created_at || tx.date || Date.now(),
            customer: String(tx.customerName ?? tx.customer_name ?? tx.customer ?? 'Unknown'),
            freeGlass: Number(tx.freeGlass ?? (tx.freeGlassInstallation ?? tx.free_glass_installation ? 1 : 0)),
            freeCover: Number(tx.freeCover ?? 0),
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFreeItemsData(freeItems);
        
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reports data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
  }, [timeRange]);

  // Initial load + re-fetch when time range changes
  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // ── Real-time socket.io subscriptions (BUG-02) ────────────────────────────
  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL ||
      import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
      'https://backendmobile-4swg.onrender.com';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socket.on('connect_error', (err: Error) => console.warn('Reports socket error (non-fatal):', err.message));

    const update = () => fetchReportsData();
    socket.on('transactionCreated', update);
    socket.on('transactionUpdated', update);
    socket.on('transactionDeleted', update);
    socket.on('expenditureCreated', update);
    socket.on('expenditureUpdated', update);
    socket.on('expenditureDeleted', update);

    return () => {
      socket.off('transactionCreated', update);
      socket.off('transactionUpdated', update);
      socket.off('transactionDeleted', update);
      socket.off('expenditureCreated', update);
      socket.off('expenditureUpdated', update);
      socket.off('expenditureDeleted', update);
      socket.disconnect();
    };
  }, [fetchReportsData]);

  // Calculate key metrics
  // const currentMonth = monthlyRevenueData[monthlyRevenueData.length - 1];
  // const previousMonth = monthlyRevenueData[monthlyRevenueData.length - 2];

  // const revenueGrowth = (
  //   ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) *
  //   100
  // ).toFixed(1);
  // const profitGrowth = showProfits
  //   ? (
  //       ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) *
  //       100
  //     ).toFixed(1)
  //   : "0";
  // const repairGrowth = (
  //   ((currentMonth.repairs - previousMonth.repairs) / previousMonth.repairs) *
  //   100
  // ).toFixed(1);

  // const totalRevenue = monthlyRevenueData.reduce(
  //   (sum, month) => sum + month.revenue,
  //   0,
  // );
  // const totalProfit = monthlyRevenueData.reduce(
  //   (sum, month) => sum + month.profit,
  //   0,
  // );
  // const totalRepairs = monthlyRevenueData.reduce(
  //   (sum, month) => sum + month.repairs,
  //   0,
  // );
  // const avgTicketSize = Math.round(totalRevenue / totalRepairs);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("reports")}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-48 bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
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
              <Button
                variant="outline"
                size="sm"
                onClick={toggleProfits}
                className="h-10 sm:h-9 bg-background border border-border text-foreground hover:bg-muted/50"
              >
                {effectiveShowProfits ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {effectiveShowProfits ? "Hide Profits" : "Show Profits"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="bg-background border border-border text-foreground hover:bg-muted/50">
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-background backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-brand-orange" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{loading ? '...' : (typeof reportsData.totalRevenue === 'number' ? reportsData.totalRevenue.toLocaleString() : '0')}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-green-400">+{loading ? '...' : reportsData.revenueGrowth}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{effectiveShowProfits ? 'Total Profit' : 'Total Repairs'}</span>
              {effectiveShowProfits ? <TrendingUp className="h-4 w-4 text-brand-orange" /> : <Smartphone className="h-4 w-4 text-brand-orange" />}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {effectiveShowProfits
                ? `₹${loading ? '...' : (typeof reportsData.totalProfit === 'number' ? reportsData.totalProfit.toLocaleString() : '0')}`
                : (loading ? '...' : reportsData.totalRepairs)}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-green-400">+{loading ? '...' : (effectiveShowProfits ? reportsData.profitGrowth : reportsData.repairGrowth)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Avg. Ticket Size</span>
              <Target className="h-4 w-4 text-brand-orange" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{loading ? '...' : (typeof reportsData.avgTicketSize === 'number' ? reportsData.avgTicketSize.toLocaleString() : '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per repair</p>
          </div>
          <div className="rounded-xl border border-border bg-background backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Customer Base</span>
              <Users className="h-4 w-4 text-brand-orange" />
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '...' : reportsData.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Total customers</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Revenue &amp; Profit Trend</h3>

            <div className="h-[240px] md:h-[300px] w-full mt-4">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10, dy: 10 }} tickMargin={10} minTickGap={15} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10, dx: -10 }} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value} />
                  <Tooltip
                    formatter={(value) => `₹${typeof value === 'number' ? value.toLocaleString() : '0'}`}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                  {effectiveShowProfits && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="Profit"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Repair Types */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Repair Types Distribution</h3>

            {(() => {
              const totalRepairsCount = repairTypesData.reduce((sum, item) => sum + item.count, 0);
              return (
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 w-full">
                  {/* Donut Container */}
                  <div className="relative w-full max-w-[280px] h-[240px] md:h-[280px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={repairTypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="count"
                        >
                          {repairTypesData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getSliceColor(entry.name, index)} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-foreground">{totalRepairsCount}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Repairs</span>
                    </div>
                  </div>

                  {/* Legend Container */}
                  <div className="w-full grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3 px-2">
                    {repairTypesData.map((entry, index) => {
                      const color = getSliceColor(entry.name, index);
                      return (
                        <div key={entry.name} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex flex-row md:items-center justify-between w-full min-w-0 gap-1">
                            <span className="font-medium text-foreground truncate capitalize">{entry.name}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0 md:ml-4 whitespace-nowrap">
                              {entry.count} ({entry.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Device Brands */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Device Brand Performance</h3>

            <div className="h-[240px] md:h-[300px] w-full mt-4">
              <ResponsiveContainer width="99%" height="100%">
                <RechartsBarChart data={deviceBrandsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="brand" tick={{ fill: '#71717a', fontSize: 10, dy: 10 }} tickMargin={10} minTickGap={15} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10, dx: -10 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `₹${typeof value === 'number' ? value.toLocaleString() : '0'}` : value,
                      name === "revenue" ? "Revenue" : "Repairs",
                    ]}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="repairs" fill="#f59e0b" name="Repairs" />
                  {effectiveShowProfits && (
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                  )}
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Analytics */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Customer Segments</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
                  <div>
                    <div className="font-medium text-foreground">No Data Available</div>
                    <div className="text-sm text-muted-foreground">
                      No customer analytics data found.
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {effectiveShowProfits ? `₹${0}` : "0 customers"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Top Customers</h3>

            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-muted-foreground">Repairs</TableHead>
                    <TableHead className="text-muted-foreground">Revenue</TableHead>
                    <TableHead className="text-muted-foreground">Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomersData.length > 0 ? (
                    topCustomersData.map((customer, index) => (
                      <TableRow key={index} className="border-border hover:bg-background">
                        <TableCell className="font-medium text-foreground">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-foreground">{customer.repairs}</TableCell>
                        <TableCell className="text-foreground">
                          ₹{typeof customer.revenue === 'number' ? customer.revenue.toLocaleString() : '0'}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {(() => {
                            if (!customer.lastVisit) return '—';
                            const d = new Date(customer.lastVisit);
                            return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No customer data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Supplier Spending */}
          <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
            <h3 className="text-base font-semibold text-foreground mb-1">Supplier Spending Analysis</h3>

            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Supplier</TableHead>
                    <TableHead className="text-muted-foreground">Orders</TableHead>
                    <TableHead className="text-muted-foreground">Total Spent</TableHead>
                    <TableHead className="text-muted-foreground">Avg Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No data available for supplier spending.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
          <h3 className="text-base font-semibold text-foreground mb-1">Report Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-brand-orange/20 bg-brand-orange/10">
              <div className="text-sm font-medium text-brand-orange-light">
                Revenue Growth
              </div>
              <div className="text-lg font-bold text-foreground">
                {loading ? '...' : `+${reportsData.revenueGrowth}% MoM`}
              </div>
              <div className="text-xs text-brand-orange/70">
                {loading ? '' : reportsData.totalRevenue > 0
                  ? `Total: ₹${reportsData.totalRevenue.toLocaleString()}`
                  : 'No revenue data available.'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-brand-green/20 bg-brand-green/10">
              <div className="text-sm font-medium text-brand-green">
                Top Repair Type
              </div>
              <div className="text-lg font-bold text-foreground">
                {loading ? '...' : repairTypesData.length > 0
                  ? repairTypesData[0]?.name
                  : 'No data'}
              </div>
              <div className="text-xs text-brand-green">
                {loading ? '' : repairTypesData.length > 0
                  ? `${repairTypesData[0]?.value ?? 0}% of all repairs`
                  : 'No repair type data available.'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/10">
              <div className="text-sm font-medium text-orange-400">
                Top Device Brand
              </div>
              <div className="text-lg font-bold text-foreground">
                {loading ? '...' : deviceBrandsData.length > 0
                  ? deviceBrandsData[0]?.brand
                  : 'No data'}
              </div>
              <div className="text-xs text-orange-500/70">
                {loading ? '' : deviceBrandsData.length > 0
                  ? `${deviceBrandsData[0]?.repairs ?? 0} repairs`
                  : 'No device brand data available.'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-violet-500/20 bg-violet-500/10">
              <div className="text-sm font-medium text-violet-400">
                Customer Retention
              </div>
              <div className="text-lg font-bold text-foreground">
                {loading ? '...' : reportsData.totalCustomers > 0
                  ? `${reportsData.totalCustomers} customers`
                  : 'No data'}
              </div>
              <div className="text-xs text-violet-500/70">
                {loading ? '' : reportsData.totalRepairs > 0
                  ? `${reportsData.totalRepairs} total repairs`
                  : 'No customer retention data available.'}
              </div>
            </div>
          </div>
        </div>

        {/* Free Items Audit Log */}
        <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-5">
          <h3 className="text-base font-semibold text-foreground mb-1">Free Items Audit Log</h3>
          <p className="text-xs text-muted-foreground mb-4">Detailed audit of all complimentary tempered glass and back cover installations tracked by customer.</p>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Transaction ID</TableHead>
                  <TableHead className="text-muted-foreground">Customer Name</TableHead>
                  <TableHead className="text-muted-foreground text-center">Free Glass</TableHead>
                  <TableHead className="text-muted-foreground text-center">Free Cover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : freeItemsData.length > 0 ? (
                  freeItemsData.map((item) => (
                    <TableRow key={item.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-foreground font-medium">
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {item.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {item.customer}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.freeGlass > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-green/20 text-brand-green border border-brand-green/30">
                            +{item.freeGlass}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.freeCover > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            +{item.freeCover}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No free items recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
  );
}
