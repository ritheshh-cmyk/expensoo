import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingDown,
  Plus,
  Receipt,
  Calculator,
  PieChart,
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell,
} from "recharts";

export default function Expenditures() {
  const { t } = useLanguage();
  const { toast } = useToast();
  // Remove localStorage usage for showProfits, use only state
  const [showProfits, setShowProfits] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // All expenditure data is loaded from backend and updated via socket.io
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    apiClient.getExpenditures().then(setExpenditures).finally(() => setLoading(false));

    // Real-time updates
    const socket = io("https://positive-kodiak-friendly.ngrok-free.app", { transports: ["websocket"] });
    const update = () => apiClient.getExpenditures().then(setExpenditures);
    socket.on("expenditureCreated", update);
    socket.on("expenditureUpdated", update);
    socket.on("expenditureDeleted", update);
    return () => {
      socket.off("expenditureCreated", update);
      socket.off("expenditureUpdated", update);
      socket.off("expenditureDeleted", update);
      socket.disconnect();
    };
  }, []);

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    // localStorage.setItem("showProfits", newValue.toString()); // Removed
  };

  // Filter expenditures
  const filteredExpenditures = expenditures.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || exp.category === categoryFilter;
    const matchesPayment =
      paymentMethodFilter === "all" ||
      exp.paymentMethod === paymentMethodFilter;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  // Calculate totals
  const totalExpenses = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyExpenses = expenditures
    .filter((exp) => exp.date.startsWith("2024-01"))
    .reduce((sum, exp) => sum + exp.amount, 0);

  const categories = [...new Set(expenditures.map((exp) => exp.category))];
  const paymentMethods = [
    ...new Set(expenditures.map((exp) => exp.paymentMethod)),
  ];

  // Add, update, delete handlers
  const handleAddExpenditure = async (formData: any) => {
    await apiClient.createExpenditure(formData);
    // Real-time event will trigger refetch
  };
  const handleUpdateExpenditure = async (id: string, formData: any) => {
    await apiClient.updateExpenditure(id, formData);
  };
  const handleDeleteExpenditure = async (id: string) => {
    await apiClient.deleteExpenditure(id);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "upi":
        return <Smartphone className="h-4 w-4" />;
      case "bank_transfer":
        return <Building className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "upi":
        return "UPI";
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      default:
        return method;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Supplies: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Rent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      Utilities:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Salaries:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Equipment:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Marketing:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Maintenance:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return (
      colors[category] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const categoryDataToShow = Object.entries(
        expenditures.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, amount]) => ({
        name,
        amount,
        color:
          {
            Supplies: "#3B82F6",
            Rent: "#EF4444",
            Utilities: "#F59E0B",
            Salaries: "#10B981",
            Equipment: "#8B5CF6",
            Marketing: "#EC4899",
            Maintenance: "#F97316",
          }[name] || "#6B7280",
      }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("expenditures")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track business expenses and analyze profit margins
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expenditure
                </Button>
              </DialogTrigger>
              <AddExpenditureDialog onAdd={handleAddExpenditure} />
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{typeof totalExpenses === "number" ? totalExpenses.toLocaleString() : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{typeof monthlyExpenses === "number" ? monthlyExpenses.toLocaleString() : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-1">January 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Expense types
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {showProfits ? "Monthly Profit" : "Average Expense"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showProfits
                  ? "₹31,000"
                  : `₹${Math.round(totalExpenses / (expenditures.length || 1)).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {showProfits ? "January 2024" : "Per transaction"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
              <CardDescription>
                Breakdown of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDataToShow}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ name, value }) =>
                      `${name}: ₹${typeof value === "number" ? value.toLocaleString() : ""}`
                    }
                  >
                    {categoryDataToShow.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry?.color || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString() : ""}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>
                Revenue, expenses and profit trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString() : ""}`}
                  />
                  <Legend />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  {showProfits && (
                    <Bar dataKey="profit" fill="#10B981" name="Profit" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Expenditures Table */}
        <Card>
          <CardHeader>
            <CardTitle>Expenditure Log</CardTitle>
            <CardDescription>
              Complete record of all business expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenditures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenditures.map((expenditure) => (
                    <TableRow key={expenditure.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {expenditure.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {expenditure.description}
                          </div>
                          {expenditure.notes && (
                            <div className="text-sm text-muted-foreground">
                              {expenditure.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getCategoryColor(expenditure.category) || ""}
                        >
                          {expenditure.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{expenditure.supplier}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(expenditure.paymentMethod)}
                          {getPaymentMethodLabel(expenditure.paymentMethod)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{typeof expenditure.amount === "number" ? expenditure.amount.toLocaleString() : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// Add Expenditure Dialog Component
function AddExpenditureDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    description: "",
    category: "Supplies",
    amount: "",
    paymentMethod: "cash",
    supplier: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount),
    });
    setFormData({
      description: "",
      category: "Supplies",
      amount: "",
      paymentMethod: "cash",
      supplier: "",
      notes: "",
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Expenditure</DialogTitle>
        <DialogDescription>Record a new business expense</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="What was purchased or paid for?"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Supplies">Supplies</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Salaries">Salaries</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMethod: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="supplier">Supplier/Vendor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) =>
              setFormData({ ...formData, supplier: e.target.value })
            }
            placeholder="Who was paid?"
            required
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional details..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={!formData.description || !formData.amount}
          >
            Add Expenditure
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
