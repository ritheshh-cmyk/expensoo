import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { InitialsBadge } from "@/components/ui/InitialsBadge";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ShoppingCart,
  FileText,
  Package,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Fragment } from "react";
import { apiClient } from "@/lib/api";
import { io } from "socket.io-client";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { usePermissions } from "@/hooks/usePermissions";

interface TransactionPart {
  item: string;
  cost?: number;
  price?: number;
  quantity?: number;
  supplier?: string;
}

interface Transaction {
  id: string;
  date: Date;
  customer: string;
  phone: string;
  device: string;
  repairType: string;
  cost: number;
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  freeGlass: number;
  freeCover: number;
  status: string;
  partsCost: TransactionPart[];
  remarks: string;
  technician: string;
  actualCost: number;
  created_by?: { user_id: string; display_name: string } | null;
  last_modified_by?: { user_id: string; display_name: string } | null;
  last_modified_at?: Date | null;
}



function parseCreatedBy(raw: Record<string, unknown>): { user_id: string; display_name: string } | null {
  // Try snake_case (created_by) first, then camelCase (createdBy)
  const cb = (raw.created_by ?? raw.createdBy ?? raw.creator ?? null) as any;
  if (cb && (cb.user_id || cb.userId || cb.id) && (cb.display_name || cb.displayName || cb.name || cb.username)) {
    return {
      user_id: String(cb.user_id || cb.userId || cb.id || ''),
      display_name: String(cb.display_name || cb.displayName || cb.name || cb.username || ''),
    };
  }
  return null;
}

// Extracted to avoid duplication between initial fetch and delete-rollback
const normaliseTransaction = (raw: Record<string, unknown>): Transaction => ({
  id:            String(raw.id ?? ''),
  date:          raw.createdAt ? new Date(raw.createdAt as string) : raw.created_at ? new Date(raw.created_at as string) : new Date(),
  customer:      (raw.customerName ?? raw.customer_name ?? raw.customer ?? '') as string,
  phone:         (raw.mobileNumber ?? raw.mobile_number ?? raw.phone ?? '') as string,
  device:        (raw.deviceModel  ?? raw.device_model  ?? raw.device  ?? '') as string,
  repairType:    (raw.repairType   ?? raw.repair_type   ?? '') as string,
  cost:          Number(raw.repairCost ?? raw.repair_cost ?? raw.cost ?? 0),
  paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? 'cash') as Transaction['paymentMethod'],
  freeGlass:     Number(raw.freeGlass ?? (raw.freeGlassInstallation ?? raw.free_glass_installation ? 1 : 0)),
  freeCover:     Number(raw.freeCover ?? 0),
  status:        String(raw.status ?? 'pending'),
  partsCost:     (() => {
    let parts = raw.partsCost;
    if (typeof parts === 'string') {
      try {
        parts = JSON.parse(parts);
      } catch (e) {
        parts = [];
      }
    }
    return Array.isArray(parts) ? parts.map((p: any) => ({
      item: p.item || p.name || "",
      cost: Number(p.cost) || 0,
      price: Number(p.price || p.soldPrice) || 0,
      quantity: Number(p.quantity) || 1,
      supplier: p.supplier || ""
    })) : [];
  })(),
  remarks:       (raw.remarks ?? '') as string,
  technician:    (raw.technician ?? '') as string,
  actualCost:    Number(raw.actualCost ?? raw.internalCost ?? raw.ourCost ?? 0),
  created_by:    parseCreatedBy(raw),
  last_modified_by: raw.last_modified_by || raw.lastModifiedBy ? {
    user_id: String(((raw.last_modified_by ?? raw.lastModifiedBy) as any)?.user_id || ((raw.last_modified_by ?? raw.lastModifiedBy) as any)?.userId || ''),
    display_name: String(((raw.last_modified_by ?? raw.lastModifiedBy) as any)?.display_name || ((raw.last_modified_by ?? raw.lastModifiedBy) as any)?.displayName || ((raw.last_modified_by ?? raw.lastModifiedBy) as any)?.name || ''),
  } : null,
  last_modified_at: raw.last_modified_at ? new Date(raw.last_modified_at as string) : raw.lastModifiedAt ? new Date(raw.lastModifiedAt as string) : null,
});

