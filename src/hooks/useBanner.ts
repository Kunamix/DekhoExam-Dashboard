import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

// --- Types ---

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  redirectUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// --- Queries ---

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await api.get("/banners");
      return data;
    },
  });
};

// --- Mutations ---

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post("/banners/create", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Banner created successfully");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to create banner");
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: payload,
    }: {
      id: string;
      data: FormData;
    }) => {
      const { data } = await api.put(`/banners/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Banner updated successfully");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update banner");
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/banners/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Banner deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to delete banner");
    },
  });
};

export const useToggleBannerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/banners/${id}/toggle-status`);
      return data;
    },
    onSuccess: () => {
      toast.success("Banner status updated");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || "Failed to update banner status",
      );
    },
  });
};
