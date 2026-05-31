import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  TrendingUp, 
  Activity, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DashboardTotals {
  totalRevenue: number;
  todayRevenue: number;
  totalProfit: number;
  todayProfit: number;
  totalTransactions: number;
  pendingTransactions: number;
}

interface Transaction {
  id: string;
  customer_name: string;
  type: string;
  amount: number;
  profit_margin: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [totals, setTotals] = useState<DashboardTotals>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    totalTransactions: 0,
    pendingTransactions: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Dashboard: Fetching data...');
      
      // Fetch dashboard totals
      const dashboardResponse = await apiClient.getDashboardData();
      if (dashboardResponse.success && dashboardResponse.data) {
        setTotals(dashboardResponse.data);
        console.log('✅ Dashboard totals loaded:', dashboardResponse.data);
      } else {
        console.error('❌ Dashboard totals failed:', dashboardResponse.error);
        // Keep default totals instead of setting undefined
        console.log('Using default dashboard totals');
      }

      // Fetch recent transactions
      const transactionsResponse = await apiClient.getTransactions();
      if (transactionsResponse.success && Array.isArray(transactionsResponse.data)) {
        const recent = transactionsResponse.data.slice(0, 5);
        setRecentTransactions(recent);
        console.log('✅ Recent transactions loaded:', recent.length);
      } else {
        console.error('❌ Transactions fetch failed');
      }
    } catch (error: any) {
      console.error('❌ Dashboard data fetch error:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return statusColors[status.toLowerCase() as keyof typeof statusColors] || 
           'bg-secondary text-foreground border-border';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.full_name || user?.email}
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totals.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-blue-700 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Today: {formatCurrency(totals.todayRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totals.totalProfit)}
            </div>
            <div className="flex items-center text-xs text-green-700 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Today: {formatCurrency(totals.todayProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {totals.totalTransactions.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-purple-700 mt-1">
              <Activity className="h-3 w-3 mr-1" />
              All time transactions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Pending
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {totals.pendingTransactions}
            </div>
            <div className="flex items-center text-xs text-orange-700 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              Awaiting completion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type} • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-green-600">
                        +{formatCurrency(transaction.profit_margin)} profit
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(transaction.status)}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}