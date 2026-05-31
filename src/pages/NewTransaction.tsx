import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

export default function NewTransaction() {
  const navigate = useNavigate();

  const handleSubmit = async (createdTransaction: any) => {
    // MultiStepTransactionForm already handled backend save and success toasts.
    // We simply redirect the user back to the main transactions view.
    navigate("/transactions");
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

  return (
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
      />
    </div>
  );
}
