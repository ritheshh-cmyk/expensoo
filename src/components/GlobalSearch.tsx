import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, User, Smartphone, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({
  placeholder = "Search transactions, customers...",
  className = "",
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const performSearch = async () => {
        setIsSearching(true);
        try {
          // Try backend search only
          const backendResults = await apiClient.request(
            `/search?q=${encodeURIComponent(searchQuery)}`,
          );

          // Transform backend results to match our format
          const transformedResults = backendResults.map((item: any) => ({
            type: item.type || "transaction",
            id: item.id,
            title: item.title || item.customerName || item.name,
            subtitle:
              item.subtitle ||
              `${item.deviceModel} • ₹${item.amount}` ||
              item.phone,
            link:
              item.type === "customer"
                ? "/transactions"
                : `/transactions/${item.id}`,
            icon: item.type === "customer" ? User : Smartphone,
          }));

          setSearchResults(transformedResults);
        } catch (error) {
          // On error, show no results
          setSearchResults([]);
        } finally {
          setIsSearching(false);
          setIsOpen(true);
        }
      };
      // Debounce search
      const debounceTimer = setTimeout(performSearch, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleResultClick = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "customer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "transaction":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const renderSearchContent = () => {
    if (isSearching) {
      return (
        <div className="p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      );
    }

    if (searchResults.length === 0 && searchQuery.length > 1) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      );
    }

    return searchResults.map((result) => {
      const Icon = result.icon;
      return (
        <Link
          key={result.id}
          to={result.link}
          onClick={handleResultClick}
          className="flex items-center gap-3 p-3 hover:bg-accent transition-colors border-b last:border-b-0"
        >
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{result.title}</p>
              <Badge
                variant="secondary"
                className={`text-xs ${getTypeColor(result.type)}`}
              >
                {result.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {result.subtitle}
            </p>
          </div>
        </Link>
      );
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onFocus={() => searchQuery.length > 1 && setIsOpen(true)}
          />
        </div>
      </PopoverTrigger>
      {(searchResults.length > 0 ||
        isSearching ||
        (searchQuery.length > 1 && !isSearching)) && (
        <PopoverContent
          className="w-80 p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="border-b p-3">
            <h4 className="font-medium text-sm">
              {isSearching ? "Searching..." : "Search Results"}
            </h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {renderSearchContent()}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
