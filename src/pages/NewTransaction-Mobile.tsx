import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Save,
  Smartphone,
  User,
  Phone,
  Wrench,
  CreditCard,
  DollarSign,
  Clock,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  Package,
  Settings,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionData {
  customerName: string;
  phoneNumber: string;
  deviceModel: string;
  repairType: string;
  repairCost: number;
  paymentMethod: string;
  amountGiven: number;
  remarks: string;
  parts: Array<{ name: string; cost: number }>;
  freeGlass: boolean;
  repairServiceType: string;
  internalCost: number;
  externalItemCost: number;
}

const initialData: TransactionData = {
  customerName: "",
  phoneNumber: "",
  deviceModel: "",
  repairType: "",
  repairCost: 0,
  paymentMethod: "",
  amountGiven: 0,
  remarks: "",
  parts: [],
  freeGlass: false,
  repairServiceType: "internal",
  internalCost: 0,
  externalItemCost: 0,
};

const steps = [
  { id: "customer", title: "Customer", icon: User, completed: false },
  { id: "device", title: "Device", icon: Smartphone, completed: false },
  { id: "repair", title: "Repair", icon: Wrench, completed: false },
  { id: "parts", title: "Parts", icon: Package, completed: false },
  { id: "payment", title: "Payment", icon: CreditCard, completed: false },
];

