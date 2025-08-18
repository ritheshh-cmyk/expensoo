// 🔧 SIMPLIFIED MULTI-STEP TRANSACTION FORM
// This replaces the complex 4-step form with a streamlined 3-step approach

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import {
  User,
  Smartphone,
  Calculator,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ SIMPLIFIED SCHEMA - Combined logical fields
const simplifiedTransactionSchema = z.object({
  // Step 1: Customer & Device Info
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  deviceModel: z.string().min(1, "Device model is required"),
  
  // Step 2: Repair & Payment Info
  repairType: z.string().min(1, "Repair type is required"),
  customRepairType: z.string().optional(),
  repairCost: z.number().min(0, "Cost must be positive"),
  paymentMethod: z.enum(["cash", "upi", "card", "bank-transfer"]),
  amountGiven: z.number().min(0, "Amount must be positive"),
  
  // Step 3: Costs & Final Details (SIMPLIFIED)
  partsCost: z.number().default(0),
  laborCost: z.number().default(0),
  freeGlass: z.boolean().default(false),
  remarks: z.string().optional(),
});

type SimplifiedTransactionFormData = z.infer<typeof simplifiedTransactionSchema>;

const repairTypes = [
  "screen-replacement",
  "battery-replacement", 
  "charging-port",
  "speaker-repair",
  "camera-repair",
  "water-damage",
  "software-issue",
  "others",
];

interface SimplifiedMultiStepTransactionFormProps {
  onSubmit: (data: SimplifiedTransactionFormData) => void;
  onCancel: () => void;
  initialData?: Partial<SimplifiedTransactionFormData>;
}

export function SimplifiedMultiStepTransactionForm({
  onSubmit,
  onCancel,
  initialData,
}: SimplifiedMultiStepTransactionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<SimplifiedTransactionFormData>({
    resolver: zodResolver(simplifiedTransactionSchema),
    defaultValues: {
      partsCost: 0,
      laborCost: 0,
      freeGlass: false,
      ...initialData,
    },
  });

  const watchedValues = watch();
  const repairCost = watchedValues.repairCost || 0;
  const amountGiven = watchedValues.amountGiven || 0;
  const partsCost = watchedValues.partsCost || 0;
  const laborCost = watchedValues.laborCost || 0;
  const changeReturned = Math.max(0, amountGiven - repairCost);
  const estimatedProfit = Math.max(0, amountGiven - partsCost - laborCost);

  // ✅ SIMPLIFIED TO 3 STEPS ONLY
  const steps = [
    {
      title: "Customer & Device",
      icon: User,
      description: "Basic customer and device information",
    },
    {
      title: "Repair & Payment",
      icon: Smartphone,
      description: "Repair details and payment information",
    },
    {
      title: "Costs & Summary",
      icon: Calculator,
      description: "Cost breakdown and final details",
    },
  ];

  const nextStep = async () => {
    let fieldsToValidate: (keyof SimplifiedTransactionFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["customerName", "phoneNumber", "deviceModel"];
        break;
      case 2:
        fieldsToValidate = ["repairType", "repairCost", "paymentMethod", "amountGiven"];
        break;
      case 3:
        // Final step - no validation needed
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onFormSubmit = async (data: SimplifiedTransactionFormData) => {
    try {
      // ✅ CALCULATE PROPER COSTS FOR BACKEND
      const finalData = {
        ...data,
        // Backend expects these fields for profit calculation
        internalCost: data.laborCost,
        parts_cost: data.partsCost,
        actual_cost: data.partsCost + data.laborCost,
        estimated_profit: estimatedProfit,
      };

      onSubmit(finalData as any);
      
      toast({
        title: "Transaction Created",
        description: "New repair transaction has been added successfully.",
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error", 
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* ✅ SIMPLIFIED PROGRESS INDICATOR */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-success bg-success text-success-foreground",
                    !isActive && !isCompleted && "border-muted-foreground bg-background",
                  )}
                >
                  {isCompleted ? (
                    <span className="text-sm">✓</span>
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-20 mx-4 transition-colors",
                      isCompleted ? "bg-success" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Card>
          <CardContent className="p-6">
            {/* ✅ STEP 1: Customer & Device (Simplified) */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="John Smith"
                      {...register("customerName")}
                      className="h-12"
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...register("phoneNumber")}
                      className="h-12"
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Device Model *</Label>
                  <Input
                    id="deviceModel"
                    type="text"
                    placeholder="iPhone 15 Pro, Samsung Galaxy S24, etc."
                    {...register("deviceModel")}
                    className="h-12"
                  />
                  {errors.deviceModel && (
                    <p className="text-sm text-destructive">
                      {errors.deviceModel.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ✅ STEP 2: Repair & Payment (Simplified) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="repairType">Repair Type *</Label>
                    <Select
                      onValueChange={(value) => setValue("repairType", value)}
                      defaultValue={watchedValues.repairType}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select repair type" />
                      </SelectTrigger>
                      <SelectContent>
                        {repairTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === "others" ? "Others" : t(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {watchedValues.repairType === "others" && (
                      <Input
                        className="mt-2 h-12"
                        placeholder="Enter custom repair type"
                        value={watchedValues.customRepairType || ""}
                        onChange={e => setValue("customRepairType", e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repairCost">Repair Cost *</Label>
                    <Input
                      id="repairCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("repairCost", { valueAsNumber: true })}
                      className="h-12"
                    />
                    {errors.repairCost && (
                      <p className="text-sm text-destructive">
                        {errors.repairCost.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Payment Method *</Label>
                  <RadioGroup
                    onValueChange={(value) => setValue("paymentMethod", value as any)}
                    defaultValue={watchedValues.paymentMethod}
                    className="grid grid-cols-2 gap-4"
                  >
                    {["cash", "upi", "card", "bank-transfer"].map((method) => (
                      <div
                        key={method}
                        className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent"
                      >
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method} className="cursor-pointer capitalize">
                          {method.replace("-", " ")}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amountGiven">Amount Given *</Label>
                    <Input
                      id="amountGiven"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("amountGiven", { valueAsNumber: true })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Change Returned</Label>
                    <div className="h-12 flex items-center px-3 border rounded-lg bg-muted">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-semibold">
                        ₹{changeReturned.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ STEP 3: Costs & Summary (GREATLY SIMPLIFIED) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* ✅ SIMPLE COST BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="partsCost">Parts Cost</Label>
                    <Input
                      id="partsCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={watchedValues.partsCost || ""}
                      onChange={e => setValue("partsCost", parseFloat(e.target.value) || 0)}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">Cost of replacement parts</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={watchedValues.laborCost || ""}
                      onChange={e => setValue("laborCost", parseFloat(e.target.value) || 0)}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">Internal service charges</p>
                  </div>
                </div>

                {/* ✅ PROFIT PREVIEW - SIMPLIFIED */}
                <Card className="bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-green-700 dark:text-green-300">Estimated Profit</Label>
                        <p className="text-xs text-muted-foreground">
                          Customer Payment - Parts - Labor = Profit
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{estimatedProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ✅ SIMPLIFIED ADDITIONAL OPTIONS */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="freeGlass">Free Glass Installation</Label>
                    <p className="text-sm text-muted-foreground">
                      Complimentary screen protector
                    </p>
                  </div>
                  <Switch
                    id="freeGlass"
                    checked={watchedValues.freeGlass}
                    onCheckedChange={(checked) => setValue("freeGlass", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Special Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any special notes about this repair..."
                    {...register("remarks")}
                    rows={3}
                  />
                </div>

                {/* ✅ SUMMARY PREVIEW */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{watchedValues.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Device</p>
                        <p className="font-medium">{watchedValues.deviceModel}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Repair</p>
                        <p className="font-medium">{watchedValues.repairType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-medium">₹{repairCost.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ✅ SIMPLIFIED NAVIGATION */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <div>
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" className="bg-primary">
                Create Transaction
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ✅ EXPORT FOR EASY REPLACEMENT
export default SimplifiedMultiStepTransactionForm;
