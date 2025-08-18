import React, { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDevice } from "@/contexts/DeviceContext";
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  Receipt,
  Building,
  Truck,
  Coffee,
  Wifi,
  ShoppingCart,
  Fuel,
  Home,
  Briefcase,
  History,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  AlertTriangle,
  Shield,
  UserCheck,
  Clock,
  Zap
} from "lucide-react";
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { expendituresService, type Expenditure } from "@/services/expenditures";
import { useRealTimeRefresh, realTimeRefreshService } from "@/services/realTimeRefreshService";

// Expenditure categories with icons
const expenditureCategories = [
  { value: "Supplies", label: "Office Supplies", icon: Briefcase, color: "bg-blue-100 text-blue-700" },
  { value: "Equipment", label: "Equipment & Tools", icon: ShoppingCart, color: "bg-red-100 text-red-700" },
  { value: "Rent", label: "Rent & Property", icon: Home, color: "bg-indigo-100 text-indigo-700" },
  { value: "Utilities", label: "Utilities & Bills", icon: Wifi, color: "bg-purple-100 text-purple-700" },
  { value: "Salaries", label: "Staff Salaries", icon: UserCheck, color: "bg-green-100 text-green-700" },
  { value: "Marketing", label: "Marketing & Advertising", icon: TrendingUp, color: "bg-pink-100 text-pink-700" },
  { value: "Maintenance", label: "Maintenance", icon: Building, color: "bg-gray-100 text-gray-700" },
  { value: "Other", label: "Other", icon: MoreHorizontal, color: "bg-slate-100 text-slate-700" },
];

// Payment methods matching the Expenditure type
const paymentMethods = [
  { value: "cash" as const, label: "Cash" },
  { value: "card" as const, label: "Credit/Debit Card" },
  { value: "bank_transfer" as const, label: "Bank Transfer" },
  { value: "upi" as const, label: "UPI" },
  { value: "check" as const, label: "Cheque" },
];

