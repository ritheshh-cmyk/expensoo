import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function EditTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        // Only fetch data if user is authenticated and token is available
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

    const websocketUrl = import.meta.env.VITE_PRODUCTION_WEBSOCKET_URL || import.meta.env.VITE_PRODUCTION_BACKEND_URL || "https://expensoo-app-gu3wg.ondigitalocean.app";
    const socket = io(websocketUrl, { transports: ["websocket"] });
    socket.on("transactionUpdated", (updatedTransaction: any) => {
      if (updatedTransaction.id === id) {
        setTransaction(updatedTransaction);
        toast({
          title: "Transaction Updated",
          description: `Transaction ${id} has been updated successfully.`,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!transaction) {
    return <div>Transaction not found.</div>;
  }

  const handleSubmit = (data: any) => {
    console.log("Transaction successfully updated:", data);
    navigate("/transactions");
  };

  const handleCancel = () => {
    navigate("/transactions");
  };

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
        />
      </div>
    </div>
  );
}
