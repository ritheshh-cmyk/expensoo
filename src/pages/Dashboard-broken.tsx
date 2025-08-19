
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceDetection } from "@/components/DeviceDetection";
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
  Wifi,
  WifiOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const paymentMethodIcons = {
  cash: DollarSign,
  upi: Smartphone,
  card: CreditCard,
  "bank-transfer": ArrowUpRight,
};

export default function Dashboard() {
  const [showProfits, setShowProfits] = useState(
  );
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();
  const device = useDeviceDetection();
  
  // Enhanced State Management
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
  });
  
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    version: '1.0.0',
    lastUpdate: new Date()
  });
  
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate enhanced weekly chart data
  const generateWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      profit: Math.floor(Math.random() * 15000) + 3000,
      transactions: Math.floor(Math.random() * 20) + 5,
    }));
  };

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
  };

  // Enhanced Data Fetching with Real-time Updates
  const fetchDashboardData = async (showToast = false) => {
    if (!user) {
      console.log('⏭️ Skipping dashboard data fetch - user not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Parallel API calls for better performance
      const [dashboardResponse, transactionsResponse, healthResponse] = await Promise.all([
        apiClient.getDashboardData(),
        apiClient.getTransactions(),
        apiClient.healthCheck()
      ]);
      
      // Update dashboard metrics
      if (dashboardResponse.success && dashboardResponse.totals) {
        setDashboardData(dashboardResponse.totals);
      }
      
      // Update recent transactions
      if (Array.isArray(transactionsResponse)) {
        setRecentTransactions(transactionsResponse.slice(0, 5));
      }
      
      // Update system status
      setSystemStatus({
        status: healthResponse.status || 'online',
        version: healthResponse.version || '1.0.0',
        lastUpdate: new Date()
      });
      
      setLastRefresh(new Date());
      
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "Dashboard data has been updated successfully.",
        });
      }
      
    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error);
      setSystemStatus(prev => ({ ...prev, status: 'offline' }));
      
      if (showToast) {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh dashboard data.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh && user) {
      const interval = setInterval(() => {
        fetchDashboardData(false);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
    setWeeklyData(generateWeeklyData());
  }, [user]);

  // Responsive grid classes based on device
  const getGridClasses = () => {
    if (device.isMobile) return "grid-cols-1 gap-3";
    if (device.isTablet) return "grid-cols-2 gap-4";
    return "grid-cols-3 gap-4";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Enhanced Header with Real-time Status */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("dashboard")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {user?.name}! 
            {user?.role === "worker"
              ? " Here are your daily tasks."
              : " Here's your repair shop overview."}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* System Status Badge */}
          <Badge 
            variant={systemStatus.status === 'online' ? 'default' : 'destructive'}
          >
            {systemStatus.status === 'online' ? 
              <Wifi className="h-3 w-3" /> : 
              <WifiOff className="h-3 w-3" />
            }
            System {systemStatus.status}
            </Badge>
            
            {/* Device Badge */}
              {device.isMobile && <Smartphone className="h-3 w-3" />}
              {device.isTablet && <Package className="h-3 w-3" />}
              {device.isDesktop && <Wrench className="h-3 w-3" />}
              {device.screenSize.toUpperCase()}
            </Badge>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 sm:h-9"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            
            {hasAccess(["admin", "owner"]) && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleProfits}
                className="h-10 sm:h-9"
              >
                {showProfits ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {showProfits ? "Hide Profits" : "Show Profits"}
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Key Metrics Cards with Responsive Grid */}
        <div className={`grid ${getGridClasses()}`}>
          <Card className="card-hover animate-fade-in">
              <CardTitle className="text-sm font-medium">
                Today's Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? (
                  <div className="professional-skeleton w-20 h-6 rounded" />
                ) : (
                  `₹${dashboardData.todayRevenue?.toLocaleString() || 0}`
                )}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{loading ? '...' : dashboardData.todayProfit?.toLocaleString() || 0}
                </div>
              )}
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Real-time data
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in">
              <CardTitle className="text-sm font-medium">
                Pending Repairs
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading ? (
                  <div className="professional-skeleton w-12 h-6 rounded" />
                ) : (
                  dashboardData.pendingTransactions || 0
                )}
              </div>
                Awaiting completion
              </div>
              <Progress 
                value={(dashboardData.pendingTransactions / Math.max(dashboardData.totalTransactions, 1)) * 100} 
                className="mt-2 h-1" 
              />
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? (
                  <div className="professional-skeleton w-24 h-6 rounded" />
                ) : (
                  `₹${dashboardData.totalRevenue?.toLocaleString() || 0}`
                )}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{loading ? '...' : dashboardData.totalProfit?.toLocaleString() || 0}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions with Device-Specific Layout */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-4">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm">
              Streamlined repair shop operations
            </CardDescription>
          </CardHeader>
          <CardContent className={`grid ${device.isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-6'} gap-3`}>
            <Link to="/transactions/new">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 w-full hover:scale-105 transition-transform"
              >
                <Plus className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">New Transaction</span>
              </Button>
            </Link>
            
            {hasAccess(["admin", "owner"]) && (
              <>
                <Link to="/suppliers">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 w-full hover:scale-105 transition-transform"
                  >
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium">Suppliers</span>
                  </Button>
                </Link>
                
                <Link to="/reports">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 w-full hover:scale-105 transition-transform"
                  >
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="text-xs font-medium">Reports</span>
                  </Button>
                </Link>
              </>
            )}
            
            <Link to="/transactions">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 w-full hover:scale-105 transition-transform"
              >
                <Receipt className="h-6 w-6 text-purple-600" />
                <span className="text-xs font-medium">History</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Rest of the dashboard content remains the same but with enhanced styling */}
        {/* Recent Transactions with Enhanced UI */}
        <Card className="animate-scale-in">
          <CardHeader className="pb-4">
              <div>
                  <Receipt className="h-5 w-5 text-primary" />
                  Recent Transactions
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
                  <div className="loading-professional mr-2" />
                  <span className="text-muted-foreground">Loading transactions...</span>
                </div>
              ) : recentTransactions.length === 0 ? (
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recent transactions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Transactions will appear here once you start processing repairs
                  </p>
                  <Link to="/transactions/new">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Transaction
                    </Button>
                  </Link>
                </div>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id || index}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Transaction content */}
                        <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                              <p className="font-medium text-sm sm:text-base">
                                {transaction.customer || 'Unknown Customer'}
                              </p>
                              <Badge className="text-xs flex-shrink-0">
                                <Clock className="h-3 w-3 mr-1" />
                                {transaction.status || 'Pending'}
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">
                                {transaction.device || 'Device Info'}
                              </span>
                              {" • "}
                              <span>{transaction.repair || 'Repair Type'}</span>
                            </div>
                              <span>
                                {transaction.date || new Date().toLocaleDateString()} at {transaction.time || new Date().toLocaleTimeString()}
                              </span>
                              <DollarSign className="h-3 w-3" />
                              <span>{transaction.paymentMethod || 'cash'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm sm:text-base text-green-600">
                              ₹{typeof transaction.amount === 'number' ? transaction.amount.toLocaleString() : '0'}
                            </div>
                            {hasAccess(["admin", "owner"]) && showProfits && (
                              <div className="text-xs text-green-600/80">
                                Profit: ₹{typeof transaction.profit === 'number' ? transaction.profit.toLocaleString() : '0'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
