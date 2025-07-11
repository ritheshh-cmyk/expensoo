import { useState } from "react";
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
import {
  User,
  Smartphone,
  Wrench,
  Package,
  Plus,
  Trash2,
  Calculator,
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
  amountGiven: z.number().min(0, "Amount must be positive"),

  // Step 3: Parts & Supplier (optional)
  requiresParts: z.boolean().default(false),
  supplier: z.string().optional(),
  parts: z
    .array(
      z.object({
        name: z.string(),
        cost: z.number(),
        quantity: z.number(),
      }),
    )
    .default([]),
  repairSource: z.string().optional(),
  partsRemarks: z.string().optional(),
  internalRepairCost: z.number().optional(),
  internalRepairRemarks: z.string().optional(),

  // Step 4: Additional Details
  freeGlass: z.boolean().default(false),
  remarks: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  newSupplierName: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

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

const deviceModels = [
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro",
  "iPhone 14",
  "iPhone 13",
  "Samsung Galaxy S24",
  "Samsung Galaxy S23",
  "Samsung Galaxy A54",
  "Google Pixel 8",
  "OnePlus 12",
  "Xiaomi 14",
  "Other",
];

const suppliers = [
  "Patel Electronics",
  "Mahalaxmi Components",
  "Rathod Mobile Parts",
  "Sri Ramdev Suppliers",
  "Hub Technologies",
  "Other",
];

interface MultiStepTransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  initialData?: Partial<TransactionFormData>;
}

