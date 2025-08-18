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
import { expendituresService, type Expenditure } from "@/services/expenditures";
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
  
  // State management
  const [showProfits, setShowProfits] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load expenditures data
  useEffect(() => {
    const loadExpenditures = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await expendituresService.getExpenditures();
        setExpenditures(data);
        
        toast({
          title: "✅ Expenditures loaded",
          description: `Found ${data.length} expense records`,
          duration: 3000,
        });
      } catch (err) {
        console.error('Failed to load expenditures:', err);
        setError('Failed to load expenditures. Using offline data.');
        
        toast({
          title: "⚠️ Connection issue",
          description: "Using offline data. Some features may be limited.",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadExpenditures();

    // Real-time updates (with fallback)
    let socket: any = null;
    try {
      socket = io("https://expensoo-app-gu3wg.ondigitalocean.app", { 
        transports: ["websocket"],
        timeout: 5000,
      });
      
      const handleUpdate = () => {
        expendituresService.getExpenditures().then(setExpenditures);
      };
      
      socket.on("expenditureCreated", handleUpdate);
      socket.on("expenditureUpdated", handleUpdate);
      socket.on("expenditureDeleted", handleUpdate);
      
      socket.on("connect_error", () => {
        console.warn("Real-time connection failed, using local data");
      });
      
    } catch (err) {
      console.warn("Real-time connection not available");
    }

    return () => {
      if (socket) {
        socket.off("expenditureCreated");
        socket.off("expenditureUpdated");
        socket.off("expenditureDeleted");
        socket.disconnect();
      }
    };
  }, [toast]);

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

  // Calculate totals with proper error handling
  const totalExpenses = expenditures.reduce((sum, exp) => {
    const amount = typeof exp.amount === 'number' ? exp.amount : 0;
    return sum + amount;
  }, 0);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyExpenses = expenditures
    .filter((exp) => exp.date && exp.date.startsWith(currentMonth))
    .reduce((sum, exp) => {
      const amount = typeof exp.amount === 'number' ? exp.amount : 0;
      return sum + amount;
    }, 0);

  const categories = [...new Set(expenditures.map((exp) => exp.category).filter(Boolean))];
  const paymentMethods = [...new Set(expenditures.map((exp) => exp.paymentMethod).filter(Boolean))];

  // CRUD operations with error handling
  const handleAddExpenditure = async (formData: any) => {
    try {
      await expendituresService.createExpenditure(formData);
      setIsAddDialogOpen(false);
      
      toast({
        title: "✅ Expenditure added",
        description: "New expense record created successfully",
        duration: 3000,
      });
      
      // Refresh data
      const updatedData = await expendituresService.getExpenditures();
      setExpenditures(updatedData);
    } catch (error) {
      console.error('Failed to add expenditure:', error);
      toast({
        title: "❌ Failed to add expenditure",
        description: "Please check your connection and try again",
        duration: 5000,
      });
    }
  };

  const handleUpdateExpenditure = async (id: string, formData: any) => {
    try {
      await expendituresService.updateExpenditure(id, formData);
      
      toast({
        title: "✅ Expenditure updated",
        description: "Expense record updated successfully",
        duration: 3000,
      });
      
      // Refresh data
      const updatedData = await expendituresService.getExpenditures();
      setExpenditures(updatedData);
    } catch (error) {
      console.error('Failed to update expenditure:', error);
      toast({
        title: "❌ Failed to update expenditure",
        description: "Please check your connection and try again",
        duration: 5000,
      });
    }
  };

  const handleDeleteExpenditure = async (id: string) => {
    try {
      await expendituresService.deleteExpenditure(id);
      
      toast({
        title: "✅ Expenditure deleted",
        description: "Expense record deleted successfully",
        duration: 3000,
      });
      
      // Refresh data
      const updatedData = await expendituresService.getExpenditures();
      setExpenditures(updatedData);
    } catch (error) {
      console.error('Failed to delete expenditure:', error);
      toast({
        title: "❌ Failed to delete expenditure",
        description: "Please check your connection and try again",
        duration: 5000,
      });
    }
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

  // Enhanced chart data with error handling
  const categoryDataToShow = expendituresService.getCategoryBreakdown();
  const monthlyDataToShow = expendituresService.getMonthlyData();

  return (
    <AppLayout>
      <div className="container-responsive space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="mobile-header">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {t("expenditures")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track business expenses and analyze profit margins
            </p>
          </div>
          
          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleProfits}
              className="touch-button justify-center sm:justify-start"
            >
              {showProfits ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              <span className="sm:hidden">
                {showProfits ? "Hide" : "Show"} Profits
              </span>
              <span className="hidden sm:inline">
                {showProfits ? "Hide Profits" : "Show Profits"}
              </span>
            </Button>
            
            <Button variant="outline" size="sm" className="touch-button">
              <Download className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Export</span>
              <span className="hidden sm:inline">{t("export")}</span>
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="touch-button action-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add Expenditure</span>
                </Button>
              </DialogTrigger>
              <AddExpenditureDialog onAdd={handleAddExpenditure} />
            </Dialog>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="loading-spinner w-8 h-8"></div>
            <span className="ml-3 text-muted-foreground">Loading expenditures...</span>
          </div>
        )}

        {error && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-warning mr-2" />
              <span className="text-warning font-medium">Connection Issue</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {/* Summary Cards - Mobile-First Grid */}
        <div className="metrics-grid">
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="amount-display">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="amount-display">
                ₹{monthlyExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
          
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Expense types</p>
            </CardContent>
          </Card>
          
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {showProfits ? "Monthly Profit" : "Average Expense"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="amount-display">
                {showProfits
                  ? "₹31,000"
                  : `₹${Math.round(totalExpenses / (expenditures.length || 1)).toLocaleString('en-IN')}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {showProfits ? "Estimated" : "Per transaction"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Responsive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="card-standard">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Expense by Category</CardTitle>
              <CardDescription>
                Breakdown of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDataToShow}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ name, value }) =>
                        `${name}: ₹${typeof value === "number" ? value.toLocaleString('en-IN') : "0"}`
                      }
                    >
                      {categoryDataToShow.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry?.color || "#ccc"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString('en-IN') : "0"}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="card-standard">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Monthly Overview</CardTitle>
              <CardDescription>
                Revenue, expenses and profit trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyDataToShow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString('en-IN') : "0"}`}
                    />
                    <Legend />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    {showProfits && (
                      <Bar dataKey="profit" fill="#10B981" name="Profit" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Expenditures Table */}
        <Card className="card-standard">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Expenditure Log</CardTitle>
            <CardDescription>
              Complete record of all business expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile-Optimized Search & Filters */}
            <div className="filter-group mb-6">
              <div className="search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenditures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 touch-target"
                />
              </div>
              
              <div className="filter-item">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="touch-target">
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
              </div>
              
              <div className="filter-item">
                <Select
                  value={paymentMethodFilter}
                  onValueChange={setPaymentMethodFilter}
                >
                  <SelectTrigger className="touch-target">
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
            </div>

            {/* Desktop Table View */}
            <div className="table-responsive hidden sm:block">
              <Table className="table-desktop">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                    <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenditures.map((expenditure) => (
                    <TableRow key={expenditure.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(expenditure.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {expenditure.description}
                          </div>
                          {expenditure.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {expenditure.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expenditure.category)}>
                          {expenditure.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {expenditure.supplier}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(expenditure.paymentMethod)}
                          <span className="text-sm">
                            {getPaymentMethodLabel(expenditure.paymentMethod)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium amount-display text-base">
                          ₹{expenditure.amount.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="touch-target h-8 w-8 p-0"
                            onClick={() => handleUpdateExpenditure(expenditure.id, expenditure)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="touch-target h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteExpenditure(expenditure.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="table-mobile sm:hidden">
              {filteredExpenditures.map((expenditure) => (
                <Card key={expenditure.id} className="card-compact hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {expenditure.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(expenditure.date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                        <div className="amount-display text-lg text-right">
                          ₹{expenditure.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getCategoryColor(expenditure.category)}>
                          {expenditure.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getPaymentMethodIcon(expenditure.paymentMethod)}
                          {getPaymentMethodLabel(expenditure.paymentMethod)}
                        </div>
                      </div>

                      {/* Supplier & Notes */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Supplier: {expenditure.supplier}</div>
                        {expenditure.notes && (
                          <div className="text-xs">Note: {expenditure.notes}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="touch-target"
                          onClick={() => handleUpdateExpenditure(expenditure.id, expenditure)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="touch-target text-destructive hover:text-destructive"
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredExpenditures.length === 0 && !loading && (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' || paymentMethodFilter !== 'all'
                    ? "No expenditures match your search criteria"
                    : "No expenditures recorded yet"}
                </p>
                {!searchTerm && categoryFilter === 'all' && paymentMethodFilter === 'all' && (
                  <Button 
                    className="mt-4 touch-button"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expenditure
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Responsive Footer with Summary Info */}
      <div className="responsive-footer mt-6 p-4 bg-card border rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-lg font-semibold">{filteredExpenditures.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold text-destructive">
                ₹{filteredExpenditures.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-lg font-semibold text-info">
                ₹{filteredExpenditures
                  .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          
          {/* Device Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className="h-4 w-4 sm:hidden" />
            <Tablet className="h-4 w-4 hidden sm:block md:hidden" />
            <Monitor className="h-4 w-4 hidden md:block" />
            <span className="sm:hidden">Mobile</span>
            <span className="hidden sm:block md:hidden">Tablet</span>
            <span className="hidden md:block">Desktop</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Mobile-Optimized Add Expenditure Dialog Component
function AddExpenditureDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    description: "",
    category: "Supplies",
    amount: "",
    paymentMethod: "cash",
    supplier: "",
    notes: "",
    date: new Date().toISOString().split('T')[0], // Current date
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      
      // Reset form
      setFormData({
        description: "",
        category: "Supplies",
        amount: "",
        paymentMethod: "cash",
        supplier: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Failed to add expenditure:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
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
            className="touch-target"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="touch-target">
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
            <Label htmlFor="amount">Amount (₹)</Label>
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
              className="touch-target"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
            >
              <SelectTrigger className="touch-target">
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="touch-target"
              required
            />
          </div>
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
            className="touch-target"
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
            className="touch-target resize-none"
          />
        </div>
        
        <DialogFooter>
          <Button
            type="submit"
            disabled={!formData.description || !formData.amount || loading}
            className="touch-button w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Expenditure
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
