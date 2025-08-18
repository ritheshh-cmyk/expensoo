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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingDown,
  Plus,
  Receipt,
  Calculator,
  Download,
  Search,
  Edit,
  Trash2,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  ShoppingCart,
  Fuel,
  Wrench,
  Coffee,
  Car,
  Home,
  MoreVertical,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Expenditure {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  supplier?: string;
  invoiceNumber?: string;
}

export default function Expenditures() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for new expenditure
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    paymentMethod: "",
    supplier: "",
    invoiceNumber: "",
  });

  // Sample data
  const sampleExpenditures: Expenditure[] = [
    {
      id: "EXP001",
      date: new Date(),
      amount: 15000,
      category: "Inventory",
      description: "iPhone screens bulk purchase",
      paymentMethod: "bank-transfer",
      supplier: "TechParts India",
      invoiceNumber: "INV-2024-001",
    },
    {
      id: "EXP002",
      date: new Date(Date.now() - 86400000),
      amount: 2500,
      category: "Tools",
      description: "New screwdriver set",
      paymentMethod: "cash",
      supplier: "Hardware Store",
    },
    {
      id: "EXP003",
      date: new Date(Date.now() - 172800000),
      amount: 800,
      category: "Utilities",
      description: "Electricity bill",
      paymentMethod: "upi",
    },
  ];

  useEffect(() => {
    setExpenditures(sampleExpenditures);
  }, []);

  const categories = [
    { value: "inventory", label: "Inventory", icon: ShoppingCart, color: "bg-blue-100 text-blue-700" },
    { value: "tools", label: "Tools", icon: Wrench, color: "bg-green-100 text-green-700" },
    { value: "utilities", label: "Utilities", icon: Home, color: "bg-yellow-100 text-yellow-700" },
    { value: "transport", label: "Transport", icon: Car, color: "bg-purple-100 text-purple-700" },
    { value: "office", label: "Office", icon: Coffee, color: "bg-orange-100 text-orange-700" },
    { value: "rent", label: "Rent", icon: Building, color: "bg-red-100 text-red-700" },
    { value: "other", label: "Other", icon: Receipt, color: "bg-gray-100 text-gray-700" },
  ];

  const getCategoryInfo = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category.toLowerCase());
    return categoryInfo || categories[categories.length - 1];
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "upi": return "📱";
      case "cash": return "💵";
      case "card": return "💳";
      case "bank-transfer": return "🏦";
      default: return "💰";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Expenditure data updated successfully.",
      });
    }, 1000);
  };

  const handleAddExpenditure = () => {
    if (!formData.amount || !formData.category || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newExpenditure: Expenditure = {
      id: `EXP${String(expenditures.length + 1).padStart(3, '0')}`,
      date: new Date(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      paymentMethod: formData.paymentMethod as any,
      supplier: formData.supplier,
      invoiceNumber: formData.invoiceNumber,
    };

    setExpenditures([newExpenditure, ...expenditures]);
    setFormData({
      amount: "",
      category: "",
      description: "",
      paymentMethod: "",
      supplier: "",
      invoiceNumber: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Success",
      description: "Expenditure added successfully.",
    });
  };

  const filteredExpenditures = expenditures.filter(expenditure => {
    const matchesSearch = 
      expenditure.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expenditure.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expenditure.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expenditure.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || expenditure.category.toLowerCase() === categoryFilter;
    const matchesPayment = paymentMethodFilter === "all" || expenditure.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesCategory && matchesPayment;
  });

  const totalExpenditure = filteredExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
  const todayExpenditure = filteredExpenditures
    .filter(exp => exp.date.toDateString() === new Date().toDateString())
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Expenditures
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Track business expenses and costs
            </p>
          </div>

          {/* Quick Stats - Mobile Optimized */}
          <div className="grid gap-4 grid-cols-2">
            <Card className="border-2 border-red-100 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Today's Expenses</p>
                    <p className="text-2xl font-bold text-red-700">₹{todayExpenditure.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Calculator className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Total Filtered</p>
                    <p className="text-2xl font-bold text-orange-700">₹{totalExpenditure.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Primary Action Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="thumb-primary w-full text-lg py-6 shadow-lg">
                <Plus className="mr-3 h-6 w-6" />
                Add New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Expenditure</DialogTitle>
                <DialogDescription>
                  Enter the details of your business expense
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-4 w-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter expense description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="upi">📱 UPI</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="bank-transfer">🏦 Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    placeholder="Supplier name"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Invoice/Bill number"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddExpenditure} className="w-full sm:w-auto thumb-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expenditure
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Secondary Actions */}
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
              className="touch-button py-4 border-2"
              onClick={() => {
                toast({
                  title: "Export Started",
                  description: "Downloading expenses as Excel file.",
                });
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Mobile-Optimized Search and Filters */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-slate-200 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="upi">📱 UPI</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                    <SelectItem value="bank-transfer">🏦 Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First Expenditure Cards */}
        <div className="space-y-3">
          {filteredExpenditures.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="p-6 bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Receipt className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No expenses found</h3>
                <p className="text-base text-muted-foreground mb-6">
                  {searchTerm ? "Try adjusting your search filters" : "Start by adding your first business expense"}
                </p>
                <Button 
                  className="thumb-primary text-lg px-8 py-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Add First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredExpenditures.map((expenditure) => {
              const categoryInfo = getCategoryInfo(expenditure.category);
              const CategoryIcon = categoryInfo.icon;
              
              return (
                <Card 
                  key={expenditure.id} 
                  className="border-2 border-slate-100 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-full", categoryInfo.color)}>
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{expenditure.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {expenditure.date.toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("px-2 py-1 text-xs", categoryInfo.color)}>
                          {expenditure.category}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-base font-medium">{expenditure.description}</p>
                      {expenditure.supplier && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Supplier: {expenditure.supplier}
                        </p>
                      )}
                      {expenditure.invoiceNumber && (
                        <p className="text-sm text-muted-foreground">
                          Invoice: {expenditure.invoiceNumber}
                        </p>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getPaymentMethodIcon(expenditure.paymentMethod)}</span>
                        <span className="text-sm font-medium capitalize">
                          {expenditure.paymentMethod.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">
                          -₹{expenditure.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Load More for Mobile */}
        {filteredExpenditures.length > 0 && (
          <Card className="border-2 border-slate-100">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredExpenditures.length} expenses • Total: ₹{totalExpenditure.toLocaleString('en-IN')}
              </p>
              <Button variant="outline" className="touch-button">
                Load More Expenses
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
