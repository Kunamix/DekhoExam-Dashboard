import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

/* ----------------------------------
 Types
---------------------------------- */

export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  gateway?: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED" | "COMPLETED";
  createdAt: string;
  date: string;
  userName?: string;
  phone?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  gateway?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  currentMonthRevenue: number;
  revenueChange?: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions?: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

/* ----------------------------------
 Queries
---------------------------------- */

// Get all payments (admin)
export const usePayments = (filters?: PaymentFilters) => {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      const { data } = await api.get("/payments", {
        params: filters,
      });
      return data;
    },
  });
};

// Get payment by ID
export const usePaymentById = (id?: string) => {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      const { data } = await api.get(`/payments/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Payment statistics
export const usePaymentStats = () => {
  return useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data } = await api.get("/payments/stats");
      return data;
    },
  });
};

/* ----------------------------------
 Mutations
---------------------------------- */

// Export payments (CSV)
export const useExportPayments = () => {
  return useMutation({
    mutationFn: async (filters?: PaymentFilters) => {
      const { data } = await api.get("/payments/export", {
        params: filters,
        responseType: "blob",
      });
      return data;
    },
    onSuccess: (response) => {
      const blob = new Blob([blobData], {
        type: "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Payments exported successfully");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to export payments");
    },
  });
};

// Refund payment
export const useRefundPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post(`/payments/${paymentId}/refund`);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment refunded successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Refund failed");
    },
  });
};
