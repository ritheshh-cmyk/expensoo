import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

export default function NewTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') === 'sale' ? 'sales' : 'repair';

  const handleSubmit = async (createdTransaction: any) => {
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
          Create a new repair or sales transaction
        </p>
      </div>

      <MultiStepTransactionForm
        initialCategory={typeParam}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
