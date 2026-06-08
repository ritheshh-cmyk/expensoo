
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText,
  Plus,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import Stepper, { Step } from '@/components/ui/Stepper';

interface SupplierPaymentProps {
  supplierId: string;
  supplierName: string;
  currentBalance?: number;
  onPaymentComplete?: () => void;
}

export function SupplierPayment({
  supplierId,
  supplierName,
  currentBalance = 0,
  onPaymentComplete
}: SupplierPaymentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setActiveStep(1);
      setPaymentData({
        amount: '',
        paymentMethod: 'cash',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid payment amount.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep > activeStep) {
      const isValid = validateStep(activeStep);
      if (!isValid) return;
    }
    setActiveStep(nextStep);
  };

  const handlePayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.request(`/api/suppliers/${supplierId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.paymentMethod,
          description: paymentData.description || `Payment to {supplierName}`,
          payment_date: paymentData.paymentDate,
          status: 'completed'
        })
      });

      if (response.success) {
        toast({
          title: "Payment Recorded",
          description: `Payment of ₹${paymentData.amount} has been recorded for ${supplierName}.`,
        });
        
        handleOpenChange(false);
        onPaymentComplete?.();
      } else {
        throw new Error(response.error || 'Failed to record payment');
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Payment to {supplierName}
          </DialogTitle>
          <DialogDescription>
            Record a payment made to this supplier to update their balance.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Stepper
            activeStep={activeStep}
            onStepChange={handleStepChange}
            onFinalStepCompleted={handlePayment}
            stepCircleContainerClassName="border-0 shadow-none p-0 max-w-full"
            stepContainerClassName="px-0 py-2"
            contentClassName="pt-2"
            footerClassName="px-0 pb-0"
            backButtonText="Back"
            nextButtonText="Continue"
            completeButtonText={loading ? "Recording..." : "Record Payment"}
            backButtonProps={{
              type: "button",
              className: "px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            }}
            nextButtonProps={{
              type: "button",
              disabled: loading || (activeStep === 1 && (!paymentData.amount || parseFloat(paymentData.amount) <= 0)),
              className: "px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[120px]"
            }}
          >
            {/* Step 1: Amount & Method */}
            <Step>
              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Outstanding Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold font-heading">
                        ₹{currentBalance.toLocaleString("en-IN")}
                      </span>
                      <Badge variant={currentBalance > 0 ? "destructive" : "secondary"}>
                        {currentBalance > 0 ? "Outstanding" : "Settled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                      className="text-right font-mono h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={paymentData.paymentMethod}
                      onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 2: Date & Notes */}
            <Step>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes about this payment..."
                    value={paymentData.description}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </Step>

            {/* Step 3: Summary & Review */}
            <Step>
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
                  <h3 className="font-bold text-base mb-1 text-primary">Confirm Payment Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Please review the payment details before submitting to the system.
                  </p>
                </div>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-950 dark:text-blue-100">
                          Transaction Review
                        </p>
                        <div className="mt-2 space-y-1 text-blue-850 dark:text-blue-200">
                          <p>• Amount: <span className="font-semibold text-foreground">₹{parseFloat(paymentData.amount || "0").toLocaleString("en-IN")}</span></p>
                          <p>• Method: <span className="font-semibold capitalize text-foreground">{paymentData.paymentMethod}</span></p>
                          <p>• Date: <span className="font-semibold text-foreground">{paymentData.paymentDate}</span></p>
                          {paymentData.description && <p>• Notes: <span className="font-semibold text-foreground">{paymentData.description}</span></p>}
                        </div>
                        <p className="mt-3 font-medium text-blue-900 dark:text-blue-200 border-t border-blue-200 dark:border-blue-800 pt-2.5">
                          Remaining balance after payment: <span className="font-bold text-foreground">₹{Math.max(0, currentBalance - parseFloat(paymentData.amount || "0")).toLocaleString("en-IN")}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Step>
          </Stepper>
        </div>
      </DialogContent>
    </Dialog>
  );
}
