import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Building,
  Phone,
  MapPin,
  Package,
  ShoppingCart,
  Users,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  category: string;
  rating: number;
  totalOrders: number;
  totalAmount: number;
  status: "active" | "inactive" | "blocked";
}

interface SupplierSelectorProps {
  value?: string;
  onValueChange: (supplierId: string, supplier?: Supplier) => void;
  placeholder?: string;
  category?: string; // Filter by category
  className?: string;
  disabled?: boolean;
}

export function SupplierSelector({
  value,
  onValueChange,
  placeholder = "Select supplier",
  category,
  className,
  disabled = false,
}: SupplierSelectorProps) {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Quick add supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    category: category || "parts",
  });

  // Sample suppliers data
  const sampleSuppliers: Supplier[] = [
    {
      id: "SUP001",
      name: "TechParts India",
      contactPerson: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "sales@techparts.in",
      address: "123, Electronic Market, Nehru Place",
      city: "New Delhi",
      category: "parts",
      rating: 4.5,
      totalOrders: 45,
      totalAmount: 125000,
      status: "active",
    },
    {
      id: "SUP002",
      name: "Mobile Solutions Pvt Ltd",
      contactPerson: "Priya Sharma",
      phone: "+91 87654 32109",
      email: "orders@mobilesolutions.com",
      address: "456, Tech Hub, Sector 62",
      city: "Gurgaon",
      category: "accessories",
      rating: 4.2,
      totalOrders: 32,
      totalAmount: 85000,
      status: "active",
    },
    {
      id: "SUP003",
      name: "Repair Tools Co",
      contactPerson: "Amit Singh",
      phone: "+91 76543 21098",
      email: "support@repairtools.co",
      address: "789, Industrial Area, Phase 1",
      city: "Chandigarh",
      category: "tools",
      rating: 4.8,
      totalOrders: 28,
      totalAmount: 65000,
      status: "active",
    },
    {
      id: "SUP004",
      name: "QuickFix Consumables",
      contactPerson: "Sneha Patel",
      phone: "+91 99887 76655",
      email: "orders@quickfix.com",
      address: "321, Industrial Estate",
      city: "Ahmedabad",
      category: "consumables",
      rating: 4.3,
      totalOrders: 22,
      totalAmount: 45000,
      status: "active",
    },
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const response = await apiClient.get('/api/suppliers');
      if (response && Array.isArray(response)) {
        setSuppliers(response.filter(s => s.status === 'active'));
      } else {
        setSuppliers(sampleSuppliers.filter(s => s.status === 'active'));
      }
    } catch (error) {
      console.log('Using sample suppliers:', error);
      setSuppliers(sampleSuppliers.filter(s => s.status === 'active'));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "parts", label: "Parts & Components", icon: Package, color: "bg-blue-100 text-blue-700" },
    { value: "accessories", label: "Accessories", icon: ShoppingCart, color: "bg-green-100 text-green-700" },
    { value: "tools", label: "Tools & Equipment", icon: Building, color: "bg-purple-100 text-purple-700" },
    { value: "consumables", label: "Consumables", icon: Package, color: "bg-orange-100 text-orange-700" },
    { value: "services", label: "Services", icon: Users, color: "bg-indigo-100 text-indigo-700" },
  ];

  const getCategoryInfo = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !category || supplier.category === category;
    
    return matchesSearch && matchesCategory;
  });

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    onValueChange(supplierId, supplier);
  };

  const handleAddNewSupplier = () => {
    if (!newSupplier.name || !newSupplier.contactPerson || !newSupplier.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const supplier: Supplier = {
      id: `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      city: newSupplier.city,
      category: newSupplier.category,
      rating: 0,
      totalOrders: 0,
      totalAmount: 0,
      status: "active",
    };

    setSuppliers([supplier, ...suppliers]);
    onValueChange(supplier.id, supplier);
    
    setNewSupplier({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      category: category || "parts",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Success",
      description: `Supplier "${supplier.name}" added and selected.`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select 
            value={value} 
            onValueChange={handleSupplierSelect}
            disabled={disabled || loading}
          >
            <SelectTrigger className={cn("h-12 text-base", className)}>
              <SelectValue placeholder={loading ? "Loading suppliers..." : placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {/* Search within dropdown */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>

              {filteredSuppliers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchTerm ? "No suppliers found matching your search" : "No suppliers available"}
                </div>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const categoryInfo = getCategoryInfo(supplier.category);
                  const CategoryIcon = categoryInfo.icon;
                  
                  return (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center space-x-3 py-1">
                        <div className={cn("p-1 rounded", categoryInfo.color)}>
                          <CategoryIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{supplier.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{supplier.contactPerson}</span>
                            {supplier.city && (
                              <>
                                <span>•</span>
                                <span>{supplier.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <Badge className={cn("text-xs", categoryInfo.color)}>
                            {categoryInfo.label}
                          </Badge>
                          <p className="text-muted-foreground">
                            ⭐ {supplier.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })
              )}
              
              {/* Quick Add Option */}
              <div className="p-2 border-t">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full h-8">
                      <Plus className="mr-2 h-3 w-3" />
                      Add New Supplier
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Add Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Quick Add Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier to use in this transaction
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Company Name *</Label>
                  <Input
                    id="supplierName"
                    placeholder="Supplier company name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Primary contact name"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="supplierPhone">Phone *</Label>
                  <Input
                    id="supplierPhone"
                    type="tel"
                    placeholder="+91 12345 67890"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierEmail">Email</Label>
                  <Input
                    id="supplierEmail"
                    type="email"
                    placeholder="supplier@email.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="supplierCity">City</Label>
                  <Input
                    id="supplierCity"
                    placeholder="City name"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierCategory">Category</Label>
                  <Select 
                    value={newSupplier.category} 
                    onValueChange={(value) => setNewSupplier({...newSupplier, category: value})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center space-x-2">
                            <cat.icon className="h-4 w-4" />
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierAddress">Address</Label>
                <Input
                  id="supplierAddress"
                  placeholder="Full address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  className="h-12"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewSupplier} className="thumb-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Supplier Info */}
      {value && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          {(() => {
            const selectedSupplier = suppliers.find(s => s.id === value);
            if (!selectedSupplier) return null;
            
            const categoryInfo = getCategoryInfo(selectedSupplier.category);
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <div className="flex items-center space-x-3">
                <div className={cn("p-2 rounded-full", categoryInfo.color)}>
                  <CategoryIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedSupplier.name}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{selectedSupplier.phone}</span>
                    </span>
                    {selectedSupplier.city && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{selectedSupplier.city}</span>
                      </span>
                    )}
                    <span>⭐ {selectedSupplier.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
