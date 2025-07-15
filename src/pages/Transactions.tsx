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
import { AppLayout } from "@/components/layout/AppLayout";
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
  profit: number;
  status: "pending" | "in-progress" | "completed" | "delivered";
  paymentMethod: "cash" | "upi" | "card" | "bank-transfer";
  freeGlass: boolean;
}

const statusConfig = {
  pending: { label: "pending", color: "status-pending" },
  "in-progress": { label: "in-progress", color: "status-progress" },
  completed: { label: "completed", color: "status-completed" },
  delivered: { label: "delivered", color: "status-delivered" },
};

export default function Transactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  // Remove localStorage usage for showProfits, use only state
  const [showProfits, setShowProfits] = useState(false);
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; customer: string | null }>({ open: false, customer: null });
  const { t } = useLanguage();

  const columnHelper = createColumnHelper<Transaction>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Transaction ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("id")}</div>
        ),
      }),
      columnHelper.accessor("date", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-medium"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue<Date>("date") ? row.getValue<Date>("date").toLocaleDateString() : ""}
          </div>
        ),
      }),
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue("customer")}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
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
            <div className="font-medium">{row.getValue("device")}</div>
            <div className="text-xs text-muted-foreground">
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
            className="h-8 p-0 font-medium"
          >
            Cost
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold">
              ₹{typeof row.getValue<number>("cost") === "number" ? row.getValue<number>("cost").toLocaleString() : ""}
            </div>
            {showProfits && (
              <div className="text-xs text-success">
                Profit: ₹{typeof row.original.profit === "number" ? row.original.profit.toLocaleString() : ""}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue<keyof typeof statusConfig>("status");
          return (
            <Badge className={cn("text-xs", statusConfig[status]?.color || "")}>
              {t(statusConfig[status].label)}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("paymentMethod", {
        header: "Payment",
        cell: ({ row }) => (
          <div className="text-sm">
            {t(row.getValue("paymentMethod"))}
            {row.original.freeGlass && (
              <div className="text-xs text-success">+ Free Glass</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("profit", {
        header: "Profit",
        cell: ({ row }) => (
          showProfits ? (
            <span>₹{row.getValue("profit")}</span>
          ) : (
            <span className="text-muted-foreground">Hidden</span>
          )
        ),
      }),
      columnHelper.display({
        id: "history",
        header: "History",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => setHistoryDialog({ open: true, customer: row.original.customer })}>
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
    [showProfits],
  );

  const filteredData = useMemo(() => {
    return data.filter((transaction) => {
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || transaction.paymentMethod === paymentFilter;
      return matchesStatus && matchesPayment;
    });
  }, [data, statusFilter, paymentFilter]);

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
    // Initial fetch
    apiClient.getTransactions().then(setData).finally(() => setLoading(false));

    // Real-time updates
    const socket = io("https://positive-kodiak-friendly.ngrok-free.app", { transports: ["websocket"] });
    const update = () => apiClient.getTransactions().then(setData);
    socket.on("transactionCreated", update);
    socket.on("transactionUpdated", update);
    socket.on("transactionDeleted", update);
    return () => {
      socket.off("transactionCreated", update);
      socket.off("transactionUpdated", update);
      socket.off("transactionDeleted", update);
      socket.disconnect();
    };
  }, []);

  // Add, update, delete handlers
  const handleAdd = async (txn) => {
    await apiClient.createTransaction(txn);
    // No need to manually update state, real-time event will trigger refetch
  };
  const handleUpdate = async (updatedTxn) => {
    await apiClient.updateTransaction(updatedTxn.id, updatedTxn);
  };
  const handleDelete = async (id) => {
    await apiClient.deleteTransaction(id);
  };

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
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
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("transactions")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track all repair transactions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleProfits}
              className="h-10 sm:h-9"
            >
              {showProfits ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {showProfits ? "Hide Profits" : "Show Profits"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="h-10 sm:h-9"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            <Link to="/transactions/new">
              <Button size="sm" className="h-10 sm:h-9">
                <Plus className="mr-2 h-4 w-4" />
                {t("new-transaction")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`${t("search")} transactions...`}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="in-progress">
                      {t("in-progress")}
                    </SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="delivered">{t("delivered")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">{t("cash")}</SelectItem>
                    <SelectItem value="upi">{t("upi")}</SelectItem>
                    <SelectItem value="card">{t("card")}</SelectItem>
                    <SelectItem value="bank-transfer">
                      {t("bank-transfer")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction List</CardTitle>
            <CardDescription>
              {table.getFilteredRowModel().rows.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()} pages
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer History Dialog */}
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
                const totalProfit = txns.reduce((sum, t) => sum + (t.profit || 0), 0);
                // If you have parts/supplier info, list them here. For now, show a placeholder.
                return (
                  <div>
                    <div className="mb-2 font-medium">Total Profit: <span className="text-green-600">₹{totalProfit}</span></div>
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
    </AppLayout>
  );
}
