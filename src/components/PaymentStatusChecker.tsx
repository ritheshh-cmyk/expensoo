import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePaymentVerification,
  type PaymentVerificationResponse,
  getPaymentMethodInfo,
} from "@/lib/paymentVerification";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusCheckerProps {
  transactionId: string;
  expectedAmount: number;
  paymentMethod: string;
  customerName: string;
  onPaymentConfirmed?: (result: PaymentVerificationResponse) => void;
}

export function PaymentStatusChecker({
  transactionId,
  expectedAmount,
  paymentMethod,
  customerName,
  onPaymentConfirmed,
}: PaymentStatusCheckerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes
  const { verify, startMonitoring, isVerifying, results, report } =
    usePaymentVerification();
  const { toast } = useToast();

  const methodInfo = getPaymentMethodInfo(paymentMethod);

  useEffect(() => {
    if (isMonitoring && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
        setProgress(((120 - timeRemaining + 1) / 120) * 100);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining <= 0) {
      setIsMonitoring(false);
      toast({
        title: "Payment Verification Timeout",
        description: "Please check payment status manually or try again.",
        variant: "destructive",
      });
    }
  }, [isMonitoring, timeRemaining, toast]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    setProgress(0);
    setTimeRemaining(120);

    const stopMonitoring = startMonitoring(
      transactionId,
      expectedAmount,
      paymentMethod,
      20, // 20 attempts
    );

    // Stop monitoring when dialog closes
    return stopMonitoring;
  };

  const handleManualVerification = async () => {
    try {
      const result = await verify(
        paymentMethod,
        expectedAmount,
        transactionId,
        {
          upiId: "customer@upi",
          cardLast4: "1234",
          accountNumber: "****1234",
        },
      );

      if (result.success) {
        toast({
          title: "Payment Verified!",
          description: `Payment of ₹${result.amount.toLocaleString()} confirmed.`,
        });
        onPaymentConfirmed?.(result);
        setIsOpen(false);
      } else {
        toast({
          title: "Payment Not Found",
          description: result.error || "Payment verification failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "upi":
        return <Smartphone className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "bank_transfer":
      case "bank-transfer":
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const latestResult = results[results.length - 1];
  const hasSuccessfulPayment = results.some((r) => r.success);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={hasSuccessfulPayment}
        >
          <Search className="h-4 w-4" />
          {hasSuccessfulPayment ? "Payment Verified" : "Check Payment"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMethodIcon(paymentMethod)}
            Payment Verification
          </DialogTitle>
          <DialogDescription>
            Verify payment for {customerName} - ₹
            {expectedAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {methodInfo.icon} {methodInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Processing Time: {methodInfo.processingTime}</p>
                <p>Transaction ID: {transactionId}</p>
                <p>Expected Amount: ₹{expectedAmount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Progress */}
          {isMonitoring && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Checking payment status...</span>
                    <span>
                      {Math.floor(timeRemaining / 60)}:
                      {String(timeRemaining % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    We'll automatically check for payment confirmation every few
                    seconds.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verification Results</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {results.slice(-3).map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="text-sm font-medium">
                            {result.success ? "Payment Found" : "Not Found"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          result.success
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800",
                        )}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {report.totalAttempts > 0 && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <p>
                      {report.successfulPayments} of {report.totalAttempts}{" "}
                      attempts successful
                    </p>
                    {report.lastSuccessfulPayment && (
                      <p>
                        Last successful: ₹{report.totalAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleManualVerification}
              disabled={isVerifying || isMonitoring}
              className="flex-1"
            >
              {isVerifying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Check Now
            </Button>

            {!isMonitoring && !hasSuccessfulPayment && (
              <Button
                onClick={handleStartMonitoring}
                variant="outline"
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Auto Monitor
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              💡 <strong>Manual Check:</strong> Instantly verify if payment was
              received
            </p>
            <p>
              🔄 <strong>Auto Monitor:</strong> Continuously check for 2 minutes
            </p>
            {paymentMethod === "cash" && (
              <p>💵 Cash payments are immediately verified</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact version for table rows
export function CompactPaymentChecker({
  transactionId,
  expectedAmount,
  paymentMethod,
  onPaymentConfirmed,
}: Omit<PaymentStatusCheckerProps, "customerName">) {
  const { verify, isVerifying } = usePaymentVerification();
  const { toast } = useToast();

  const handleQuickCheck = async () => {
    try {
      const result = await verify(paymentMethod, expectedAmount, transactionId);

      if (result.success) {
        toast({
          title: "Payment Verified!",
          description: `₹${result.amount.toLocaleString()} confirmed.`,
        });
        onPaymentConfirmed?.(result);
      } else {
        toast({
          title: "Payment Not Found",
          description: "No payment found for this transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify payment.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickCheck}
      disabled={isVerifying}
      className="h-8 w-8 p-0"
    >
      {isVerifying ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Search className="h-4 w-4" />
      )}
    </Button>
  );
}
