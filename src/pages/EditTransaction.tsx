import { AppLayout } from "@/components/layout/AppLayout";
import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function EditTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data for editing - in real app, fetch by ID
  const initialData = {
    customerName: "John Doe",
    phoneNumber: "+91 98765 43210",
    deviceModel: "iPhone 14 Pro",
    repairType: "screen-replacement",
    repairCost: 12500,
    paymentMethod: "upi" as const,
    amountGiven: 12500,
    requiresParts: true,
    supplier: "TechParts Ltd",
    freeGlass: true,
    remarks: "Customer requested urgent repair",
    status: "in-progress" as const,
  };

  const handleSubmit = (data: any) => {
    console.log("Updated transaction data:", data);
    toast({
      title: "Transaction Updated",
      description: `Transaction ${id} has been updated successfully.`,
    });
    navigate("/transactions");
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Edit Transaction
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Update transaction details for {id}
          </p>
        </div>

        <MultiStepTransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={initialData}
        />
      </div>
    </AppLayout>
  );
}
