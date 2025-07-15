import { AppLayout } from "@/components/layout/AppLayout";
import { MultiStepTransactionForm } from "@/components/forms/MultiStepTransactionForm";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { useEffect, useState } from "react";
import { Transaction } from "@/types/transaction";
import { Socket } from "socket.io-client";

export default function EditTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/transactions/${id}`);
        setTransaction(response.data);
      } catch (err) {
        setError("Failed to fetch transaction.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();

    const socket = new Socket("http://localhost:3000"); // Assuming socket.io server is running on port 3000
    socket.on("transactionUpdated", (updatedTransaction: Transaction) => {
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
          initialData={transaction}
        />
      </div>
    </AppLayout>
  );
}
