import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Phone,
  RefreshCw,
  Smartphone,
  Clock,
  IndianRupee,
  Calendar,
  User,
  Wrench,
  CreditCard,
  MoreVertical,
  ArrowRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Transaction {
  id: string;
  date: Date;
  customer: string;
  phone: string;
  device: string;
  repairType: string;
  cost: number;
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  freeGlass: boolean;
}

export default function Transactions() {
  const navigate = useNavigate();
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { t } = useLanguage();

  // Sample data - replace with API call
  const sampleTransactions: Transaction[] = [
    {
      id: "TXN001",
      date: new Date(),
      customer: "John Doe",
      phone: "+91 98765 43210",
      device: "iPhone 13",
      repairType: "Screen Replacement",
      cost: 5500,
      paymentMethod: "upi",
      status: "completed",
      freeGlass: true,
    },
    {
      id: "TXN002", 
      date: new Date(),
      customer: "Jane Smith",
      phone: "+91 87654 32109",
      device: "Samsung Galaxy S21",
      repairType: "Battery Replacement",
      cost: 3200,
      paymentMethod: "cash",
      status: "in-progress",
      freeGlass: false,
    },
    {
      id: "TXN003",
      date: new Date(),
      customer: "Mike Johnson",
      phone: "+91 76543 21098",
      device: "OnePlus 9",
      repairType: "Camera Repair",
      cost: 4800,
      paymentMethod: "card",
      status: "pending",
      freeGlass: false,
    },
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactions = await apiClient.getTransactions();
      
      if (Array.isArray(transactions)) {
        setData(transactions);
        toast({
          title: "Success",
          description: `Loaded ${transactions.length} transactions successfully.`,
        });
      } else {
        // Fallback to sample data if API fails
        setData(sampleTransactions);
        toast({
          title: "Using Sample Data",
          description: "API unavailable, showing sample transactions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Fallback to sample data
      setData(sampleTransactions);
      toast({
        title: "Error Loading Data",
        description: "Using sample data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTransactions();
      toast({
        title: "Refreshed",
        description: "Transaction data updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh transaction data.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const exportToExcel = () => {
    toast({
      title: "Export Started", 
      description: "Downloading transactions as Excel file.",
    });
  };

  const filteredTransactions = useMemo(() => {
    return data.filter(transaction => {
      const matchesSearch = 
        transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.repairType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || transaction.paymentMethod === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [data, searchQuery, statusFilter, paymentFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Repair Transactions
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage all repair orders and payments
            </p>
          </div>
          
          {/* Primary Action Button - Mobile First */}
          <Link to="/transactions/new" className="block">
            <Button className="thumb-primary w-full text-lg py-6 shadow-lg">
              <Plus className="mr-3 h-6 w-6" />
              Add New Repair Order
            </Button>
          </Link>

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
              onClick={exportToExcel}
              className="touch-button py-4 border-2"
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
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-slate-200 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First Transaction Cards */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="p-6 bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Smartphone className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
                <p className="text-base text-muted-foreground mb-6">
                  {searchQuery ? "Try adjusting your search filters" : "Start by adding your first repair transaction"}
                </p>
                <Link to="/transactions/new">
                  <Button className="thumb-primary text-lg px-8 py-4">
                    <Plus className="h-6 w-6 mr-3" />
                    Add First Transaction
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
                className="border-2 border-slate-100 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-base">{transaction.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.date.toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("px-2 py-1 text-xs border", getStatusColor(transaction.status))}>
                        {transaction.status.replace('-', ' ')}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${transaction.id}`);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${transaction.id}/edit`);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-base">{transaction.customer}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {transaction.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Device and Repair Info */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-slate-600" />
                        <span className="font-medium text-sm">{transaction.device}</span>
                      </div>
                      {transaction.freeGlass && (
                        <Badge variant="secondary" className="text-xs">
                          Free Glass
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{transaction.repairType}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                      <span className="text-sm font-medium capitalize">{transaction.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">₹{transaction.cost.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More / Pagination for Mobile */}
        {filteredTransactions.length > 0 && (
          <Card className="border-2 border-slate-100">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredTransactions.length} transactions
              </p>
              <Button variant="outline" className="touch-button">
                Load More Transactions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