export function MultiStepTransactionForm({
  onSubmit,
  onCancel,
  initialData,
}: MultiStepTransactionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [parts, setParts] = useState<
    Array<{ name: string; cost: number; quantity: number }>
  >([]);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      requiresParts: false,
      freeGlass: false,
      status: "pending",
      customRepairType: "",
      repairSource: "parts",
      partsRemarks: "",
      internalRepairCost: undefined,
      internalRepairRemarks: "",
      ...initialData,
    },
  });

  const watchedValues = watch();
  const requiresParts = watch("requiresParts");
  const repairCost = watch("repairCost") || 0;
  const amountGiven = watch("amountGiven") || 0;
  const changeReturned = Math.max(0, amountGiven - repairCost);

  const steps = [
    {
      title: t("customer-details"),
      icon: User,
      description: "Enter customer and device information",
    },
    {
      title: t("repair-info"),
      icon: Wrench,
      description: "Repair details and payment information",
    },
    {
      title: t("parts-supplier"),
      icon: Package,
      description: "Parts required and supplier details",
    },
    {
      title: t("additional-details"),
      icon: Smartphone,
      description: "Final details and status",
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
        // No required fields in step 3
        break;
      case 4:
        // All remaining fields
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
    const newPart = { name: "", cost: 0, quantity: 1 };
    setParts([...parts, newPart]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: string | number) => {
    const updatedParts = parts.map((part, i) => {
      if (i === index) {
        return { ...part, [field]: value };
      }
      return part;
    });
    setParts(updatedParts);
    setValue("parts", updatedParts);
  };

  const onFormSubmit = (data: TransactionFormData) => {
    const finalData = {
      ...data,
      parts: requiresParts ? parts : [],
    };
    onSubmit(finalData);
    toast({
      title: "Transaction Created",
      description: "New repair transaction has been added successfully.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
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
                    isActive && "step-active border-primary",
                    isCompleted && "step-completed border-success",
                    !isActive && !isCompleted && "step-inactive border-muted",
                  )}
                >
                  {isCompleted ? (
                    <span className="text-success-foreground">✓</span>
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-16 mx-2 transition-colors",
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
            {/* Step 1: Customer Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">{t("customer-name")} *</Label>
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
                    <Label htmlFor="phoneNumber">{t("phone-number")} *</Label>
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
                  <Label htmlFor="deviceModel">{t("device-model")} *</Label>
                  <Input
                    id="deviceModel"
                    type="text"
                    placeholder="Enter device model (e.g. iPhone 15 Pro, Samsung Galaxy S24)"
                    {...register("deviceModel", {
                      setValueAs: (value: string) => {
                        // Normalize device model input - remove extra spaces, fix common typos
                        return value
                          .trim()
                          .replace(/\s+/g, " ")
                          .replace(/iphone/i, "iPhone")
                          .replace(/samsung/i, "Samsung")
                          .replace(/galaxy/i, "Galaxy")
                          .replace(/plus/i, "Plus")
                          .replace(/pro/i, "Pro")
                          .replace(/max/i, "Max")
                          .replace(/mini/i, "Mini");
                      },
                    })}
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

            {/* Step 2: Repair Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="repairType">{t("repair-type")} *</Label>
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
                    {errors.repairType && (
                      <p className="text-sm text-destructive">
                        {errors.repairType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repairCost">{t("repair-cost")} *</Label>
                    <Input
                      id="repairCost"
                      type="text"
                      inputMode="decimal"
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

                <div className="space-y-2">
                  <Label>{t("payment-method")} *</Label>
                  <RadioGroup
                    onValueChange={(value) => setValue("paymentMethod", value as any)}
                    defaultValue={watchedValues.paymentMethod}
                    className="grid grid-cols-2 gap-4 w-full"
                  >
                    {["cash", "upi"].map((method) => (
                      <div
                        key={method}
                        className="flex items-center space-x-2 p-4 border rounded-lg bg-accent/30 w-full justify-center"
                      >
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method} className="flex-1 cursor-pointer text-lg">
                          {t(method)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.paymentMethod && (
                    <p className="text-sm text-destructive">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amountGiven">{t("amount-given")} *</Label>
                    <Input
                      id="amountGiven"
                      type="text"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      {...register("amountGiven", { valueAsNumber: true })}
                      className="h-12"
                    />
                    {errors.amountGiven && (
                      <p className="text-sm text-destructive">
                        {errors.amountGiven.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("change-returned")}</Label>
                    <div className="h-12 flex items-center px-3 border rounded-lg bg-muted">
                      <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-semibold">
                        ₹{changeReturned.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Parts & Supplier */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <RadioGroup
                    onValueChange={value => setValue("repairSource", value)}
                    defaultValue={watchedValues.repairSource || "parts"}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parts" id="parts" />
                      <Label htmlFor="parts">Requires Parts Purchase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="internal" id="internal" />
                      <Label htmlFor="internal">Internal Repair</Label>
                  </div>
                  </RadioGroup>
                </div>

                {/* If parts purchase */}
                {watchedValues.repairSource !== "internal" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Select
                        onValueChange={(value) => setValue("supplier", value)}
                        defaultValue={watchedValues.supplier}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {watchedValues.supplier === "Other" && (
                        <Input
                          placeholder="Enter new supplier name"
                          value={watchedValues.newSupplierName || ""}
                          onChange={e => setValue("newSupplierName", e.target.value)}
                          className="h-10 mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Parts List</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPart}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Part
                        </Button>
                      </div>

                      {parts.map((part, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <Label>Part Name</Label>
                              <Input
                                placeholder="Screen Assembly"
                                value={part.name}
                                onChange={(e) =>
                                  updatePart(index, "name", e.target.value)
                                }
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={part.quantity}
                                onChange={(e) =>
                                  updatePart(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label>Cost</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={part.cost}
                                  onChange={(e) =>
                                    updatePart(
                                      index,
                                      "cost",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="h-10"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removePart(index)}
                                className="h-10 w-10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* If internal repair */}
                {watchedValues.repairSource === "internal" && (
                  <>
                    <div className="space-y-2">
                      <Label>Internal Repair Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={watchedValues.internalRepairCost || ""}
                        onChange={e => setValue("internalRepairCost", parseFloat(e.target.value) || 0)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Textarea
                        placeholder="Any notes about the internal repair..."
                        value={watchedValues.internalRepairRemarks || ""}
                        onChange={e => setValue("internalRepairRemarks", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="freeGlass">Free Glass Installation</Label>
                    <p className="text-sm text-muted-foreground">
                      Complimentary screen protector installation
                    </p>
                  </div>
                  <Switch
                    id="freeGlass"
                    checked={watchedValues.freeGlass}
                    onCheckedChange={(checked) =>
                      setValue("freeGlass", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value) => setValue("status", value as any)}
                    defaultValue={watchedValues.status}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="in-progress">
                        {t("in-progress")}
                      </SelectItem>
                      <SelectItem value="completed">
                        {t("completed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Special Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any special notes about this repair..."
                    {...register("remarks")}
                    rows={4}
                  />
                </div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Transaction Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">
                          {watchedValues.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Device</p>
                        <p className="font-medium">
                          {watchedValues.deviceModel}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Repair</p>
                        <p className="font-medium">
                          {t(watchedValues.repairType || "")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-medium">₹{repairCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <p className="font-medium">
                          {t(watchedValues.paymentMethod || "")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Change</p>
                        <p className="font-medium">
                          ₹{changeReturned.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                {t("back")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
          </div>

          <div>
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                {t("next")}
              </Button>
            ) : (
              <Button type="submit">{t("finish")}</Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}