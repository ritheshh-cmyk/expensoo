import { AppLayout } from "@/components/layout/AppLayout";
import { SimplifiedMultiStepTransactionForm } from "@/components/forms/SimplifiedMultiStepTransactionForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

export default function NewTransaction() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      // Transform data for backend compatibility
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
        partsCost: data.parts || [],
        freeGlassInstallation: data.freeGlass || false,
        repairServiceType: data.repairServiceType || 'internal',
        internalCost: data.internalCost || 0,
        externalItemCost: data.externalItemCost || 0,
        status: 'Completed'
      };
      
      console.log('🔄 Creating transaction with data:', transformedData);
      const result = await apiClient.createTransaction(transformedData);
      console.log('✅ Transaction created successfully:', result);
      
      // Clear cache to ensure fresh data
      apiClient.clearLocalData();
      
      toast({
        title: "Transaction Created",
        description: `Transaction for ${data.customerName} has been created successfully and synced with backend.`,
      });
      
      // Navigate to transactions page
      navigate("/transactions");
    } catch (error: any) {
      console.error('❌ Transaction creation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            New Transaction
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create a new repair transaction
          </p>
        </div>

        <SimplifiedMultiStepTransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  );
}
