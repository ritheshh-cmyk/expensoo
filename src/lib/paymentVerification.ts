// Payment verification system for real-time payment status checking

export interface PaymentVerificationResponse {
  success: boolean;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: number;
  transactionId: string;
  reference?: string;
  timestamp: string;
  method: string;
  error?: string;
}

export interface UPIPaymentCheck {
  upiId: string;
  amount: number;
  reference: string;
}

export interface CardPaymentCheck {
  cardLast4: string;
  amount: number;
  reference: string;
}

export interface BankTransferCheck {
  accountNumber: string;
  amount: number;
  reference: string;
}

class PaymentVerificationService {
  private static instance: PaymentVerificationService;

  public static getInstance(): PaymentVerificationService {
    if (!PaymentVerificationService.instance) {
      PaymentVerificationService.instance = new PaymentVerificationService();
    }
    return PaymentVerificationService.instance;
  }

  // Simulate UPI payment verification (in production, integrate with payment gateway API)
  public async verifyUPIPayment(
    paymentData: UPIPaymentCheck,
  ): Promise<PaymentVerificationResponse> {
    // Simulate API delay
    await this.delay(2000);

    // Simulate payment verification logic
    const isSuccessful = Math.random() > 0.15; // 85% success rate
    const reference = isSuccessful ? `UPI${Date.now()}` : undefined;

    return {
      success: isSuccessful,
      status: isSuccessful ? "completed" : "failed",
      amount: paymentData.amount,
      transactionId: paymentData.reference,
      reference,
      timestamp: new Date().toISOString(),
      method: "upi",
      error: isSuccessful ? undefined : "Payment not found or failed",
    };
  }

  // Simulate card payment verification
  public async verifyCardPayment(
    paymentData: CardPaymentCheck,
  ): Promise<PaymentVerificationResponse> {
    await this.delay(3000);

    const isSuccessful = Math.random() > 0.1; // 90% success rate
    const reference = isSuccessful ? `CARD${Date.now()}` : undefined;

    return {
      success: isSuccessful,
      status: isSuccessful ? "completed" : "failed",
      amount: paymentData.amount,
      transactionId: paymentData.reference,
      reference,
      timestamp: new Date().toISOString(),
      method: "card",
      error: isSuccessful ? undefined : "Card payment verification failed",
    };
  }

  // Simulate bank transfer verification
  public async verifyBankTransfer(
    paymentData: BankTransferCheck,
  ): Promise<PaymentVerificationResponse> {
    await this.delay(5000); // Bank transfers take longer to verify

    const isSuccessful = Math.random() > 0.05; // 95% success rate
    const reference = isSuccessful ? `BANK${Date.now()}` : undefined;

    return {
      success: isSuccessful,
      status: isSuccessful ? "completed" : "failed",
      amount: paymentData.amount,
      transactionId: paymentData.reference,
      reference,
      timestamp: new Date().toISOString(),
      method: "bank_transfer",
      error: isSuccessful ? undefined : "Bank transfer not found",
    };
  }

  // Cash payment (always successful, just for logging)
  public async verifyCashPayment(
    amount: number,
    reference: string,
  ): Promise<PaymentVerificationResponse> {
    return {
      success: true,
      status: "completed",
      amount,
      transactionId: reference,
      reference: `CASH${Date.now()}`,
      timestamp: new Date().toISOString(),
      method: "cash",
    };
  }

