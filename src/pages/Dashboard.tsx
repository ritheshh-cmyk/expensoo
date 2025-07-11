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
import { GlobalSearch } from "@/components/GlobalSearch";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Mock data for charts
const weeklyRevenue = [
  { day: "Mon", revenue: 15400, repairs: 18, profit: 6200 },
  { day: "Tue", revenue: 12800, repairs: 15, profit: 5100 },
  { day: "Wed", revenue: 18200, repairs: 22, profit: 7300 },
  { day: "Thu", revenue: 16700, repairs: 20, profit: 6700 },
  { day: "Fri", revenue: 21400, repairs: 26, profit: 8600 },
  { day: "Sat", revenue: 25200, repairs: 31, profit: 10100 },
  { day: "Sun", revenue: 19800, repairs: 24, profit: 7900 },
];

const repairTypeData = [
  { type: "Screen", count: 124, revenue: 371200, color: "#2563eb" },
  { type: "Battery", count: 89, revenue: 178000, color: "#dc2626" },
  { type: "Charging Port", count: 56, revenue: 140000, color: "#16a34a" },
  { type: "Speaker", count: 34, revenue: 68000, color: "#ca8a04" },
  { type: "Camera", count: 28, revenue: 84000, color: "#9333ea" },
  { type: "Water Damage", count: 22, revenue: 132000, color: "#0891b2" },
];

const recentTransactions = [
  {
    id: 1,
    customer: "Rajesh Kumar",
    phone: "+91 98765 43210",
    device: "iPhone 14 Pro",
    repair: "Screen Replacement",
    amount: 12500,
    cost: 8000,
    profit: 4500,
    status: "completed",
    date: "Today",
    time: "2:30 PM",
    paymentMethod: "upi",
  },
  {
    id: 2,
    customer: "Priya Sharma",
    phone: "+91 98765 43211",
    device: "Samsung Galaxy S23",
    repair: "Battery Replacement",
    amount: 3500,
    cost: 2000,
    profit: 1500,
    status: "in-progress",
    date: "Today",
    time: "1:15 PM",
    paymentMethod: "cash",
  },
  {
    id: 3,
    customer: "Mohammed Ali",
    phone: "+91 98765 43212",
    device: "OnePlus 11",
    repair: "Charging Port",
    amount: 4500,
    cost: 2500,
    profit: 2000,
    status: "pending",
    date: "Today",
    time: "11:45 AM",
    paymentMethod: "card",
  },
  {
    id: 4,
    customer: "Sunita Devi",
    phone: "+91 98765 43213",
    device: "iPhone 13",
    repair: "Screen + Battery",
    amount: 15000,
    cost: 9500,
    profit: 5500,
    status: "completed",
    date: "Yesterday",
    time: "4:20 PM",
    paymentMethod: "bank-transfer",
  },
  {
    id: 5,
    customer: "Arjun Reddy",
    phone: "+91 98765 43214",
    device: "Google Pixel 7",
    repair: "Camera Module",
    amount: 8500,
    cost: 5000,
    profit: 3500,
    status: "delivered",
    date: "Yesterday",
    time: "2:10 PM",
    paymentMethod: "upi",
  },
];

const lowStockItems = [
  { item: "iPhone 14 Pro Screen", stock: 2, minStock: 5, critical: true },
  { item: "Samsung S23 Battery", stock: 4, minStock: 8, critical: false },
  { item: "USB-C Port Module", stock: 1, minStock: 6, critical: true },
  { item: "iPhone 13 Camera", stock: 3, minStock: 5, critical: true },
  { item: "Screen Protectors", stock: 15, minStock: 50, critical: false },
];

const statusConfig = {
  pending: {
    label: "pending",
    color: "status-pending",
    icon: Clock,
    bgColor: "bg-repair-pending/10",
  },
  "in-progress": {
    label: "in-progress",
    color: "status-progress",
    icon: Wrench,
    bgColor: "bg-repair-progress/10",
  },
  completed: {
    label: "completed",
    color: "status-completed",
    icon: CheckCircle,
    bgColor: "bg-repair-completed/10",
  },
  delivered: {
    label: "delivered",
    color: "status-delivered",
    icon: CheckCircle,
    bgColor: "bg-repair-delivered/10",
  },
};

const paymentMethodIcons = {
  cash: DollarSign,
  upi: Smartphone,
  card: CreditCard,
  "bank-transfer": ArrowUpRight,
};

