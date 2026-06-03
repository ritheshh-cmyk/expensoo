import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate } from "react-router-dom";

export default function SalesTransaction() {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Form handles backend save + success screen internally.
    // User will click "Go to Transactions" explicitly.
    navigate("/transactions");
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          New Sale
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Record a new sales transaction with profit tracking
        </p>
      </div>

      <MultiStepTransactionForm
        mode="sales"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
