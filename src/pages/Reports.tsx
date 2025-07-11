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
import { useState } from "react";
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

// Remove any mock/demo/sample data and logic

export default function Reports() {
  const { t } = useLanguage();
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const [timeRange, setTimeRange] = useState("last6months");
  const [reportType, setReportType] = useState("overview");

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

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
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("reports")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Business analytics and financial reports
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>
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
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Revenue
                <DollarSign className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{0}
              </div>
              <div className="flex items-center text-xs mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+0%</span>
                <span className="text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                {showProfits ? "Total Profit" : "Total Repairs"}
                {showProfits ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showProfits
                  ? `₹${0}`
                  : 0}
              </div>
              <div className="flex items-center text-xs mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">
                  +0%
                </span>
                <span className="text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Avg. Ticket Size
                <Target className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per repair</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Customer Base
                <Users className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trend</CardTitle>
              <CardDescription>Monthly performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  {showProfits && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Profit"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Repair Types */}
          <Card>
            <CardHeader>
              <CardTitle>Repair Types Distribution</CardTitle>
              <CardDescription>Breakdown by repair category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {[]}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Brands */}
          <Card>
            <CardHeader>
              <CardTitle>Device Brand Performance</CardTitle>
              <CardDescription>
                Revenue and repair count by brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `₹${value.toLocaleString()}` : value,
                      name === "revenue" ? "Revenue" : "Repairs",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="repairs" fill="#3B82F6" name="Repairs" />
                  {showProfits && (
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                  )}
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>
                Customer breakdown by visit frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div>
                      <div className="font-medium">No Data Available</div>
                      <div className="text-sm text-muted-foreground">
                        No customer analytics data found.
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {showProfits
                        ? `₹${0}`
                        : "0 customers"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                Customers with highest repair count and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Repairs</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No data available for top customers.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Spending */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Spending Analysis</CardTitle>
              <CardDescription>Spending breakdown by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No data available for supplier spending.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Key insights and business intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Revenue Growth
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  +0% MoM
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  No revenue data available.
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Top Repair Type
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  No data available.
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  No repair type data available.
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Top Device Brand
                </div>
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  No data available.
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  No device brand data available.
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Customer Retention
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  No data available.
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  No customer retention data available.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
