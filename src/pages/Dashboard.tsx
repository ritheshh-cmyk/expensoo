import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import {
  DollarSign,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();
  
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
  const [loading, setLoading] = useState(true);

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
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
      console.log('🔄 Fetching dashboard data...');
      
      // Parallel API calls for better performance
      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransactions()
      ]);
      
      console.log('📊 Dashboard response:', dashboardResponse);
      console.log('📝 Transactions response:', transactionsResponse);
      
      // Update dashboard metrics
      if (dashboardResponse && dashboardResponse.totals) {
        const totals = dashboardResponse.totals;
        const today = dashboardResponse.today || {};
        
        setDashboardData({
          totalRevenue: totals.totalRevenue || 0,
          todayRevenue: today.totalRevenue || 0,
          totalProfit: totals.totalProfit || 0,
          todayProfit: today.totalProfit || 0,
          totalTransactions: totals.totalTransactions || 0,
          pendingTransactions: totals.pendingTransactions || 0,
        });
        
        console.log('✅ Dashboard data updated:', {
          totalRevenue: totals.totalRevenue,
          todayRevenue: today.totalRevenue,
          totalTransactions: totals.totalTransactions
        });
      } else {
        console.log('⚠️ Dashboard response missing totals:', dashboardResponse);
      }
      
      // Update recent transactions
      if (Array.isArray(transactionsResponse)) {
        setRecentTransactions(transactionsResponse.slice(0, 5));
        console.log('✅ Recent transactions updated:', transactionsResponse.length, 'total');
      } else if (transactionsResponse && Array.isArray(transactionsResponse.data)) {
        setRecentTransactions(transactionsResponse.data.slice(0, 5));
        console.log('✅ Recent transactions updated from data array:', transactionsResponse.data.length, 'total');
      } else {
        console.log('⚠️ Transactions response not an array:', transactionsResponse);
      }
      
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "Dashboard data has been updated successfully.",
        });
      }
      
    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error);
      
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

  // Initial data load
  useEffect(() => {
    console.log('🚀 Dashboard mounted, user:', user?.username);
    fetchDashboardData();
  }, [user]);

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("dashboard")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back, {user?.name}! 
              {user?.role === "worker"
                ? " Here are your daily tasks."
                : " Here's your repair shop overview for today."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 sm:h-9"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            
            {hasAccess(["admin", "owner"]) && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleProfits}
                className="h-10 sm:h-9"
              >
                {showProfits ? "Hide Profits" : "Show Profits"}
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("today-revenue") || "Today's Revenue"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ₹{dashboardData.todayRevenue.toLocaleString()}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && dashboardData.todayProfit > 0 && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{dashboardData.todayProfit.toLocaleString()}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Today's earnings
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("pending-repairs") || "Pending Repairs"}
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {dashboardData.pendingTransactions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Awaiting completion
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{dashboardData.totalRevenue.toLocaleString()}
              </div>
              {hasAccess(["admin", "owner"]) && showProfits && dashboardData.totalProfit > 0 && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{dashboardData.totalProfit.toLocaleString()}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Total: {dashboardData.totalTransactions} transactions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {t("recent-transactions") || "Recent Transactions"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Latest repair transactions and their status ({recentTransactions.length} loaded)
                </div>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium">
                        {transaction.customer_name || transaction.name || `Customer #${transaction.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.device_type || transaction.device} - {transaction.repair_type || transaction.repair}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()} - 
                        Status: {transaction.status || 'pending'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ₹{(transaction.repair_cost || transaction.amount_given || transaction.repairCost || transaction.amountGiven || 0).toLocaleString()}
                      </div>
                      {hasAccess(["admin", "owner"]) && showProfits && (transaction.profit || transaction.actual_cost) && (
                        <div className="text-xs text-success">
                          +₹{((transaction.profit || (transaction.repair_cost - transaction.actual_cost)) || 0).toLocaleString()} profit
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {loading ? 'Loading transactions...' : 'No recent transactions found'}
                </div>
                {!loading && (
                  <Link to="/transactions/new" className="mt-4 inline-block">
                    <Button>
                      Add First Transaction
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div>User: {user?.username} ({user?.role})</div>
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                <div>Dashboard Data: {JSON.stringify(dashboardData, null, 2)}</div>
                <div>Recent Transactions: {recentTransactions.length} items</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
