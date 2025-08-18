import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SupplierSelector } from "@/components/forms/SupplierSelector";
import {
  Smartphone,
  User,
  Phone,
  IndianRupee,
  Calendar,
  Wrench,
  Package,
  FileText,
  Building,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDevice } from "@/contexts/DeviceContext";
import { useAuth } from "@/contexts/AuthContext";

interface TransactionFormData {
  // Customer Details
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Device Details
  deviceBrand: string;
  deviceModel: string;
  deviceIMEI?: string;
  problemDescription: string;
  
  // Repair Details
  repairCost: string;
  partsRequired: string;
  laborCost: string;
  totalCost: string;
  estimatedDays: string;
  priority: "low" | "medium" | "high" | "urgent";
  
  // Supplier Integration
  supplierId?: string;
  supplierOrderId?: string;
  partsCost?: string;
  
  // Additional Details
  notes?: string;
  warrantyPeriod?: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  rating: number;
}

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transaction: any) => void;
  transaction?: any; // For editing
  mode?: "create" | "edit";
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  transaction,
  mode = "create",
}: TransactionFormProps) {
  const { toast } = useToast();
  const { isMobile } = useDevice();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState<TransactionFormData>({
    customerName: transaction?.customerName || "",
    customerPhone: transaction?.customerPhone || "",
    customerEmail: transaction?.customerEmail || "",
    deviceBrand: transaction?.deviceBrand || "",
    deviceModel: transaction?.deviceModel || "",
    deviceIMEI: transaction?.deviceIMEI || "",
    problemDescription: transaction?.problemDescription || "",
    repairCost: transaction?.repairCost?.toString() || "",
    partsRequired: transaction?.partsRequired || "",
    laborCost: transaction?.laborCost?.toString() || "",
    totalCost: transaction?.totalCost?.toString() || "",
    estimatedDays: transaction?.estimatedDays?.toString() || "",
    priority: transaction?.priority || "medium",
    supplierId: transaction?.supplierId || "",
    supplierOrderId: transaction?.supplierOrderId || "",
    partsCost: transaction?.partsCost?.toString() || "",
    notes: transaction?.notes || "",
    warrantyPeriod: transaction?.warrantyPeriod || "",
  });

  const deviceBrands = [
    "Apple", "Samsung", "OnePlus", "Xiaomi", "Realme", 
    "Oppo", "Vivo", "Nothing", "Google", "Motorola", "Other"
  ];

  const priorityOptions = [
    { value: "low", label: "Low Priority", color: "bg-gray-100 text-gray-800" },
    { value: "medium", label: "Medium Priority", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High Priority", color: "bg-yellow-100 text-yellow-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
  ];

  // Auto-calculate total cost
  const calculateTotalCost = () => {
    const repair = parseFloat(formData.repairCost) || 0;
    const parts = parseFloat(formData.partsCost) || 0;
    const labor = parseFloat(formData.laborCost) || 0;
    const total = repair + parts + labor;
    
    setFormData(prev => ({
      ...prev,
      totalCost: total.toString()
    }));
  };

  const handleSupplierChange = (supplierId: string, supplier?: Supplier) => {
    setFormData(prev => ({ ...prev, supplierId }));
    setSelectedSupplier(supplier || null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.customerName || !formData.customerPhone || !formData.deviceModel || !formData.problemDescription) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const transactionData = {
        ...formData,
        repairCost: parseFloat(formData.repairCost) || 0,
        laborCost: parseFloat(formData.laborCost) || 0,
        partsCost: parseFloat(formData.partsCost) || 0,
        totalCost: parseFloat(formData.totalCost) || 0,
        estimatedDays: parseInt(formData.estimatedDays) || 0,
        createdBy: user?.id,
        createdAt: new Date(),
        status: "pending",
        supplierInfo: selectedSupplier,
      };

      await onSubmit(transactionData);
      
      toast({
        title: "Success",
        description: mode === "create" 
          ? "Transaction created successfully!" 
          : "Transaction updated successfully!",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>{mode === "create" ? "New Transaction" : "Edit Transaction"}</span>
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new repair transaction with supplier integration"
              : "Update transaction details and supplier information"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customer Information</h3>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Full name"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="+91 12345 67890"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerEmail">Email (Optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@email.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Device Information</h3>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand">Device Brand *</Label>
                  <Select 
                    value={formData.deviceBrand} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, deviceBrand: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceBrands.map(brand => (
                        <SelectItem key={brand} value={brand.toLowerCase()}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Device Model *</Label>
                  <Input
                    id="deviceModel"
                    placeholder="iPhone 14, Galaxy S23, etc."
                    value={formData.deviceModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, deviceModel: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceIMEI">IMEI (Optional)</Label>
                  <Input
                    id="deviceIMEI"
                    placeholder="Device IMEI number"
                    value={formData.deviceIMEI}
                    onChange={(e) => setFormData(prev => ({ ...prev, deviceIMEI: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TransactionFormData['priority'] }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={cn("px-2 py-1", priority.color)}>
                              {priority.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="problemDescription">Problem Description *</Label>
                  <Textarea
                    id="problemDescription"
                    placeholder="Describe the problem with the device..."
                    value={formData.problemDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Integration */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Supplier Integration</h3>
                <Badge variant="outline" className="text-xs">NEW</Badge>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Parts Supplier (Optional)</Label>
                  <SupplierSelector
                    value={formData.supplierId}
                    onValueChange={handleSupplierChange}
                    category="parts"
                    placeholder="Select supplier for parts"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierOrderId">Supplier Order ID</Label>
                  <Input
                    id="supplierOrderId"
                    placeholder="Order reference from supplier"
                    value={formData.supplierOrderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierOrderId: e.target.value }))}
                    className="h-12"
                    disabled={!formData.supplierId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partsRequired">Parts Required</Label>
                  <Input
                    id="partsRequired"
                    placeholder="Screen, battery, etc."
                    value={formData.partsRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, partsRequired: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <IndianRupee className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Cost Breakdown</h3>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="repairCost">Base Repair Cost</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="repairCost"
                      type="number"
                      placeholder="0.00"
                      value={formData.repairCost}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, repairCost: e.target.value }));
                        setTimeout(calculateTotalCost, 100);
                      }}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partsCost">Parts Cost</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="partsCost"
                      type="number"
                      placeholder="0.00"
                      value={formData.partsCost}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, partsCost: e.target.value }));
                        setTimeout(calculateTotalCost, 100);
                      }}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laborCost">Labor Cost</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="laborCost"
                      type="number"
                      placeholder="0.00"
                      value={formData.laborCost}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, laborCost: e.target.value }));
                        setTimeout(calculateTotalCost, 100);
                      }}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCost">Total Cost</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="totalCost"
                      type="number"
                      value={formData.totalCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                      className="pl-10 h-12 font-bold bg-muted"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDays">Estimated Days</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    placeholder="Number of days"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDays: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyPeriod">Warranty Period (Days)</Label>
                  <Input
                    id="warrantyPeriod"
                    type="number"
                    placeholder="Warranty in days"
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriod: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Additional Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes, special instructions, or important details..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="thumb-primary">
            {loading ? "Saving..." : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {mode === "create" ? "Create Transaction" : "Update Transaction"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
