import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  Download,
  Mail,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoice_number: 'INV-2024-001',
      customer_name: 'ABC Electronics',
      customer_email: 'contact@abcelectronics.com',
      amount: 25000,
      status: 'sent',
      due_date: '2024-02-15',
      created_at: '2024-01-15',
      items: [
        { description: 'Mobile Phone - Samsung Galaxy S24', quantity: 5, rate: 5000, amount: 25000 }
      ]
    },
    {
      id: '2',
      invoice_number: 'INV-2024-002',
      customer_name: 'XYZ Retailers',
      customer_email: 'billing@xyzretailers.com',
      amount: 45000,
      status: 'paid',
      due_date: '2024-02-10',
      created_at: '2024-01-10',
      items: [
        { description: 'iPhone 15 Pro', quantity: 3, rate: 15000, amount: 45000 }
      ]
    },
    {
      id: '3',
      invoice_number: 'INV-2024-003',
      customer_name: 'TechMart Solutions',
      customer_email: 'accounts@techmart.com',
      amount: 18000,
      status: 'overdue',
      due_date: '2024-01-20',
      created_at: '2024-01-05',
      items: [
        { description: 'OnePlus 12', quantity: 2, rate: 9000, amount: 18000 }
      ]
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft:   { class: 'bg-secondary text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border', label: 'Draft' },
      sent:    { class: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800', label: 'Sent' },
      paid:    { class: 'bg-green-100 text-green-800 border-green-200 dark:bg-brand-green/15 dark:text-brand-green dark:border-brand-green/20', label: 'Paid' },
      overdue: { class: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800', label: 'Overdue' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return { ...config };
  };

  const getTotalStats = () => {
    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const pending = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
    
    return { total, paid, pending, overdue };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Invoicing</h1>
          <p className="text-muted-foreground mt-1">Manage invoices and track payments</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-blue-700">All invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Paid</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-green-700">Received payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-yellow-700">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-red-700">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const statusConfig = getStatusBadge(invoice.status);
              return (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customer_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-foreground">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className={statusConfig.class}>
                        {statusConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(invoice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Send
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}