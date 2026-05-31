import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Package,
  ShoppingCart,
  Users,
  ChevronRight,
  IndianRupee,
  CalendarDays,
  Smartphone,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── types ───────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  contact_number?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  total_orders?: number;
  total_amount?: number;
  created_at?: string;
}

interface PurchasedPart {
  transactionId: string;
  customerName: string;
  deviceModel: string;
  repairType: string;
  partName: string;
  cost: number;
  date: string;
}

interface AddSupplierForm {
  name: string;
  contact_person: string;
  contact_number: string;
}

const EMPTY_FORM: AddSupplierForm = { name: '', contact_person: '', contact_number: '' };

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

const fmtDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusClass = (s?: string) =>
  s === 'inactive'
    ? 'bg-muted text-muted-foreground border-border'
    : 'bg-brand-green/15 text-brand-green border-brand-green/25';

// ─── component ───────────────────────────────────────────────────────────────

export default function Suppliers() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Add supplier dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<AddSupplierForm>(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // ── fetch ──────────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [supRes, txnRes] = await Promise.all([
        apiClient.getSuppliers(),
        apiClient.getTransactions(),
      ]);
      if (supRes.success && Array.isArray(supRes.data)) setSuppliers(supRes.data);
      const raw = txnRes.success
        ? (Array.isArray(txnRes.data) ? txnRes.data : txnRes.data?.transactions ?? [])
        : [];
      setTransactions(raw);
    } catch (err) {
      console.error('[Suppliers] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── add supplier ────────────────────────────────────────────────────────────
  const handleAddSupplier = async () => {
    setFormError('');
    if (!addForm.name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }
    setAddLoading(true);
    try {
      const res = await apiClient.createSupplier({
        name: addForm.name.trim(),
        contact_person: addForm.contact_person.trim(),
        contact_number: addForm.contact_number.trim(),
      });
      if (res.success) {
        toast({ title: 'Supplier added', description: `${addForm.name} has been added.` });
        setShowAddDialog(false);
        setAddForm(EMPTY_FORM);
        await loadData(); // refresh list
      } else {
        setFormError(res.error || 'Failed to add supplier. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── parts per supplier ─────────────────────────────────────────────────────
  const getPartsForSupplier = (supplier: Supplier): PurchasedPart[] => {
    const parts: PurchasedPart[] = [];
    for (const tx of transactions) {
      const extPurchases: any[] = tx.externalPurchases ?? tx.external_purchases ?? [];
      for (const ep of extPurchases) {
        const epStore = String(ep.store ?? ep.supplier ?? '').toLowerCase();
        const supId   = String(supplier.id ?? '').toLowerCase();
        const supName = String(supplier.name ?? '').toLowerCase();
        if (epStore === supId || epStore === supName || epStore.includes(supName)) {
          parts.push({
            transactionId: String(tx.id ?? ''),
            customerName:  tx.customerName ?? tx.customer_name ?? '—',
            deviceModel:   tx.deviceModel ?? tx.device_model ?? '—',
            repairType:    tx.repairType ?? tx.repair_type ?? '—',
            partName:      ep.item ?? ep.name ?? 'Part',
            cost:          Number(ep.cost ?? ep.amount ?? 0),
            date:          tx.createdAt ?? tx.created_at ?? '',
          });
        }
      }
    }
    return parts;
  };

  // ── stats ──────────────────────────────────────────────────────────────────
  const activeCount = suppliers.filter(s => s.status !== 'inactive').length;
  const totalSpend  = suppliers.reduce((s, x) => s + (Number(x.total_amount) || 0), 0);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_number ?? s.phone ?? '').includes(searchTerm)
  );

  const selectedParts = selectedSupplier ? getPartsForSupplier(selectedSupplier) : [];
  const totalSpentOnSelected = selectedParts.reduce((s, p) => s + p.cost, 0);

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Track suppliers and parts purchased</p>
        </div>
        <Button onClick={() => { setAddForm(EMPTY_FORM); setFormError(''); setShowAddDialog(true); }} className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-light text-black font-semibold border-0">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
            <Users className="h-4 w-4 text-brand-orange-light" />
          </div>
          <div className="text-2xl font-bold text-foreground">{activeCount}</div>
          <p className="text-xs text-muted-foreground mt-1">{suppliers.length} total</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Parts Spend</p>
            <IndianRupee className="h-4 w-4 text-brand-orange-light" />
          </div>
          <div className="text-2xl font-bold text-brand-orange-light">{fmt(totalSpend)}</div>
          <p className="text-xs text-muted-foreground mt-1">All time value</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-md p-5 hover:border-brand-orange/30 transition-colors duration-200">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Parts Transactions</p>
            <ShoppingCart className="h-4 w-4 text-brand-orange-light" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {transactions.filter(t => (t.externalPurchases ?? t.external_purchases ?? []).length > 0).length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">With external parts</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-brand-orange/50"
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-xl bg-background animate-pulse" />
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-muted-foreground">No suppliers found</p>
          <p className="text-sm mt-1">Add your first supplier to get started</p>
          <Button className="mt-4 flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-light text-black font-semibold border-0" onClick={() => { setAddForm(EMPTY_FORM); setFormError(''); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const parts = getPartsForSupplier(supplier);
            const partsTotal = parts.reduce((s, p) => s + p.cost, 0);
            const phone = supplier.contact_number ?? supplier.phone ?? '';

            return (
              <button
                key={supplier.id}
                type="button"
                onClick={() => setSelectedSupplier(supplier)}
                className="text-left w-full cursor-pointer min-h-[44px]"
              >
                <div className="relative overflow-hidden rounded-xl border border-border bg-background backdrop-blur-sm hover:border-brand-orange/30 hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 rounded-lg shrink-0">
                          <Building2 className="h-5 w-5 text-brand-orange-light" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground leading-tight truncate">
                            {supplier.name}
                          </h3>
                          {supplier.contact_person && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {supplier.contact_person}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0', statusClass(supplier.status))}>
                        {supplier.status ?? 'active'}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-0">
                    {phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{phone}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Parts Bought</p>
                        <p className="font-semibold text-foreground mt-0.5">{parts.length} items</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="font-semibold text-brand-orange-light mt-0.5">
                          {partsTotal > 0 ? fmt(partsTotal) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-brand-orange-light transition-colors">
                      View parts history
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Add Supplier Dialog ───────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!addLoading) setShowAddDialog(open); }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add New Supplier
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Supplier Name */}
            <div className="space-y-1.5">
              <Label htmlFor="sup-name">
                Supplier / Shop Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-name"
                placeholder="e.g. Global Electronics"
                value={addForm.name}
                onChange={(e) => { setAddForm(f => ({ ...f, name: e.target.value })); setFormError(''); }}
                disabled={addLoading}
                autoFocus
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-1.5">
              <Label htmlFor="sup-person">Contact Person</Label>
              <Input
                id="sup-person"
                placeholder="e.g. Rajesh Kumar"
                value={addForm.contact_person}
                onChange={(e) => setAddForm(f => ({ ...f, contact_person: e.target.value }))}
                disabled={addLoading}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">Phone Number</Label>
              <Input
                id="sup-phone"
                placeholder="e.g. +91-9876543210"
                value={addForm.contact_number}
                onChange={(e) => setAddForm(f => ({ ...f, contact_number: e.target.value }))}
                disabled={addLoading}
                type="tel"
              />
            </div>

            {/* Error */}
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={addLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSupplier}
              disabled={addLoading || !addForm.name.trim()}
              className="flex items-center gap-2"
            >
              {addLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
              ) : (
                <><Plus className="h-4 w-4" /> Add Supplier</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Supplier detail dialog ─────────────────────────────────────────── */}
      <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedSupplier.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {selectedSupplier.contact_person && `${selectedSupplier.contact_person} · `}
                      {selectedSupplier.contact_number ?? selectedSupplier.phone ?? ''}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="rounded-lg bg-background border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Parts Bought</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{selectedParts.length}</p>
                </div>
                <div className="rounded-lg bg-brand-orange/10 border border-brand-orange/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-bold mt-1 text-brand-orange-light">
                    {totalSpentOnSelected > 0 ? fmt(totalSpentOnSelected) : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-background border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {new Set(selectedParts.map(p => p.transactionId)).size}
                  </p>
                </div>
              </div>

              {/* Parts list */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Parts Purchased from {selectedSupplier.name}
                </h3>

                {selectedParts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                    <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
                    <p className="font-medium text-muted-foreground">No parts recorded yet</p>
                    <p className="text-sm mt-1">
                      Parts appear here when added via the New Transaction form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedParts.map((part, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:bg-white/[0.08] transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="shrink-0 mt-0.5 p-1.5 bg-brand-orange/10 rounded">
                            <Package className="h-3.5 w-3.5 text-brand-orange-light" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground">{part.partName}</p>
                            <div className="flex flex-wrap items-center gap-x-2 mt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Smartphone className="h-3 w-3" />
                                {part.deviceModel}
                              </span>
                              <span className="text-xs text-muted-foreground">· {part.repairType}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Customer: {part.customerName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              {fmtDate(part.date)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-sm text-brand-orange-light">{fmt(part.cost)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            TXN-{part.transactionId.slice(-5).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 mt-3">
                      <span className="text-sm font-semibold text-foreground">Total Parts Cost</span>
                      <span className="text-sm font-bold text-brand-orange-light">{fmt(totalSpentOnSelected)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}