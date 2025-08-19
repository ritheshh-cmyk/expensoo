import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  User,
  Smartphone,
  Wrench,
  Package,
  Plus,
  Trash2,
  Calculator,
  Store,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  // Step 1: Customer Details
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  deviceModel: z.string().min(1, "Device model is required"),

  // Step 2: Repair Info
  repairType: z.string().min(1, "Repair type is required"),
  customRepairType: z.string().optional(),
  repairCost: z.number().min(0, "Cost must be positive"),
  paymentMethod: z.enum(["cash", "upi", "card", "bank-transfer"]),
  amountGiven: z.number().min(0, "Amount given must be positive"),

  // Step 3: Parts and Supplier Selection - ENHANCED
  requiresParts: z.boolean().optional(),
  supplier: z.string().optional(),
  newSupplierName: z.string().optional(),
  externalPurchase: z.boolean().optional(),
  partSupplier: z.string().optional(), // New field for part supplier selection
  
  // Step 4: Additional Details
  freeGlass: z.boolean().optional(),
  remarks: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  estimatedCompletion: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

interface Part {
  name: string;
  cost: number;
  quantity: number;
  supplier?: string; // Enhanced with supplier tracking
}

interface MultiStepTransactionFormProps {
  onSubmit: (data: any) => void;
}

