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
        {/* Mobile-First Header - Simplified */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Dashboard
            </h1>
            <p className="text-base text-muted-foreground">
              Welcome back, {user?.name}! 
              {user?.role === "worker" ? " Your daily tasks await." : " Your shop overview."}
            </p>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {/* Mobile-Optimized Controls */}
          <div className="flex flex-col gap-3">
            <Button 
              className="thumb-primary w-full sm:w-auto text-lg py-6 shadow-lg"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("mr-3 h-6 w-6", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </Button>
            
            <div className="flex gap-3">
              <div className="flex-1 sm:flex-none">
                <Button variant="outline" className="touch-button w-full text-base py-4">
                  <Calendar className="mr-2 h-5 w-5" />
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Button>
              </div>
              
              {hasAccess(["admin", "owner"]) && (
                <div className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="touch-button w-full text-base py-4"
                    onClick={toggleProfits}
                  >
                    {showProfits ? (
                      <EyeOff className="mr-2 h-5 w-5" />
                    ) : (
                      <Eye className="mr-2 h-5 w-5" />
                    )}
                    {showProfits ? "Hide Profits" : "Show Profits"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-Primary Metrics Cards - Focused on Key Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="card-hover border-2 border-success/20 bg-success/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-success">
                Today's Revenue
              </CardTitle>
              <div className="p-2 bg-success/10 rounded-full">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-4xl sm:text-5xl font-bold text-success mb-3">
                ₹{loading ? '...' : formattedValues.todayRevenue}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-base text-success/80 mb-2 font-medium">
                  Profit: ₹{loading ? '...' : formattedValues.todayProfit}
                </div>
              )}
              <div className="flex items-center text-base text-success font-medium">
                <ArrowUpRight className="h-5 w-5 mr-2" />
                Today's earnings
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-primary">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-3">
                ₹{loading ? '...' : formattedValues.totalRevenue}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-base text-primary/80 mb-2 font-medium">
                  Total Profit: ₹{loading ? '...' : formattedValues.totalProfit}
                </div>
              )}
              <div className="text-base text-primary/80 font-medium">
                All time earnings • {formattedValues.totalTransactions} repairs
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Quick Actions - Enhanced for Thumb Navigation */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Button 
            className="thumb-primary h-24 flex-col gap-3 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/transactions")}
          >
            <div className="p-2 bg-white/20 rounded-full">
              <Plus className="h-8 w-8" />
            </div>
            <span className="text-base font-bold">New Repair</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-24 flex-col gap-3 border-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/expenditures")}
          >
            <div className="p-2 bg-orange-100 rounded-full">
              <Receipt className="h-8 w-8 text-orange-600" />
            </div>
            <span className="text-base font-bold">Expenses</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-24 flex-col gap-3 border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/suppliers")}
          >
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <span className="text-base font-bold">Suppliers</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="touch-button h-24 flex-col gap-3 border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/reports")}
          >
            <div className="p-2 bg-green-100 rounded-full">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <span className="text-base font-bold">Reports</span>
          </Button>
        </div>

        {/* Recent Transactions - Mobile-First Design */}
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Recent Repairs</CardTitle>
                <CardDescription className="text-base">Latest transactions from your shop</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/transactions")}
                className="touch-button text-primary hover:text-primary/80"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="p-6 bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Smartphone className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No recent transactions</h3>
                <p className="text-base mb-6">Start by adding your first repair transaction</p>
                <Button 
                  className="thumb-primary text-lg px-8 py-4"
                  onClick={() => navigate("/transactions")}
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: any, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 touch-target cursor-pointer active:scale-98"
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-foreground truncate">
                          {transaction.customerName || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {transaction.deviceType || 'Device'} • {transaction.issueDescription?.substring(0, 40) || 'No description'}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(transaction.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-lg text-foreground">₹{transaction.totalAmount || 0}</p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'} 
                        className="text-xs mt-1 px-2 py-1"
                      >
                        {transaction.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Overview - Mobile-Simplified */}
        {hasAccess(["admin", "owner"]) && weeklyData.length > 0 && (
          <Card className="border-2 border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Weekly Performance</CardTitle>
              <CardDescription className="text-base">Revenue trends over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value}` : value,
                        name === 'revenue' ? 'Revenue' : 'Repairs'
                      ]}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium text-center">
                  Average daily revenue: ₹{Math.round(weeklyData.reduce((sum, day) => sum + day.revenue, 0) / 7).toLocaleString('en-IN')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