export default function Dashboard() {
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const { t } = useLanguage();
  const { user, hasAccess } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  // Calculate totals
  const todayRevenue = 51300;
  const todayProfit = showProfits ? 20520 : null;
  const pendingRepairs = 7;
  const weeklyTotal = weeklyRevenue.reduce((sum, day) => sum + day.revenue, 0);
  const weeklyProfitTotal = showProfits
    ? weeklyRevenue.reduce((sum, day) => sum + day.profit, 0)
    : null;

  // Check if user can view profits (admin and owner only)
  const canViewProfits = hasAccess(["admin", "owner"]);

  useEffect(() => {
    // Only for owner
    if (user?.role !== "owner") return;
    // Only show once per day
    const today = new Date().toISOString().split("T")[0];
    if (localStorage.getItem("owner_notified") === today) return;
    // Only after 9pm or on next login
    const now = new Date();
    if (now.getHours() < 21) return;
    // Calculate today's and yesterday's profit/sales
    // (Replace with real data if available)
    const todayRevenue = 51300;
    const todayProfit = 20520;
    const yesterdayRevenue = 43400;
    const yesterdayProfit = 16800;
    const salesDiff = todayRevenue - yesterdayRevenue;
    const profitDiff = todayProfit - yesterdayProfit;
    toast({
      title: "End of Day Summary",
      description: `Today's Sales: ₹${todayRevenue.toLocaleString()}\nToday's Profit: ₹${todayProfit.toLocaleString()}\nSales Change: ${salesDiff >= 0 ? "+" : "-"}₹${Math.abs(salesDiff).toLocaleString()}\nProfit Change: ${profitDiff >= 0 ? "+" : "-"}₹${Math.abs(profitDiff).toLocaleString()}`,
      duration: 10000,
    });
    localStorage.setItem("owner_notified", today);
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
              Welcome back, {user?.name}!{" "}
              {user?.role === "worker"
                ? "Here are your daily tasks."
                : "Here's your repair shop overview for today."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Global Search */}
            <GlobalSearch className="h-10 sm:h-9 w-full sm:w-64" />
            <Button variant="outline" size="sm" className="h-10 sm:h-9">
              <Calendar className="mr-2 h-4 w-4" />
              Today: {new Date().toLocaleDateString()}
            </Button>
            {canViewProfits && (
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

        {/* Key Metrics Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("today-revenue")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ₹{todayRevenue.toLocaleString()}
              </div>
              {canViewProfits && showProfits && todayProfit && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{todayProfit.toLocaleString()}
                </div>
              )}
              <div className="flex items-center text-xs text-success">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +18.2% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("pending-repairs")}
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {pendingRepairs}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                5 in progress, 2 new
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{weeklyTotal.toLocaleString()}
              </div>
              {canViewProfits && showProfits && weeklyProfitTotal && (
                <div className="text-sm text-muted-foreground">
                  Profit: ₹{weeklyProfitTotal.toLocaleString()}
                </div>
              )}
              <div className="flex items-center text-xs text-success">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% from last week
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
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-xs">{t("record-payment")}</span>
            </Button>
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
                  <BarChart data={weeklyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
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
                    {canViewProfits && showProfits && (
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
                      data={repairTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {repairTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {repairTypeData.map((type, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {type.type}
                      </span>
                    </div>
                  ))}
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
                  {repairTypeData.map((repair, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          {repair.type}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {repair.count} repairs
                          </span>
                          <div className="text-xs text-muted-foreground">
                            ₹{repair.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={(repair.count / repairTypeData[0].count) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
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
              {recentTransactions.slice(0, 5).map((transaction) => {
                const StatusIcon =
                  statusConfig[transaction.status as keyof typeof statusConfig]
                    .icon;
                const PaymentIcon =
                  paymentMethodIcons[
                    transaction.paymentMethod as keyof typeof paymentMethodIcons
                  ];

                return (
                  <div
                    key={transaction.id}
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
                                {transaction.customer}
                              </p>
                              <Badge
                                className={cn(
                                  "text-xs flex-shrink-0",
                                  statusConfig[
                                    transaction.status as keyof typeof statusConfig
                                  ].color,
                                )}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {t(
                                  statusConfig[
                                    transaction.status as keyof typeof statusConfig
                                  ].label,
                                )}
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">
                                {transaction.device}
                              </span>
                              {" • "}
                              <span>{transaction.repair}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {transaction.date} at {transaction.time}
                              </span>
                              <PaymentIcon className="h-3 w-3" />
                              <span>{t(transaction.paymentMethod)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <div className="font-semibold text-sm sm:text-base">
                                ₹{transaction.amount.toLocaleString()}
                              </div>
                              {canViewProfits && showProfits && (
                                <div className="text-xs text-success">
                                  Profit: ₹{transaction.profit.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}