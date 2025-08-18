import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  Calendar,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  DollarSign,
  Receipt,
  Users,
  Smartphone,
  RefreshCw,
  Filter,
  Eye,
  Share,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

interface ReportData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  transactions: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  topDevices: Array<{
    device: string;
    count: number;
    revenue: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

export default function Reports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("thisMonth");
  const [reportType, setReportType] = useState("overview");

  // Sample report data
  const [reportData, setReportData] = useState<ReportData>({
    revenue: {
      total: 125000,
      thisMonth: 25000,
      lastMonth: 22000,
      growth: 13.6,
    },
    transactions: {
      total: 456,
      completed: 398,
      pending: 45,
      cancelled: 13,
    },
    topDevices: [
      { device: "iPhone 13", count: 85, revenue: 35000 },
      { device: "Samsung S21", count: 67, revenue: 28000 },
      { device: "OnePlus 9", count: 54, revenue: 22000 },
      { device: "Xiaomi 11", count: 43, revenue: 18000 },
      { device: "iPhone 12", count: 38, revenue: 16000 },
    ],
    monthlyData: [
      { month: "Jan", revenue: 18000, transactions: 45 },
      { month: "Feb", revenue: 22000, transactions: 52 },
      { month: "Mar", revenue: 25000, transactions: 58 },
      { month: "Apr", revenue: 28000, transactions: 65 },
      { month: "May", revenue: 32000, transactions: 72 },
      { month: "Jun", revenue: 25000, transactions: 58 },
    ],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Reports Updated",
        description: "Latest data has been loaded successfully.",
      });
    }, 1000);
  };

  const handleExport = (format: "pdf" | "excel") => {
    toast({
      title: "Export Started",
      description: `Downloading report as ${format.toUpperCase()} file.`,
    });
  };

  const pieChartData = [
    { name: "Completed", value: reportData.transactions.completed, color: "#10b981" },
    { name: "Pending", value: reportData.transactions.pending, color: "#f59e0b" },
    { name: "Cancelled", value: reportData.transactions.cancelled, color: "#ef4444" },
  ];

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Business Reports
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Analytics and insights for your repair business
            </p>
          </div>

          {/* Period and Type Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="devices">Device Analysis</SelectItem>
                <SelectItem value="customers">Customer Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="touch-button py-4 border-2"
            >
              <RefreshCw className={cn("mr-2 h-5 w-5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              className="touch-button py-4 border-2"
            >
              <Download className="mr-2 h-5 w-5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics - Mobile Optimized */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="border-2 border-green-100 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      ₹{reportData.revenue.thisMonth.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("flex items-center text-sm font-medium", getGrowthColor(reportData.revenue.growth))}>
                    {(() => {
                      const GrowthIcon = getGrowthIcon(reportData.revenue.growth);
                      return <GrowthIcon className="h-4 w-4 mr-1" />;
                    })()}
                    {Math.abs(reportData.revenue.growth)}%
                  </div>
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </div>
              </div>
              <div className="text-xs text-green-600/80">
                Total: ₹{reportData.revenue.total.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Repairs</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.transactions.total}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">✓ {reportData.transactions.completed} completed</span>
                <span className="text-yellow-600">⏳ {reportData.transactions.pending} pending</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Mobile Optimized */}
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Revenue Trend</CardTitle>
            <CardDescription>Monthly performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
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
                      name === 'revenue' ? 'Revenue' : 'Transactions'
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
          </CardContent>
        </Card>

        {/* Transaction Status Distribution */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="border-2 border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Repair Status</CardTitle>
              <CardDescription>Current transaction distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Top Devices</CardTitle>
              <CardDescription>Most repaired device types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topDevices.slice(0, 5).map((device, index) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.device}</p>
                        <p className="text-xs text-muted-foreground">{device.count} repairs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{device.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Report Actions</CardTitle>
            <CardDescription>Generate and share detailed reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => handleExport("excel")}
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium">Excel Report</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => handleExport("pdf")}
              >
                <Download className="h-5 w-5" />
                <span className="text-sm font-medium">PDF Report</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => {
                  toast({
                    title: "Share Link Generated",
                    description: "Report link copied to clipboard.",
                  });
                }}
              >
                <Share className="h-5 w-5" />
                <span className="text-sm font-medium">Share Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
