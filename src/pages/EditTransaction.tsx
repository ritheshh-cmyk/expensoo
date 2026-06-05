import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function EditTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await apiClient.getTransactions();
        if (res.success && Array.isArray(res.data)) {
          const found = res.data.find((t: any) => String(t.id) === String(id));
          if (found) {
            setTransaction(found);
          } else {
            setError("Transaction not found.");
          }
        } else {
          setError(res.error || "Failed to fetch transaction.");
        }
      } catch (err) {
        setError("Failed to fetch transaction.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground gap-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading transaction…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <p className="text-destructive font-medium">{error}</p>
        <button
          className="text-sm underline underline-offset-2"
          onClick={() => navigate("/transactions")}
        >
          Back to Transactions
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <p className="font-medium">Transaction not found.</p>
        <button
          className="text-sm underline underline-offset-2"
          onClick={() => navigate("/transactions")}
        >
          Back to Transactions
        </button>
      </div>
    );
  }

  const handleSubmit = (_data: any) => {
    toast({ title: "Updated", description: "Transaction updated successfully." });
    navigate("/transactions");
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

  // Determine initial category from the saved repairType
  const initialCategory: "repair" | "sales" =
    transaction.repairType?.toLowerCase() === "sale" ? "sales" : "repair";

  return (
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
        initialData={transaction}
        initialCategory={initialCategory}
      />
    </div>
  );
}