  // Generic payment verification that routes to specific method
  public async verifyPayment(
    method: string,
    amount: number,
    reference: string,
    additionalData?: any,
  ): Promise<PaymentVerificationResponse> {
    try {
      switch (method) {
        case "upi":
          return await this.verifyUPIPayment({
            upiId: additionalData?.upiId || "customer@upi",
            amount,
            reference,
          });

        case "card":
          return await this.verifyCardPayment({
            cardLast4: additionalData?.cardLast4 || "1234",
            amount,
            reference,
          });

        case "bank_transfer":
        case "bank-transfer":
          return await this.verifyBankTransfer({
            accountNumber: additionalData?.accountNumber || "****1234",
            amount,
            reference,
          });

        case "cash":
          return await this.verifyCashPayment(amount, reference);

        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    } catch (error) {
      return {
        success: false,
        status: "failed",
        amount,
        transactionId: reference,
        timestamp: new Date().toISOString(),
        method,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Check multiple payment attempts for a transaction
  public async checkAllPaymentMethods(
    transactionId: string,
    expectedAmount: number,
  ): Promise<PaymentVerificationResponse[]> {
    const methods = ["upi", "card", "bank_transfer"];
    const results: PaymentVerificationResponse[] = [];

    for (const method of methods) {
      try {
        const result = await this.verifyPayment(
          method,
          expectedAmount,
          transactionId,
        );
        results.push(result);

        // If we find a successful payment, break the loop
        if (result.success) {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          status: "failed",
          amount: expectedAmount,
          transactionId,
          timestamp: new Date().toISOString(),
          method,
          error: error instanceof Error ? error.message : "Verification failed",
        });
      }
    }

    return results;
  }

  // Continuous payment monitoring (polls every few seconds)
  public startPaymentMonitoring(
    transactionId: string,
    expectedAmount: number,
    method: string,
    onStatusUpdate: (result: PaymentVerificationResponse) => void,
    maxAttempts: number = 20, // 20 attempts = 2 minutes with 6-second intervals
  ): () => void {
    let attempts = 0;
    let isActive = true;

    const checkPayment = async () => {
      if (!isActive || attempts >= maxAttempts) {
        return;
      }

      attempts++;

      try {
        const result = await this.verifyPayment(
          method,
          expectedAmount,
          transactionId,
        );
        onStatusUpdate(result);

        // Stop monitoring if payment is completed or failed permanently
        if (result.status === "completed" || result.status === "failed") {
          isActive = false;
        }
      } catch (error) {
        onStatusUpdate({
          success: false,
          status: "failed",
          amount: expectedAmount,
          transactionId,
          timestamp: new Date().toISOString(),
          method,
          error: error instanceof Error ? error.message : "Monitoring error",
        });
      }

      // Schedule next check if still active
      if (isActive && attempts < maxAttempts) {
        setTimeout(checkPayment, 6000); // Check every 6 seconds
      }
    };

    // Start first check after 3 seconds
    setTimeout(checkPayment, 3000);

    // Return function to stop monitoring
    return () => {
      isActive = false;
    };
  }

  // Generate payment verification report
  public generatePaymentReport(results: PaymentVerificationResponse[]): {
    totalAttempts: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    successRate: number;
    lastSuccessfulPayment?: PaymentVerificationResponse;
  } {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalAmount = successful.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalAttempts: results.length,
      successfulPayments: successful.length,
      failedPayments: failed.length,
      totalAmount,
      successRate:
        results.length > 0 ? (successful.length / results.length) * 100 : 0,
      lastSuccessfulPayment: successful[successful.length - 1],
    };
  }

  // Get payment method display information
  public getPaymentMethodInfo(method: string): {
    name: string;
    icon: string;
    processingTime: string;
    verificationComplexity: string;
  } {
    switch (method) {
      case "upi":
        return {
          name: "UPI",
          icon: "📱",
          processingTime: "Instant - 2 minutes",
          verificationComplexity: "Medium",
        };
      case "card":
        return {
          name: "Card Payment",
          icon: "💳",
          processingTime: "2-5 minutes",
          verificationComplexity: "High",
        };
      case "bank_transfer":
      case "bank-transfer":
        return {
          name: "Bank Transfer",
          icon: "🏦",
          processingTime: "5-30 minutes",
          verificationComplexity: "High",
        };
      case "cash":
        return {
          name: "Cash",
          icon: "💵",
          processingTime: "Instant",
          verificationComplexity: "None",
        };
      default:
        return {
          name: method,
          icon: "💰",
          processingTime: "Unknown",
          verificationComplexity: "Unknown",
        };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
const paymentVerificationService = PaymentVerificationService.getInstance();

// Public API functions
export function verifyPayment(
  method: string,
  amount: number,
  reference: string,
  additionalData?: any,
): Promise<PaymentVerificationResponse> {
  return paymentVerificationService.verifyPayment(
    method,
    amount,
    reference,
    additionalData,
  );
}

export function startPaymentMonitoring(
  transactionId: string,
  expectedAmount: number,
  method: string,
  onStatusUpdate: (result: PaymentVerificationResponse) => void,
  maxAttempts?: number,
): () => void {
  return paymentVerificationService.startPaymentMonitoring(
    transactionId,
    expectedAmount,
    method,
    onStatusUpdate,
    maxAttempts,
  );
}

export function checkAllPaymentMethods(
  transactionId: string,
  expectedAmount: number,
): Promise<PaymentVerificationResponse[]> {
  return paymentVerificationService.checkAllPaymentMethods(
    transactionId,
    expectedAmount,
  );
}

export function generatePaymentReport(results: PaymentVerificationResponse[]) {
  return paymentVerificationService.generatePaymentReport(results);
}

export function getPaymentMethodInfo(method: string) {
  return paymentVerificationService.getPaymentMethodInfo(method);
}

// React hook for payment verification
export function usePaymentVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    PaymentVerificationResponse[]
  >([]);

  const verify = async (
    method: string,
    amount: number,
    reference: string,
    additionalData?: any,
  ) => {
    setIsVerifying(true);
    try {
      const result = await verifyPayment(
        method,
        amount,
        reference,
        additionalData,
      );
      setVerificationResults((prev) => [...prev, result]);
      return result;
    } finally {
      setIsVerifying(false);
    }
  };

  const startMonitoring = (
    transactionId: string,
    expectedAmount: number,
    method: string,
    maxAttempts?: number,
  ) => {
    return startPaymentMonitoring(
      transactionId,
      expectedAmount,
      method,
      (result) => {
        setVerificationResults((prev) => [...prev, result]);
      },
      maxAttempts,
    );
  };

  const clearResults = () => {
    setVerificationResults([]);
  };

  return {
    verify,
    startMonitoring,
    clearResults,
    isVerifying,
    results: verificationResults,
    report: generatePaymentReport(verificationResults),
  };
}

export default paymentVerificationService;
