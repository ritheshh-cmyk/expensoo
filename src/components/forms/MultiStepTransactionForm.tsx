import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { PaymentStatusChecker } from "@/components/PaymentStatusChecker";

import {
  User,
  Smartphone,
  Wrench,
  Package,
  Plus,
  Trash2,
  Calculator,
  Store,
  ShoppingCart,
  MessageSquare,
  CheckCircle,
  Loader2,
  Building2,
  FileText,
  Receipt,
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

  // Sales-specific fields
  itemName: z.string().optional(),
  ourCost: z.number().min(0, "Our cost must be 0 or greater").optional(),
  soldPrice: z.number().min(0, "Sold price must be 0 or greater").optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

interface Part {
  name: string;
  cost: number;
  quantity: number;
  supplier?: string; // Enhanced with supplier tracking
  isCustom?: boolean;
}

interface MultiStepTransactionFormProps {
  onSubmit: (data: Record<string, unknown> | null) => void;
  onCancel?: () => void;
  initialData?: any;
  /** When "sales" the form shows Sales Details in Step 2 instead of Repair Info */
  mode?: "repair" | "sales";
}

const DRAFT_KEY = "txn_form_draft";

export function MultiStepTransactionForm({ onSubmit, onCancel, initialData, mode = "repair" }: MultiStepTransactionFormProps) {
  const isSales = mode === "sales";
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [salesProfit, setSalesProfit] = useState(0);
  const [parts, setParts] = useState<Part[]>(() => {
    if (initialData?.partsCost && Array.isArray(initialData.partsCost)) {
      return initialData.partsCost.map((p: any) => ({
        name: p.item || p.name || "",
        cost: Number(p.cost) || 0,
        quantity: Number(p.quantity) || 1,
        supplier: p.supplier || ""
      }));
    }
    return [];
  });
  const [requiresParts, setRequiresParts] = useState(() => {
    return initialData?.requiresParts || (initialData?.partsCost && initialData.partsCost.length > 0) || false;
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [transactionCreated, setTransactionCreated] = useState<string | null>(null);
  const [createdTransactionData, setCreatedTransactionData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { t } = useLanguage();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData ? {
      customerName: initialData.customerName || initialData.customer || "",
      phoneNumber: initialData.phoneNumber || initialData.phone || initialData.mobileNumber || "",
      deviceModel: initialData.deviceModel || initialData.device || "",
      repairType: initialData.repairType || initialData.repair || "screen-replacement",
      repairCost: Number(initialData.repairCost) || Number(initialData.amount) || 0,
      amountGiven: Number(initialData.amountGiven) || Number(initialData.amount_given) || 0,
      paymentMethod: initialData.paymentMethod || "cash",
      requiresParts: initialData.requiresParts || (initialData.partsCost && initialData.partsCost.length > 0) || false,
      freeGlass: initialData.freeGlass || initialData.freeGlassInstallation || false,
      priority: initialData.priority || "medium",
      remarks: initialData.remarks || "",
      estimatedCompletion: initialData.estimatedCompletion || "",
    } : {
      repairCost: 0,
      amountGiven: 0,
      paymentMethod: "cash",
      requiresParts: false,
      freeGlass: false,
      externalPurchase: false,
      priority: "medium",
      ourCost: 0,
      soldPrice: 0,
    },
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;
  const paymentMethod = watch("paymentMethod");
  const repairCost = watch("repairCost");
  const watchedValues = watch();
  // Sales: watch cost fields for live profit calculation
  const watchedOurCost = watch("ourCost" as any) as number | undefined;
  const watchedSoldPrice = watch("soldPrice" as any) as number | undefined;



  useEffect(() => {
    if (paymentMethod && paymentMethod !== "cash") {
      setValue("amountGiven", Number(repairCost) || 0, { shouldValidate: true });
    }
  }, [paymentMethod, repairCost, setValue]);

  // Sales mode: recalculate profit whenever ourCost or soldPrice changes
  useEffect(() => {
    if (isSales) {
      const cost = Number(watchedOurCost) || 0;
      const price = Number(watchedSoldPrice) || 0;
      const profit = price - cost;
      setSalesProfit(profit);
      // Keep repairCost in sync with soldPrice for backend compatibility
      setValue("repairCost", price, { shouldValidate: false });
    }
  }, [isSales, watchedOurCost, watchedSoldPrice, setValue]);

  // ── Draft persistence ───────────────────────────────────────────────────────
  // Check on mount whether a previous draft exists
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        // Only flag as draft if there's meaningful data (name or device filled)
        if (saved?.formValues?.customerName || saved?.formValues?.deviceModel) {
          setHasDraft(true);
        }
      } catch { /* corrupt draft — ignore */ }
    }
  }, []);

  // Auto-save every time any form field or step changes
  useEffect(() => {
    if (!hasDraft && !watchedValues.customerName && !watchedValues.deviceModel) return;
    const draft = {
      formValues: watchedValues,
      currentStep,
      parts,
      requiresParts,
      selectedSupplier,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [watchedValues, currentStep, parts, requiresParts, selectedSupplier]);

  const resumeDraft = () => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved?.formValues) {
        // Restore every field
        Object.entries(saved.formValues).forEach(([key, val]) => {
          setValue(key as any, val as any);
        });
      }
      if (typeof saved.currentStep === "number") setCurrentStep(saved.currentStep);
      if (Array.isArray(saved.parts)) setParts(saved.parts);
      if (typeof saved.requiresParts === "boolean") setRequiresParts(saved.requiresParts);
      if (saved.selectedSupplier) setSelectedSupplier(saved.selectedSupplier);
    } catch { /* ignore corrupt draft */ }
    setHasDraft(false); // banner dismissed — now in "live" save mode
  };

  const discardDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.getSuppliers();
      if (response.success && Array.isArray(response.data)) {
        setSuppliers(response.data);
      }
    } catch {
      // Supplier load failed — user can still continue without pre-filling
    }
  };

  const steps = [
    {
      title: t("customer-details"),
      icon: User,
      description: isSales ? "Customer and contact details" : "Customer information and contact details",
    },
    {
      title: isSales ? "Sales Details" : t("repair-details"),
      icon: isSales ? ShoppingCart : Wrench,
      description: isSales ? "Item, cost and sale price" : "Repair type, cost and payment information",
    },
    {
      title: t("parts-suppliers"),
      icon: Package,
      description: isSales ? "Parts and sourcing information" : "Parts required and supplier selection",
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
        if (isSales) {
          // For sales mode validate item fields; repairType is auto-set
          // soldPrice is stored in repairCost; ourCost as internalCost
          fieldsToValidate = ["paymentMethod", "amountGiven"];
        } else {
          fieldsToValidate = [
            "repairType",
            "repairCost",
            "paymentMethod",
            "amountGiven",
          ];
        }
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
    setIsSubmitting(true);
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
        } catch {
          // Supplier creation failed — transaction will still proceed
        }
      }

      const getLocalTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let computedStatus = "Completed";
      if (data.estimatedCompletion) {
        const todayStr = getLocalTodayString();
        if (data.estimatedCompletion > todayStr) {
          computedStatus = "Pending";
        }
      }

      // Always send all required fields for backend validation
      const validationData = {
        ...data,
        customerName: String(data.customerName || "").trim(),
        mobileNumber: String(data.phoneNumber || "").replace(/\D/g, ""),
        deviceModel: isSales
          ? String((data as any).itemName || data.deviceModel || "").trim()
          : String(data.deviceModel || "").trim(),
        repairType: isSales
          ? "sale"
          : String(data.repairType === "others" ? data.customRepairType : data.repairType),
        paymentMethod: String(data.paymentMethod || "cash"),
        repairCost: isSales ? Number((data as any).soldPrice) || 0 : Number(data.repairCost) || 0,
        internalCost: isSales ? Number((data as any).ourCost) || 0 : undefined,
        profit: isSales ? salesProfit : undefined,
        actualCost: isSales ? Number((data as any).ourCost) || 0 : undefined,
        amountGiven: Number(data.amountGiven) || 0,
        changeReturned: Math.max(0, (Number(data.amountGiven) || 0) - (isSales ? Number((data as any).soldPrice) || 0 : Number(data.repairCost) || 0)),
        status: computedStatus,
        remarks: data.remarks || "",
        freeGlassInstallation: data.freeGlass || false,
        partsCost: parts.length > 0 ? parts.map(part => ({
          supplier: part.supplier || "",
          cost: part.cost,
          quantity: part.quantity,
          item: part.name
        })) : []
      };


      // Submit transaction
      let response;
      if (initialData) {
        const txnId = initialData.id || initialData._id;
        response = await apiClient.updateTransaction(txnId, validationData);
      } else {
        response = await apiClient.createTransaction(validationData);
      }

      if (response.success) {
        if (initialData) {
          toast({
            title: "Success!",
            description: "Transaction updated successfully.",
          });
          if (onSubmit) {
            onSubmit(validationData);
          }
          return;
        }

        const createdId = response.transaction?.id || response.data?.transaction?.id || `TXN${Date.now()}`;
        setTransactionCreated(createdId);
        setCreatedTransactionData(response.transaction ?? response.data?.transaction ?? response.data);

        // Update supplier expenditures if parts were purchased
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.supplier) {
              try {
                await apiClient.request(`/api/expenditures`, {
                  method: 'POST',
                  body: JSON.stringify({
                    description: `Parts for ${data.customerName} - ${part.name}`,
                    amount: part.cost * part.quantity,
                    category: "Supplies",
                    paymentMethod: data.paymentMethod || "cash",
                    recipient: part.supplier
                  })
                });
              } catch {
                // Expenditure update failed — non-fatal, transaction is already saved
              }
            }
          }
        }

        toast({
          title: "Success!",
          description: "Transaction created successfully with all supplier information.",
        });
      } else {
        throw new Error(response.error || (initialData ? "Failed to update transaction" : "Failed to create transaction"));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction. Please try again.';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check all fields and try again.",
      variant: "destructive",
    });
  };



  const handleDone = () => {
    if (typeof onSubmit === 'function') {
      onSubmit(createdTransactionData);
    }
    // Wipe draft and reset
    sessionStorage.removeItem(DRAFT_KEY);
  };

  const handleReset = () => {
    form.reset({
      repairCost: 0,
      amountGiven: 0,
      paymentMethod: 'cash',
      requiresParts: false,
      freeGlass: false,
      externalPurchase: false,
      priority: 'medium',
      ourCost: 0,
      soldPrice: 0,
    });
    setParts([]);
    setSelectedSupplier('');
    setCurrentStep(1);
    setTransactionCreated(null);
    setCreatedTransactionData(null);
    setSalesProfit(0);
    sessionStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Draft resume banner ─────────────────────────────────────────── */}
      {hasDraft && !transactionCreated && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-brand-orange-light">
            <span className="text-base">&#9888;&#65039;</span>
            <span>You have an unsaved draft from your last visit. Want to continue where you left off?</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={resumeDraft}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-brand-orange hover:bg-brand-orange-light text-black transition-colors"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 text-foreground transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {transactionCreated ? (
        <div className="space-y-6 animate-fade-in" id="transaction-success-container">
          <Card className="border border-brand-green/30 bg-card/60 backdrop-blur-md overflow-hidden shadow-2xl relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-green to-emerald-400" />
            
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-16 h-16 bg-brand-green/20 border border-brand-green/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-brand-green animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Transaction Created Successfully
              </CardTitle>
              <CardDescription className="text-muted-foreground max-w-md mx-auto">
                Transaction has been securely persisted. Real-time updates have been broadcasted to all active dashboards.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-4 bg-background/50 rounded-xl p-5 border border-border/80">
                  <h3 className="text-sm font-semibold text-brand-orange-light tracking-wide uppercase flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer &amp; Device Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded text-xs">{transactionCreated}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-semibold text-foreground">{watchedValues.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{watchedValues.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Device Model:</span>
                      <span className="font-semibold text-brand-orange-light">{watchedValues.deviceModel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-background/50 rounded-xl p-5 border border-border/80">
                  <h3 className="text-sm font-semibold text-brand-orange-light tracking-wide uppercase flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Billing &amp; Payment Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Repair Type:</span>
                      <span className="font-medium text-foreground">{watchedValues.repairType === "others" ? watchedValues.customRepairType || "Custom" : watchedValues.repairType}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-bold text-lg text-emerald-400">₹{(watchedValues.repairCost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="font-medium text-white bg-muted/60 px-2 py-0.5 rounded capitalize text-xs">{watchedValues.paymentMethod}</span>
                    </div>
                    {watchedValues.paymentMethod === "cash" && (watchedValues.amountGiven || 0) > (watchedValues.repairCost || 0) && (
                      <div className="flex justify-between items-center py-1 text-green-400">
                        <span>Change Returned:</span>
                        <span className="font-bold">₹{Math.max(0, (watchedValues.amountGiven || 0) - (watchedValues.repairCost || 0)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="p-5 border border-border rounded-xl bg-background/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                      <FileText className="h-4 w-4 text-brand-orange" />
                      Generate Bill
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Create an invoice for this transaction. WhatsApp sharing is available from the Bills page.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      navigate('/bills', { 
                        state: { 
                          prefill: {
                            customerName: watchedValues.customerName,
                            phoneNumber: watchedValues.phoneNumber,
                            repairCost: watchedValues.repairCost,
                            repairType: watchedValues.repairType,
                            customRepairType: watchedValues.customRepairType
                          } 
                        } 
                      });
                    }}
                    className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange-light text-black font-semibold flex items-center justify-center gap-2 shadow-lg px-5"
                  >
                    <Receipt className="h-4 w-4" />
                    Generate Bill
                  </Button>
                </div>

                {watchedValues.paymentMethod !== "cash" && (
                  <div className="p-5 border border-border rounded-xl bg-background/30 space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Store className="h-4 w-4 text-brand-orange" />
                      Payment Status Verification
                    </h4>
                    <PaymentStatusChecker
                      transactionId={transactionCreated}
                      expectedAmount={watchedValues.repairCost || 0}
                      paymentMethod={watchedValues.paymentMethod}
                      customerName={watchedValues.customerName}
                      onPaymentConfirmed={(result) => {
                        toast({
                          title: "Payment Confirmed!",
                          description: `Payment of ₹${result.amount.toLocaleString()} verified successfully.`,
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full sm:w-auto min-w-[150px] bg-background hover:bg-muted/50 border border-border text-foreground py-5"
                >
                  Create Another
                </Button>
                <Button
                  type="button"
                  id="go-to-transactions-btn"
                  onClick={handleDone}
                  className="w-full sm:w-auto min-w-[200px] bg-brand-orange hover:bg-brand-orange-light text-black font-bold py-5 shadow-lg shadow-brand-orange/10"
                >
                  Go to Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Enhanced Progress Steps */}
          <div className="mb-8">
            <div className="sm:hidden mb-4 text-center font-medium text-brand-orange-light">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </div>
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
                      "flex items-center space-x-2 sm:px-4 sm:py-2 p-2 rounded-lg transition-all",
                      isActive && "bg-brand-orange text-black shadow-md shadow-brand-orange/20",
                      isCompleted && "bg-brand-orange/20 text-brand-orange-light border border-brand-orange/30",
                      !isActive && !isCompleted && "bg-background text-muted-foreground border border-border"
                    )}
                  >
                    <StepIcon className="w-5 h-5" />
                    <div className="hidden sm:block">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs opacity-80">{step.description}</div>
                    </div>
                    {isCompleted && <div className="w-2 h-2 bg-brand-orange-light rounded-full hidden sm:block" />}
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted/50 rounded-full h-2">
              <div 
                className="bg-brand-orange h-2 rounded-full transition-all duration-300 shadow-sm shadow-brand-orange/50"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="space-y-6">
            {/* Step 1: Customer Details */}
            {currentStep === 1 && (
              <Card className="border border-border bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <User className="w-5 h-5 text-brand-orange" />
                    Customer Information
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter customer details and device information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-medium text-muted-foreground mb-1.5">Customer Name *</Label>
                      <Input
                        id="customerName"
                        {...register("customerName")}
                        placeholder="Enter customer name"
                        className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                      />
                      {errors.customerName && (
                        <p className="text-red-400 text-sm">{errors.customerName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-muted-foreground mb-1.5">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        {...register("phoneNumber")}
                        placeholder="Enter phone number"
                        className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-400 text-sm">{errors.phoneNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deviceModel" className="text-sm font-medium text-muted-foreground mb-1.5">Device Model *</Label>
                    <Input
                      id="deviceModel"
                      {...register("deviceModel")}
                      placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
                      className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                    />
                    {errors.deviceModel && (
                      <p className="text-red-400 text-sm">{errors.deviceModel.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Repair OR Sales Details */}
            {currentStep === 2 && (
              <Card className="border border-border bg-card overflow-visible">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    {isSales
                      ? <ShoppingCart className="w-5 h-5 text-brand-orange" />
                      : <Wrench className="w-5 h-5 text-brand-orange" />
                    }
                    {isSales ? "Sales Details" : "Repair Information"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isSales
                      ? "Enter item details and pricing to auto-calculate profit"
                      : "Specify repair type, cost and payment details"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                  {/* ── SALES MODE FIELDS ── */}
                  {isSales ? (
                    <>
                      {/* Item Name */}
                      <div className="space-y-2">
                        <Label htmlFor="itemName" className="text-sm font-medium text-muted-foreground mb-1.5">Item Name *</Label>
                        <Input
                          id="itemName"
                          {...register("itemName" as any)}
                          placeholder="e.g., iPhone 15 Pro Max 256GB, Samsung S24 Ultra"
                          className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                        />
                      </div>

                      {/* Our Cost + Sold Price + Profit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ourCost" className="text-sm font-medium text-muted-foreground mb-1.5">Our Cost (₹) *</Label>
                          <Input
                            id="ourCost"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            {...register("ourCost" as any, { valueAsNumber: true })}
                            placeholder="0"
                            className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                          />
                          <p className="text-xs text-muted-foreground">Your purchase / internal cost</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="soldPrice" className="text-sm font-medium text-muted-foreground mb-1.5">Sold Price / Customer Cost (₹) *</Label>
                          <Input
                            id="soldPrice"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            {...register("soldPrice" as any, { valueAsNumber: true })}
                            placeholder="0"
                            className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                          />
                          <p className="text-xs text-muted-foreground">Price charged to customer</p>
                        </div>
                      </div>

                      {/* Live Profit Display */}
                      <div className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg border",
                        salesProfit >= 0
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-red-500/30 bg-red-500/10"
                      )}>
                        <div className="flex items-center gap-2">
                          <Calculator className={cn("w-4 h-4", salesProfit >= 0 ? "text-emerald-400" : "text-red-400")} />
                          <span className="text-sm font-medium text-foreground">Profit (auto-calculated)</span>
                        </div>
                        <div className={cn(
                          "text-lg font-bold",
                          salesProfit >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {salesProfit >= 0 ? "+" : ""}₹{salesProfit.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground -mt-3">Profit = Sold Price − Our Cost · Updates in real time</p>
                    </>
                  ) : (
                    /* ── REPAIR MODE FIELDS (original, untouched) ── */
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="repairType" className="text-sm font-medium text-muted-foreground mb-1.5">Repair Type *</Label>
                          <Select onValueChange={(value) => setValue("repairType", value)}>
                            <SelectTrigger className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
                              <SelectValue placeholder="Select repair type" />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="z-[9999] bg-popover border border-border shadow-xl">
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
                            <p className="text-red-400 text-sm">{errors.repairType.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="repairCost" className="text-sm font-medium text-muted-foreground mb-1.5">Repair Cost (₹) *</Label>
                          <Input
                            id="repairCost"
                            type="number"
                            inputMode="decimal"
                            {...register("repairCost", { valueAsNumber: true })}
                            placeholder="0"
                            className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                          />
                          {errors.repairCost && (
                            <p className="text-red-400 text-sm">{errors.repairCost.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Custom repair type input — shown only when 'Others' is selected */}
                      {watchedValues.repairType === "others" && (
                        <div className="space-y-2">
                          <Label htmlFor="customRepairType" className="text-sm font-medium text-muted-foreground mb-1.5">Specify Repair Type *</Label>
                          <Input
                            id="customRepairType"
                            {...register("customRepairType")}
                            placeholder="e.g., Motherboard repair, Mic replacement, Face ID fix..."
                            className="bg-background border border-primary text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange"
                            autoFocus
                          />
                          {errors.customRepairType && (
                            <p className="text-red-400 text-sm">{errors.customRepairType.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            This will appear as the repair type in reports and receipts.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod" className="text-sm font-medium text-muted-foreground mb-1.5">Payment Method *</Label>
                      <Select onValueChange={(value) => setValue("paymentMethod", value as any)}>
                        <SelectTrigger className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="z-[9999] bg-popover border border-border shadow-xl">
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && (
                        <p className="text-red-400 text-sm">{errors.paymentMethod.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amountGiven" className="text-sm font-medium text-muted-foreground mb-1.5">
                        {watchedValues.paymentMethod === "cash" ? "Amount Given (₹) *" : "Amount Sent (₹) *"}
                      </Label>
                      <Input
                        id="amountGiven"
                        type="number"
                        inputMode="decimal"
                        {...register("amountGiven", { valueAsNumber: true })}
                        placeholder="0"
                        className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                      />
                      {errors.amountGiven && (
                        <p className="text-red-400 text-sm">{errors.amountGiven.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Enhanced Parts and Supplier Selection */}
            {currentStep === 3 && (
              <Card className="border border-border bg-card overflow-visible">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Package className="w-5 h-5 text-brand-orange" />
                    <Store className="w-5 h-5 text-brand-orange" />
                    Parts &amp; Supplier Selection
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
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
                      <Label htmlFor="externalPurchase" className="flex items-center gap-2 text-foreground">
                        <ShoppingCart className="w-4 h-4" />
                        External Purchase (parts bought from supplier)
                      </Label>
                    </div>

                    {watch("externalPurchase") && (
                      <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                        <div className="space-y-2">
                          <Label htmlFor="supplier" className="text-sm font-medium text-muted-foreground mb-1.5">Select Supplier</Label>
                          <Select 
                            onValueChange={(value) => {
                              setSelectedSupplier(value);
                              setValue("supplier", value);
                            }}
                          >
                            <SelectTrigger className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
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

                        {/* After selecting supplier, prompt what parts are needed */}
                        {watch("supplier") && watch("supplier") !== "Other" && (
                          <div className="space-y-2 border-t border-border pt-3">
                            <Label className="text-sm font-medium text-foreground">
                              What type of parts are you getting from this supplier?
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                "Screen / Display",
                                "Battery",
                                "Charging Port",
                                "Speaker / Mic",
                                "Camera Module",
                                "Back Cover / Glass",
                                "Motherboard Parts",
                                "Other Parts",
                              ].map((partType) => (
                                <label
                                  key={partType}
                                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border border-border bg-background hover:bg-muted/50 text-foreground transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={parts.some(p => p.name === partType || (partType === 'Other Parts' && p.isCustom))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (!requiresParts) {
                                          setRequiresParts(true);
                                          setValue("requiresParts", true);
                                        }
                                        if (partType === "Other Parts") {
                                          setParts(prev => [...prev, { name: "Custom Part", cost: 0, quantity: 1, supplier: selectedSupplier, isCustom: true }]);
                                        } else {
                                          setParts(prev => [...prev, { name: partType, cost: 0, quantity: 1, supplier: selectedSupplier }]);
                                        }
                                      } else {
                                        if (partType === "Other Parts") {
                                          setParts(prev => prev.filter(p => !p.isCustom));
                                        } else {
                                          setParts(prev => prev.filter(p => p.name !== partType));
                                        }
                                      }
                                    }}
                                  />
                                  {partType}
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selecting a type will pre-fill the parts list below. You can edit the details there.
                            </p>
                          </div>
                        )}

                        {watch("supplier") === "Other" && (
                          <div className="space-y-3 p-3 border border-dashed border-primary rounded-lg bg-primary/10">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-brand-orange" />
                              Add New Supplier
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="newSupplierName" className="text-sm font-medium text-muted-foreground mb-1.5">Supplier Name <span className="text-red-400">*</span></Label>
                              <Input
                                id="newSupplierName"
                                {...register("newSupplierName")}
                                placeholder="e.g. Global Electronics"
                                className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newSupplierPhone" className="text-sm font-medium text-muted-foreground mb-1.5">Phone (optional)</Label>
                              <Input
                                id="newSupplierPhone"
                                {...register("newSupplierPhone" as any)}
                                placeholder="e.g. +91-9876543210"
                                className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                                type="tel"
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full flex items-center gap-2"
                              disabled={!watch("newSupplierName" as any)?.trim()}
                              onClick={async () => {
                                const name = (watch("newSupplierName" as any) as string)?.trim();
                                const phone = (watch("newSupplierPhone" as any) as string)?.trim() || "";
                                if (!name) return;
                                try {
                                  const res = await apiClient.createSupplier({ name, contact_number: phone });
                                  if (res.success) {
                                    const newSup = res.data?.supplier ?? res.data ?? { id: name, name, contact_number: phone };
                                    setSuppliers(prev => [...prev, newSup]);
                                    setSelectedSupplier(newSup.id || name);
                                    setValue("supplier", newSup.id || name);
                                    toast({ title: "Supplier added", description: `${name} added and selected.` });
                                  } else {
                                    toast({ title: "Error", description: res.error || "Could not add supplier.", variant: "destructive" });
                                  }
                                } catch (e: any) {
                                  toast({ title: "Error", description: e.message || "Network error.", variant: "destructive" });
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Save &amp; Select Supplier
                            </Button>
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
                        <h4 className="font-medium text-foreground">Parts List</h4>
                        
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-3 mb-1">
                          <div className="col-span-4">Part Name</div>
                          <div className="col-span-2">Cost (₹)</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-3">Supplier</div>
                          <div className="col-span-1">Action</div>
                        </div>

                        {parts.map((part, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-lg bg-background">
                            <div className="col-span-4">
                              <Input
                                placeholder="Part name"
                                value={part.name}
                                onChange={(e) => updatePart(index, "name", e.target.value)}
                                className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="Cost"
                                value={part.cost}
                                onChange={(e) => updatePart(index, "cost", Number(e.target.value))}
                                className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={part.quantity}
                                onChange={(e) => updatePart(index, "quantity", Number(e.target.value))}
                                className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                              />
                            </div>
                            <div className="col-span-3">
                              <Select 
                                value={part.supplier} 
                                onValueChange={(value) => updatePart(index, "supplier", value)}
                              >
                                <SelectTrigger className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
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
                          <div className="text-lg font-semibold text-foreground">
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
              <Card className="border border-border bg-card overflow-visible">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Smartphone className="w-5 h-5 text-brand-orange" />
                    Additional Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Final information and special requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground mb-1.5">Priority Level</Label>
                      <Select onValueChange={(value) => setValue("priority", value as any)}>
                        <SelectTrigger className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50">
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
                      <Label htmlFor="estimatedCompletion" className="text-sm font-medium text-muted-foreground mb-1.5">Estimated Completion</Label>
                      <Input
                        id="estimatedCompletion"
                        type="date"
                        {...register("estimatedCompletion")}
                        className="bg-background border border-border text-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="freeGlass"
                        {...register("freeGlass")}
                      />
                      <Label htmlFor="freeGlass" className="text-foreground">Free tempered glass installation</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="text-sm font-medium text-muted-foreground mb-1.5">Remarks / Special Instructions</Label>
                    <Textarea
                      id="remarks"
                      {...register("remarks")}
                      placeholder="Any additional notes or special instructions..."
                      className="bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-brand-orange/50 focus:border-brand-orange/50 min-h-[100px]"
                    />
                  </div>

                  {/* Transaction Summary */}
                  <div className="border border-border rounded-lg p-4 bg-background mt-6">
                    <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-brand-orange" />
                      Transaction Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-medium text-foreground">{watchedValues.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{watchedValues.phoneNumber}</span>
                      </div>
                      {isSales ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Item:</span>
                            <span className="font-medium text-foreground">{(watchedValues as any).itemName || watchedValues.deviceModel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Our Cost:</span>
                            <span className="font-medium text-foreground">₹{((watchedValues as any).ourCost || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sold Price:</span>
                            <span className="font-semibold text-brand-orange-light">₹{((watchedValues as any).soldPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-2 mt-2">
                            <span className="font-semibold text-foreground">Profit:</span>
                            <span className={cn("font-bold text-lg", salesProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {salesProfit >= 0 ? "+" : ""}₹{salesProfit.toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Device:</span>
                            <span className="font-medium text-foreground">{watchedValues.deviceModel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Repair Type:</span>
                            <span className="font-medium text-foreground">{watchedValues.repairType === "others" ? watchedValues.customRepairType || "Custom" : watchedValues.repairType}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-2 mt-2">
                            <span className="font-semibold text-foreground">Total Cost:</span>
                            <span className="font-semibold text-brand-orange-light">₹{(watchedValues.repairCost || 0).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium text-white capitalize">{watchedValues.paymentMethod}</span>
                      </div>
                      {watchedValues.paymentMethod === "cash" && (watchedValues.amountGiven || 0) > (watchedValues.repairCost || 0) && (
                        <div className="flex justify-between text-green-400">
                          <span>Change:</span>
                          <span className="font-medium">₹{Math.max(0, (watchedValues.amountGiven || 0) - (watchedValues.repairCost || 0)).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
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
                disabled={currentStep === 1 || isSubmitting}
                className="min-w-[120px] bg-background hover:bg-muted/50 border border-border text-foreground"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  id="next-btn"
                  key="next-btn"
                  type="button"
                  onClick={nextStep}
                  className="min-w-[120px] bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                >
                  Next
                </Button>
              ) : (
                <Button
                  id="submit-btn"
                  key="submit-btn"
                  type="submit"
                  className="min-w-[120px] bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Creating...
                    </span>
                  ) : "Create Transaction"}
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}