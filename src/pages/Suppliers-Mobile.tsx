import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Package,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Download,
  Filter,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  lastOrderDate: Date;
  status: "active" | "inactive" | "blocked";
  notes?: string;
}

export default function Suppliers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for new supplier
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    category: "",
    notes: "",
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
      lastOrderDate: new Date(),
      status: "active",
      notes: "Reliable supplier for iPhone parts"
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
      lastOrderDate: new Date(Date.now() - 86400000),
      status: "active",
      notes: "Good for bulk orders"
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
      lastOrderDate: new Date(Date.now() - 172800000),
      status: "active",
      notes: "Premium quality tools"
    },
  ];

  useEffect(() => {
    setSuppliers(sampleSuppliers);
  }, []);

  const categories = [
    { value: "parts", label: "Parts & Components", icon: Package, color: "bg-blue-100 text-blue-700" },
    { value: "accessories", label: "Accessories", icon: ShoppingCart, color: "bg-green-100 text-green-700" },
    { value: "tools", label: "Tools & Equipment", icon: Building, color: "bg-purple-100 text-purple-700" },
    { value: "consumables", label: "Consumables", icon: Package, color: "bg-orange-100 text-orange-700" },
    { value: "services", label: "Services", icon: Users, color: "bg-indigo-100 text-indigo-700" },
  ];

  const getCategoryInfo = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category.toLowerCase());
    return categoryInfo || categories[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      case "blocked": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Supplier data updated successfully.",
      });
    }, 1000);
  };

  const handleAddSupplier = () => {
    if (!formData.name || !formData.contactPerson || !formData.phone || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newSupplier: Supplier = {
      id: `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
      name: formData.name,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      category: formData.category,
      rating: 0,
      totalOrders: 0,
      totalAmount: 0,
      lastOrderDate: new Date(),
      status: "active",
      notes: formData.notes,
    };

    setSuppliers([newSupplier, ...suppliers]);
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      category: "",
      notes: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Success",
      description: "Supplier added successfully.",
    });
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalSuppliers = filteredSuppliers.length;
  const activeSuppliers = filteredSuppliers.filter(s => s.status === "active").length;
  const totalSpent = filteredSuppliers.reduce((sum, s) => sum + s.totalAmount, 0);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn("h-3 w-3", i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
      />
    ));
  };

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Suppliers
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage your business suppliers and vendors
            </p>
          </div>

          {/* Quick Stats - Mobile Optimized */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <Card className="border-2 border-blue-100 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600">Total Suppliers</p>
                    <p className="text-lg font-bold text-blue-700">{totalSuppliers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-green-100 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600">Active</p>
                    <p className="text-lg font-bold text-green-700">{activeSuppliers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 bg-purple-50 col-span-2 sm:col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-purple-100 rounded-full">
                    <IndianRupee className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-600">Total Spent</p>
                    <p className="text-lg font-bold text-purple-700">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Primary Action Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="thumb-primary w-full text-lg py-6 shadow-lg">
                <Plus className="mr-3 h-6 w-6" />
                Add New Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Supplier</DialogTitle>
                <DialogDescription>
                  Enter supplier information and contact details
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Supplier company name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Primary contact name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 12345 67890"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="supplier@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-4 w-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City name"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this supplier..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddSupplier} className="w-full sm:w-auto thumb-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="touch-button py-4 border-2"
            >
              <RefreshCw className={cn("mr-2 h-5 w-5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              className="touch-button py-4 border-2"
              onClick={() => {
                toast({
                  title: "Export Started",
                  description: "Downloading suppliers as Excel file.",
                });
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Export Data
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
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-slate-200 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First Supplier Cards */}
        <div className="space-y-3">
          {filteredSuppliers.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="p-6 bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Building className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
                <p className="text-base text-muted-foreground mb-6">
                  {searchTerm ? "Try adjusting your search filters" : "Start by adding your first supplier"}
                </p>
                <Button 
                  className="thumb-primary text-lg px-8 py-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Add First Supplier
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSuppliers.map((supplier) => {
              const categoryInfo = getCategoryInfo(supplier.category);
              const CategoryIcon = categoryInfo.icon;
              
              return (
                <Card 
                  key={supplier.id} 
                  className="border-2 border-slate-100 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-full", categoryInfo.color)}>
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("px-2 py-1 text-xs border", getStatusColor(supplier.status))}>
                          {supplier.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/suppliers/${supplier.id}`);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle delete
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{supplier.contactPerson}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{supplier.phone}</span>
                      </div>
                      {supplier.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.city && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{supplier.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating and Stats */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(supplier.rating)}</div>
                          <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                        </div>
                        <Badge className={cn("px-2 py-1 text-xs", categoryInfo.color)}>
                          {categoryInfo.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">{supplier.totalOrders}</span> orders
                        </div>
                        <div>
                          <span className="font-medium">₹{supplier.totalAmount.toLocaleString('en-IN')}</span> spent
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {supplier.notes && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-sm text-muted-foreground">{supplier.notes}</p>
                      </div>
                    )}

                    {/* Last Order Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-muted-foreground">
                      <span>Last order: {supplier.lastOrderDate.toLocaleDateString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Load More for Mobile */}
        {filteredSuppliers.length > 0 && (
          <Card className="border-2 border-slate-100">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredSuppliers.length} suppliers • {activeSuppliers} active
              </p>
              <Button variant="outline" className="touch-button">
                Load More Suppliers
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