// ─── Status Badge helper ──────────────────────────────────────────────────────
const STATUS_DESCRIPTIONS: Record<string, string> = {
  completed: 'Payment received and repair job is done.',
  pending:   'Awaiting collection or payment from the customer.',
  cancelled: 'This repair was cancelled.',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-brand-green/15 text-brand-green border-brand-green/20',
    pending:   'bg-brand-orange/15  text-brand-orange-light  border-brand-orange/20',
    cancelled: 'bg-red-500/15    text-red-400    border-red-500/20',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-zinc-500/15 text-muted-foreground border-zinc-500/20';
  const description = STATUS_DESCRIPTIONS[status?.toLowerCase()] ?? status;
  return (
    <Tippy
      content={<span className="text-xs">{description}</span>}
      animation="scale"
      placement="top"
      delay={[250, 0]}
    >
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-default ${cls}`}>
        {status || 'Unknown'}
      </span>
    </Tippy>
  );
}

interface TransactionsProps {
  filterCategory?: 'all' | 'sale';
}

export default function Transactions({ filterCategory = 'all' }: TransactionsProps) {
  const [searchParams] = useSearchParams();
  const searchId = searchParams.get("id");
  const searchQuery = searchParams.get("search");

  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; customer: string | null }>({ open: false, customer: null });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery) {
      setGlobalFilter(searchQuery);
    }
  }, [searchQuery]);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const { t } = useLanguage();
  const { confirm, ConfirmModalElement } = useConfirm();
  const { can } = usePermissions();
  const { user } = useAuth();

  const columnHelper = createColumnHelper<Transaction>();

  const columns = useMemo(
    () => [
      // S.No — sequential row number, independent of DB id
      columnHelper.display({
        id: "sno",
        header: t("sno"),
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <div className="text-sm font-medium text-muted-foreground w-10 text-center">
            {row.index + 1}
          </div>
        ),
      }),
      columnHelper.accessor("id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t("txn-id")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const id = String(row.getValue("id") ?? "");
          // Show short formatted ID: TXN-12345 (last 5 chars of DB id)
          const shortId = id.length > 5 ? `TXN-${id.slice(-5).toUpperCase()}` : `TXN-${id}`;
          return (
            <div className="font-mono text-xs text-muted-foreground" title={id}>
              {shortId}
            </div>
          );
        },
      }),
      columnHelper.accessor("date", {
        meta: { className: "hidden md:table-cell" },
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t("date-col")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {(() => {
              const d = row.getValue<Date>("date");
              if (!d) return '';
              const dt = d instanceof Date ? d : new Date(d);
              return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString();
            })()}
          </div>
        ),
      }),
      columnHelper.accessor("customer", {
        header: t("customer-col"),
        cell: ({ row }) => (
          <div className="flex justify-between items-start gap-2 pr-2">
            <div>
              <div className="font-medium text-foreground">{row.getValue("customer")}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />
                {row.original.phone}
              </div>
            </div>
            <InitialsBadge user={row.original.created_by} />
          </div>
        ),
      }),
      columnHelper.accessor("device", {
        header: t("device-col"),
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.getValue("device")}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t(row.original.repairType)}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("cost", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t("cost-col")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold text-brand-orange-light">
              ₹{(Number(row.getValue<number>("cost")) || 0).toLocaleString()}
            </div>
          </div>
        ),
      }),

      columnHelper.accessor("paymentMethod", {
        header: t("payment-method"),
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {t(row.getValue("paymentMethod"))}
            {(row.original.freeGlass > 0 || row.original.freeCover > 0) && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {row.original.freeGlass > 0 && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold bg-brand-green/20 text-brand-green border border-brand-green/30">
                    +{row.original.freeGlass} Glass
                  </span>
                )}
                {row.original.freeCover > 0 && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    +{row.original.freeCover} Cover
                  </span>
                )}
              </div>
            )}
          </div>
        ),
      }),

      columnHelper.display({
        id: "history",
        header: t("view-details"),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="View customer history"
            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
            onClick={() => setHistoryDialog({ open: true, customer: row.original.customer })}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: t("actions-col"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
                aria-label="Open transaction actions"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" avoidCollisions={false} sideOffset={4}>
              <DropdownMenuLabel>{t("actions-col")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(row.original.id)}
              >
                {t("copy-txn-id")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {can('transactions.edit') && (
                <DropdownMenuItem asChild>
                  <Link to={`/transactions/${row.original.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t("edit-txn")}
                  </Link>
                </DropdownMenuItem>
              )}
              {can('transactions.delete') && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("delete-txn")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [t],
  );

  // ── Step 1: payment method filter ──────────────────────────────────────────
  const paymentFiltered = useMemo(
    () => data.filter((t) => paymentFilter === "all" || t.paymentMethod === paymentFilter),
    [data, paymentFilter]
  );

  // ── Step 2: Fuse.js fuzzy text search over payment-filtered data ────────────
  const filteredData = useFuzzySearch(
    paymentFiltered,
    ['customer', 'mobile', 'deviceModel', 'repairType', 'remarks'],
    globalFilter,
    0.35
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // globalFilter is now handled by Fuse.js above — no TanStack filter needed
    state: {},
  });

  // All transaction data is loaded from backend and updated via socket.io
  useEffect(() => {
    let cancelled = false; // prevent state updates after unmount

    // Uses normaliseTransaction defined at module scope

    const fetchTransactions = async () => {
      // Use correct localStorage key — set by api.ts login()
      const token = localStorage.getItem('auth_token');
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const response = await apiClient.getTransactions();
        if (!cancelled) {
          if (response.success && Array.isArray(response.data)) {
            let mapped = response.data.map(normaliseTransaction);
            if (filterCategory === 'sale') {
              mapped = mapped.filter(t => t.repairType.toLowerCase() === 'sale');
            } else {
              mapped = mapped.filter(t => t.repairType.toLowerCase() !== 'sale');
            }
            setData(mapped);
            if (searchId) {
              const matched = mapped.find(t => t.id === searchId);
              if (matched) {
                setExpandedRowId(searchId);
                setSelectedTxn(matched);
                if (window.innerWidth < 768) {
                  setMobileSheetOpen(true);
                }
              }
            }
          } else {
            setData([]);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch transactions:', error);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTransactions();

    // Real-time updates via socket.io
    const wsUrl =
      import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL ||
      import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
      'https://backendmobile-4swg.onrender.com';

    const socket = io(wsUrl, { transports: ['websocket'] });

    socket.on('connect_error', (err) => {
      console.warn('Socket.io connection error (non-fatal):', err.message);
    });

    const update = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || cancelled) return;
      try {
        const response = await apiClient.getTransactions();
        if (!cancelled && response.success && Array.isArray(response.data)) {
          let mapped = response.data.map(normaliseTransaction);
          if (filterCategory === 'sale') {
            mapped = mapped.filter(t => t.repairType.toLowerCase() === 'sale');
          } else {
            mapped = mapped.filter(t => t.repairType.toLowerCase() !== 'sale');
          }
          setData(mapped);
        }
      } catch { /* real-time update failure is non-fatal */ }
    };

    socket.on('transactionCreated', update);
    socket.on('transactionUpdated', update);
    socket.on('transactionDeleted', update);

    return () => {
      cancelled = true;
      socket.off('transactionCreated', update);
      socket.off('transactionUpdated', update);
      socket.off('transactionDeleted', update);
      socket.disconnect();
    };
  // BUG 2 FIX: filterCategory was missing from deps - switching between
  // Repairs and Sales tabs never re-ran the effect, showing stale data.
  }, [filterCategory, refreshKey]);


  // Add, update, delete handlers
  const handleAdd = async (txn: Partial<Transaction>) => {
    try {
      if (user && user.id) {
        txn.created_by = {
          user_id: String(user.id),
          display_name: user.display_name || user.name || user.username || "Unknown"
        };
      }
      const response = await apiClient.createTransaction(txn);
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to create transaction');
      }
      toast({ title: 'Transaction Added', description: 'New repair transaction recorded successfully.' });
      setRefreshKey(prev => prev + 1);
      // Real-time event will also trigger a refetch
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };
  const handleUpdate = async (updatedTxn: Transaction) => {
    try {
      await apiClient.updateTransaction(updatedTxn.id, updatedTxn);
      toast({ title: 'Updated', description: 'Transaction updated successfully.' });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update transaction.',
        variant: 'destructive',
      });
    }
  };
  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Transaction",
      description: "This action cannot be undone. The transaction will be permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    // Optimistic UI: remove from local state immediately
    setData(prev => prev.filter(t => t.id !== id));
    try {
      await apiClient.deleteTransaction(id);
      toast({ title: 'Deleted', description: 'Transaction deleted successfully.' });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      // Rollback optimistic update by re-fetching
      console.error('Failed to delete transaction:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete transaction.',
        variant: 'destructive',
      });
      // Re-fetch to restore correct state after failed delete
      try {
        const response = await apiClient.getTransactions();
        if (response.success && Array.isArray(response.data)) {
          setData(response.data.map(normaliseTransaction));
        }
      } catch { /* non-fatal rollback attempt */ }
    }
  };



  // BUG 8 FIX: previously only showed a toast with no actual export.
  // Now builds a real CSV from the currently filtered rows and triggers a download.
  const exportToExcel = () => {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) {
      toast({ title: 'Nothing to export', description: 'No transactions match the current filter.', variant: 'destructive' });
      return;
    }
    const escape = (v: any) => {
      const s = String(v ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };
    const headers = ['S.No','ID','Date','Customer','Phone','Device','Repair Type','Cost','Payment','Status','Technician','Remarks'];
    const csvRows = [
      headers.join(','),
      ...rows.map((row, i) => {
        const tx = row.original;
        return [
          i + 1,
          escape(tx.id),
          escape(tx.date instanceof Date ? tx.date.toLocaleDateString() : ''),
          escape(tx.customer),
          escape(tx.phone),
          escape(tx.device),
          escape(tx.repairType),
          tx.cost,
          escape(tx.paymentMethod),
          escape(tx.status),
          escape(tx.technician),
          escape(tx.remarks),
        ].join(',');
      }),
    ].join('\r\n');

    // \uFEFF = UTF-8 BOM so Excel opens it correctly with Indian characters
    const blob = new Blob(['\uFEFF' + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Export complete', description: `Downloaded ${rows.length} transactions as CSV.` });
  };

  // Helper to get all transactions for a customer
  const getCustomerTransactions = (customer: string) => data.filter(txn => txn.customer === customer);

  return (
    <div className="space-y-6">
      {ConfirmModalElement}
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-end sm:justify-between px-4 sm:px-0 mt-4 sm:mt-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {filterCategory === 'sale' ? t("sales-history") || "Sales History" : t("transactions")}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filterCategory === 'sale' ? t("manage-sales-desc") || "View your sales transactions" : t("manage-repairs-desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-background hover:bg-muted/50 border border-border text-foreground hover:text-foreground font-medium rounded-lg transition-colors duration-150 cursor-pointer min-h-[44px] text-sm"
            aria-label="Export transactions"
            style={{ touchAction: "manipulation" }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("export")}</span>
            <span className="sm:hidden">Export</span>
          </button>
          <Link to={filterCategory === 'sale' ? "/transactions/new?type=sale" : "/transactions/new"} className="flex-1 sm:flex-none">
            <button
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg transition-colors duration-150 cursor-pointer min-h-[44px] text-sm"
              style={{ touchAction: "manipulation" }}
            >
              <Plus className="w-4 h-4" />
              {filterCategory === 'sale' ? t("new-sale") || "New Sale" : t("new-transaction")}
            </button>
          </Link>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background backdrop-blur-sm p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={t("search-placeholder")}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all duration-150 text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 bg-background border-border text-foreground cursor-pointer">
                <SelectValue placeholder={t("all-payments")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all-payments")}</SelectItem>
                <SelectItem value="cash">{t("cash")}</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Table (md+) / Card list (mobile) ──────────────────────────── */}
      <div className="rounded-xl border border-border bg-background backdrop-blur-sm overflow-hidden">
        {/* Table header row: count */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">{t("transaction-list")}</span>
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} {t("txns-found")}
          </span>
        </div>

        {/* === Mobile card list (hidden md+) === */}
        <div className="md:hidden">
          {loading ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`txn-mobile-skeleton-${idx}`} className="flex items-start gap-3 px-4 py-4 animate-pulse">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-white/10" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-2 flex-1">
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                      <div className="shrink-0 text-right space-y-2 flex flex-col items-end">
                        <div className="h-4 bg-white/10 rounded w-14" />
                        <div className="h-3.5 bg-white/5 rounded-full w-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="h-3 bg-white/5 rounded w-16" />
                      <div className="h-3 bg-white/5 rounded w-12" />
                      <div className="h-3 bg-white/5 rounded w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : table.getRowModel().rows?.length ? (
            <div className="divide-y divide-border/50">
              {table.getRowModel().rows.map((row) => {
                const tx = row.original;
                const shortId = tx.id.length > 5 ? `TXN-${tx.id.slice(-5).toUpperCase()}` : `TXN-${tx.id}`;
                return (
                  <div 
                    key={row.id} 
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[role="menuitem"]')) return;
                      setSelectedTxn(tx);
                      setMobileSheetOpen(true);
                    }}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center mt-0.5">
                      {tx.repairType.toLowerCase() === 'sale' ? (
                        <ShoppingCart className="h-4 w-4 text-brand-orange-light" />
                      ) : (
                        <Phone className="h-4 w-4 text-brand-orange-light" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{tx.customer}</p>
                          <p className="text-xs text-muted-foreground truncate">{tx.device}</p>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1">
                          <p className="font-bold text-brand-orange-light text-sm">₹{tx.cost.toLocaleString()}</p>
                          <StatusBadge status={tx.status} />
                          <div className="mt-1"><InitialsBadge user={tx.created_by} /></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{shortId}</span>
                        <span className="text-xs text-muted-foreground">{tx.repairType}</span>
                        <span className="text-xs text-muted-foreground">{t(tx.paymentMethod)}</span>
                        {tx.freeGlass > 0 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold bg-brand-green/20 text-brand-green border border-brand-green/30">
                            +{tx.freeGlass} Glass
                          </span>
                        )}
                        {tx.freeCover > 0 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            +{tx.freeCover} Cover
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end">
                        <DropdownMenuLabel>{t("actions-col")}</DropdownMenuLabel>
                        {can('transactions.edit') && (
                          <DropdownMenuItem asChild>
                            <Link to={`/transactions/${tx.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t("edit")}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {can('transactions.delete') && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium text-sm">{t("no-transactions-yet")}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("add-first-transaction")}</p>
            </div>
          )}
        </div>

        {/* === Desktop table (hidden below md) === */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                        (header.column.columnDef.meta as any)?.className
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`txn-row-skeleton-${idx}`} className="border-b border-border/50 animate-pulse">
                    {/* S.No */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="h-4 bg-white/10 rounded w-6 mx-auto" />
                    </td>
                    {/* Txn ID */}
                    <td className="px-4 py-4">
                      <div className="h-4 bg-white/10 rounded w-16" />
                    </td>
                    {/* Date */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="h-4 bg-white/10 rounded w-20" />
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div className="space-y-2 max-w-[150px]">
                        <div className="h-4 bg-white/10 rounded w-24" />
                        <div className="h-3 bg-white/5 rounded w-16" />
                      </div>
                    </td>
                    {/* Device */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="space-y-2 max-w-[150px]">
                        <div className="h-4 bg-white/10 rounded w-28" />
                        <div className="h-3 bg-white/5 rounded w-20" />
                      </div>
                    </td>
                    {/* Cost */}
                    <td className="px-4 py-4 text-right">
                      <div className="h-4 bg-white/10 rounded w-16 ml-auto" />
                    </td>
                    {/* Payment */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="h-4 bg-white/10 rounded w-20" />
                    </td>
                    {/* Details */}
                    <td className="px-4 py-4">
                      <div className="h-8 w-8 rounded-full bg-white/10 mx-auto" />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="h-8 w-8 rounded-full bg-white/10 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/40 transition-colors duration-150 cursor-pointer",
                        expandedRowId === row.original.id ? "bg-muted/20" : ""
                      )}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[role="menuitem"]')) return;
                        setExpandedRowId(expandedRowId === row.original.id ? null : row.original.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td 
                          key={cell.id} 
                          className={cn(
                            "px-4 py-3 text-sm text-foreground",
                            (cell.column.columnDef.meta as any)?.className
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedRowId === row.original.id && (
                      <tr className="bg-muted/10 border-b border-border">
                        <td colSpan={columns.length} className="p-0">
                          <div className="p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200 border-x-4 border-l-brand-orange-light border-r-transparent">
                            <TransactionDetailsContent tx={row.original} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-foreground font-medium mb-1">{t("no-transactions-yet")}</h3>
                      <p className="text-muted-foreground text-sm">{t("add-first-transaction")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-5 py-4 pb-24 lg:pb-4 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {t("showing-pages")} {table.getState().pagination.pageIndex + 1} {t("of-pages")}{" "}
            {table.getPageCount()} {t("pages-label")}
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Customer History Dialog ─────────────────────────────── */}
      {historyDialog.open && historyDialog.customer && (
        <Dialog open={historyDialog.open} onOpenChange={open => setHistoryDialog({ open, customer: open ? historyDialog.customer : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customer-history")}: {historyDialog.customer}</DialogTitle>
            </DialogHeader>
            {(() => {
              const txns = getCustomerTransactions(historyDialog.customer!);
              // Sort by date descending
              txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              // If you have parts/supplier info, list them here. For now, show a placeholder.
              return (
                <div>
                  {/* If you have parts/supplier info, map and show here */}
                  <div className="mt-2">
                    <div className="font-medium mb-1">{t("parts-purchased")}</div>
                    <div className="text-muted-foreground text-sm">{t("no-parts-data")}</div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* ── Mobile Details Sheet ─────────────────────────────── */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-xl sm:hidden">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left flex flex-col">
              <span className="text-lg text-foreground">{selectedTxn?.customer}</span>
              <span className="text-sm font-normal text-muted-foreground font-mono mt-1">
                {selectedTxn ? `TXN-${selectedTxn.id.slice(-5).toUpperCase()}` : ''}
              </span>
            </SheetTitle>
          </SheetHeader>
          {selectedTxn && (
            <TransactionDetailsContent tx={selectedTxn} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TransactionDetailsContent({ tx }: { tx: Transaction }) {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const canViewCost = can('transactions.view_cost');
  const [showCp, setShowCp] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-brand-orange-light flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t("transaction-details") || "Transaction Details"}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">Technician</span>
            <span className="font-medium text-foreground">{tx.technician || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Status</span>
            <div className="mt-0.5"><StatusBadge status={tx.status} /></div>
          </div>
          <div className="col-span-2 flex justify-between gap-4">
            <div>
              <span className="text-muted-foreground block mb-1">Remarks</span>
              <p className="font-medium text-foreground whitespace-pre-wrap">{tx.remarks || "No remarks"}</p>
            </div>
            {tx.last_modified_by && (
              <div className="text-right flex flex-col items-end">
                <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider">Last Modified By</span>
                <InitialsBadge user={tx.last_modified_by} />
                <span className="text-[10px] text-muted-foreground mt-1">
                  {tx.last_modified_at ? tx.last_modified_at.toLocaleString() : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parts & Financials */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-brand-orange-light flex items-center gap-2">
            <Package className="w-4 h-4" />
            Parts & Costing
          </h4>
          {canViewCost && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={(e) => { e.stopPropagation(); setShowCp(!showCp); }}
            >
              {showCp ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showCp ? "Hide CP" : "Show CP"}
            </Button>
          )}
        </div>

        {tx.partsCost && tx.partsCost.length > 0 ? (
          <div className="space-y-2">
            {tx.partsCost.map((part, idx) => (
              <div key={idx} className="bg-background rounded-lg border border-border p-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {part.item}
                    <span className="text-xs text-muted-foreground">x{part.quantity || 1}</span>
                  </div>
                  {part.supplier && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {part.supplier}
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-brand-orange-light font-medium">
                    Sell: ₹{((part.price || 0) * (part.quantity || 1)).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Cost: {canViewCost && showCp ? `₹${((part.cost || 0) * (part.quantity || 1)).toLocaleString()}` : "******"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground bg-background rounded-lg border border-border p-3 text-center">
            No parts recorded
          </div>
        )}
        
        {/* Total Cost Summary */}
        <div className="flex justify-between items-center bg-muted/20 rounded-lg border border-border p-3 text-sm mt-4">
          <span className="font-medium text-foreground">Total Internal Cost</span>
          <span className="font-semibold text-foreground">
            {canViewCost && showCp ? `₹${(tx.actualCost || 0).toLocaleString()}` : "******"}
          </span>
        </div>
      </div>
    </div>
  );
}
