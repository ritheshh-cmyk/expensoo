import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Plus,
  Download,
  Send,
  MessageSquare,
  MessageCircle,
  Printer,
  Eye,
  Edit,
  Copy,
  Search,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

// All bills data is loaded from backend and updated via socket.io

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", color: "bg-blue-500 text-white" },
  paid: { label: "Paid", color: "bg-green-500 text-white" },
  overdue: { label: "Overdue", color: "bg-red-500 text-white" },
};

function BillStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:    'bg-brand-green/15 text-brand-green border-brand-green/20',
    unpaid:  'bg-brand-orange/15  text-brand-orange-light  border-brand-orange/20',
    overdue: 'bg-red-500/15    text-red-400    border-red-500/20',
    partial: 'bg-blue-500/15   text-blue-400   border-blue-500/20',
    draft:   'bg-zinc-500/15   text-muted-foreground   border-zinc-500/20',
    sent:    'bg-blue-500/15   text-blue-400   border-blue-500/20',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-zinc-500/15 text-muted-foreground border-zinc-500/20';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{status || 'Unknown'}</span>;
}

export default function Bills() {
  const location = useLocation();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewBill, setPreviewBill] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    apiClient.getBills().then(res => {
      if (res.success) {
        setBills(res.data);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [refreshKey]);

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    date: new Date().toISOString().split("T")[0],
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    taxRate: 10,
    discount: 0,
    notes: "",
  });

  useEffect(() => {
    if (location.state?.prefill) {
      const { customerName, phoneNumber, repairCost, repairType, customRepairType } = location.state.prefill;
      const desc = repairType === "others" ? customRepairType || "Repair Service" : repairType || "Repair Service";
      
      setFormData(prev => ({
        ...prev,
        customerName: customerName || "",
        customerPhone: phoneNumber || "",
        items: [{
          description: desc,
          quantity: 1,
          rate: repairCost || 0,
          amount: repairCost || 0
        }]
      }));
      setShowCreateDialog(true);
      
      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, rate: 0, amount: 0 },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount - formData.discount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleCustomerSelect = async (customerId: string) => {
    try {
      const customer = await apiClient.getCustomerById(customerId);
      if (customer) {
        setFormData({
          ...formData,
          customerId,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
        });
      }
    } catch (error) {
      toast({ title: "Error fetching customer", description: "Could not fetch customer details." });
    }
  };

  const handlePreview = (bill: any) => {
    setPreviewBill(bill);
    setShowPreviewDialog(true);
  };

  const handleDownloadPDF = (bill: any) => {
    // Mock PDF download
    console.log("Downloading PDF for bill:", bill.id);
  };

  const handleSendWhatsApp = (bill: any) => {
    let phone = (bill.customerPhone || '').replace(/\D/g, '');
    if (!phone) {
      toast({ title: "No phone number", description: "Customer phone number is missing." });
      return;
    }
    const message = `🧾 *Invoice from Call Me Mobiles*\n\nDear ${bill.customerName},\n\nHere are your bill details:\nInvoice #: ${bill.id}\nDate: ${bill.date}\nAmount: ₹${bill.amount}\n\nThank you for your business!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
    toast({ title: "WhatsApp Opened", description: `Opening WhatsApp for ${bill.customerName}` });
  };

  const handleSendSMS = async (bill: any) => {
    // Format phone number (remove non-digits, ensure country code)
    let phone = (bill.customerPhone || '').replace(/\D/g, '');
    if (!phone) {
      toast({ title: "No phone number", description: "Customer phone number is missing." });
      return;
    }
    // Compose a simple bill message
    const message = `Invoice ${bill.id} for ${bill.customerName}\nAmount: ₹${bill.amount}\nDate: ${bill.date}`;
    try {
      await apiClient.sendBillSMS({ phone, message });
      toast({ title: "SMS Sent", description: `Bill sent to ${bill.customerName} (${bill.customerPhone})` });
    } catch (error) {
      toast({ title: "SMS Failed", description: "Could not send SMS. Please try again." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newBill = {
      id: `INV-${String(bills.length + 1).padStart(3, "0")}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      date: formData.date,
      amount: total,
      status: "draft",
      items: formData.items.filter(
        (item) => item.description && item.amount > 0,
      ),
      tax: taxAmount,
      total: total,
    };

    try {
      const createdBill = await apiClient.createBill(newBill);
      setRefreshKey(prev => prev + 1);
      setShowCreateDialog(false);

      // Reset form
      setFormData({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        date: new Date().toISOString().split("T")[0],
        items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
        taxRate: 10,
        discount: 0,
        notes: "",
      });
      toast({ title: "Bill Created", description: `Bill ${createdBill.id} created successfully.` });
    } catch (error) {
      toast({ title: "Error creating bill", description: "Could not create bill. Please try again." });
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              E-Bill Generator
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage customer bills and invoices
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-muted/50 border border-border text-foreground text-sm font-medium transition-colors cursor-pointer min-h-[44px]">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-brand-orange hover:bg-brand-orange-light text-black font-semibold border-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bill</DialogTitle>
                  <DialogDescription>
                    Generate a professional invoice for repair services
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="customer" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="customer">Customer</TabsTrigger>
                      <TabsTrigger value="items">Items</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="customer" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Select Customer</Label>
                          <Select onValueChange={handleCustomerSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose existing customer" />
                            </SelectTrigger>
                            <SelectContent side="bottom" avoidCollisions={false}>
                              {/* This section will be populated by API calls */}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Bill Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Customer Name *</Label>
                          <Input
                            id="customerName"
                            value={formData.customerName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone">Phone Number</Label>
                          <Input
                            id="customerPhone"
                            value={formData.customerPhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customerEmail">Email Address</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerEmail: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customerAddress">Address</Label>
                        <Textarea
                          id="customerAddress"
                          value={formData.customerAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerAddress: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="items" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Bill Items</h3>
                        <Button type="button" onClick={addLineItem} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.items.map((item, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="col-span-2 md:col-span-2">
                                <Label>Description</Label>
                                <Input
                                  placeholder="iPhone 14 Pro Screen Replacement"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateLineItem(
                                      index,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateLineItem(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <Label>Rate (₹)</Label>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) =>
                                    updateLineItem(
                                      index,
                                      "rate",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1 flex items-end gap-2">
                                <div className="flex-1">
                                  <Label>Amount</Label>
                                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                                    ₹{item.amount.toFixed(2)}
                                  </div>
                                </div>
                                {formData.items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => removeLineItem(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxRate">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            value={formData.taxRate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                taxRate: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discount">Discount (₹)</Label>
                          <Input
                            id="discount"
                            type="number"
                            value={formData.discount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discount: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Thank you for your business!"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                      <Card className="p-6">
                        <div className="space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h1 className="text-2xl font-bold text-primary">
                                INVOICE
                              </h1>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">
                                Call Me Mobiles
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Mobile Repair Services
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">
                                Bill To:
                              </h3>
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium">
                                  {formData.customerName}
                                </p>
                                {formData.customerPhone && (
                                  <p>{formData.customerPhone}</p>
                                )}
                                {formData.customerEmail && (
                                  <p>{formData.customerEmail}</p>
                                )}
                                {formData.customerAddress && (
                                  <p>{formData.customerAddress}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">
                                Invoice Details:
                              </h3>
                              <div className="text-sm text-muted-foreground">
                                <p>Date: {formData.date}</p>
                                <p>Due Date: {formData.date}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2">
                                    Description
                                  </th>
                                  <th className="text-right py-2">Qty</th>
                                  <th className="text-right py-2">Rate</th>
                                  <th className="text-right py-2">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.items
                                  .filter((item) => item.description && item.description.toLowerCase() !== 'service charge')
                                  .map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-border/50"
                                    >
                                      <td className="py-2">
                                        {item.description}
                                      </td>
                                      <td className="text-right py-2">
                                        {item.quantity}
                                      </td>
                                      <td className="text-right py-2">
                                        ₹{item.rate.toFixed(2)}
                                      </td>
                                      <td className="text-right py-2">
                                        ₹{item.amount.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex justify-end">
                            <div className="w-64">
                              <div className="flex justify-between py-1">
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Tax ({formData.taxRate}%):</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                              </div>
                              {formData.discount > 0 && (
                                <div className="flex justify-between py-1">
                                  <span>Discount:</span>
                                  <span>-₹{formData.discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-2 border-t border-border font-bold text-lg">
                                <span>Total:</span>
                                <span>₹{total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {formData.notes && (
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">
                                Notes:
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formData.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Bill</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
              <FileText className="h-4 w-4 text-brand-orange-light" />
            </div>
            <div className="text-2xl font-bold text-foreground">{bills.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <DollarSign className="h-4 w-4 text-brand-orange-light" />
            </div>
            <div className="text-2xl font-bold text-brand-orange-light">
              ₹
              {typeof bills.reduce((sum, bill) => sum + (typeof bill.amount === 'number' ? bill.amount : 0), 0) === 'number' ? bills.reduce((sum, bill) => sum + (typeof bill.amount === 'number' ? bill.amount : 0), 0).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Total invoiced</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Paid Bills</p>
              <Receipt className="h-4 w-4 text-brand-green" />
            </div>
            <div className="text-2xl font-bold text-brand-green">
              {bills.filter((bill) => bill.status === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground">Payment received</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <Calendar className="h-4 w-4 text-brand-orange-light" />
            </div>
            <div className="text-2xl font-bold text-brand-orange-light">
              {bills.filter((bill) => bill.status === "sent").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bills by customer or invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-brand-orange/50"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false}>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        {/* Bills List */}
        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`bill-skeleton-${idx}`} className="rounded-xl border border-border bg-background backdrop-blur-sm p-6 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-white/10 rounded w-1/4" />
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end space-y-2 shrink-0">
                    <div className="h-6 bg-white/10 rounded w-16" />
                    <div className="flex gap-1">
                      <div className="h-9 w-9 bg-white/10 rounded-lg" />
                      <div className="h-9 w-9 bg-white/10 rounded-lg" />
                      <div className="h-9 w-9 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <Receipt className="h-12 w-12 opacity-40 mb-3" />
              <p className="font-medium">No bills found</p>
              <p className="text-sm mt-1">Generate your first invoice to get started</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="rounded-xl border border-border bg-background backdrop-blur-sm hover:border-brand-orange/30 transition-all duration-200">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-brand-orange-light" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-foreground">{bill.id}</h3>
                          <BillStatusBadge status={bill.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {bill.customerName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Date: {bill.date}</span>
                          <span>Items: {bill.items.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          ₹{typeof bill.amount === "number" ? bill.amount.toLocaleString() : "0"}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-background border-border text-foreground hover:bg-muted/50 hover:border-white/20 cursor-pointer min-h-[44px]"
                          onClick={() => handlePreview(bill)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-background border-border text-foreground hover:bg-muted/50 hover:border-white/20 cursor-pointer min-h-[44px]"
                          onClick={() => handleDownloadPDF(bill)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {bill.customerPhone && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 bg-background border-border text-foreground hover:bg-muted/50 hover:border-white/20 cursor-pointer min-h-[44px]"
                              onClick={() => handleSendWhatsApp(bill)}
                              title="Send via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 bg-background border-border text-foreground hover:bg-muted/50 hover:border-white/20 cursor-pointer min-h-[44px]"
                              onClick={() => handleSendSMS(bill)}
                              title="Send SMS"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bill Preview</DialogTitle>
              <DialogDescription>
                Preview and manage bill actions
              </DialogDescription>
            </DialogHeader>

            {previewBill && (
              <div className="space-y-6 p-6 bg-card border rounded-lg text-card-foreground">
                {/* Bill content similar to the form preview */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-primary">
                      INVOICE
                    </h1>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      Call Me Mobiles
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mobile Repair Services
                    </p>
                  </div>
                </div>

                {/* Customer and invoice details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Bill To:
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{previewBill.customerName}</p>
                      <p>{previewBill.customerPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Invoice Details:
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Date: {previewBill.date}</p>
                      <p>
                        Status:{" "}
                        {
                          statusConfig[
                            previewBill.status as keyof typeof statusConfig
                          ].label
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewBill.items.filter((item: any) => item.description && item.description.toLowerCase() !== 'service charge').map((item: any, index: number) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">
                            ₹{item.rate.toFixed(2)}
                          </td>
                          <td className="text-right py-2">
                            ₹{item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-t border-border font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{previewBill.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="default" className="flex-1" onClick={() => handleDownloadPDF(previewBill)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="default" className="flex-1" onClick={() => handleSendSMS(previewBill)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send SMS
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
