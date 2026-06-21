import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/common/Modal";
import { Toggle } from "@/components/common/Toggle";
import { Badge } from "@/components/common/Badge";
import {
  Plus,
  Edit,
  Trash2,
  Crown,
  Sparkles,
  Loader2,
  IndianRupee,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useSubscriptionPlans,
  useSubscriptionStats,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useToggleSubscriptionPlanStatus,
} from "@/hooks/useSubscription";
import { useCategories } from "@/hooks/useCategory";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string | number;
  durationDays: number;
  type: "CATEGORY_SPECIFIC" | "ALL_CATEGORIES";
  categoryId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    userSubscriptions: number;
  };
}

export const Subscriptions = () => {
  const [activeTab, setActiveTab] = useState<
    "CATEGORY_SPECIFIC" | "ALL_CATEGORIES"
  >("CATEGORY_SPECIFIC");
  const [page, setPage] = useState(1);
  const LIMIT = 9;

  const { data: categoriesData, isError: isCategoriesError } = useCategories({ limit: 10000 });

  const { data: statsData, isError: isStatsError } = useSubscriptionStats();

  const {
    data: plansResponse,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = useSubscriptionPlans({
    type: activeTab,
    page,
    limit: LIMIT,
  });

  const plans = (plansResponse?.data?.plans as Plan[]) || [];
  const pagination = plansResponse?.data?.pagination || {
    total: 0,
    totalPages: 1,
  };
  const stats = statsData?.data || {
    plans: { total: 0 },
    subscriptions: { active: 0, expiringSoon: 0 },
    revenue: { total: 0 },
  };
  const categories = categoriesData?.data?.categories || [];

  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();
  const deleteMutation = useDeleteSubscriptionPlan();
  const toggleMutation = useToggleSubscriptionPlanStatus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 499,
    durationDays: 180,
    type: "CATEGORY_SPECIFIC" as "CATEGORY_SPECIFIC" | "ALL_CATEGORIES",
    categoryId: "",
    displayOrder: 0,
    isActive: true,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const formatDuration = (days: number) => {
    if (days >= 365)
      return `${Math.floor(days / 365)} Year${days >= 730 ? "s" : ""}`;
    if (days >= 30)
      return `${Math.floor(days / 30)} Month${days >= 60 ? "s" : ""}`;
    return `${days} Days`;
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        price: Number(plan.price),
        durationDays: plan.durationDays,
        type: plan.type,
        categoryId: plan.categoryId || "",
        displayOrder: plan.displayOrder || 0,
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: 499,
        durationDays: 180,
        type: activeTab,
        categoryId: "",
        displayOrder: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    if (formData.type === "CATEGORY_SPECIFIC" && !formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays),
      type: formData.type,
      categoryId:
        formData.type === "CATEGORY_SPECIFIC" ? formData.categoryId : undefined,
      displayOrder: Number(formData.displayOrder),
      isActive: formData.isActive,
    };

    try {
      if (editingPlan) {
        await updateMutation.mutateAsync({
          id: editingPlan.id,
          payload: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this plan? If it has active subscribers, it will be deactivated instead.",
      )
    ) {
      return;
    }

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

  return (
    <DashboardLayout
      title="Subscription Plans"
      breadcrumbs={[{ label: "Subscriptions" }]}
    >
      {!isStatsError && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Total Plans
            </p>
            <p className="text-3xl font-bold mt-2 text-foreground">
              {stats.plans.total}
            </p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Active Subscribers
            </p>
            <p className="text-3xl font-bold mt-2 text-primary">
              {stats.subscriptions.active}
            </p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Total Revenue
            </p>
            <p className="text-3xl font-bold mt-2 text-success">
              {formatPrice(stats.revenue.total)}
            </p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Expiring (7d)
            </p>
            <p className="text-3xl font-bold mt-2 text-warning">
              {stats.subscriptions.expiringSoon}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex p-1 bg-muted rounded-xl">
          <button
            onClick={() => {
              setActiveTab("CATEGORY_SPECIFIC");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "CATEGORY_SPECIFIC"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Category Plans
          </button>
          <button
            onClick={() => {
              setActiveTab("ALL_CATEGORIES");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "ALL_CATEGORIES"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Access Plans
          </button>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5"
          disabled={isCategoriesError}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {isPlansLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isPlansError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load plans</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the subscription plans. Please try
            again.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: Plan) => (
              <div
                key={plan.id}
                className={`group relative bg-card rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col
                  ${plan.type === "ALL_CATEGORIES" ? "border-primary/40 shadow-primary/5" : "border-border"}
                  ${!plan.isActive ? "opacity-60 grayscale-[0.5]" : ""}
                `}
              >
                {plan.type === "ALL_CATEGORIES" && (
                  <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground p-2 rounded-full shadow-lg z-10">
                    <Crown className="w-5 h-5" />
                  </div>
                )}

                <div className="p-6 pb-4 border-b border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={
                        plan.type === "ALL_CATEGORIES" ? "primary" : "default"
                      }
                    >
                      <span className="rounded-md uppercase text-[10px] tracking-wider font-bold">
                        {plan.type === "ALL_CATEGORIES"
                          ? "All Access"
                          : plan.category?.name}
                      </span>
                    </Badge>
                    <Toggle
                      checked={plan.isActive}
                      onChange={() => handleToggleActive(plan.id)}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-extrabold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      / {formatDuration(plan.durationDays)}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 bg-muted/5">
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap leading-relaxed">
                    {plan.description || "No description provided."}
                  </p>
                </div>

                <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-card rounded-b-2xl">
                  <div className="flex items-center text-xs text-muted-foreground font-medium px-2">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {plan._count?.userSubscriptions || 0} Subscribers
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(plan)}
                      className="p-2 rounded-lg hover:bg-muted text-foreground/80 hover:text-primary transition-colors"
                      title="Edit Plan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Plan"
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

          {!isPlansLoading && plans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No plans found
              </h3>
              <p className="text-muted-foreground max-w-sm mt-1 mb-6">
                Get started by creating your first{" "}
                {activeTab === "CATEGORY_SPECIFIC" ? "category" : "bundle"}{" "}
                subscription plan.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </button>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline text-sm py-2 px-4 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="btn-outline text-sm py-2 px-4 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold mb-1.5">
                Plan Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-field"
                placeholder="e.g. SSC CGL Pro Pack"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="input-field pl-9"
                  min={0}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Duration
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationDays: Number(e.target.value),
                    })
                  }
                  className="input-field"
                  min={1}
                  placeholder="Enter days (e.g. 30, 90, 180, 365)"
                  required
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "7 Days", value: 7 },
                    { label: "1 Month", value: 30 },
                    { label: "3 Months", value: 90 },
                    { label: "6 Months", value: 180 },
                    { label: "1 Year", value: 365 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, durationDays: opt.value })
                      }
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        formData.durationDays === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Configuration</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-card px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="planType"
                    checked={formData.type === "CATEGORY_SPECIFIC"}
                    onChange={() =>
                      setFormData({ ...formData, type: "CATEGORY_SPECIFIC" })
                    }
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">Specific Category</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-card px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="planType"
                    checked={formData.type === "ALL_CATEGORIES"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        type: "ALL_CATEGORIES",
                        categoryId: "",
                      })
                    }
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">All Categories (Bundle)</span>
                </label>
              </div>
            </div>

            {formData.type === "CATEGORY_SPECIFIC" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Select Category
                </label>
                {isCategoriesError ? (
                  <div className="p-3 bg-muted rounded border border-border text-sm text-muted-foreground">
                    Unable to load categories
                  </div>
                ) : (
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="input-field bg-card"
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-[120px] resize-none"
              placeholder="Describe what's included in this plan..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: Number(e.target.value),
                  })
                }
                className="input-field w-32"
                min={0}
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-sm font-medium">Active Status</span>
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-outline rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary rounded-xl flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Subscriptions;