// Date filter options
const dateFilters = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export default function ExpenditureManagement() {
  const { user, hasAccess } = useAuth();
  const { device, isMobile, isTablet, isDesktop } = useDevice();
  
  // State management
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  
  // Form state
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    category: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'check';
    supplier: string;
    date: Date;
    notes: string;
  }>({
    description: "",
    amount: "",
    category: "",
    paymentMethod: "cash",
    supplier: "",
    date: new Date(),
    notes: "",
  });

  // Load expenditures on component mount
  useEffect(() => {
    loadExpenditures();
  }, []);

  // Enable real-time refresh for expenditures
  const manualRefresh = useRealTimeRefresh('expenditures', loadExpenditures, 30000);

  const loadExpenditures = async () => {
    try {
      setLoading(true);
      const data = await expendituresService.getExpenditures();
      setExpenditures(data);
      console.log(`✅ Loaded ${data.length} expenditures with real-time refresh`);
    } catch (error) {
      console.error('❌ Failed to load expenditures:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load expenditure data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Global search and filtering
  const filteredExpenditures = useMemo(() => {
    let filtered = [...expenditures];

    // Global search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description.toLowerCase().includes(query) ||
        exp.category.toLowerCase().includes(query) ||
        exp.supplier?.toLowerCase().includes(query) ||
        exp.paymentMethod.toLowerCase().includes(query) ||
        exp.amount.toString().includes(query) ||
        format(new Date(exp.date), 'PPP').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(exp => exp.paymentMethod === paymentMethodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const expDate = (exp: Expenditure) => new Date(exp.date);

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(exp => isToday(expDate(exp)));
          break;
        case "yesterday":
          filtered = filtered.filter(exp => isYesterday(expDate(exp)));
          break;
        case "last_7_days":
          const last7Days = subDays(today, 7);
          filtered = filtered.filter(exp => expDate(exp) >= last7Days);
          break;
        case "last_30_days":
          const last30Days = subDays(today, 30);
          filtered = filtered.filter(exp => expDate(exp) >= last30Days);
          break;
        case "this_month":
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          filtered = filtered.filter(exp => {
            const date = expDate(exp);
            return date >= monthStart && date <= monthEnd;
          });
          break;
        case "custom":
          if (customDateRange.start && customDateRange.end) {
            filtered = filtered.filter(exp => {
              const date = expDate(exp);
              return date >= customDateRange.start! && date <= customDateRange.end!;
            });
          }
          break;
      }
    }

    // RBAC: Apply role-based restrictions
    if (user?.role === "worker") {
      // Workers can only see last 20 expenditures
      filtered = filtered.slice(0, 20);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenditures, searchQuery, categoryFilter, paymentMethodFilter, dateFilter, customDateRange, user?.role]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const thisMonth = filteredExpenditures.filter(exp => 
      new Date(exp.date).getMonth() === new Date().getMonth()
    ).reduce((sum, exp) => sum + exp.amount, 0);
    
    const categoryBreakdown = expenditureCategories.map(cat => ({
      ...cat,
      total: filteredExpenditures
        .filter(exp => exp.category === cat.value)
        .reduce((sum, exp) => sum + exp.amount, 0),
      count: filteredExpenditures.filter(exp => exp.category === cat.value).length
    })).filter(cat => cat.total > 0);

    return {
      total,
      thisMonth,
      count: filteredExpenditures.length,
      average: filteredExpenditures.length ? total / filteredExpenditures.length : 0,
      categoryBreakdown
    };
  }, [filteredExpenditures]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // RBAC Check: Only admin/owner can add expenditures
    if (!hasAccess(['admin', 'owner'])) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to add expenditures.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenditureData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.toISOString(),
      };

      await expendituresService.createExpenditure(expenditureData);
      
      // Trigger immediate refresh after creation
      realTimeRefreshService.onDataMutation('expenditures');
      
      toast({
        title: "Success",
        description: "Expenditure added successfully!",
      });
      
      setIsAddFormOpen(false);
      resetForm();
      await loadExpenditures();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expenditure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExpenditure) return;

    // RBAC Check: Only admin/owner can edit, workers can edit within 24 hours
    const canEdit = hasAccess(['admin', 'owner']) || 
      (user?.role === 'worker' && 
       new Date().getTime() - new Date(selectedExpenditure.createdAt).getTime() < 24 * 60 * 60 * 1000);

    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: user?.role === 'worker' 
          ? "You can only edit expenditures within 24 hours of creation."
          : "You don't have permission to edit expenditures.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.toISOString(),
      };

      await expendituresService.updateExpenditure(selectedExpenditure.id, updates);
      
      // Trigger immediate refresh after update
      realTimeRefreshService.onDataMutation('expenditures');
      
      toast({
        title: "Success",
        description: "Expenditure updated successfully!",
      });
      
      setIsEditFormOpen(false);
      setSelectedExpenditure(null);
      resetForm();
      await loadExpenditures();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expenditure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (expenditure: Expenditure) => {
    // RBAC Check: Only admin/owner can delete, workers can delete within 24 hours
    const canDelete = hasAccess(['admin', 'owner']) || 
      (user?.role === 'worker' && 
       new Date().getTime() - new Date(expenditure.createdAt).getTime() < 24 * 60 * 60 * 1000);

    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: user?.role === 'worker' 
          ? "You can only delete expenditures within 24 hours of creation."
          : "You don't have permission to delete expenditures.",
        variant: "destructive",
      });
      return;
    }

    try {
      await expendituresService.deleteExpenditure(expenditure.id);
      
      // Trigger immediate refresh after deletion
      realTimeRefreshService.onDataMutation('expenditures');
      
      toast({
        title: "Success",
        description: "Expenditure deleted successfully!",
      });
      
      await loadExpenditures();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expenditure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      paymentMethod: "cash",
      supplier: "",
      date: new Date(),
      notes: "",
    });
  };

  const openEditForm = (expenditure: Expenditure) => {
    setSelectedExpenditure(expenditure);
    setFormData({
      description: expenditure.description,
      amount: expenditure.amount.toString(),
      category: expenditure.category,
      paymentMethod: expenditure.paymentMethod,
      supplier: expenditure.supplier || "",
      date: new Date(expenditure.date),
      notes: expenditure.notes || "",
    });
    setIsEditFormOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = expenditureCategories.find(cat => cat.value === category);
    const IconComponent = categoryData?.icon || MoreHorizontal;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const categoryData = expenditureCategories.find(cat => cat.value === category);
    return categoryData?.color || "bg-gray-400";
  };

  const exportData = () => {
    // RBAC Check: Only admin/owner can export
    if (!hasAccess(['admin', 'owner'])) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export data.",
        variant: "destructive",
      });
      return;
    }

    const csv = [
      ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Supplier', 'Notes'],
      ...filteredExpenditures.map(exp => [
        format(new Date(exp.date), 'yyyy-MM-dd'),
        exp.description,
        exp.category,
        exp.amount,
        exp.paymentMethod,
        exp.supplier || '',
        exp.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenditures-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Expenditure data exported successfully!",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with RBAC indicator */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                Expenditure Management
              </h1>
              {user?.role && (
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'owner' ? 'secondary' : 'outline'} className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {user.role.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Track and manage business expenditures with advanced filtering and RBAC security
              {user?.role === 'worker' && (
                <span className="text-orange-600 ml-2">
                  • Limited to recent 20 entries with 24h edit window
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {hasAccess(['admin', 'owner']) && (
              <>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expenditure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Expenditure</DialogTitle>
                      <DialogDescription>
                        Record a new business expenditure with detailed information
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Input
                          id="description"
                          placeholder="Enter expenditure description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount *</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-10"
                              value={formData.amount}
                              onChange={(e) =>
                                setFormData({ ...formData, amount: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {expenditureCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <category.icon className="h-4 w-4" />
                                    {category.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method *</Label>
                          <Select
                            value={formData.paymentMethod}
                            onValueChange={(value: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'check') =>
                              setFormData({ ...formData, paymentMethod: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="supplier">Supplier</Label>
                          <Input
                            id="supplier"
                            placeholder="Supplier name"
                            value={formData.supplier}
                            onChange={(e) =>
                              setFormData({ ...formData, supplier: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.date ? (
                                format(formData.date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.date}
                              onSelect={(date) =>
                                setFormData({
                                  ...formData,
                                  date: date || new Date(),
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional notes (optional)"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsAddFormOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                          Add Expenditure
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${statistics.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.thisMonth.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.average.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Per expenditure
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.categoryBreakdown[0]?.label || "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                ${statistics.categoryBreakdown[0]?.total.toLocaleString() || "0"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Global search: description, category, supplier, amount, date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Options */}
              <div className="grid gap-4 md:grid-cols-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenditureCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Payment Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Methods</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {dateFilters.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setPaymentMethodFilter("all");
                    setDateFilter("all");
                    setCustomDateRange({ start: null, end: null });
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenditures Table/List */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expenditure List</CardTitle>
                    <CardDescription>
                      {filteredExpenditures.length} expenditures found
                      {user?.role === 'worker' && filteredExpenditures.length === 20 && (
                        <Badge variant="outline" className="ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Limited View
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  {user?.role && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {user.role} access
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // Mobile Card View
                  <div className="space-y-4">
                    {filteredExpenditures.map((expenditure) => (
                      <div
                        key={expenditure.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                                getCategoryColor(expenditure.category)
                              )}
                            >
                              {getCategoryIcon(expenditure.category)}
                            </div>
                            <div>
                              <h4 className="font-medium">{expenditure.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {expenditure.supplier}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-destructive">
                              ${expenditure.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(expenditure.date), "MMM dd")}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {expenditureCategories.find(c => c.value === expenditure.category)?.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {paymentMethods.find(p => p.value === expenditure.paymentMethod)?.label}
                            </Badge>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedExpenditure(expenditure);
                                setIsDetailsOpen(true);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {(hasAccess(['admin', 'owner']) || 
                                (user?.role === 'worker' && 
                                 new Date().getTime() - new Date(expenditure.createdAt).getTime() < 24 * 60 * 60 * 1000)) && (
                                <>
                                  <DropdownMenuItem onClick={() => openEditForm(expenditure)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Expenditure</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{expenditure.description}"? 
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDelete(expenditure)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {expenditure.notes && (
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {expenditure.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Desktop Table View
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenditures.map((expenditure) => (
                        <TableRow key={expenditure.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs",
                                  getCategoryColor(expenditure.category)
                                )}
                              >
                                {getCategoryIcon(expenditure.category)}
                              </div>
                              <div>
                                <div className="font-medium">{expenditure.description}</div>
                                {expenditure.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    {expenditure.notes.substring(0, 50)}
                                    {expenditure.notes.length > 50 ? "..." : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {expenditureCategories.find(c => c.value === expenditure.category)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-destructive">
                            ${expenditure.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {paymentMethods.find(p => p.value === expenditure.paymentMethod)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{expenditure.supplier || "-"}</TableCell>
                          <TableCell>{format(new Date(expenditure.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedExpenditure(expenditure);
                                  setIsDetailsOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {(hasAccess(['admin', 'owner']) || 
                                  (user?.role === 'worker' && 
                                   new Date().getTime() - new Date(expenditure.createdAt).getTime() < 24 * 60 * 60 * 1000)) && (
                                  <>
                                    <DropdownMenuItem onClick={() => openEditForm(expenditure)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Expenditure</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{expenditure.description}"? 
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDelete(expenditure)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {filteredExpenditures.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No expenditures found matching your criteria.</p>
                    {hasAccess(['admin', 'owner']) && (
                      <Button variant="outline" className="mt-4" onClick={() => setIsAddFormOpen(true)}>
                        Add First Expenditure
                      </Button>
                    )}
                  </div>
                )}

                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading expenditures...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Expenditure History</CardTitle>
                <CardDescription>
                  Monthly breakdown and category analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Category Breakdown */}
                  <div>
                    <h4 className="font-semibold mb-4">Category Breakdown</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {statistics.categoryBreakdown.map((category) => (
                        <div key={category.value} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white",
                                category.color
                              )}
                            >
                              <category.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="font-medium">{category.label}</h5>
                              <p className="text-sm text-muted-foreground">{category.count} items</p>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-destructive">
                            ${category.total.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {((category.total / statistics.total) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
          <DialogContent className="max-w-md sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Expenditure</DialogTitle>
              <DialogDescription>
                Update expenditure information
                {user?.role === 'worker' && selectedExpenditure && (
                  <Badge variant="outline" className="ml-2">
                    <Clock className="h-3 w-3 mr-1" />
                    24h Edit Window
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-10"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
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
                      {expenditureCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'check') =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          date: date || new Date(),
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditFormOpen(false);
                    setSelectedExpenditure(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Update Expenditure
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Expenditure Details</DialogTitle>
            </DialogHeader>
            {selectedExpenditure && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white",
                      getCategoryColor(selectedExpenditure.category)
                    )}
                  >
                    {getCategoryIcon(selectedExpenditure.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedExpenditure.description}</h3>
                    <p className="text-muted-foreground">
                      {expenditureCategories.find(c => c.value === selectedExpenditure.category)?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-2xl font-bold text-destructive">
                      ${selectedExpenditure.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <p className="text-lg">
                      {paymentMethods.find(p => p.value === selectedExpenditure.paymentMethod)?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <p>{format(new Date(selectedExpenditure.date), "PPPP")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Supplier</Label>
                    <p>{selectedExpenditure.supplier || "Not specified"}</p>
                  </div>
                </div>

                {selectedExpenditure.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedExpenditure.notes}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Created:</strong> {format(new Date(selectedExpenditure.createdAt), "PPp")}
                    </div>
                    <div>
                      <strong>Updated:</strong> {format(new Date(selectedExpenditure.updatedAt), "PPp")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
