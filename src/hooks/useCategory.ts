import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

// --- Types ---

export interface CategorySubject {
  id: string;
  subjectId: string;
  questionsPerTest: number;
  displayOrder: number;
  subject: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string; // Changed to string (not optional) based on component usage
  imageUrl: string | null;
  categorySubjects: CategorySubject[];
  testsCount: number;
  isActive: boolean;
  displayOrder: number;
  _count: {
    tests: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface SubjectAssignment {
  subjectId: string;
  questionsPerTest: number;
  displayOrder: number;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  isActive?: string;
  search?: string;
}

// --- Queries ---

export const useCategories = (filters?: CategoryFilters) => {
  return useQuery({
    queryKey: ["categories", filters],
    queryFn: async () => {
      const { data } = await api.get("/categories", {
        params: filters,
      });
      return data;
    },
  });
};

export const useSubjects = (p0: { limit: number; }) => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await api.get("/subjects"); // Assuming endpoint is /subjects
      return data;
    },
  });
};

export const useCategoryById = (id?: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// --- Mutations ---

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post("/categories/create", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: payload,
    }: {
      id: string;
      data: FormData;
    }) => {
      const { data } = await api.put(`/categories/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update category");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/categories/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    },
  });
};

export const useAssignSubjectsToCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      subjects,
    }: {
      categoryId: string;
      subjects: SubjectAssignment[]; // Updated type to match component
    }) => {
      const { data } = await api.put(
        `/categories/${categoryId}/assign-subjects`,
        { subjects },
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Subjects assigned to category successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to assign subjects");
    },
  });
};
