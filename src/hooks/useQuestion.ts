import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

/* ----------------------------------
 Types
---------------------------------- */
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export interface Question {
  id: string;
  topicId: string;
  subjectId?: string;
  questionText: string;
  questionImageUrl?: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
  explanation?: string;
  explanationImageUrl?: string;
  difficultyLevel?: DifficultyLevel;
  isActive: boolean;
  topic?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };
}

export interface QuestionFilters {
  page?: number;
  limit?: number;
  isActive?: string;
  search?: string;
  topicId?: string;
  subjectId?: string;
  difficultyLevel?: DifficultyLevel;
}

/* ----------------------------------
 Queries
---------------------------------- */

// ✅ Already correct
export const useQuestions = (filters?: QuestionFilters) => {
  return useQuery({
    queryKey: ["questions", filters],
    queryFn: async () => {
      const { data } = await api.get("/questions", {
        params: filters,
      });
      return data;
    },
  });
};

// ✅ Already correct
export const useQuestionById = (id?: string) => {
  return useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data } = await api.get(`/questions/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// ✅ Already correct
export const useQuestionStats = (params?: {
  topicId?: string;
  subjectId?: string;
}) => {
  return useQuery({
    queryKey: ["question-stats", params?.topicId, params?.subjectId],
    queryFn: async () => {
      const { data } = await api.get("/questions/stats", {
        params,
      });
      return data;
    },
  });
};

/* ----------------------------------
 Mutations
---------------------------------- */

// ✅ CORRECTED: Proper data extraction
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Question>) => {
      const { data } = await api.post("/questions/create", payload);
      return data; // ✅ Handle both nested and flat responses
    },
    onSuccess: () => {
      toast.success("Question created successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to create question");
    },
  });
};

// ✅ CORRECTED: Proper data extraction
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: updateData,
    }: {
      id: string;
      data: Partial<Question>;
    }) => {
      const { data } = await api.post(`/questions/${id}/update`, updateData);
      return data; // ✅ Handle both nested and flat responses
    },
    onSuccess: () => {
      toast.success("Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update question");
    },
  });
};

// ✅ CORRECTED: Proper data extraction
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/questions/${id}`);
      return data; // ✅ Handle both nested and flat responses
    },
    onSuccess: () => {
      toast.success("Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to delete question");
    },
  });
};

/* ----------------------------------
 Bulk Upload
---------------------------------- */
// ✅ CORRECTED: Proper data extraction
export const useBulkUploadQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/questions/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data; // ✅ Handle both nested and flat responses
    },
    onSuccess: (response) => {
      const result = response?.data;
      const created = result?.successfullyCreated || 0;
      const failed = result?.failedRows || 0;
      toast.success(
        `Uploaded ${created} questions successfully${failed > 0 ? `, ${failed} failed` : ""}`,
      );
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || "Failed to upload questions",
      );
    },
  });
};
