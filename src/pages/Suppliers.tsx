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
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultSuppliers } from "@/data/suppliers";
import { apiClient } from "@/lib/api";
import {
  Users,
  Plus,
  DollarSign,
  Phone,
  MessageCircle,
  Download,
  Search,
  Filter,
  Edit,
  Eye,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Define a PaymentRecord type
type PaymentRecord = {
  date: string;
  amount: number;
  mode: string;
  remarks: string;
  supplierId: string;
  supplierName: string;
};

// Define a Supplier type with paymentHistory
type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  address: string;
  outstandingAmount: number;
  totalPurchases: number;
  lastOrderDate: string;
  status: string;
  paymentTerms: string;
  category: string;
  paymentHistory: PaymentRecord[];
};

export default function Suppliers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState<{ open: boolean; supplierId: string | null }>({ open: false, supplierId: null });
  const [historyDialogOpen, setHistoryDialogOpen] = useState<{ open: boolean; supplierId: string | null }>({ open: false, supplierId: null });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const backendSuppliers = await apiClient.getSuppliers();
        setSuppliers((backendSuppliers as Supplier[]).map(s => ({ ...s, paymentHistory: s.paymentHistory || [] })));
      } catch (error) {
        console.warn("Backend suppliers not available, using defaults:", error);
        // Keep default suppliers as fallback
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  // Filter suppliers based on search and status
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalOutstanding = suppliers.reduce(
    (sum, supplier) => sum + supplier.outstandingAmount,
    0,
  );
  const totalPurchases = suppliers.reduce(
    (sum, supplier) => sum + supplier.totalPurchases,
    0,
  );

  const handleAddSupplier = async (newSupplier: any) => {
    try {
      const supplier: Supplier = {
        ...newSupplier,
        id: `SUP${String(suppliers.length + 1).padStart(3, "0")}`,
        totalPurchases: 0,
        outstandingAmount: 0,
        lastOrderDate: new Date().toISOString().split("T")[0],
        status: "active",
        paymentHistory: [],
      };
      // Try backend first
      try {
        const createdSupplier = await apiClient.createSupplier(supplier);
        // Ensure createdSupplier is an object and has paymentHistory
        let safeSupplier: Supplier;
        if (createdSupplier && typeof createdSupplier === 'object') {
          safeSupplier = Object.assign({}, createdSupplier) as Supplier;
          if (!Array.isArray((safeSupplier as any).paymentHistory)) {
            (safeSupplier as any).paymentHistory = [];
          }
        } else {
          safeSupplier = supplier;
        }
        setSuppliers([...suppliers, safeSupplier]);
      } catch (error) {
        // Fallback to local storage
        console.warn("Backend create failed, using local:", error);
        setSuppliers([...suppliers, supplier]);
      }
      setShowAddDialog(false);
      toast({
        title: "Supplier Added",
        description: `${supplier.name} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add supplier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Hello ${name}, I hope you're doing well. I wanted to check on our recent orders and discuss any pending items.`,
    );
    window.open(
      `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`,
    );
  };

  // Helper to get supplier by ID
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);

  // Handle payment
  const handlePaySupplier = (supplierId: string, amount: number, mode: string, remarks: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const newOutstanding = Math.max(0, (s.outstandingAmount || 0) - amount);
        const paymentRecord = {
          date: new Date().toISOString(),
          amount,
          mode,
          remarks,
          supplierId: s.id,
          supplierName: s.name,
        };
        return {
          ...s,
          outstandingAmount: newOutstanding,
          paymentHistory: [...(s.paymentHistory || []), paymentRecord],
        };
      }
      return s;
    }));
    setPayDialogOpen({ open: false, supplierId: null });
    setPaymentAmount("");
    setPaymentMode("cash");
    setPaymentRemarks("");
    toast({ title: "Payment Recorded", description: `Payment of ₹${amount} recorded.` });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("suppliers")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your supplier relationships and track purchases
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <AddSupplierDialog onAdd={handleAddSupplier} />
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSuppliers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSuppliers} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalOutstanding.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending payments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalPurchases.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30 days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Payment period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Manage your supplier database and track payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading suppliers...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No suppliers found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.contactPerson}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{supplier.outstandingAmount?.toLocaleString?.()}
                          </div>
                          {supplier.outstandingAmount > 0 && (
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1"
                            >
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Due
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{supplier.totalPurchases?.toLocaleString?.()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {supplier.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(supplier.lastOrderDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {supplier.paymentTerms}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              supplier.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setPayDialogOpen({ open: true, supplierId: supplier.id });
                              setPaymentMode("cash");
                              setPaymentRemarks("");
                            }} disabled={supplier.outstandingAmount <= 0}>Pay</Button>
                            <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen({ open: true, supplierId: supplier.id })}>History</Button>
                            <Link to={`/suppliers/${supplier.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {payDialogOpen.open && (
        <PaySupplierDialog
          open={payDialogOpen.open}
          onOpenChange={(open) => setPayDialogOpen({ open, supplierId: open ? payDialogOpen.supplierId : null })}
          supplier={getSupplierById(payDialogOpen.supplierId)}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          onPay={(amount, mode, remarks) => handlePaySupplier(payDialogOpen.supplierId, amount, mode, remarks)}
        />
      )}
      {historyDialogOpen.open && (
        <SupplierHistoryDialog
          open={historyDialogOpen.open}
          onOpenChange={(open) => setHistoryDialogOpen({ open, supplierId: open ? historyDialogOpen.supplierId : null })}
          suppliers={suppliers}
        />
      )}
    </AppLayout>
  );
}

// Add Supplier Dialog Component
function AddSupplierDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    address: "",
    paymentTerms: "30 days",
    category: "Electronics",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      whatsapp: "",
      address: "",
      paymentTerms: "30 days",
      category: "Electronics",
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogDescription>
          Add a new supplier to your database
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Supplier Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Company name"
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            placeholder="Primary contact name"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+91 98765 43210"
            required
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) =>
              setFormData({ ...formData, whatsapp: e.target.value })
            }
            placeholder="+91 98765 43210"
            required
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Business address"
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
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Parts">Parts</SelectItem>
              <SelectItem value="Screen & Display">Screen & Display</SelectItem>
              <SelectItem value="Batteries & Charging">
                Batteries & Charging
              </SelectItem>
              <SelectItem value="Tools & Equipment">
                Tools & Equipment
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit">Add Supplier</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// PaySupplierDialog component
function PaySupplierDialog({ open, onOpenChange, supplier, paymentAmount, setPaymentAmount, onPay }) {
  const [mode, setMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  if (!supplier) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div>Supplier: <b>{supplier.name}</b></div>
        <div>Outstanding: ₹{supplier.outstandingAmount?.toLocaleString?.()}</div>
        <Input
          type="number"
          min={1}
          max={supplier.outstandingAmount}
          value={paymentAmount}
          onChange={e => setPaymentAmount(e.target.value)}
          placeholder="Enter payment amount"
        />
        <div className="flex gap-2 mt-2">
          <Label>Mode:</Label>
          <select value={mode} onChange={e => setMode(e.target.value)} className="border rounded px-2 py-1">
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div className="mt-2">
          <Label>Remarks:</Label>
          <Input
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Remarks (optional)"
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onPay(Number(paymentAmount), mode, remarks)} disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > supplier.outstandingAmount}>Pay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// SupplierHistoryDialog component
function SupplierHistoryDialog({ open, onOpenChange, suppliers }: { open: boolean; onOpenChange: (open: boolean) => void; suppliers: Supplier[] }) {
  // Gather all payments from all suppliers
  const allPayments = suppliers.flatMap(s => (s.paymentHistory || []).map(p => ({ ...p, supplierName: s.name })));
  // Sort by date descending
  allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All Supplier Payments</DialogTitle>
        </DialogHeader>
        {allPayments.length > 0 ? (
          <ul className="space-y-2">
            {allPayments.map((p, idx) => (
              <li key={idx} className="flex flex-col border-b pb-2">
                <div className="flex justify-between">
                  <span><b>{p.supplierName}</b></span>
                  <span>{new Date(p.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>₹{p.amount} ({p.mode})</span>
                  <span>{p.remarks}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>No payments recorded.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
