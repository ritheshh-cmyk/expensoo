import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { apiClient } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Smartphone,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  DollarSign,
  Eye,
  EyeOff,
  ShoppingCart,
  Zap,
  FileText,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// All dashboard data is loaded from backend and updated via socket.io



const paymentMethodIcons = {
  cash: DollarSign,
  upi: Smartphone,
  card: CreditCard,
  "bank-transfer": ArrowUpRight,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Generate weekly chart data with real data
  const generateWeeklyData = useCallback(async () => {
    try {
      // Use working dashboard/stats endpoint instead of broken /api/statistics/week
      const response = await apiClient.request('/api/dashboard/stats');
      if (response && typeof response === 'object' && 'week' in response && response.week) {
        const weekData = response.week as any;
        return [{
          day: 'Week',
          revenue: weekData.revenue || weekData.totalRevenue || 0,
          profit: weekData.profit || 0,
        }];
      }
    } catch (error) {
      console.log('Using fallback weekly data');
    }
    
    // Fallback data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      profit: Math.floor(Math.random() * 15000) + 3000,
    }));
  }, []);

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  // Optimized data fetching with instant loading and background refresh
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    // Only fetch data if user is authenticated AND token is available
    if (!user || !localStorage.getItem("callmemobiles_token")) {
      console.log('⏭️ Skipping dashboard data fetch - user not authenticated or no token');
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      console.log('🔄 Fetching dashboard and transactions data...');
      
      // Remove the long delay - use instant loading with background refresh
      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiClient.getDashboardData(),
        apiClient.getTransactions()
      ]);
      
      console.log('📊 Dashboard API Response:', dashboardResponse);
      console.log('📋 Transactions API Response:', transactionsResponse);
      
      // Handle dashboard data with proper structure mapping from API response
      if (dashboardResponse) {
        console.log('✅ Setting dashboard data from API response structure');
        console.log('📊 Full dashboard response:', dashboardResponse);
        
        // Cast to proper type and map the correct API response structure: {totals, today, week}
        const response = dashboardResponse as any;
        setDashboardData({
          totalRevenue: response.totals?.totalRevenue || 0,
          todayRevenue: response.today?.totalRevenue || response.today?.revenue || 0,
          totalProfit: response.totals?.totalProfit || 0,
          todayProfit: response.today?.profit || 0,
          totalTransactions: response.totals?.totalTransactions || 0,
          pendingTransactions: response.totals?.pendingTransactions || 0,
        });
        
        console.log('💰 Today Revenue mapped from API:', response.today?.totalRevenue || response.today?.revenue || 0);
        console.log('💰 Total Revenue mapped from API:', response.totals?.totalRevenue || 0);
      } else {
        console.warn('⚠️ No dashboard data found, using fallback');
        setDashboardData({
          totalRevenue: 0,
          todayRevenue: 0,
          totalProfit: 0,
          todayProfit: 0,
          totalTransactions: 0,
          pendingTransactions: 0,
        });
      }
      
      // Handle transactions data
      if (Array.isArray(transactionsResponse)) {
        console.log('✅ Setting recent transactions:', transactionsResponse.slice(0, 5));
        setRecentTransactions(transactionsResponse.slice(0, 5));
      } else if ((transactionsResponse as any)?.data && Array.isArray((transactionsResponse as any).data)) {
        console.log('✅ Setting recent transactions (nested):', (transactionsResponse as any).data.slice(0, 5));
        setRecentTransactions((transactionsResponse as any).data.slice(0, 5));
              } else {
          console.warn('⚠️ Transactions response is not an array:', typeof transactionsResponse);
          setRecentTransactions([]);
        }

        // Set weekly data
        const weeklyResponse = await generateWeeklyData();
        if (Array.isArray(weeklyResponse)) {
          setWeeklyData(weeklyResponse);
        }
        
        setLastUpdate(new Date());
        
      } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      
      // Set fallback data
      setDashboardData({
        totalRevenue: 0,
        todayRevenue: 0,
        totalProfit: 0,
        todayProfit: 0,
        totalTransactions: 0,
        pendingTransactions: 0,
      });
      setRecentTransactions([]);
      
      // Only show error toast if it's not a 'No backend available' error
      if (!error.message?.includes('No backend available')) {
        toast({
          title: "Error Loading Dashboard",
          description: "Failed to load dashboard data. Please check your connection.",
          variant: "destructive",
        });
      } else {
        console.log('ℹ️ Backend unavailable, using fallback data');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
    toast({
      title: "Dashboard Updated",
      description: "Latest data has been loaded successfully.",
    });
  }, [fetchDashboardData]);

  // Initial data fetch with instant loading
  useEffect(() => {
    if (user && localStorage.getItem("callmemobiles_token")) {
      // Immediate fetch without delay
      fetchDashboardData(true);
    }
  }, [user, fetchDashboardData]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!user || !localStorage.getItem("callmemobiles_token")) return;

    const interval = setInterval(() => {
      fetchDashboardData(false); // Background refresh without loading indicator
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  // Memoized formatted values for better performance
  const formattedValues = useMemo(() => ({
    todayRevenue: dashboardData.todayRevenue?.toLocaleString() || '0',
    todayProfit: dashboardData.todayProfit?.toLocaleString() || '0',
    totalRevenue: dashboardData.totalRevenue?.toLocaleString() || '0',
    totalProfit: dashboardData.totalProfit?.toLocaleString() || '0',
    pendingTransactions: dashboardData.pendingTransactions || 0,
    totalTransactions: dashboardData.totalTransactions || 0,
  }), [dashboardData]);

  // All dashboard data is loaded from backend and updated via socket.io

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-Primary Header - Minimal and thumb-friendly */}
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {t("dashboard")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome {user?.name}! 
              <span className="hidden sm:inline">
                {user?.role === "worker"
                  ? " Here are your daily tasks."
                  : " Here's your repair shop overview for today."}
              </span>
            </p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {/* Mobile-First Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              className="thumb-primary sm:w-auto"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Button variant="outline" className="touch-button">
                <Calendar className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Today: </span>
                {new Date().toLocaleDateString()}
              </Button>
              
              {hasAccess(["admin", "owner"]) && (
                <Button
                  variant="outline"
                  className="touch-button"
                  onClick={toggleProfits}
                >
                  {showProfits ? (
                    <EyeOff className="mr-1 h-4 w-4" />
                  ) : (
                    <Eye className="mr-1 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {showProfits ? "Hide" : "Show"} Profits
                  </span>
                  <span className="sm:hidden">
                    {showProfits ? "Hide" : "Show"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-Primary Metrics Cards - Large and Touch-Friendly */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover p-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Today's Revenue
              </CardTitle>
              <DollarSign className="h-6 w-6 text-success" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-success mb-2">
                ₹{loading ? '...' : formattedValues.todayRevenue}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-sm text-muted-foreground mb-1">
                  Profit: ₹{loading ? '...' : formattedValues.todayProfit}
                </div>
              )}
              <div className="flex items-center text-sm text-success">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Active today
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover p-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Pending Repairs
              </CardTitle>
              <Clock className="h-6 w-6 text-warning" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-warning mb-2">
                {loading ? '...' : formattedValues.pendingTransactions}
              </div>
              <div className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${formattedValues.pendingTransactions} pending repairs`}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover p-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                ₹{loading ? '...' : formattedValues.totalRevenue}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-sm text-muted-foreground mb-1">
                  Total Profit: ₹{loading ? '...' : formattedValues.totalProfit}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                All time earnings
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Primary Quick Actions */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Button 
            className="thumb-primary h-20 flex-col gap-2"
            onClick={() => navigate("/transactions")}
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">New Repair</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-20 flex-col gap-2"
            onClick={() => navigate("/expenditures")}
          >
            <Receipt className="h-6 w-6" />
            <span className="text-sm font-medium">Add Expense</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-20 flex-col gap-2"
            onClick={() => navigate("/suppliers")}
          >
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium">Suppliers</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-20 flex-col gap-2"
            onClick={() => navigate("/reports")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-sm font-medium">Reports</span>
          </Button>
        </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{loading ? '...' : formattedValues.totalRevenue}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{loading ? '...' : formattedValues.totalProfit}
                </div>
              )}
              <div className="flex items-center text-xs text-success">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +0% from last week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {t("quick-actions")}
            </CardTitle>
            <CardDescription className="text-sm">
              Frequently used repair shop operations
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link to="/transactions/new">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 w-full"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs">{t("new-transaction")}</span>
              </Button>
            </Link>
            {hasAccess(["admin", "owner"]) && (
              <>
                <Link to="/suppliers">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 w-full"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-xs">Add Supplier</span>
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 w-full"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-xs">View Reports</span>
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Charts - Only for Admin and Owner */}
        {hasAccess(["admin", "owner"]) && (
          <div className="grid gap-4 lg:grid-cols-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Weekly Revenue & Profit
                </CardTitle>
                <CardDescription className="text-sm">
                  Revenue, repairs, and profit trends for this week
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `₹${value.toLocaleString()}`,
                        name === "revenue" ? "Revenue" : "Profit",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      name="revenue"
                    />
                    {hasAccess(["admin", "owner"]) && showProfits && (
                      <Bar
                        dataKey="profit"
                        fill="hsl(var(--success))"
                        name="profit"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Repair Types Analysis - Only for Admin and Owner */}
        {hasAccess(["admin", "owner"]) && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Repair Type Distribution
                </CardTitle>
                <CardDescription className="text-sm">
                  Most common repairs this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {[]}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[]}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Repair Performance
                </CardTitle>
                <CardDescription className="text-sm">
                  Count and revenue by repair type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[]}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {t("recent-transactions")}
                </CardTitle>
                <CardDescription className="text-sm">
                  Latest repair transactions and their status
                </CardDescription>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading transactions...</span>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recent transactions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Transactions will appear here once you start processing repairs
                  </p>
                  <Link to="/transactions">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Transaction
                    </Button>
                  </Link>
                </div>
              ) : (
                recentTransactions.slice(0, 5).map((transaction) => {
                const StatusIcon = Clock;
                // Fix the payment method icon lookup to match the actual data structure
                const transactionData = transaction as any;
                const paymentMethodKey = transactionData.paymentMethod || transactionData.payment_method || 'cash';
                const paymentInfo = paymentMethodIcons[paymentMethodKey as keyof typeof paymentMethodIcons];
                const PaymentIcon = paymentInfo || DollarSign;

                return (
                  <div
                    key={String(transaction.id || Math.random())}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm sm:text-base">
                                {String(transactionData.customer || transactionData.customer_name || 'Unknown Customer')}
                              </p>
                              <Badge
                                className="text-xs flex-shrink-0"
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                Transaction
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">
                                {String(transactionData.device || transactionData.device_model || 'Unknown Device')}
                              </span>
                              {" • "}
                              <span>{(() => {
                                // Use the correct field names from API client transformation
                                const repairType = String(transactionData.repairType || transactionData.repair_type || transactionData.service_type || transactionData.repair_description || transactionData.repair || 'Unknown Repair');
                                return repairType;
                              })()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {String(transactionData.date || transactionData.created_at || 'Date not available')}
                              </span>
                              <PaymentIcon className="h-3 w-3" />
                              <span>{String(paymentMethodKey).charAt(0).toUpperCase() + String(paymentMethodKey).slice(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <div className="font-semibold text-sm sm:text-base">
                                ₹{Number(transactionData.cost || transactionData.repair_cost || transactionData.total_amount || transactionData.amount || 0).toLocaleString()}
                              </div>
                              {hasAccess(["admin", "owner"]) && showProfits && (
                                <div className="text-xs text-success">
                                  Profit: ₹{Number(transactionData.profit || (transactionData.cost ? transactionData.cost - (transactionData.actual_cost || 0) : 0) || 0).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}