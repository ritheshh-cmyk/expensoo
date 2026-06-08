import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  CreditCard
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  payment_terms: string;
  total_amount: number;
  outstanding_amount: number;
  last_payment_date: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const { confirm, ConfirmModalElement } = useConfirm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSupplierData, setEditSupplierData] = useState<Supplier | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    payment_terms: '30'
  });
  const [paymentAmount, setPaymentAmount] = useState('');

  const canEditSuppliers = can('suppliers.edit');
  const canDeleteSuppliers = can('suppliers.delete');
  const canMakePayments = can('suppliers.pay');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSuppliers();
      
      if (response.success) {
        const rawList = response.data || response.suppliers || [];
        const mappedList = rawList.map((s: any) => ({
          ...s,
          phone: s.phone || s.contactNumber || s.contact_number || '',
          contact_person: s.contact_person || s.address || '',
          address: s.address || ''
        }));
        setSuppliers(mappedList);
      } else {
        setError('Failed to load suppliers data');
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    try {
      const response = await apiClient.createSupplier(newSupplier);
      if (response.success) {
        setShowAddDialog(false);
        setNewSupplier({
          name: '',
          email: '',
          phone: '',
          address: '',
          contact_person: '',
          payment_terms: '30'
        });
        toast({ title: 'Success', description: 'Supplier added successfully.' });
        loadSuppliers();
      } else {
        toast({ title: 'Error', description: 'Failed to create supplier.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error creating supplier:', err);
      toast({ title: 'Error', description: 'Unable to create supplier.', variant: 'destructive' });
    }
  };

  const handleEditClick = async (e: React.MouseEvent, supplier: Supplier) => {
    e.stopPropagation();
    try {
      const res = await apiClient.getSupplier(supplier.id);
      if (res.success && res.data) {
        const s = res.data;
        setEditSupplierData({
          ...s,
          phone: s.phone || s.contactNumber || s.contact_number || '',
          contact_person: s.contact_person || s.address || '',
          address: s.address || ''
        });
        setShowEditDialog(true);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch supplier details.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch supplier details.', variant: 'destructive' });
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editSupplierData) return;
    try {
      const response = await apiClient.updateSupplier(editSupplierData.id, {
        name: editSupplierData.name,
        contact_person: editSupplierData.contact_person,
        phone: editSupplierData.phone,
        address: editSupplierData.address,
        payment_terms: editSupplierData.payment_terms
      });
      if (response.success) {
        setShowEditDialog(false);
        setEditSupplierData(null);
        toast({ title: 'Success', description: 'Supplier updated successfully.' });
        loadSuppliers();
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to update supplier.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Error updating supplier:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update supplier.', variant: 'destructive' });
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, supplier: Supplier) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Supplier',
      message: `Are you sure you want to delete ${supplier.name}? This will unlink any expenditures associated with this supplier.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (isConfirmed) {
      try {
        const res = await apiClient.deleteSupplier(supplier.id);
        if (res.success) {
          toast({ title: 'Success', description: 'Supplier deleted successfully.' });
          loadSuppliers();
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to delete supplier.', variant: 'destructive' });
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to delete supplier.', variant: 'destructive' });
      }
    }
  };

  const handleMakePayment = async () => {
    if (!selectedSupplier || !paymentAmount) return;

    try {
      const response = await apiClient.addSupplierPayment(selectedSupplier.id, {
        amount: parseFloat(paymentAmount),
        payment_date: new Date().toISOString(),
        notes: 'Payment processed via admin panel'
      });

      if (response.success) {
        setShowPaymentDialog(false);
        setSelectedSupplier(null);
        setPaymentAmount('');
        toast({ title: 'Success', description: 'Payment recorded successfully.' });
        loadSuppliers();
      } else {
        toast({ title: 'Error', description: 'Failed to process payment.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      toast({ title: 'Error', description: 'Unable to process payment.', variant: 'destructive' });
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-brand-green/15 dark:text-brand-green dark:border-brand-green/20">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-secondary text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-amber-900/40 dark:text-brand-orange-light dark:border-amber-800">Pending</Badge>;
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
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Supplier Management</h1>
            <p className="text-muted-foreground dark:text-muted-foreground">Loading suppliers...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
            Supplier Management
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Manage your suppliers and track payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEditSuppliers && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Create a new supplier record for your business
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Supplier Name</Label>
                      <Input
                        id="name"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        placeholder="Enter supplier name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={newSupplier.contact_person}
                        onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                        placeholder="Contact person name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        placeholder="supplier@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      placeholder="Enter complete address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                    <Input
                      id="payment_terms"
                      type="number"
                      value={newSupplier.payment_terms}
                      onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSupplier}>
                    Add Supplier
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
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Suppliers</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{suppliers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Outstanding Amount</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(suppliers.reduce((sum, s) => sum + (s.outstanding_amount || 0), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Pending Suppliers</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {suppliers.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, email, or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Advanced Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Supplier Directory</CardTitle>
          <CardDescription>Complete list of all suppliers and their details</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Details</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Financial Status</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground dark:text-white">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">{supplier.contact_person}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Total: {formatCurrency(supplier.total_amount || 0)}
                      </p>
                      <p className="text-sm text-orange-600">
                        Outstanding: {formatCurrency(supplier.outstanding_amount || 0)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(supplier.last_payment_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(supplier.status)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplier(supplier);
                        }}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform duration-100"
                        aria-label={`View details of ${supplier.name}`}
                        style={{ touchAction: "manipulation" }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEditSuppliers && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditClick(e, supplier)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform duration-100"
                          aria-label={`Edit ${supplier.name}`}
                          style={{ touchAction: "manipulation" }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canMakePayments && supplier.outstanding_amount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(supplier);
                            setShowPaymentDialog(true);
                          }}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform duration-100"
                          aria-label={`Pay ${supplier.name}`}
                          style={{ touchAction: "manipulation" }}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteSuppliers && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform duration-100"
                          onClick={(e) => handleDeleteClick(e, supplier)}
                          aria-label={`Delete ${supplier.name}`}
                          style={{ touchAction: "manipulation" }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSuppliers.length === 0 && (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground dark:text-muted-foreground">
                {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers added yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Outstanding Amount</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(selectedSupplier.outstanding_amount || 0)}
                </p>
              </div>
              <div>
                <Label htmlFor="payment_amount">Payment Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  max={selectedSupplier.outstanding_amount}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMakePayment} disabled={!paymentAmount}>
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier's details.
            </DialogDescription>
          </DialogHeader>
          {editSupplierData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Supplier Name</Label>
                  <Input
                    id="edit_name"
                    value={editSupplierData.name}
                    onChange={(e) => setEditSupplierData({ ...editSupplierData, name: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_contact_person">Contact Person</Label>
                  <Input
                    id="edit_contact_person"
                    value={editSupplierData.contact_person}
                    onChange={(e) => setEditSupplierData({ ...editSupplierData, contact_person: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={editSupplierData.phone}
                    onChange={(e) => setEditSupplierData({ ...editSupplierData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_payment_terms">Payment Terms (days)</Label>
                  <Input
                    id="edit_payment_terms"
                    type="number"
                    value={editSupplierData.payment_terms || '30'}
                    onChange={(e) => setEditSupplierData({ ...editSupplierData, payment_terms: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={editSupplierData.address}
                  onChange={(e) => setEditSupplierData({ ...editSupplierData, address: e.target.value })}
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ConfirmModal rendering helper element */}
      {ConfirmModalElement}
    </div>
  );
}
