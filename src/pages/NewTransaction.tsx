import { AppLayout } from "@/components/layout/AppLayout";
import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

export default function NewTransaction() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await apiClient.createTransaction(data);
    toast({
      title: "Transaction Created",
        description: `Transaction for ${data.customerName} has been created successfully and synced with backend.`,
    });
    navigate("/transactions");
    } catch (error: any) {
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

        <MultiStepTransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  );
}
