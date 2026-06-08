import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, User, Smartphone, Building2, Receipt, Command } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { LoaderOne } from "./ui/loader";
import Fuse from "fuse.js";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

interface SearchItem {
  id: string;
  type: "transaction" | "customer" | "supplier" | "bill";
  title: string;
  subtitle: string;
  link: string;
  icon: any;
}

export function GlobalSearch({
  placeholder = "Search transactions, customers, suppliers...",
  className = "",
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedIndex, setHasLoadedIndex] = useState(false);

  // Raw data stores
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  const fuseRef = useRef<Fuse<SearchItem> | null>(null);

  // Load search index
  const loadSearchIndex = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token || hasLoadedIndex) return;

    setIsSearching(true);
    try {
      const [txResponse, supResponse, billsResponse, custResponse] = await Promise.all([
        apiClient.getTransactions().catch(() => ({ success: false, data: [] })),
        apiClient.getSuppliers().catch(() => ({ success: false, data: [] })),
        apiClient.getBills().catch(() => ({ success: false, data: [] })),
        apiClient.request("/api/customers").catch(() => ({ success: false, data: [] })),
      ]);

      const txList = txResponse.success && Array.isArray(txResponse.data) ? txResponse.data : [];
      const supList = supResponse.success && Array.isArray(supResponse.data) ? supResponse.data : [];
      const billsList = billsResponse.success && Array.isArray(billsResponse.data) ? billsResponse.data : [];
      
      let custList: any[] = [];
      if (custResponse && Array.isArray(custResponse.data)) {
        custList = custResponse.data;
      } else if (Array.isArray(custResponse)) {
        custList = custResponse;
      }

      setTransactions(txList);
      setSuppliers(supList);
      setBills(billsList);
      setCustomers(custList);

      // Build unified search list
      const searchItems: SearchItem[] = [];

      // Add Transactions
      txList.forEach((txn: any) => {
        searchItems.push({
          id: txn.id || txn.transaction_id,
          type: "transaction",
          title: txn.customerName || txn.customer_name || "Unknown Transaction",
          subtitle: `${txn.deviceModel || "Device"} • ₹${txn.repairCost || txn.amount || 0} • ${txn.repairType || "Repair"}`,
          link: `/transactions?id=${txn.id}`,
          icon: Smartphone,
        });
      });

      // Add Customers
      custList.forEach((cust: any) => {
        searchItems.push({
          id: cust.id || cust.phone,
          type: "customer",
          title: cust.name || "Unknown Customer",
          subtitle: `${cust.phone || ""} • ${cust.device_type || "Client"} (${cust.total_repairs || 0} repairs)`,
          link: `/transactions?search=${encodeURIComponent(cust.name || "")}`,
          icon: User,
        });
      });

      // Add Suppliers
      supList.forEach((sup: any) => {
        searchItems.push({
          id: sup.id || sup.name,
          type: "supplier",
          title: sup.name || "Unknown Supplier",
          subtitle: `${sup.parts_type || "Spare Parts"} • ${sup.phone || ""}`,
          link: "/suppliers",
          icon: Building2,
        });
      });

      // Add Bills
      billsList.forEach((bill: any) => {
        searchItems.push({
          id: bill.id || bill.bill_number,
          type: "bill",
          title: bill.bill_number || "Invoice",
          subtitle: `${bill.customer_name || "Customer"} • ₹${bill.amount || 0} • ${bill.payment_method || ""}`,
          link: "/bills",
          icon: Receipt,
        });
      });

      // Initialize Fuse
      fuseRef.current = new Fuse(searchItems, {
        keys: ["title", "subtitle", "id"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        shouldSort: true,
      });

      setHasLoadedIndex(true);
    } catch (error) {
      console.error("Error building search index:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform search on query change
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (!hasLoadedIndex) {
      loadSearchIndex();
      return;
    }

    if (fuseRef.current) {
      const results = fuseRef.current.search(searchQuery.trim()).map((r) => r.item);
      setSearchResults(results.slice(0, 15)); // Limit to top 15 results for performance & UX
    }
  }, [searchQuery, hasLoadedIndex]);

  // When focusing search input
  const handleFocus = () => {
    loadSearchIndex();
    if (searchQuery.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleResultClick = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  const getTypeBadgeCls = (type: string) => {
    switch (type) {
      case "customer":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "transaction":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "supplier":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "bill":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <LoaderOne />
          <p className="text-xs text-muted-foreground mt-3 font-medium">Building search index...</p>
        </div>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim().length >= 2) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      );
    }

    return (
      <div className="divide-y divide-zinc-800/50">
        {searchResults.map((result) => {
          const Icon = result.icon;
          return (
            <Link
              key={`${result.type}-${result.id}`}
              to={result.link}
              onClick={handleResultClick}
              className="flex items-center gap-3.5 p-3 hover:bg-zinc-800/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-zinc-700 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-zinc-100 group-hover:text-white truncate transition-colors">
                    {result.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border ${getTypeBadgeCls(result.type)}`}
                  >
                    {result.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate group-hover:text-zinc-400 transition-colors">
                  {result.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={isOpen && searchQuery.trim().length >= 2} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setIsOpen(true);
              } else {
                setIsOpen(false);
              }
            }}
            className="pl-11 pr-8 bg-zinc-900/40 border-zinc-800/80 focus:border-zinc-700 focus:ring-0 transition-all rounded-xl"
            onFocus={handleFocus}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-0.5 pointer-events-none text-zinc-500 font-mono text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/80">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 z-[300] bg-zinc-950/95 backdrop-blur border border-zinc-800/80 shadow-2xl rounded-2xl overflow-hidden"
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
      >
        <div className="border-b border-zinc-900 p-3 bg-zinc-950 flex items-center justify-between">
          <h4 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
            {isSearching ? "Loading search engine..." : "Matches found"}
          </h4>
          <span className="text-[10px] text-zinc-500 font-medium">Fuzzy Search (Typo-Tolerant)</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {renderSearchResults()}
        </div>
        <div className="border-t border-zinc-900 px-3 py-2 bg-zinc-950/40 text-[10px] text-zinc-500 flex items-center justify-between">
          <span>Click result to expand or navigate</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
