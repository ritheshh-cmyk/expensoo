import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  CreditCard,
  History,
  IndianRupee,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDevice } from "@/contexts/DeviceContext";

interface Payment {
  id: string;
  supplierId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "upi" | "credit_card";
  status: "pending" | "completed" | "failed" | "cancelled";
  referenceNumber?: string;
  notes?: string;
  invoiceNumber?: string;
  createdAt: Date;
}

interface SupplierPaymentProps {
  supplierId: string;
  supplierName: string;
  currentBalance: number;
  totalSpent: number;
  onPaymentAdded?: (payment: Payment) => void;
}

export function SupplierPaymentManagement({
  supplierId,
  supplierName,
  currentBalance,
  totalSpent,
  onPaymentAdded,
}: SupplierPaymentProps) {
  const { toast } = useToast();
  const { isMobile } = useDevice();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
    invoiceNumber: "",
  });

  // Sample payment history
  const samplePayments: Payment[] = [
    {
      id: "PAY001",
      supplierId,
      amount: 15000,
      paymentDate: new Date(Date.now() - 86400000 * 5),
      paymentMethod: "bank_transfer",
      status: "completed",
      referenceNumber: "TXN123456789",
      notes: "Payment for iPhone parts batch",
      invoiceNumber: "INV-2024-001",
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: "PAY002",
      supplierId,
      amount: 8500,
      paymentDate: new Date(Date.now() - 86400000 * 15),
      paymentMethod: "upi",
      status: "completed",
      referenceNumber: "UPI789123456",
      notes: "Quick payment for urgent order",
      invoiceNumber: "INV-2024-002",
      createdAt: new Date(Date.now() - 86400000 * 15),
    },
    {
      id: "PAY003",
      supplierId,
      amount: 3200,
      paymentDate: new Date(Date.now() - 86400000 * 25),
      paymentMethod: "cash",
      status: "completed",
      notes: "Cash payment for small parts",
      createdAt: new Date(Date.now() - 86400000 * 25),
    },
  ];

  useEffect(() => {
    setPayments(samplePayments);
  }, [supplierId]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return "💵";
      case "bank_transfer": return "🏦";
      case "cheque": return "📝";
      case "upi": return "📱";
      case "credit_card": return "💳";
      default: return "💰";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      case "cancelled": return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newPayment: Payment = {
      id: `PAY${String(payments.length + 1).padStart(3, '0')}`,
      supplierId,
      amount: parseFloat(paymentForm.amount),
      paymentDate: new Date(),
      paymentMethod: paymentForm.paymentMethod as Payment['paymentMethod'],
      status: "completed",
      referenceNumber: paymentForm.referenceNumber,
      notes: paymentForm.notes,
      invoiceNumber: paymentForm.invoiceNumber,
      createdAt: new Date(),
    };

    setPayments([newPayment, ...payments]);
    setPaymentForm({
      amount: "",
      paymentMethod: "",
      referenceNumber: "",
      notes: "",
      invoiceNumber: "",
    });
    setIsPaymentDialogOpen(false);

    onPaymentAdded?.(newPayment);

    toast({
      title: "Payment Recorded",
      description: `₹${newPayment.amount.toLocaleString('en-IN')} payment recorded successfully.`,
    });
  };

  const totalPaid = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingBalance = Math.max(0, totalSpent - totalPaid);

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-2 border-green-100 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-xl font-bold text-green-700">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Outstanding</p>
                <p className="text-xl font-bold text-orange-700">
                  ₹{outstandingBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-xl font-bold text-blue-700">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            Manage payments for {supplierName}
          </p>
        </div>
        
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="thumb-primary">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Add a payment record for {supplierName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select 
                    value={paymentForm.paymentMethod} 
                    onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="upi">📱 UPI</SelectItem>
                      <SelectItem value="cheque">📝 Cheque</SelectItem>
                      <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Transaction ID"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, referenceNumber: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="INV-2024-001"
                    value={paymentForm.invoiceNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, invoiceNumber: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Payment description or notes..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment} className="thumb-primary">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment History */}
      {isMobile ? (
        // Mobile Card View
        <div className="space-y-3">
          {payments.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-8 text-center">
                <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by recording your first payment
                </p>
                <Button 
                  onClick={() => setIsPaymentDialogOpen(true)}
                  className="thumb-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} className="border-2 border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</div>
                      <div>
                        <p className="font-semibold text-lg">
                          ₹{payment.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.id}</p>
                      </div>
                    </div>
                    <Badge className={cn("px-2 py-1 text-xs flex items-center space-x-1 border", getStatusColor(payment.status))}>
                      {getStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{payment.paymentDate.toLocaleDateString('en-IN')}</span>
                    </div>
                    {payment.referenceNumber && (
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-3 w-3" />
                        <span>{payment.referenceNumber}</span>
                      </div>
                    )}
                    {payment.invoiceNumber && (
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-3 w-3" />
                        <span>Invoice: {payment.invoiceNumber}</span>
                      </div>
                    )}
                    {payment.notes && (
                      <p className="text-xs italic">{payment.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Desktop Table View
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-2">No payments recorded</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by recording your first payment
                      </p>
                      <Button 
                        onClick={() => setIsPaymentDialogOpen(true)}
                        className="thumb-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                          <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.paymentDate.toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge className={cn("px-2 py-1 text-xs flex items-center space-x-1 border w-fit", getStatusColor(payment.status))}>
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.referenceNumber && <div>{payment.referenceNumber}</div>}
                          {payment.invoiceNumber && <div className="text-muted-foreground">{payment.invoiceNumber}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      {payments.length > 0 && (
        <Card className="border-2 border-slate-100">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Completed Payments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Pending Payments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">₹{(totalPaid / payments.filter(p => p.status === "completed").length || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Average Payment</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{Math.round((totalPaid / totalSpent) * 100 || 0)}%</p>
                <p className="text-xs text-muted-foreground">Payment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