export function MultiStepTransactionForm({ onSubmit }: MultiStepTransactionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [parts, setParts] = useState<Part[]>([]);
  const [requiresParts, setRequiresParts] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const { t } = useLanguage();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      repairCost: 0,
      amountGiven: 0,
      paymentMethod: "cash",
      requiresParts: false,
      freeGlass: false,
      externalPurchase: false,
      priority: "medium",
    },
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.getSuppliers();
      if (response.success && response.suppliers) {
        setSuppliers(response.suppliers);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    }
  };

  const steps = [
    {
      title: t("customer-details"),
      icon: User,
      description: "Customer information and contact details",
    },
    {
      title: t("repair-details"),
      icon: Wrench,
      description: "Repair type, cost and payment information",
    },
    {
      title: t("parts-suppliers"),
      icon: Package,
      description: "Parts required and supplier selection", // Updated description
    },
    {
      title: t("additional-details"),
      icon: Smartphone,
      description: "Final details and completion",
    },
  ];

  const nextStep = async () => {
    let fieldsToValidate: (keyof TransactionFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["customerName", "phoneNumber", "deviceModel"];
        break;
      case 2:
        fieldsToValidate = [
          "repairType",
          "repairCost",
          "paymentMethod",
          "amountGiven",
        ];
        break;
      case 3:
        // Validate supplier selection if parts are required
        if (requiresParts && parts.length > 0) {
          const partsWithoutSupplier = parts.some(part => !part.supplier);
          if (partsWithoutSupplier) {
            toast({
              title: "Supplier Required",
              description: "Please select a supplier for all parts.",
              variant: "destructive",
            });
            return;
          }
        }
        break;
      case 4:
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addPart = () => {
    const newPart = { 
      name: "", 
      cost: 0, 
      quantity: 1, 
      supplier: selectedSupplier || suppliers[0]?.id || ""
    };
    setParts([...parts, newPart]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    const updatedParts = parts.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    );
    setParts(updatedParts);
  };

  const calculatePartsCost = () => {
    return parts.reduce((total, part) => total + (part.cost * part.quantity), 0);
  };

  const extractBrandFromModel = (model: string) => {
    const brands = ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Oppo", "Vivo", "Realme", "Nokia", "Motorola"];
    const foundBrand = brands.find(brand => 
      model.toLowerCase().includes(brand.toLowerCase())
    );
    return foundBrand || "Other";
  };

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      // Create suppliers first if needed
      const createdSuppliers = [];
      
      if (data.supplier === "Other" && data.newSupplierName?.trim()) {
        const newSupplier = {
          name: data.newSupplierName.trim(),
          contact_number: "",
          address: "",
        };
        
        try {
          const supplierResponse = await apiClient.createSupplier(newSupplier);
          if (supplierResponse.success) {
            createdSuppliers.push(supplierResponse.supplier);
            toast({
              title: "Supplier Added",
              description: `${data.newSupplierName} has been added to your suppliers list.`,
            });
          }
        } catch (error) {
          console.error("Failed to create supplier:", error);
        }
      }

      // Always send all required fields for backend validation
      const validationData = {
        customerName: String(data.customerName || "").trim(),
        mobileNumber: String(data.phoneNumber || "").replace(/\D/g, ""),
        deviceModel: String(data.deviceModel || "").trim(),
        repairType: String(data.repairType === "others" ? data.customRepairType : data.repairType),
        paymentMethod: String(data.paymentMethod || "cash"),
        repairCost: Number(data.repairCost) || 0,
        amountGiven: Number(data.amountGiven) || 0,
        changeReturned: Math.max(0, (Number(data.amountGiven) || 0) - (Number(data.repairCost) || 0)),
        status: "Completed",
        remarks: data.remarks || "",
        partsCost: parts.length > 0 ? parts.map(part => ({
          supplier: part.supplier || "",
          cost: part.cost,
          item: part.name
        })) : []
      };

      console.log("🔧 Sending transaction with validation format (camelCase):", validationData);

      // Submit transaction
      const response = await apiClient.createTransaction(validationData);

      if (response.success) {
        // Update supplier expenditures if parts were purchased
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.supplier) {
              try {
                await apiClient.request(`/api/suppliers/${part.supplier}/add-expenditure`, {
                  method: 'POST',
                  body: JSON.stringify({
                    amount: part.cost * part.quantity,
                    description: `Parts for ${data.customerName} - ${part.name}`,
                    transaction_id: response.transaction?.id
                  })
                });
              } catch (error) {
                console.error("Failed to update supplier expenditure:", error);
              }
            }
          }
        }

        toast({
          title: "Success!",
          description: "Transaction created successfully with all supplier information.",
        });

        // Reset form
        form.reset();
        setParts([]);
        setRequiresParts(false);
        setSelectedSupplier("");
        setCurrentStep(1);

        // Force transaction list refresh (if parent provides onSubmit)
        if (typeof onSubmit === 'function') {
          onSubmit(response.transaction);
        }
      } else {
        throw new Error(response.error || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Transaction creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            const StepIcon = step.icon;

            return (
              <div
                key={stepNumber}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all",
                  isActive && "bg-primary text-primary-foreground shadow-md",
                  isCompleted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                <StepIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs opacity-80">{step.description}</div>
                </div>
                {isCompleted && <div className="w-2 h-2 bg-green-500 rounded-full" />}
              </div>
            );
          })}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step 1: Customer Details */}
        {currentStep === 1 && (
          <Card className="border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Enter customer details and device information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    {...register("customerName")}
                    placeholder="Enter customer name"
                    className="border-2"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm">{errors.customerName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    {...register("phoneNumber")}
                    placeholder="Enter phone number"
                    className="border-2"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceModel">Device Model *</Label>
                <Input
                  id="deviceModel"
                  {...register("deviceModel")}
                  placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
                  className="border-2"
                />
                {errors.deviceModel && (
                  <p className="text-red-500 text-sm">{errors.deviceModel.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Repair Details */}
        {currentStep === 2 && (
          <Card className="border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Repair Information
              </CardTitle>
              <CardDescription>
                Specify repair type, cost and payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repairType">Repair Type *</Label>
                  <Select onValueChange={(value) => setValue("repairType", value)}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select repair type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen-replacement">Screen Replacement</SelectItem>
                      <SelectItem value="battery-replacement">Battery Replacement</SelectItem>
                      <SelectItem value="charging-port">Charging Port Repair</SelectItem>
                      <SelectItem value="speaker-repair">Speaker Repair</SelectItem>
                      <SelectItem value="camera-repair">Camera Repair</SelectItem>
                      <SelectItem value="water-damage">Water Damage Repair</SelectItem>
                      <SelectItem value="software-issue">Software Issue</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.repairType && (
                    <p className="text-red-500 text-sm">{errors.repairType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repairCost">Repair Cost (₹) *</Label>
                  <Input
                    id="repairCost"
                    type="number"
                    {...register("repairCost", { valueAsNumber: true })}
                    placeholder="0"
                    className="border-2"
                  />
                  {errors.repairCost && (
                    <p className="text-red-500 text-sm">{errors.repairCost.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select onValueChange={(value) => setValue("paymentMethod", value as any)}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountGiven">Amount Given (₹) *</Label>
                  <Input
                    id="amountGiven"
                    type="number"
                    {...register("amountGiven", { valueAsNumber: true })}
                    placeholder="0"
                    className="border-2"
                  />
                  {errors.amountGiven && (
                    <p className="text-red-500 text-sm">{errors.amountGiven.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Enhanced Parts and Supplier Selection */}
        {currentStep === 3 && (
          <Card className="border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <Store className="w-5 h-5" />
                Parts & Supplier Selection
              </CardTitle>
              <CardDescription>
                Manage parts requirements and select suppliers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Supplier Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="externalPurchase"
                    checked={watch("externalPurchase")}
                    onCheckedChange={(checked) => setValue("externalPurchase", !!checked)}
                  />
                  <Label htmlFor="externalPurchase" className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    External Purchase (parts bought from supplier)
                  </Label>
                </div>

                {watch("externalPurchase") && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Select Supplier</Label>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedSupplier(value);
                          setValue("supplier", value);
                        }}
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue placeholder="Choose supplier for parts" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name} - {supplier.contact_number}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other">+ Add New Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {watch("supplier") === "Other" && (
                      <div className="space-y-2">
                        <Label htmlFor="newSupplierName">New Supplier Name</Label>
                        <Input
                          id="newSupplierName"
                          {...register("newSupplierName")}
                          placeholder="Enter new supplier name"
                          className="border-2"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Parts Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresParts"
                      checked={requiresParts}
                      onCheckedChange={(checked) => {
                        setRequiresParts(!!checked);
                        setValue("requiresParts", !!checked);
                      }}
                    />
                    <Label htmlFor="requiresParts">This repair requires parts</Label>
                  </div>
                  
                  {requiresParts && (
                    <Button type="button" onClick={addPart} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Part
                    </Button>
                  )}
                </div>

                {requiresParts && parts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Parts List</h4>
                    {parts.map((part, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                        <div className="col-span-4">
                          <Input
                            placeholder="Part name"
                            value={part.name}
                            onChange={(e) => updatePart(index, "name", e.target.value)}
                            className="border-2"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Cost"
                            value={part.cost}
                            onChange={(e) => updatePart(index, "cost", Number(e.target.value))}
                            className="border-2"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={part.quantity}
                            onChange={(e) => updatePart(index, "quantity", Number(e.target.value))}
                            className="border-2"
                          />
                        </div>
                        <div className="col-span-3">
                          <Select 
                            value={part.supplier} 
                            onValueChange={(value) => updatePart(index, "supplier", value)}
                          >
                            <SelectTrigger className="border-2">
                              <SelectValue placeholder="Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePart(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end">
                      <div className="text-lg font-semibold">
                        Total Parts Cost: ₹{calculatePartsCost()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Additional Details */}
        {currentStep === 4 && (
          <Card className="border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Additional Details
              </CardTitle>
              <CardDescription>
                Final information and special requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select onValueChange={(value) => setValue("priority", value as any)}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                  <Input
                    id="estimatedCompletion"
                    type="date"
                    {...register("estimatedCompletion")}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="freeGlass"
                    {...register("freeGlass")}
                  />
                  <Label htmlFor="freeGlass">Free tempered glass installation</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks / Special Instructions</Label>
                <Textarea
                  id="remarks"
                  {...register("remarks")}
                  placeholder="Any additional notes or special instructions..."
                  className="border-2 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="min-w-[120px]"
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="min-w-[120px]"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="min-w-[120px] bg-green-600 hover:bg-green-700"
            >
              Create Transaction
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}