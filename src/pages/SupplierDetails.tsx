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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { usePermissions } from "@/hooks/usePermissions";

export default function SupplierDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { can } = usePermissions();

  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [loadingExpenditures, setLoadingExpenditures] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoadingExpenditures(true);
    apiClient.makeRequest(`/api/expenditures/by-supplier/${id}`)
      .then(res => {
        if (res.success && res.data) {
          setExpenditures(res.data);
        } else if (Array.isArray(res)) {
          setExpenditures(res);
        } else if (Array.isArray(res?.data)) {
          setExpenditures(res.data);
        }
      })
      .catch(err => console.warn(err))
      .finally(() => setLoadingExpenditures(false));
  }, [id]);

  useEffect(() => {
    // Only fetch data if user is authenticated and token is available
    const token = localStorage.getItem("callmemobiles_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Initial fetch
    apiClient.getSupplier(id).then(setSupplier).finally(() => setLoading(false));

    // Real-time updates
    const websocketUrl = import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL || import.meta.env.VITE_PRODUCTION_BACKEND_URL || "https://backendmobile-4swg.onrender.com";
    const socket = io(websocketUrl, { transports: ["websocket"] });
    const update = () => {
      const currentToken = localStorage.getItem("callmemobiles_token");
      if (currentToken) {
        apiClient.getSupplier(id).then(setSupplier);
      }
    };
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
  const paidExpenditures = expenditures.filter(
    (exp: any) => (exp.status || exp.paymentStatus || "").toLowerCase() === "paid"
  );
  const pendingExpenditures = expenditures.filter(
    (exp: any) =>
      (exp.status || exp.paymentStatus || "").toLowerCase() === "pending" ||
      (exp.status || exp.paymentStatus || "").toLowerCase() === "overdue" ||
      (exp.status || exp.paymentStatus || "").toLowerCase() === "unpaid"
  );

  if (!id) {
    return (
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
    );
  }

  const handleRecordPayment = (
    amount: number,
    method: string,
    notes: string,
  ) => {
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${typeof amount === "number" ? amount.toLocaleString() : '0'} has been recorded successfully.`,
    });
    setIsPaymentDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-secondary text-foreground dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-secondary text-foreground dark:bg-gray-900 dark:text-gray-300";
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
        return "bg-secondary text-foreground dark:bg-gray-900 dark:text-gray-300";
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
            {can('suppliers.edit') && (
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Supplier
              </Button>
            )}
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
                ₹{typeof supplier?.outstandingAmount === 'number' ? supplier.outstandingAmount.toLocaleString() : '0'}
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
                ₹{typeof supplier?.totalPurchases === 'number' ? supplier.totalPurchases.toLocaleString() : '0'}
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
                ₹{typeof supplier?.creditLimit === 'number' ? supplier.creditLimit.toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: ₹{typeof supplier?.availableCredit === 'number' ? supplier.availableCredit.toLocaleString() : '0'}
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
              {supplier?.paymentTerms && (
                <div className="text-2xl font-bold">{supplier.paymentTerms}</div>
              )}
              {supplier?.lastOrderDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last order: {supplier.lastOrderDate}
                </p>
              )}
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
                {supplier?.contactPerson && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.contactPerson}</span>
                    </div>
                  </div>
                )}
                {supplier?.phoneNumber && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.phoneNumber}</span>
                    </div>
                  </div>
                )}
                {supplier?.emailAddress && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.emailAddress}</span>
                    </div>
                  </div>
                )}
                {supplier?.gstNumber && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">GST Number</Label>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.gstNumber}</span>
                    </div>
                  </div>
                )}
                {supplier?.address && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{supplier.address}</span>
                    </div>
                  </div>
                )}
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
              {supplier?.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Category</span>
                  <Badge variant="outline">{supplier.category}</Badge>
                </div>
              )}
              {supplier?.joinedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Joined Date</span>
                  <span className="text-sm text-muted-foreground">{supplier.joinedDate}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="text-sm font-bold">
                  {supplier?.totalOrders || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Order Value</span>
                <span className="text-sm font-bold">
                  ₹{typeof supplier?.averageOrderValue === 'number' ? supplier.averageOrderValue.toLocaleString() : '0'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accordions for History */}
        <Accordion type="multiple" defaultValue={["paid-expenditures", "pending-expenditures", "linked-invoices"]} className="w-full space-y-4">
          <AccordionItem value="paid-expenditures" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-6 py-4 hover:no-underline font-bold text-lg text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Paid Expenditures
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidExpenditures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No paid expenditures found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paidExpenditures.map((exp: any) => {
                        const rawDate = exp.date ?? exp.createdAt;
                        const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : '-';
                        return (
                          <TableRow key={exp.id}>
                            <TableCell className="font-medium">{exp.description}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{exp.category}</Badge>
                            </TableCell>
                            <TableCell>₹{Number(exp.amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{exp.paymentMethod || 'cash'}</TableCell>
                            <TableCell>{formattedDate}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pending-expenditures" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-6 py-4 hover:no-underline font-bold text-lg text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pending Expenditures
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenditures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No pending expenditures found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingExpenditures.map((exp: any) => {
                        const rawDate = exp.date ?? exp.createdAt;
                        const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : '-';
                        return (
                          <TableRow key={exp.id}>
                            <TableCell className="font-medium">{exp.description}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{exp.category}</Badge>
                            </TableCell>
                            <TableCell>₹{Number(exp.amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{exp.paymentMethod || 'cash'}</TableCell>
                            <TableCell>{formattedDate}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="linked-invoices" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-6 py-4 hover:no-underline font-bold text-lg text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-orange" />
                Linked Invoices
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="overflow-x-auto rounded-md border">
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
                    {!supplier?.purchaseHistory || supplier.purchaseHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                          No linked invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplier.purchaseHistory.map((order: any) => (
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
                            ₹{typeof order.amount === "number" ? order.amount.toLocaleString() : "0"}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
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
            ₹{typeof supplier?.outstandingAmount === 'number' ? supplier.outstandingAmount.toLocaleString() : '0'}
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
            <SelectContent side="bottom" avoidCollisions={false}>
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
