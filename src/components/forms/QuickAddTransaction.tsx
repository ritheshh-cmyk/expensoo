import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  DollarSign,
  Receipt,
  Car,
  Coffee,
  Wifi,
  ShoppingCart,
  Fuel,
  Home,
  Briefcase,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const expenseCategories = [
  { value: "office", label: "Office Supplies", icon: Briefcase },
  { value: "travel", label: "Travel", icon: Car },
  { value: "food", label: "Food & Dining", icon: Coffee },
  { value: "utilities", label: "Utilities", icon: Wifi },
  { value: "equipment", label: "Equipment", icon: ShoppingCart },
  { value: "fuel", label: "Fuel", icon: Fuel },
  { value: "rent", label: "Rent", icon: Home },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const incomeCategories = [
  { value: "sales", label: "Sales Revenue", icon: DollarSign },
  { value: "service", label: "Service Income", icon: Receipt },
  { value: "repair", label: "Repair Services", icon: Briefcase },
  { value: "other", label: "Other Income", icon: MoreHorizontal },
];

interface QuickAddTransactionProps {
  onSubmit?: (transaction: any) => void;
  trigger?: React.ReactNode;
}

export function QuickAddTransaction({
  onSubmit,
  trigger,
}: QuickAddTransactionProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense",
    description: "",
    amount: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newTransaction = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(),
    };

    onSubmit?.(newTransaction);
    setFormData({
      type: "expense",
      description: "",
      amount: "",
      category: "",
    });
    setIsLoading(false);
    setOpen(false);
  };

  const quickPresets = [
    {
      type: "expense",
      description: "Office Supplies",
      amount: "50",
      category: "office",
    },
    { type: "expense", description: "Fuel", amount: "80", category: "fuel" },
    { type: "expense", description: "Coffee", amount: "15", category: "food" },
    {
      type: "income",
      description: "Customer Payment",
      amount: "500",
      category: "sales",
    },
    {
      type: "income",
      description: "Repair Service",
      amount: "200",
      category: "repair",
    },
  ];

  const applyPreset = (preset: any) => {
    setFormData(preset);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="shadow-soft">
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense transaction quickly
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "text-xs h-auto py-2 px-3 touch-none",
                    preset.type === "income"
                      ? "border-success/50 text-success"
                      : "border-destructive/50 text-destructive",
                  )}
                >
                  {preset.description} ${preset.amount}
                </Button>
              ))}
            </div>
          </div>

          <Tabs
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value, category: "" })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="expense"
                className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                Expense
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="data-[state=active]:bg-success data-[state=active]:text-success-foreground"
              >
                Income
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="quick-description">Description *</Label>
                <Input
                  id="quick-description"
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="quick-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-10 h-12 text-base"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: e.target.value,
                        })
                      }
                      required
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === "expense"
                        ? expenseCategories
                        : incomeCategories
                      ).map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Preview */}
              {formData.description && formData.amount && formData.category && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          formData.type === "income"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {formData.type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formData.description}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-bold",
                        formData.type === "income"
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      {formData.type === "income" ? "+" : "-"}$
                      {parseFloat(formData.amount || "0").toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Tabs>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
