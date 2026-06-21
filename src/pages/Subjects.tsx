import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Toggle } from "@/components/common/Toggle";
import { Badge } from "@/components/common/Badge";
import { Plus, Edit, Trash2, Eye, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateSubject,
} from "@/hooks/useSubject";
import { useCategories } from "@/hooks/useCategory";

interface Subject {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  categories: {
    id: string;
    name: string;
  }[];
  totalQuestions: number;
  totalTopics: number;
  isActive: boolean;
}

export const Subjects = () => {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const {
    data: subjectsData,
    isLoading: isSubjectsLoading,
    isError: isSubjectsError,
  } = useSubjects({
    page,
    limit,
    ...(selectedCategory && { categoryId: selectedCategory }),
  });

  const { data: categoriesData, isError: isCategoriesError } = useCategories({ limit: 10000 });

  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Extract subjects and pagination data from API response
  const subjects = subjectsData?.data?.subjects || [];
  const paginationInfo = subjectsData?.data?.pagination;
  const categories = categoriesData?.data?.categories || [];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        description: subject.description,
        isActive: subject.isActive,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: "",
        description: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleOpenViewModal = (subject: Subject) => {
    setViewingSubject(subject);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingSubject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    try {
      if (editingSubject) {
        await updateMutation.mutateAsync({
          id: editingSubject.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleCloseModal();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { isActive: !currentStatus },
      });
    } catch (error) {
      // Error already handled by hook
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  // Category filter handler
  const handleCategoryFilterChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setPage(1); // Reset to first page when filter changes
  };

  const columns = [
    { key: "name", label: "Subject Name", sortable: true },
    {
      key: "description",
      label: "Description",
      render: (item: Subject) => (
        <span
          className="text-muted-foreground line-clamp-1 max-w-xs"
          title={item.description}
        >
          {item.description || "No description"}
        </span>
      ),
    },
    {
      key: "categoriesUsed",
      label: "Used in Categories",
      sortable: true,
      render: (item: Subject) => (
        <Badge variant="primary">
          {item?.categories?.length || 0} categories
        </Badge>
      ),
    },
    {
      key: "totalTopics",
      label: "Topics",
      sortable: true,
      render: (item: Subject) => (
        <span className="font-medium">{item.totalTopics || 0}</span>
      ),
    },
    {
      key: "totalQuestions",
      label: "Total Questions",
      sortable: true,
      render: (item: Subject) => (
        <span className="font-medium">
          {(item.totalQuestions || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: Subject) => (
        <Toggle
          checked={item.isActive}
          onChange={() => handleToggleActive(item.id, item.isActive)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Subject) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenViewModal(item)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenModal(item)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Manage Subjects"
      breadcrumbs={[{ label: "Subjects" }]}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {isCategoriesError ? (
          <div className="w-full sm:w-64 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Unable to load categories
            </p>
          </div>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="input-field w-full sm:w-64"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Subject
        </button>
      </div>

      {isSubjectsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isSubjectsError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Unable to load subjects
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the subjects. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-outline"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subjects}
          searchPlaceholder="Search subjects..."
          emptyMessage="No subjects found"
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          searchable={false} // Disable search since we'll handle it server-side later
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSubject ? "Edit Subject" : "Add New Subject"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Subject Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="Enter subject name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-[100px] resize-none"
              placeholder="Enter subject description"
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
              {editingSubject ? "Update" : "Create"} Subject
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Subject Details"
        size="lg"
      >
        {viewingSubject && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Subject Name
                </label>
                <p className="text-lg font-semibold mt-1">
                  {viewingSubject.name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-sm mt-1">
                  {viewingSubject.description || "No description available"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Status:
                </label>
                <Badge variant={viewingSubject.isActive ? "success" : "danger"}>
                  {viewingSubject.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {viewingSubject.totalTopics || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Topics
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {viewingSubject.totalQuestions || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Questions
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {viewingSubject.categories?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Categories</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Used in Categories
              </label>
              {viewingSubject.categories &&
              viewingSubject.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {viewingSubject.categories.map((category) => (
                    <Badge key={category.id} variant="primary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not linked to any categories
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleCloseViewModal}
                className="btn-outline px-6"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Subjects;