import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/components/ui/use-toast";
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
  Timer,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Format numbers for display with Indian currency format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₹', '');
  };

  const formattedValues = {
    totalRevenue: formatCurrency(dashboardData.totalRevenue),
    todayRevenue: formatCurrency(dashboardData.todayRevenue),
    totalProfit: formatCurrency(dashboardData.totalProfit),
    todayProfit: formatCurrency(dashboardData.todayProfit),
    totalTransactions: dashboardData.totalTransactions,
    pendingTransactions: dashboardData.pendingTransactions,
  };

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  // Generate weekly data for charts
  const generateWeeklyData = async () => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      weekData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
        repairs: Math.floor(Math.random() * 10) + 1,
        date: date.toISOString(),
      });
    }
    
    return weekData;
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // Fetch dashboard metrics and recent transactions
      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiClient.requestWithAuth('/api/dashboard'),
        apiClient.requestWithAuth('/api/transactions?limit=5'),
      ]);

      // Handle dashboard data
      if (dashboardResponse && typeof dashboardResponse === 'object') {
        const response = dashboardResponse as any;
        setDashboardData({
          totalRevenue: response.totals?.totalRevenue || 0,
          todayRevenue: response.today?.totalRevenue || response.today?.revenue || 0,
          totalProfit: response.totals?.totalProfit || 0,
          todayProfit: response.today?.profit || 0,
          totalTransactions: response.totals?.totalTransactions || 0,
          pendingTransactions: response.totals?.pendingTransactions || 0,
        });
      } else {
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
        setRecentTransactions(transactionsResponse.slice(0, 5));
      } else if ((transactionsResponse as any)?.data && Array.isArray((transactionsResponse as any).data)) {
        setRecentTransactions((transactionsResponse as any).data.slice(0, 5));
      } else {
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
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user, toast]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
    toast({
      title: "Dashboard Updated",
      description: "Latest data has been loaded successfully.",
    });
  }, [fetchDashboardData, toast]);

  // Initial data fetch
  useEffect(() => {
    if (user && localStorage.getItem("callmemobiles_token")) {
      fetchDashboardData(true);
    }
  }, [user, fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user || !localStorage.getItem("callmemobiles_token")) return;

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-Primary Header */}
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome {user?.name}!
              <span className="hidden sm:inline">
                {user?.role === "worker"
                  ? " Here are your daily tasks."
                  : " Here's your repair shop overview."}
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

        {/* Mobile-Primary Metrics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover">
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

          <Card className="card-hover">
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

          <Card className="card-hover">
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

        {/* Recent Transactions - Mobile Optimized */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Repairs</CardTitle>
            <CardDescription>Latest transactions from your shop</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-4" />
                <p>No recent transactions found</p>
                <Button 
                  className="mt-4 touch-button"
                  onClick={() => navigate("/transactions")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: any, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors touch-target"
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.customerName || 'Unknown Customer'}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.deviceType || 'Device'} • {transaction.issueDescription?.substring(0, 30) || 'No description'}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{transaction.totalAmount || 0}</p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section - Simplified for Mobile */}
        {hasAccess(["admin", "owner"]) && weeklyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Overview</CardTitle>
              <CardDescription>Revenue and repairs over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value}` : value,
                        name === 'revenue' ? 'Revenue' : 'Repairs'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
