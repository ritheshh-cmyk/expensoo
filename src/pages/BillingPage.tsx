import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Send
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Bill {
  id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: BillItem[];
  notes: string;
  created_at: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [newBill, setNewBill] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as BillItem[],
    discount_amount: 0,
    tax_percentage: 18
  });
  
  const [existingCustomers, setExistingCustomers] = useState<{name: string, phone: string}[]>([]);

  const canCreateBills = can('billing.create');
  const canEditBills = can('billing.edit');
  const canDeleteBills = can('billing.delete');

  useEffect(() => {
    loadBills();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await apiClient.request('/api/transactions?limit=1000');
      if (res.success && res.data) {
        const txs = res.data.data || res.data;
        const customersMap = new Map();
        txs.forEach((t: any) => {
          if (t.customerName && t.mobileNumber && !customersMap.has(t.mobileNumber)) {
            customersMap.set(t.mobileNumber, { name: t.customerName, phone: t.mobileNumber });
          }
        });
        setExistingCustomers(Array.from(customersMap.values()));
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockBills: Bill[] = [
        {
          id: '1',
          bill_number: 'INV-2025-001',
          customer_id: '1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+91 98765 43210',
          bill_date: '2025-08-18',
          due_date: '2025-09-18',
          subtotal: 5000,
          tax_amount: 900,
          discount_amount: 100,
          total_amount: 5800,
          status: 'sent',
          items: [
            { id: '1', description: 'iPhone 14 Screen Replacement', quantity: 1, rate: 5000, amount: 5000 }
          ],
          notes: 'Professional screen replacement service',
          created_at: '2025-08-18T10:00:00Z'
        },
        {
          id: '2',
          bill_number: 'INV-2025-002',
          customer_id: '2',
          customer_name: 'Sarah Smith',
          customer_email: 'sarah@example.com',
          customer_phone: '+91 87654 32109',
          bill_date: '2025-08-17',
          due_date: '2025-09-17',
          subtotal: 3500,
          tax_amount: 630,
          discount_amount: 50,
          total_amount: 4080,
          status: 'paid',
          items: [
            { id: '1', description: 'Samsung Galaxy S23 Battery Replacement', quantity: 1, rate: 3500, amount: 3500 }
          ],
          notes: 'Battery replacement with warranty',
          created_at: '2025-08-17T14:30:00Z'
        }
      ];
      
      setBills(mockBills);
    } catch (err) {
      console.error('Error loading bills:', err);
      setError('Unable to load bills data');
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const count = bills.length + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
  };

  const addBillItem = () => {
    setNewBill({
      ...newBill,
      items: [...newBill.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeBillItem = (index: number) => {
    const updatedItems = newBill.items.filter((_, i) => i !== index);
    setNewBill({ ...newBill, items: updatedItems });
    calculateTotal(updatedItems);
  };

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...newBill.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setNewBill({ ...newBill, items: updatedItems });
    calculateTotal(updatedItems);
  };

  const calculateTotal = (items: BillItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal - newBill.discount_amount) * (newBill.tax_percentage / 100);
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount - newBill.discount_amount
    };
  };

  const handleCreateBill = async () => {
    try {
      const totals = calculateTotal(newBill.items);
      const billData = {
        ...newBill,
        bill_number: generateBillNumber(),
        bill_date: new Date().toISOString().split('T')[0],
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        status: 'draft'
      };

      // Here you would call the API to create the bill
      console.log('Creating bill:', billData);
      
      setShowCreateDialog(false);
      loadBills();
    } catch (err) {
      console.error('Error creating bill:', err);
      setError('Unable to create bill');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-brand-green/15 dark:text-brand-green dark:border-brand-green/20">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800">Sent</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">Overdue</Badge>;
      case 'draft':
        return <Badge className="bg-secondary text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border">Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-amber-900/40 dark:text-brand-orange-light dark:border-amber-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Billing & Invoicing</h1>
            <p className="text-muted-foreground dark:text-muted-foreground">Loading bills...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-secondary dark:bg-gray-700 rounded mb-4" />
                <div className="h-8 w-16 bg-secondary dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-32 bg-secondary dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            Billing & Invoicing
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Create and manage professional invoices
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreateBills && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bill</DialogTitle>
                  <DialogDescription>
                    Generate a professional invoice for your customer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Customer Information</h3>
                      {existingCustomers.length > 0 && (
                        <div className="w-[300px]">
                          <Select onValueChange={(val) => {
                            const cust = existingCustomers.find(c => c.phone === val);
                            if (cust) setNewBill({...newBill, customer_name: cust.name, customer_phone: cust.phone});
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select existing customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {existingCustomers.map(c => (
                                <SelectItem key={c.phone} value={c.phone}>{c.name} ({c.phone})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          value={newBill.customer_name}
                          onChange={(e) => setNewBill({ ...newBill, customer_name: e.target.value })}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Email</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={newBill.customer_email}
                          onChange={(e) => setNewBill({ ...newBill, customer_email: e.target.value })}
                          placeholder="customer@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_phone">Phone</Label>
                        <Input
                          id="customer_phone"
                          value={newBill.customer_phone}
                          onChange={(e) => setNewBill({ ...newBill, customer_phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Bill Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Bill Items</h3>
                      <Button variant="outline" size="sm" onClick={addBillItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newBill.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                              placeholder="Service description"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Rate (₹)</Label>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Amount (₹)</Label>
                            <Input
                              value={formatCurrency(item.amount)}
                              disabled
                            />
                          </div>
                          <div className="col-span-1">
                            {newBill.items.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBillItem(index)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Bill Totals */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Bill Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={newBill.due_date}
                          onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount">Discount (₹)</Label>
                        <Input
                          id="discount"
                          type="number"
                          value={newBill.discount_amount}
                          onChange={(e) => setNewBill({ ...newBill, discount_amount: parseFloat(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax">Tax (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={newBill.tax_percentage}
                          onChange={(e) => setNewBill({ ...newBill, tax_percentage: parseFloat(e.target.value) || 0 })}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label>Total Amount</Label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                          <span className="font-bold text-lg">
                            {formatCurrency(calculateTotal(newBill.items).total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={newBill.notes}
                      onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                      placeholder="Any additional information or terms..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBill}>
                    Create Bill
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Bills</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{bills.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Paid Bills</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {bills.filter(b => b.status === 'paid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.total_amount, 0))}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Overdue Bills</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {bills.filter(b => b.status === 'overdue').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills by number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Bills
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bills & Invoices</CardTitle>
          <CardDescription>Manage all your billing and invoicing</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground dark:text-white">{bill.bill_number}</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {bill.items.length} item{bill.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{bill.customer_name}</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">{bill.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{formatCurrency(bill.total_amount)}</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        +{formatCurrency(bill.tax_amount)} tax
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p>Created: {formatDate(bill.bill_date)}</p>
                      <p className="text-muted-foreground dark:text-muted-foreground">Due: {formatDate(bill.due_date)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(bill.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                      {canEditBills && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteBills && (
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBills.length === 0 && (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground dark:text-muted-foreground">
                {searchTerm ? 'No bills found matching your search.' : 'No bills created yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedBill?.bill_number}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedBill.customer_name}</p>
                  <p><strong>Email:</strong> {selectedBill.customer_email}</p>
                  <p><strong>Phone:</strong> {selectedBill.customer_phone}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Bill Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.rate)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedBill.discount_amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedBill.tax_amount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedBill.total_amount)}</span>
                </div>
              </div>

              {selectedBill.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{selectedBill.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
