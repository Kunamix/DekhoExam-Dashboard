import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/common/Modal";
import { Toggle } from "@/components/common/Toggle";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  AlertCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerStatus,
  Banner,
} from "@/hooks/useBanner";

export const Banners = () => {
  // ─── Data fetching ────────────────────────────────────────────────────────
  const { data: bannersData, isLoading, isError } = useBanners();

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();
  const toggleMutation = useToggleBannerStatus();

  const banners: Banner[] = bannersData?.data?.banners || bannersData?.data || [];

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    redirectUrl: "",
    displayOrder: 1,
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        "Image size must be less than 2MB. Please choose a smaller image.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (editingBanner && editingBanner.imageUrl) setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || "",
        redirectUrl: banner.redirectUrl || "",
        displayOrder: banner.displayOrder ?? 1,
        isActive: banner.isActive,
      });
      setImagePreview(banner.imageUrl || "");
      setImageFile(null);
      setRemoveImage(false);
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        redirectUrl: "",
        displayOrder: banners.length + 1,
        isActive: true,
      });
      setImagePreview("");
      setImageFile(null);
      setRemoveImage(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBanner && !imageFile) {
      toast.error("Banner image is required");
      return;
    }

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      toast.error(
        "Image size must be less than 2MB. Please choose a smaller image.",
      );
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("redirectUrl", formData.redirectUrl);
      submitFormData.append("displayOrder", String(formData.displayOrder));
      submitFormData.append("isActive", String(formData.isActive));

      if (imageFile) {
        submitFormData.append("image", imageFile);
      } else if (removeImage) {
        submitFormData.append("removeImage", "true");
      }

      if (editingBanner) {
        await updateMutation.mutateAsync({
          id: editingBanner.id,
          data: submitFormData,
        });
      } else {
        await createMutation.mutateAsync(submitFormData);
      }
      handleCloseModal();
    } catch (error: unknown) {
      console.error("Banner submission error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save banner. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Manage Banners" breadcrumbs={[{ label: "Banners" }]}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Manage home screen promotional banners
        </p>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Banner
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load banners</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the banners. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-outline"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <>
          {/* Banner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="dashboard-card overflow-hidden hover:shadow-medium transition-shadow group"
              >
                {banner.imageUrl ? (
                  <div className="w-full h-40 overflow-hidden bg-muted">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg truncate">
                      {banner.title || "Untitled Banner"}
                    </h3>
                    <Toggle
                      checked={banner.isActive}
                      onChange={() => handleToggleActive(banner.id)}
                    />
                  </div>

                  {banner.redirectUrl && (
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {banner.redirectUrl}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mb-4">
                    Display order: {banner.displayOrder}
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="flex-1 btn-outline text-sm py-2"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {banners.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No banners found</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first banner
              </p>
              <button onClick={() => handleOpenModal()} className="btn-primary">
                Create First Banner
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Banner Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBanner ? "Edit Banner" : "Add New Banner"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Banner Image {!editingBanner && <span className="text-destructive">*</span>}
            </label>
            {imagePreview && !removeImage ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF (Max: 2MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Image must be less than 2MB in size
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input-field"
              placeholder="Enter banner title (optional)"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Redirect URL
            </label>
            <input
              type="text"
              value={formData.redirectUrl}
              onChange={(e) =>
                setFormData({ ...formData, redirectUrl: e.target.value })
              }
              className="input-field"
              placeholder="Enter redirect URL (optional)"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className="input-field"
              min={0}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Active Status</label>
            <Toggle
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingBanner ? "Update" : "Create"} Banner
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Banners;
