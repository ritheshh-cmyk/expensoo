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
  PieChart as PieChartIcon,
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
import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { FieldInputGroup } from "@/components/ui/field-input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useConfirm } from "@/components/ui/ConfirmModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useSearchParams } from "react-router-dom";
import { SkeletonRow, SkeletonTableRow } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

export default function Expenditures() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { toast } = useToast();
  const { confirm, ConfirmModalElement } = useConfirm();
  const { can } = usePermissions();
  const canEdit = can('expenditures.edit');
  const canDelete = can('expenditures.delete');
  // Remove localStorage usage for showProfits, use only state
  const [showProfits, setShowProfits] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<any | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // All expenditure data is loaded from backend and updated via socket.io
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // BUG 5 FIX: userId was declared as useState but setUserId was never called,
  // so it was always null. Derive it directly from the auth context instead.
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  const setCurrentPage = (page: number) => {
    setSearchParams(prev => {
      prev.set("page", String(page));
      return prev;
    });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [expRes, txnRes] = await Promise.all([
          apiClient.getExpenditures(),
          apiClient.getTransactions()
        ]);
        if (!cancelled) {
          if (expRes.success && Array.isArray(expRes.data)) {
            setExpenditures(expRes.data);
          } else {
            setExpenditures([]);
          }
          if (txnRes.success && Array.isArray(txnRes.data)) {
            setTransactions(txnRes.data);
          } else {
            setTransactions([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        if (!cancelled) {
          setExpenditures([]);
          setTransactions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    // Load suppliers for the dropdown
    apiClient.getSuppliers().then(res => {
      if (res.success && Array.isArray(res.data)) setSuppliers(res.data);
    }).catch(() => {});

    // Real-time updates
    const wsUrl =
      import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL ||
      import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
      'https://backendmobile-4swg.onrender.com';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socket.on('connect_error', (err) => console.warn('Socket error (non-fatal):', err.message));

    const update = async () => {
      if (cancelled) return;
      try {
        const [expRes, txnRes] = await Promise.all([
          apiClient.getExpenditures(),
          apiClient.getTransactions()
        ]);
        if (!cancelled) {
          if (expRes.success && Array.isArray(expRes.data)) setExpenditures(expRes.data);
          if (txnRes.success && Array.isArray(txnRes.data)) setTransactions(txnRes.data);
        }
      } catch { /* non-fatal */ }
    };
    socket.on('expenditureCreated', update);
    socket.on('expenditureUpdated', update);
    socket.on('expenditureDeleted', update);
    socket.on('transactionCreated', update);
    socket.on('transactionUpdated', update);
    socket.on('transactionDeleted', update);
    
    return () => {
      cancelled = true;
      socket.off('expenditureCreated', update);
      socket.off('expenditureUpdated', update);
      socket.off('expenditureDeleted', update);
      socket.off('transactionCreated', update);
      socket.off('transactionUpdated', update);
      socket.off('transactionDeleted', update);
      socket.disconnect();
    };
  }, []);

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    // localStorage.setItem("showProfits", newValue.toString()); // Removed
  };

  // Filter expenditures
  const filteredExpenditures = (expenditures || []).filter((exp) => {
    if (!exp) return false;
    const desc = (exp.description ?? exp.category ?? '').toLowerCase();
    const sup  = (exp.recipient ?? exp.supplier ?? '').toLowerCase();
    const note = (exp.items ?? exp.notes ?? exp.remarks ?? '').toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      desc.includes(searchTerm.toLowerCase()) ||
      sup.includes(searchTerm.toLowerCase())  ||
      note.includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesPayment =
      paymentMethodFilter === 'all' ||
      exp.paymentMethod === paymentMethodFilter;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredExpenditures.length / itemsPerPage));
  
  // Slice data for the current page
  const paginatedExpenditures = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExpenditures.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenditures, currentPage, itemsPerPage]);

  // Calculate totals
  const totalExpenses = (expenditures || []).reduce((sum, exp) => sum + Number(exp?.amount ?? 0), 0);
  // Dynamic current-month filter (not hardcoded 2024-01)
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = (expenditures || [])
    .filter((exp) => {
      if (!exp) return false;
      const d = exp.createdAt ?? exp.date ?? '';
      return d.toString().startsWith(currentYearMonth);
    })
    .reduce((sum, exp) => sum + Number(exp?.amount ?? 0), 0);

  const monthlyRevenue = (transactions || [])
    .filter((txn) => {
      if (!txn) return false;
      const d = txn.createdAt ?? txn.date ?? '';
      return d.toString().startsWith(currentYearMonth);
    })
    .reduce((sum, txn) => sum + (Number(txn?.repairCost || txn?.amountGiven) || 0), 0);
    
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const categories = [...new Set((expenditures || []).map((exp) => exp?.category).filter(Boolean))];
  const paymentMethods = [
    ...new Set((expenditures || []).map((exp) => exp?.paymentMethod).filter(Boolean)),
  ];

  // Add, update, delete handlers
  const handleAddExpenditure = async (formData: any) => {
    try {
      const response = await apiClient.createExpenditure(formData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to add expenditure');
      }
      setIsAddDialogOpen(false);
      toast({ title: 'Expenditure Added', description: 'Expense recorded successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to add expenditure', variant: 'destructive' });
    }
  };
  const handleUpdateExpenditure = async (id: string, formData: any) => {
    try {
      const res = await apiClient.updateExpenditure(id, formData);
      if (!res.success) throw new Error(res.error || 'Failed to update');
      setExpenditures(prev => prev.map(e => String(e.id) === String(id) ? { ...e, ...formData } : e));
      toast({ title: 'Updated', description: 'Expenditure updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to update', variant: 'destructive' });
    }
  };
  const handleDeleteExpenditure = async (id: string) => {
    const ok = await confirm({
      title: "Delete Expenditure",
      description: "This expenditure will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.deleteExpenditure(id);
      setExpenditures(prev => prev.filter(e => String(e.id) !== String(id)));
      toast({ title: 'Deleted', description: 'Expenditure removed successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete', variant: 'destructive' });
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
      Suppliers: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Electricity Bill": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Rent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "WiFi Bill": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Others: "bg-secondary text-foreground dark:bg-gray-900 dark:text-gray-300",
    };
    return (
      colors[category] ||
      "bg-secondary text-foreground dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const categoryDataToShow = Object.entries(
        (expenditures || []).reduce((acc, exp) => {
          if (exp && exp.category) {
            acc[exp.category] = (acc[exp.category] || 0) + (Number(exp.amount) || 0);
          }
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, amount]) => ({
        name,
        amount,
        color:
          {
            Suppliers: "#3B82F6",
            "Electricity Bill": "#F59E0B",
            Rent: "#EF4444",
            "WiFi Bill": "#8B5CF6",
            Others: "#6B7280",
          }[name] || "#6B7280",
      }));

  const processChartData = () => {
    const dataMap: Record<string, { month: string, expenses: number, revenue: number, profit: number, dateObj: Date }> = {};
    
    // Process expenditures (expenses)
    (expenditures || []).forEach(exp => {
      if (!exp) return;
      const dateStr = exp.date ?? exp.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = { month: monthKey, expenses: 0, revenue: 0, profit: 0, dateObj: date };
      }
      dataMap[monthKey].expenses += Number(exp.amount || 0);
    });

    // Process transactions (revenue)
    (transactions || []).forEach(txn => {
      if (!txn) return;
      const dateStr = txn.date ?? txn.createdAt ?? txn.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = { month: monthKey, expenses: 0, revenue: 0, profit: 0, dateObj: date };
      }
      dataMap[monthKey].revenue += Number(txn.repairCost || txn.amountGiven || 0);
    });

    // Calculate profit and sort chronologically
    return Object.values(dataMap)
      .map(item => ({
        ...item,
        profit: item.revenue - item.expenses
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const monthlyChartData = processChartData();

  return (
    <div className="space-y-6">
        {ConfirmModalElement}
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("expenditures")}
            </h1>
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
              <AddExpenditureDialog onAdd={handleAddExpenditure} suppliers={suppliers} />
            </Dialog>
            {editingExpenditure && (
              <EditExpenditureDialog
                expenditure={editingExpenditure}
                suppliers={suppliers}
                onSave={handleUpdateExpenditure}
                onClose={() => setEditingExpenditure(null)}
              />
            )}
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
                ₹{typeof totalExpenses === "number" ? totalExpenses.toLocaleString() : "0"}
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
                ₹{typeof monthlyExpenses === "number" ? monthlyExpenses.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
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
                  ? `₹${(Number(monthlyProfit) || 0).toLocaleString()}`
                  : `₹${Math.round((Number(totalExpenses) || 0) / (expenditures.length || 1)).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {showProfits
                  ? new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
                  : 'Per transaction'}
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
                      `${name}: ₹${typeof value === "number" ? value.toLocaleString() : "0"}`
                    }
                  >
                    {categoryDataToShow.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry?.color || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString() : "0"}`}
                    contentStyle={{ backgroundColor: 'var(--background, #18181b)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--foreground, #fff)' }}
                    itemStyle={{ color: 'var(--foreground, #fff)' }}
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
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => `₹${typeof value === "number" ? value.toLocaleString() : "0"}`}
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
                <SelectContent side="bottom" avoidCollisions={false}>
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
                <SelectContent side="bottom" avoidCollisions={false}>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:block overflow-x-auto rounded-md border">
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
                  {loading ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <SkeletonTableRow key={`exp-row-skeleton-${idx}`} cols={7} />
                    ))
                  ) : filteredExpenditures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Receipt className="h-8 w-8 opacity-40" />
                          <span className="text-sm font-medium">No expenditures found</span>
                          <span className="text-xs">Try adjusting your filters or add a new expenditure.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExpenditures.map((expenditure) => (
                      <TableRow key={expenditure.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {(() => {
                              const raw = expenditure.date ?? expenditure.createdAt;
                              if (!raw) return '—';
                              const d = new Date(raw);
                              return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {expenditure.description}
                            </div>
                            {(expenditure.items || expenditure.notes) && (
                              <div className="text-sm text-muted-foreground">
                                {expenditure.items || expenditure.notes}
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
                        <TableCell>{expenditure.recipient || expenditure.supplier || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(expenditure.paymentMethod)}
                            {getPaymentMethodLabel(expenditure.paymentMethod)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{(Number(expenditure.amount) || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                        {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setEditingExpenditure(expenditure); }}
                                title="Edit expenditure"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteExpenditure(expenditure.id)}
                                title="Delete expenditure"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View (hidden md+) */}
            <div className="md:hidden grid gap-4 mt-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <SkeletonRow key={`exp-mobile-skeleton-${idx}`} />
                ))
              ) : filteredExpenditures.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-card border rounded-lg">
                  <Receipt className="h-8 w-8 opacity-40 mb-2" />
                  <span className="text-sm font-medium">No expenditures found</span>
                </div>
              ) : (
                paginatedExpenditures.map((expenditure) => (
                  <div key={expenditure.id} className="border border-border/50 rounded-lg p-4 space-y-3 bg-card shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground truncate">{expenditure.description}</div>
                        {(expenditure.recipient || expenditure.supplier) && (
                          <div className="text-sm text-muted-foreground truncate">{expenditure.recipient || expenditure.supplier}</div>
                        )}
                      </div>
                      <div className="font-bold text-lg text-foreground shrink-0">
                        ₹{(Number(expenditure.amount) || 0).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={getCategoryColor(expenditure.category)}>{expenditure.category}</Badge>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                        {getPaymentMethodIcon(expenditure.paymentMethod)}
                        <span>{getPaymentMethodLabel(expenditure.paymentMethod)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {(() => {
                           const raw = expenditure.date ?? expenditure.createdAt;
                           if (!raw) return '—';
                           const d = new Date(raw);
                           return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
                         })()}
                      </div>
                      <div className="flex gap-1">
                         {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingExpenditure(expenditure); }}><Edit className="h-4 w-4" /></Button>}
                         {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExpenditure(expenditure.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 pb-24 lg:pb-4 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Showing page {currentPage} of {totalPages} ({filteredExpenditures.length} expenditures found)
            </div>
            <div className="flex-1 flex justify-center sm:justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </Card>
      </div>
  );
}

// Edit Expenditure Dialog
function EditExpenditureDialog({ expenditure, suppliers, onSave, onClose }: { expenditure: any; suppliers: any[]; onSave: (id: string, data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    description: expenditure.description || "",
    category: expenditure.category || "Others",
    amount: String(expenditure.amount || ""),
    paymentMethod: expenditure.paymentMethod || "cash",
    recipient: expenditure.recipient || "",
    items: expenditure.items || "",
    supplierId: expenditure.supplierId ? String(expenditure.supplierId) : "",
    status: expenditure.status || "paid",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    const isPending = formData.category === "Suppliers" && formData.status === "pending";
    const selectedSup = suppliers.find(s => String(s.id) === String(formData.supplierId));
    const recipientName = formData.category === "Suppliers" && selectedSup ? selectedSup.name : formData.recipient;

    const payload: any = {
      ...formData,
      amount: parsedAmount,
      supplierId: formData.category === "Suppliers" && formData.supplierId ? parseInt(formData.supplierId) : null,
      status: formData.category === "Suppliers" ? formData.status : "paid",
      paidAmount: isPending ? 0 : parsedAmount,
      remainingAmount: isPending ? parsedAmount : 0,
      recipient: recipientName,
    };
    onSave(expenditure.id, payload);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expenditure</DialogTitle>
          <DialogDescription>Update this business expense</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldInputGroup
            label="Description"
            name="description"
            value={formData.description}
            onChange={value => setFormData({ ...formData, description: value })}
            required
            placeholder="What was purchased or paid for?"
          />
          <div>
            <Label htmlFor="edit-category" className="text-sm font-medium text-foreground/80 mb-1.5 block">Category</Label>
            <Select value={formData.category} onValueChange={value => setFormData({ ...formData, category: value, supplierId: value !== "Suppliers" ? "" : formData.supplierId })}>
              <SelectTrigger id="edit-category"><SelectValue /></SelectTrigger>
              <SelectContent side="bottom" avoidCollisions={false}>
                <SelectItem value="Suppliers">Suppliers</SelectItem>
                <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="WiFi Bill">WiFi Bill</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.category === "Suppliers" && (
            <>
              <div>
                <Label htmlFor="edit-supplier" className="text-sm font-medium text-foreground/80 mb-1.5 block">Supplier <span className="text-destructive">*</span></Label>
                <Select value={formData.supplierId} onValueChange={value => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger id="edit-supplier"><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false}>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground/80">Payment Status</Label>
                <RadioGroup
                  value={formData.status}
                  onValueChange={value => setFormData({ ...formData, status: value })}
                  className="flex flex-row gap-4 mt-1"
                >
                  <RadioGroupItem value="paid" label="Paid" />
                  <RadioGroupItem value="pending" label="Pending" />
                </RadioGroup>
              </div>
            </>
          )}
          <FieldInputGroup
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={value => setFormData({ ...formData, amount: value })}
            min="0"
            step="0.01"
            required
            placeholder="0.00"
          />
          <div>
            <Label htmlFor="edit-payment" className="text-sm font-medium text-foreground/80 mb-1.5 block">Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={value => setFormData({ ...formData, paymentMethod: value })}>
              <SelectTrigger id="edit-payment"><SelectValue /></SelectTrigger>
              <SelectContent side="bottom" avoidCollisions={false}>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.category !== "Suppliers" && (
            <FieldInputGroup
              label="Supplier / Vendor"
              name="recipient"
              value={formData.recipient}
              onChange={value => setFormData({ ...formData, recipient: value })}
              placeholder="Who was paid?"
              required
            />
          )}
          <FieldInputGroup
            label="Items / Notes"
            name="items"
            type="textarea"
            value={formData.items}
            onChange={value => setFormData({ ...formData, items: value })}
            rows={2}
            placeholder="Additional details..."
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!formData.description || !formData.amount || (formData.category === "Suppliers" && !formData.supplierId)}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Expenditure Dialog Component
function AddExpenditureDialog({ onAdd, suppliers = [] }: { onAdd: (data: any) => void; suppliers?: any[] }) {
  const [formData, setFormData] = useState({
    description: "",
    category: "Others",
    amount: "",
    paymentMethod: "cash",
    recipient: "",
    items: "",
    supplierId: "",
    status: "paid",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    const isPending = formData.category === "Suppliers" && formData.status === "pending";
    const selectedSup = suppliers.find(s => String(s.id) === String(formData.supplierId));
    const recipientName = formData.category === "Suppliers" && selectedSup ? selectedSup.name : formData.recipient;

    onAdd({
      ...formData,
      amount: parsedAmount,
      supplierId: formData.category === "Suppliers" && formData.supplierId ? parseInt(formData.supplierId) : null,
      status: formData.category === "Suppliers" ? formData.status : "paid",
      paidAmount: isPending ? 0 : parsedAmount,
      remainingAmount: isPending ? parsedAmount : 0,
      recipient: recipientName,
    });
    setFormData({
      description: "",
      category: "Others",
      amount: "",
      paymentMethod: "cash",
      recipient: "",
      items: "",
      supplierId: "",
      status: "paid",
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Expenditure</DialogTitle>
        <DialogDescription>Record a new business expense</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldInputGroup
          label="Description"
          name="description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="What was purchased or paid for?"
          required
        />
        <div>
          <Label htmlFor="category" className="text-sm font-medium text-foreground/80 mb-1.5 block">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value, supplierId: value !== "Suppliers" ? "" : formData.supplierId })
            }
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" avoidCollisions={false}>
              <SelectItem value="Suppliers">Suppliers</SelectItem>
              <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="WiFi Bill">WiFi Bill</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.category === "Suppliers" && (
          <>
            <div>
              <Label htmlFor="supplier" className="text-sm font-medium text-foreground/80 mb-1.5 block">Supplier <span className="text-destructive">*</span></Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplierId: value })
                }
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false}>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-foreground/80">Payment Status</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                className="flex flex-row gap-4 mt-1"
              >
                <RadioGroupItem value="paid" label="Paid" />
                <RadioGroupItem value="pending" label="Pending" />
              </RadioGroup>
            </div>
          </>
        )}
        <FieldInputGroup
          label="Amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={(value) => setFormData({ ...formData, amount: value })}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />
        <div>
          <Label htmlFor="paymentMethod" className="text-sm font-medium text-foreground/80 mb-1.5 block">Payment Method</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMethod: value })
            }
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" avoidCollisions={false}>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.category !== "Suppliers" && (
          <FieldInputGroup
            label="Supplier / Vendor"
            name="recipient"
            value={formData.recipient}
            onChange={(value) => setFormData({ ...formData, recipient: value })}
            placeholder="Who was paid?"
            required
          />
        )}
        <FieldInputGroup
          label="Items / Notes (Optional)"
          name="items"
          type="textarea"
          value={formData.items}
          onChange={(value) => setFormData({ ...formData, items: value })}
          placeholder="What was purchased? Any additional details..."
          rows={3}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={!formData.description || !formData.amount || (formData.category === "Suppliers" && !formData.supplierId)}
          >
            Add Expenditure
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