export default function NewTransaction() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<TransactionData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartCost, setNewPartCost] = useState("");

  const updateData = (field: keyof TransactionData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addPart = () => {
    if (newPartName && newPartCost) {
      const newPart = { name: newPartName, cost: parseFloat(newPartCost) };
      setData(prev => ({ ...prev, parts: [...prev.parts, newPart] }));
      setNewPartName("");
      setNewPartCost("");
    }
  };

  const removePart = (index: number) => {
    setData(prev => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  };

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Customer
        return !!(data.customerName && data.phoneNumber);
      case 1: // Device
        return !!(data.deviceModel);
      case 2: // Repair
        return !!(data.repairType && data.repairCost > 0);
      case 3: // Parts
        return true; // Optional step
      case 4: // Payment
        return !!(data.paymentMethod && data.amountGiven >= 0);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const transformedData = {
        customerName: data.customerName,
        mobileNumber: data.phoneNumber,
        deviceModel: data.deviceModel,
        repairType: data.repairType,
        repairCost: data.repairCost,
        paymentMethod: data.paymentMethod,
        amountGiven: data.amountGiven,
        changeReturned: Math.max(0, data.amountGiven - data.repairCost),
        remarks: data.remarks || '',
        partsCost: data.parts,
        freeGlassInstallation: data.freeGlass,
        repairServiceType: data.repairServiceType,
        internalCost: data.internalCost,
        externalItemCost: data.externalItemCost,
        status: 'Completed'
      };
      
      console.log('🔄 Creating transaction with data:', transformedData);
      const result = await apiClient.createTransaction(transformedData);
      console.log('✅ Transaction created successfully:', result);
      
      apiClient.clearLocalData();
      
      toast({
        title: "Transaction Created Successfully! 🎉",
        description: `Repair order for ${data.customerName} has been created and synced.`,
      });
      
      navigate("/transactions");
    } catch (error: any) {
      console.error('❌ Transaction creation failed:', error);
      toast({
        title: "Error Creating Transaction",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-16 w-16 mx-auto mb-4 text-blue-500 bg-blue-100 rounded-full p-4" />
        <h3 className="text-xl font-bold">Customer Information</h3>
        <p className="text-muted-foreground">Enter customer details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerName" className="text-base font-medium">
            Customer Name *
          </Label>
          <Input
            id="customerName"
            value={data.customerName}
            onChange={(e) => updateData("customerName", e.target.value)}
            placeholder="Enter customer name"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-base font-medium">
            Phone Number *
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => updateData("phoneNumber", e.target.value)}
            placeholder="+91 98765 43210"
            className="h-12 text-base"
          />
        </div>
      </div>
    </div>
  );

  const renderDeviceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Smartphone className="h-16 w-16 mx-auto mb-4 text-green-500 bg-green-100 rounded-full p-4" />
        <h3 className="text-xl font-bold">Device Information</h3>
        <p className="text-muted-foreground">Device details to repair</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deviceModel" className="text-base font-medium">
            Device Model *
          </Label>
          <Select value={data.deviceModel} onValueChange={(value) => updateData("deviceModel", value)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select device model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iPhone 15 Pro">iPhone 15 Pro</SelectItem>
              <SelectItem value="iPhone 15">iPhone 15</SelectItem>
              <SelectItem value="iPhone 14 Pro">iPhone 14 Pro</SelectItem>
              <SelectItem value="iPhone 14">iPhone 14</SelectItem>
              <SelectItem value="iPhone 13">iPhone 13</SelectItem>
              <SelectItem value="iPhone 12">iPhone 12</SelectItem>
              <SelectItem value="Samsung Galaxy S24">Samsung Galaxy S24</SelectItem>
              <SelectItem value="Samsung Galaxy S23">Samsung Galaxy S23</SelectItem>
              <SelectItem value="OnePlus 12">OnePlus 12</SelectItem>
              <SelectItem value="Xiaomi 14">Xiaomi 14</SelectItem>
              <SelectItem value="Other">Other Model</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.deviceModel === "Other" && (
          <div className="space-y-2">
            <Label className="text-base font-medium">Custom Model Name</Label>
            <Input
              value={data.deviceModel}
              onChange={(e) => updateData("deviceModel", e.target.value)}
              placeholder="Enter device model"
              className="h-12 text-base"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderRepairStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Wrench className="h-16 w-16 mx-auto mb-4 text-orange-500 bg-orange-100 rounded-full p-4" />
        <h3 className="text-xl font-bold">Repair Details</h3>
        <p className="text-muted-foreground">What needs to be fixed</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repairType" className="text-base font-medium">
            Repair Type *
          </Label>
          <Select value={data.repairType} onValueChange={(value) => updateData("repairType", value)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select repair type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Screen Replacement">📱 Screen Replacement</SelectItem>
              <SelectItem value="Battery Replacement">🔋 Battery Replacement</SelectItem>
              <SelectItem value="Charging Port">🔌 Charging Port Repair</SelectItem>
              <SelectItem value="Camera Repair">📸 Camera Repair</SelectItem>
              <SelectItem value="Speaker Repair">🔊 Speaker Repair</SelectItem>
              <SelectItem value="Water Damage">💧 Water Damage Repair</SelectItem>
              <SelectItem value="Software Issue">⚙️ Software Issue</SelectItem>
              <SelectItem value="Other">🔧 Other Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repairCost" className="text-base font-medium">
            Repair Cost *
          </Label>
          <Input
            id="repairCost"
            type="number"
            value={data.repairCost || ""}
            onChange={(e) => updateData("repairCost", parseFloat(e.target.value) || 0)}
            placeholder="Enter repair cost"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repairServiceType" className="text-base font-medium">
            Service Type
          </Label>
          <Select value={data.repairServiceType} onValueChange={(value) => updateData("repairServiceType", value)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">🏠 Internal Service</SelectItem>
              <SelectItem value="external">🏭 External Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks" className="text-base font-medium">
            Repair Notes
          </Label>
          <Textarea
            id="remarks"
            value={data.remarks}
            onChange={(e) => updateData("remarks", e.target.value)}
            placeholder="Additional notes or observations..."
            className="min-h-[80px] text-base"
          />
        </div>
      </div>
    </div>
  );

  const renderPartsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Package className="h-16 w-16 mx-auto mb-4 text-purple-500 bg-purple-100 rounded-full p-4" />
        <h3 className="text-xl font-bold">Parts & Accessories</h3>
        <p className="text-muted-foreground">Add parts used in repair</p>
      </div>

      <div className="space-y-4">
        {/* Free Glass Installation Toggle */}
        <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-blue-50">
          <div>
            <Label className="text-base font-medium">Free Glass Installation</Label>
            <p className="text-sm text-muted-foreground">Include complimentary glass protection</p>
          </div>
          <Switch
            checked={data.freeGlass}
            onCheckedChange={(checked) => updateData("freeGlass", checked)}
          />
        </div>

        {/* Add New Part */}
        <div className="space-y-3 p-4 border-2 rounded-lg">
          <Label className="text-base font-medium">Add Parts</Label>
          <div className="space-y-3">
            <Input
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="Part name (e.g., Screen Protector)"
              className="h-12 text-base"
            />
            <Input
              type="number"
              value={newPartCost}
              onChange={(e) => setNewPartCost(e.target.value)}
              placeholder="Cost (₹)"
              className="h-12 text-base"
            />
            <Button 
              onClick={addPart} 
              className="w-full h-12"
              disabled={!newPartName || !newPartCost}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Part
            </Button>
          </div>
        </div>

        {/* Parts List */}
        {data.parts.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Added Parts</Label>
            <div className="space-y-2">
              {data.parts.map((part, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-muted-foreground">₹{part.cost}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePart(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">
                Total Parts Cost: ₹{data.parts.reduce((sum, part) => sum + part.cost, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentStep = () => {
    const changeAmount = Math.max(0, data.amountGiven - data.repairCost);
    const totalCost = data.repairCost + data.parts.reduce((sum, part) => sum + part.cost, 0);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-green-500 bg-green-100 rounded-full p-4" />
          <h3 className="text-xl font-bold">Payment Details</h3>
          <p className="text-muted-foreground">Complete the transaction</p>
        </div>

        {/* Cost Summary */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Repair Cost:</span>
            <span className="font-medium">₹{data.repairCost}</span>
          </div>
          <div className="flex justify-between">
            <span>Parts Cost:</span>
            <span className="font-medium">₹{data.parts.reduce((sum, part) => sum + part.cost, 0)}</span>
          </div>
          {data.freeGlass && (
            <div className="flex justify-between text-green-600">
              <span>Free Glass Installation:</span>
              <span className="font-medium">₹0 (Free)</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span>₹{totalCost}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-base font-medium">
              Payment Method *
            </Label>
            <Select value={data.paymentMethod} onValueChange={(value) => updateData("paymentMethod", value)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="card">💳 Card</SelectItem>
                <SelectItem value="upi">📱 UPI</SelectItem>
                <SelectItem value="netbanking">🏦 Net Banking</SelectItem>
                <SelectItem value="partial">💰 Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountGiven" className="text-base font-medium">
              Amount Received *
            </Label>
            <Input
              id="amountGiven"
              type="number"
              value={data.amountGiven || ""}
              onChange={(e) => updateData("amountGiven", parseFloat(e.target.value) || 0)}
              placeholder="Amount received from customer"
              className="h-12 text-base"
            />
          </div>

          {data.amountGiven > 0 && (
            <div className={cn(
              "p-4 border-2 rounded-lg",
              changeAmount > 0 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"
            )}>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {changeAmount > 0 ? "Change to Return:" : "Payment Status:"}
                </span>
                <span className={cn(
                  "font-bold text-lg",
                  changeAmount > 0 ? "text-orange-600" : "text-green-600"
                )}>
                  {changeAmount > 0 ? `₹${changeAmount}` : "Exact Payment"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderCustomerStep();
      case 1: return renderDeviceStep();
      case 2: return renderRepairStep();
      case 3: return renderPartsStep();
      case 4: return renderPaymentStep();
      default: return renderCustomerStep();
    }
  };

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4">
        {/* Mobile-First Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/transactions")}
            className="thumb-touch p-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">New Repair Order</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep || validateStep(index);
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isActive ? "bg-primary text-white border-primary" :
                      isCompleted ? "bg-green-500 text-white border-green-500" :
                      "bg-gray-100 text-gray-400 border-gray-300"
                    )}>
                      {isCompleted && index < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-1 font-medium",
                      isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-gray-400"
                    )}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-6">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 text-base border-2"
            >
              Previous
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-12 text-base thumb-primary"
              disabled={!validateStep(currentStep)}
            >
              Next Step
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 text-base thumb-primary"
              disabled={!validateStep(4) || isSubmitting}
            >
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? "Creating..." : "Create Transaction"}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-slate-100 bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-center">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="ghost" 
                className="thumb-touch text-sm"
                onClick={() => setData(initialData)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Clear Form
              </Button>
              <Button 
                variant="ghost" 
                className="thumb-touch text-sm"
                onClick={() => navigate("/transactions")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
