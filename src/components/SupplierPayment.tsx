
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
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

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
          description: paymentData.description || `Payment to ${supplierName}`,
          payment_date: paymentData.paymentDate,
          status: 'completed'
        })
      });

      if (response.success) {
        toast({
          title: "Payment Recorded",
          description: `Payment of ₹${paymentData.amount} has been recorded for ${supplierName}.`,
        });
        
        setIsOpen(false);
        setPaymentData({
          amount: '',
          paymentMethod: 'cash',
          description: '',
          paymentDate: new Date().toISOString().split('T')[0],
        });
        
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Payment to {supplierName}
          </DialogTitle>
          <DialogDescription>
            Record a payment made to this supplier to update their balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Balance Display */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ₹{currentBalance.toLocaleString()}
                </span>
                <Badge variant={currentBalance > 0 ? "destructive" : "secondary"}>
                  {currentBalance > 0 ? "Outstanding" : "Settled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  className="text-right font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this payment..."
                value={paymentData.description}
                onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          {/* Payment Summary */}
          {paymentData.amount && parseFloat(paymentData.amount) > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Payment Summary
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      After this payment of ₹{parseFloat(paymentData.amount).toLocaleString()}, 
                      the remaining balance will be ₹{Math.max(0, currentBalance - parseFloat(paymentData.amount)).toLocaleString()}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading || !paymentData.amount || parseFloat(paymentData.amount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
