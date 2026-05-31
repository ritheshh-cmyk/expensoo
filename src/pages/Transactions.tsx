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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { io } from "socket.io-client";

interface Transaction {
  id: string;
  date: Date;
  customer: string;
  phone: string;
  device: string;
  repairType: string;
  cost: number;
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  freeGlass: boolean;
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
  freeGlass:     Boolean(raw.freeGlassInstallation ?? raw.free_glass_installation ?? raw.freeGlass ?? false),
});

// ─── Status Badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-brand-green/15 text-brand-green border-brand-green/20',
    pending:   'bg-brand-orange/15  text-brand-orange-light  border-brand-orange/20',
    cancelled: 'bg-red-500/15    text-red-400    border-red-500/20',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-zinc-500/15 text-muted-foreground border-zinc-500/20';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function Transactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; customer: string | null }>({ open: false, customer: null });
  const { t } = useLanguage();

  const columnHelper = createColumnHelper<Transaction>();

  const columns = useMemo(
    () => [
      // S.No — sequential row number, independent of DB id
      columnHelper.display({
        id: "sno",
        header: "S.No",
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
            className="h-8 p-0 font-medium text-muted-foreground hover:text-white cursor-pointer"
          >
            Txn ID
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium text-muted-foreground hover:text-white cursor-pointer"
          >
            Date
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
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-white">{row.getValue("customer")}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {row.original.phone}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("device", {
        header: "Device",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-white">{row.getValue("device")}</div>
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
            className="h-8 p-0 font-medium text-muted-foreground hover:text-white cursor-pointer"
          >
            Cost
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
        header: "Payment",
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {t(row.getValue("paymentMethod"))}
            {row.original.freeGlass && (
              <div className="text-xs text-brand-green mt-0.5">+ Free Glass</div>
            )}
          </div>
        ),
      }),

      columnHelper.display({
        id: "history",
        header: "History",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="View customer history"
            className="cursor-pointer text-muted-foreground hover:text-white hover:bg-white/10 transition-colors duration-150"
            onClick={() => setHistoryDialog({ open: true, customer: row.original.customer })}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-white/10 transition-colors duration-150"
                aria-label="Open transaction actions"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" avoidCollisions={false} sideOffset={4}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(row.original.id)}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/transactions/${row.original.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit transaction
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [],
  );

  const filteredData = useMemo(() => {
    return data.filter((transaction) => {
      const matchesPayment =
        paymentFilter === "all" || transaction.paymentMethod === paymentFilter;
      return matchesPayment;
    });
  }, [data, paymentFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
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
            setData(response.data.map(normaliseTransaction));
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
      'https://expensoo-app-gu3wg.ondigitalocean.app';

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
          setData(response.data.map(normaliseTransaction));
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
  }, []);


  // Add, update, delete handlers
  const handleAdd = async (txn: Partial<Transaction>) => {
    try {
      const response = await apiClient.createTransaction(txn);
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to create transaction');
      }
      toast({ title: 'Transaction Added', description: 'New repair transaction recorded successfully.' });
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update transaction.',
        variant: 'destructive',
      });
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;
    // Optimistic UI: remove from local state immediately
    setData(prev => prev.filter(t => t.id !== id));
    try {
      await apiClient.deleteTransaction(id);
      toast({ title: 'Deleted', description: 'Transaction deleted successfully.' });
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



  const exportToExcel = () => {
    // In a real app, this would export to Excel
    toast({
      title: "Export Started",
      description: "Exporting transactions to Excel format...",
    });
  };

  // Helper to get all transactions for a customer
  const getCustomerTransactions = (customer: string) => data.filter(txn => txn.customer === customer);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("transactions")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage all repair transactions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground hover:text-white font-medium rounded-lg transition-colors duration-150 cursor-pointer min-h-[44px] text-sm"
            aria-label="Export transactions"
            style={{ touchAction: "manipulation" }}
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <Link to="/transactions/new">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg transition-colors duration-150 cursor-pointer min-h-[44px] text-sm"
              style={{ touchAction: "manipulation" }}
            >
              <Plus className="w-4 h-4" />
              {t("new-transaction")}
            </button>
          </Link>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={`${t("search")} transactions...`}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all duration-150 text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 bg-white/5 border-white/10 text-foreground cursor-pointer">
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">{t("cash")}</SelectItem>
                <SelectItem value      {/* ── Table (md+) / Card list (mobile) ──────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {/* Table header row: count */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/10">
          <span className="text-sm font-semibold text-white">Transaction List</span>
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} transactions found
          </span>
        </div>

        {/* === Mobile card list (hidden md+) === */}
        <div className="md:hidden">
          {table.getRowModel().rows?.length ? (
            <div className="divide-y divide-white/5">
              {table.getRowModel().rows.map((row) => {
                const tx = row.original;
                const shortId = tx.id.length > 5 ? `TXN-${tx.id.slice(-5).toUpperCase()}` : `TXN-${tx.id}`;
                return (
                  <div key={row.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center mt-0.5">
                      <Phone className="h-4 w-4 text-brand-orange-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{tx.customer}</p>
                          <p className="text-xs text-muted-foreground truncate">{tx.device}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold text-brand-orange-light text-sm">₹{tx.cost.toLocaleString()}</p>
                          <StatusBadge status={row.original ? (row.getValue('actions') as any)?.status || 'pending' : 'pending'} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{shortId}</span>
                        <span className="text-xs text-muted-foreground">{tx.repairType}</span>
                        <span className="text-xs text-muted-foreground">{t(tx.paymentMethod)}</span>
                        {tx.freeGlass && <span className="text-xs text-brand-green">+Glass</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/transactions/${tx.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-white font-medium text-sm">No transactions yet</p>
              <p className="text-muted-foreground text-xs mt-1">Create your first transaction to get started</p>
            </div>
          )}
        </div>

        {/* === Desktop table (hidden below md) === */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/10 bg-white/[0.03]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-foreground">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-white font-medium mb-1">No transactions yet</h3>
                      <p className="text-muted-foreground text-sm">Create your first transaction to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-5 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} pages
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>ria-label="Next page"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
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
              <DialogTitle>Customer History: {historyDialog.customer}</DialogTitle>
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
                    <div className="font-medium mb-1">Parts Purchased from Suppliers:</div>
                    <div className="text-muted-foreground text-sm">(No parts data available in mock. Integrate with parts/supplier info if present in your data model.)</div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
