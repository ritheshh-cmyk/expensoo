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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  History,
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  FileText,
  Download,
  Plus,
  Filter,
  Search,
  Edit,
  Banknote,
  Smartphone,
  Building,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { io } from "socket.io-client";

export default function SupplierDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Initial fetch
    apiClient.getSupplier(id).then(setSupplier).finally(() => setLoading(false));

    // Real-time updates
    const socket = io("https://positive-kodiak-friendly.ngrok-free.app", { transports: ["websocket"] });
    const update = () => apiClient.getSupplier(id).then(setSupplier);
    socket.on("supplierUpdated", update);
    socket.on("supplierDeleted", update);
    return () => {
      socket.off("supplierUpdated", update);
      socket.off("supplierDeleted", update);
      socket.disconnect();
    };
  }, [id]);

  // Edit/delete handlers
  const handleUpdateSupplier = async (formData: any) => {
    await apiClient.updateSupplier(id, formData);
  };
  const handleDeleteSupplier = async () => {
    await apiClient.deleteSupplier(id);
  };

  if (!id) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Invalid Supplier ID</h2>
            <p className="text-muted-foreground mb-4">
              The supplier ID is missing. Please go back to the suppliers list.
            </p>
            <Link to="/suppliers">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Suppliers
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleRecordPayment = (
    amount: number,
    method: string,
    notes: string,
  ) => {
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${typeof amount === "number" ? amount.toLocaleString() : amount} has been recorded successfully.`,
    });
    setIsPaymentDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
        return <DollarSign className="h-4 w-4" />;
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/suppliers">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Supplier Details
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Supplier ID: {id}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            {/* {supplier.outstandingAmount > 0 && (
              <Dialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <PaymentDialog
                  supplier={supplier}
                  onPayment={handleRecordPayment}
                />
              </Dialog>
            )} */}
          </div>
        </div>

        {/* Supplier Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{supplier?.outstandingAmount?.toLocaleString?.() || 0}
              </div>
              {supplier?.outstandingAmount > 0 && (
                <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Payment due
                </div>
              )}
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
                ₹{supplier?.totalPurchases?.toLocaleString?.() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{supplier?.creditLimit?.toLocaleString?.() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: ₹{supplier?.availableCredit?.toLocaleString?.() || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supplier?.paymentTerms || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last order: {supplier?.lastOrderDate || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>
                Contact details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Contact Person
                  </Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier?.contactPerson || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier?.phoneNumber || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier?.emailAddress || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    GST Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier?.gstNumber || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Address
                  </Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{supplier?.address || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key metrics and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusColor(supplier?.status || "inactive") || ""}>
                  {supplier?.status || "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <Badge variant="outline">{supplier?.category || "N/A"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Joined Date</span>
                <span className="text-sm text-muted-foreground">
                  {supplier?.joinedDate || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="text-sm font-bold">
                  {supplier?.totalOrders || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Order Value</span>
                <span className="text-sm font-bold">
                  ₹{supplier?.averageOrderValue?.toLocaleString() || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Purchase orders and payment records
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "overview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </Button>
                <Button
                  variant={activeTab === "purchases" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("purchases")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Purchases
                </Button>
                <Button
                  variant={activeTab === "payments" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("payments")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Recent Purchase Orders</h4>
                  <div className="space-y-3">
                    {supplier?.recentPurchaseOrders?.map((order: any) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {order.invoiceNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ₹{typeof order.amount === "number" ? order.amount.toLocaleString() : ""}
                          </div>
                          <Badge
                            className={getPaymentStatusColor(
                              order.paymentStatus,
                            )}
                            size="sm"
                          >
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Recent Payments</h4>
                  <div className="space-y-3">
                    {supplier?.recentPayments?.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            ₹{typeof payment.amount === "number" ? payment.amount.toLocaleString() : ""}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            {getPaymentMethodIcon(payment.method)}
                            {getPaymentMethodLabel(payment.method)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "purchases" && (
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search purchase orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier?.purchaseHistory?.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.invoiceNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{order.date}</TableCell>
                          <TableCell>
                            <div className="max-w-48 truncate">
                              {order.items}
                            </div>
                          </TableCell>
                          <TableCell>
                            ₹{typeof order.amount === "number" ? order.amount.toLocaleString() : ""}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getPaymentStatusColor(
                                order.paymentStatus,
                              )}
                            >
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier?.paymentHistory?.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>
                            ₹{typeof payment.amount === "number" ? payment.amount.toLocaleString() : ""}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(payment.method)}
                              {getPaymentMethodLabel(payment.method)}
                            </div>
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>{payment.invoiceNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// Payment Dialog Component
function PaymentDialog({
  supplier,
  onPayment,
}: {
  supplier: any;
  onPayment: (amount: number, method: string, notes: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > 0 && paymentAmount <= supplier?.outstandingAmount) {
      onPayment(paymentAmount, paymentMethod, notes);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>
          Record a payment for {supplier?.name}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Outstanding Amount</Label>
          <div className="text-lg font-semibold text-red-600">
            ₹{supplier?.outstandingAmount?.toLocaleString?.() || 0}
          </div>
        </div>
        <div>
          <Label htmlFor="amount">Payment Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={supplier?.outstandingAmount}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="reference">Reference Number (Optional)</Label>
          <Input
            id="reference"
            placeholder="Transaction reference..."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            placeholder="Payment notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={!amount || parseFloat(amount) <= 0}>
            Record Payment
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
