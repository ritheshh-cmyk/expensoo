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
  RefreshCw,
  Smartphone,
  Clock,
  IndianRupee,
  Calendar,
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



export default function Transactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const [paymentFilter, setPaymentFilter] = useState("all");

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

          </div>
        ),
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
    // Only fetch data if user is authenticated and token is available
    const token = localStorage.getItem("callmemobiles_token");
    const user = localStorage.getItem("callmemobiles_user");
    if (!token || !user) {
      console.log('⏭️ Skipping transactions fetch - no authentication token or user');
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        console.log('🔄 Fetching transactions data...');
        const transactions = await apiClient.getTransactions();
        console.log('✅ Transactions loaded:', transactions.length);
        setData(transactions);
      } catch (error) {
        console.error('❌ Failed to fetch transactions:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTransactions();

    // Real-time updates with better error handling
    let socket: any = null;
    try {
      socket = io("https://expensoo-app-gu3wg.ondigitalocean.app", { 
        transports: ["websocket"],
        timeout: 5000
      });
      
      const update = async () => {
        const currentToken = localStorage.getItem("callmemobiles_token");
        if (currentToken) {
          try {
            const transactions = await apiClient.getTransactions();
            setData(transactions);
            console.log('🔄 Transactions updated via socket');
          } catch (error) {
            console.error('❌ Failed to update transactions via socket:', error);
          }
        }
      };
      
      socket.on("transactionCreated", update);
      socket.on("transactionUpdated", update);
      socket.on("transactionDeleted", update);
      socket.on("connect", () => console.log('🔌 Socket connected'));
      socket.on("disconnect", () => console.log('🔌 Socket disconnected'));
      socket.on("connect_error", (error: any) => console.error('🔌 Socket connection error:', error));
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
    }
    
    return () => {
      if (socket) {
        socket.off("transactionCreated");
        socket.off("transactionUpdated");
        socket.off("transactionDeleted");
        socket.disconnect();
      }
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

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const transactions = await apiClient.getTransactions();
      setData(transactions);
      toast({
        title: "Transactions Updated",
        description: "Latest transactions have been loaded successfully.",
      });
    } catch (error) {
      console.error('❌ Failed to refresh transactions:', error);
      toast({
        title: "Error",
        description: "Failed to refresh transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
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
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Transactions
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage repair transactions
            </p>
          </div>
          
          {/* Primary Action Button - Mobile First */}
          <Link to="/transactions/new" className="block">
            <Button className="thumb-primary w-full text-lg py-6 shadow-lg">
              <Plus className="mr-3 h-6 w-6" />
              Add New Repair
            </Button>
          </Link>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="touch-button flex-1 py-4"
            >
              <RefreshCw className={cn("mr-2 h-5 w-5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="touch-button flex-1 py-4"
            >
              <Download className="mr-2 h-5 w-5" />
              Export
            </Button>
          </div>
        </div>

        {/* Mobile-Optimized Search and Filters */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-slate-200 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="touch-button h-12 border-2 border-slate-200">
                  <Filter className="mr-2 h-5 w-5" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold">Transaction List</CardTitle>
                <CardDescription className="mt-1">
                  {table.getFilteredRowModel().rows.length} transactions found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto border-t">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t bg-muted/20">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()} pages
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-9 px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
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
    </AppLayout>
  );
}
