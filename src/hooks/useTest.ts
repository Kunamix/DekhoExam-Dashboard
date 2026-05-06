import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { mobileApi } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

/* ----------------------------------
 Types
---------------------------------- */

export interface Test {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  subjectId?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  positiveMarks?: number;
  negativeMarks?: number;
  isPaid: boolean;
  isActive: boolean;
  testNumber: number;
  type?: "Free" | "Paid";
  duration?: number;
}

export interface TestFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  isPaid?: boolean;
  search?: string;
  categoryId?: string;
  subjectId?: string;
}

/* ----------------------------------
 Queries
---------------------------------- */

export const useTests = (filters?: TestFilters) => {
  return useQuery({
    queryKey: ["tests", filters],
    queryFn: async () => {
      const { data } = await api.get("/tests", {
        params: {
          ...filters,
          isActive:
            filters?.isActive !== undefined
              ? String(filters.isActive)
              : undefined,
          isPaid:
            filters?.isPaid !== undefined ? String(filters.isPaid) : undefined,
        },
      });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data } = await api.get("/subjects");
      return data;
    },
  });
};

export const useTestById = (id?: string) => {
  return useQuery({
    queryKey: ["test", id],
    queryFn: async () => {
      const { data } = await api.get(`/tests/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

/* ----------------------------------
 Mutations
---------------------------------- */

export const useCreateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Test>) => {
      const { data } = await api.post("/tests", payload);
      return data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      return response;
    },
    onError: (error: AxiosError<{ message: string }>) => {
      throw error;
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: payload,
    }: {
      id: string;
      data: Partial<Test>;
    }) => {
      const { data } = await api.put(`/tests/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Test updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update test");
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/tests/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      toast.success("Test deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["test", id] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to delete test");
    },
  });
};

export const useToggleTestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/tests/${id}/toggle-status`);
      return data;
    },
    onSuccess: () => {
      toast.success("Test status updated");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || "Failed to update test status",
      );
    },
  });
};

export const useRecentTests = () => {
  return useQuery({
    queryKey: ["dashboard", "recent-tests"],
    queryFn: async () => {
      const { data } = await mobileApi.get("/dashboard/recent-tests");
      return data;
    },
    retry: false,
  });
};

export const useTestRankings = (testId?: string) => {
  return useQuery({
    queryKey: ["dashboard", "test-rankings", testId],
    queryFn: async () => {
      const res = await mobileApi.get(`/profile/tests/${testId}/rankings`);
      return res.data?.data;
    },
    enabled: !!testId,
    retry: false,
  });
};

export const useGlobalRankings = () => {
  return useQuery({
    queryKey: ["dashboard", "global-rankings"],
    queryFn: async () => {
      const { data } = await mobileApi.get("/profile/api/rankings/global");
      return data;
    },
    retry: false,
  });
};
