import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Toggle } from "@/components/common/Toggle";
import { Badge } from "@/components/common/Badge";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  FileQuestion,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTests,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  Test,
  useTestRankings,
} from "@/hooks/useTest";
import { useCategories } from "@/hooks/useCategory";
import { useSubjects } from "@/hooks/useSubject";

export const Tests = () => {
  // ✅ Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    durationMinutes: 60,
    totalQuestions: 100,
    positiveMarks: 1,
    negativeMarks: 0.25,
    isPaid: true,
    testNumber: 1,
    isActive: true,
  });

  // ✅ Pass page and limit to useTests
  const {
    data: testsData,
    isLoading: isTestsLoading,
    isError: isTestsError,
  } = useTests({
    page,
    limit,
    categoryId: selectedCategory || undefined,
  });

  const { data: categoriesData, isError: isCategoriesError } = useCategories();
  const { data: subjectsData } = useSubjects({ limit: 10000 });

  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();
  const deleteMutation = useDeleteTest();

  const {
    data: rankings,
    isLoading: isRankLoading,
    isError: isRankError,
  } = useTestRankings(selectedTestId || undefined);

  const tests = (testsData?.data?.tests as Test[]) || [];
  const categories = categoriesData?.data?.categories || [];

  // ✅ Pagination from API response
  const pagination = testsData?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // ✅ Only filter by type on frontend (category is filtered server-side)
  const filteredTests = tests.filter((test) => {
    const testType = test.isPaid ? "Paid" : "Free";
    if (selectedType && testType !== selectedType) return false;
    return true;
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const getCategoryName = (id: string) =>
    categories?.find((c: any) => c.id === id)?.name || "Unknown";

  const getSelectedCategory = () =>
    categories?.find((cat: any) => cat.id === formData.categoryId);

  const calculateTotalQuestions = () => {
    const selectedCat = getSelectedCategory();
    if (!selectedCat?.categorySubjects) return 0;
    return selectedCat.categorySubjects.reduce(
      (sum: number, item: any) => sum + (item.questionsPerTest ?? 0),
      0,
    );
  };

  const parseErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    if (typeof error === "string") return error;
    return "An unexpected error occurred. Please try again.";
  };

  const formatErrorForDisplay = (
    errorMsg: string,
  ): { title: string; details: string[] } => {
    if (errorMsg.includes("Insufficient unused questions")) {
      const lines = errorMsg.split("\n").filter((line) => line.trim());
      const title = "Insufficient Questions Available";
      const details = lines
        .filter((line) => line.includes("Need") || line.includes("Please"))
        .map((line) => line.trim());
      return { title, details };
    }
    if (errorMsg.includes("already exists")) {
      return { title: "Duplicate Test Number", details: [errorMsg] };
    }
    if (errorMsg.includes("required")) {
      return { title: "Missing Required Fields", details: [errorMsg] };
    }
    return { title: "Error Creating Test", details: [errorMsg] };
  };

  const handleOpenModal = (test?: Test) => {
    setErrorMessage("");
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        categoryId: test.categoryId,
        description: test.description || "",
        durationMinutes: test.durationMinutes || test.duration || 60,
        totalQuestions: test.totalQuestions || 100,
        positiveMarks: test.positiveMarks || 1,
        negativeMarks: test.negativeMarks || 0.25,
        isPaid: test.isPaid,
        testNumber: test.testNumber,
        isActive: test.isActive,
      });
    } else {
      setEditingTest(null);
      setFormData({
        name: "",
        categoryId: "",
        description: "",
        durationMinutes: 60,
        totalQuestions: 100,
        positiveMarks: 1,
        negativeMarks: 0.25,
        isPaid: true,
        testNumber: pagination.total + 1,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCategoryChange = (categoryId: string) => {
    setErrorMessage("");
    const selectedCat = categories?.find((cat: any) => cat.id === categoryId);
    if (selectedCat?.categorySubjects) {
      const total = selectedCat.categorySubjects.reduce(
        (sum: number, item: any) => sum + (item.questionsPerTest ?? 0),
        0,
      );
      setFormData((prev) => ({ ...prev, categoryId, totalQuestions: total }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim() || !formData.categoryId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.negativeMarks > formData.positiveMarks) {
      toast.error("Negative marks cannot be greater than positive marks");
      return;
    }

    try {
      if (editingTest) {
        await updateMutation.mutateAsync({
          id: editingTest.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      const errorMsg = parseErrorMessage(error);
      setErrorMessage(errorMsg);
      const { title } = formatErrorForDisplay(errorMsg);
      toast.error(title);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This will also delete all attempts and related data.",
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { isActive: !currentStatus },
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const columns = [
    {
      key: "testNumber",
      label: "#",
      render: (item: Test) => (
        <span className="text-muted-foreground">#{item.testNumber}</span>
      ),
    },
    { key: "name", label: "Test Name", sortable: true },
    {
      key: "categoryId",
      label: "Category",
      render: (item: Test) => getCategoryName(item.categoryId),
    },
    {
      key: "duration",
      label: "Duration",
      render: (item: Test) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {item.durationMinutes || item.duration} min
        </div>
      ),
    },
    {
      key: "totalQuestions",
      label: "Questions",
      render: (item: Test) => (
        <div className="flex items-center gap-1">
          <FileQuestion className="w-4 h-4 text-muted-foreground" />
          {item.totalQuestions}
        </div>
      ),
    },
    {
      key: "marking",
      label: "Marking",
      render: (item: Test) => (
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-muted-foreground" />+
          {item.positiveMarks}, -{item.negativeMarks}
        </div>
      ),
    },
    {
      key: "isPaid",
      label: "Type",
      render: (item: Test) => (
        <Badge variant={item.isPaid ? "default" : "info"}>
          {item.isPaid ? "Paid" : "Free"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: Test) => (
        <Toggle
          checked={item.isActive}
          onChange={() => handleToggleActive(item.id, item.isActive)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Test) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTestId(item.id);
              setIsRankingModalOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="View Rankings"
          >
            <Award className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => handleOpenModal(item)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Edit test"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
            title="Delete test"
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
    <DashboardLayout title="Tests Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {isCategoriesError ? (
              <div className="text-sm text-destructive">
                Unable to load categories
              </div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1); // ✅ Reset page on filter change
                }}
                className="input-field w-48"
              >
                <option value="">All Categories</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1); // ✅ Reset page on filter change
              }}
              className="input-field w-32"
            >
              <option value="">All Types</option>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
              disabled={isCategoriesError}
            >
              <Plus className="w-4 h-4" />
              Create New Test
            </button>
          </div>
        </div>

        {isTestsLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isTestsError ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Unable to load tests
              </h3>
              <p className="text-muted-foreground">
                There was a problem loading the tests. Please try again.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-outline"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          // ✅ Pagination now working
          <DataTable
            columns={columns}
            data={filteredTests}
            searchable={false}
            emptyMessage="No tests found"
            pagination={pagination}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setErrorMessage("");
        }}
        title={editingTest ? "Edit Test" : "Create New Test"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive mb-2">
                    {formatErrorForDisplay(errorMessage).title}
                  </h4>
                  {formatErrorForDisplay(errorMessage).details.map(
                    (detail, idx) => (
                      <p key={idx} className="text-sm text-destructive/90">
                        {detail}
                      </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Test Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="Enter test name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="input-field"
              disabled={isSubmitting}
            >
              <option value="">Select Category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {formData.categoryId && getSelectedCategory()?.categorySubjects && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">
                Question Distribution for {getCategoryName(formData.categoryId)}
              </h4>
              {getSelectedCategory()?.categorySubjects?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item?.subject?.name}
                  </span>
                  <span className="font-medium">
                    {item?.questionsPerTest} questions
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-medium">Total Questions:</span>
                <span className="font-semibold text-primary">
                  {calculateTotalQuestions()} questions
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-[80px] resize-none"
              placeholder="Enter test description"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: parseInt(e.target.value) || 0,
                  })
                }
                className="input-field"
                min={1}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Questions
              </label>
              <input
                type="number"
                value={formData.totalQuestions}
                className="input-field"
                min={1}
                disabled={isSubmitting}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Positive Marks
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.positiveMarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    positiveMarks:
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                  })
                }
                className="input-field"
                min={0}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Negative Marks
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.negativeMarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    negativeMarks:
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                  })
                }
                className={`input-field ${
                  formData.negativeMarks > formData.positiveMarks
                    ? "border-destructive focus:ring-destructive"
                    : ""
                }`}
                min={0}
                max={formData.positiveMarks}
                disabled={isSubmitting}
              />
              {formData.negativeMarks > formData.positiveMarks && (
                <p className="text-xs text-destructive mt-1">
                  Cannot be greater than positive marks
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Test Number
            </label>
            <input
              type="number"
              value={formData.testNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  testNumber: parseInt(e.target.value) || 1,
                })
              }
              className="input-field"
              min={1}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div>
                <label className="text-sm font-medium">Test Type</label>
                <p className="text-xs text-muted-foreground">
                  {formData.isPaid
                    ? "Paid - requires subscription"
                    : "Free - available to all"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${!formData.isPaid ? "text-success" : "text-muted-foreground"}`}
                >
                  Free
                </span>
                <Toggle
                  checked={formData.isPaid}
                  onChange={(checked) =>
                    setFormData({ ...formData, isPaid: checked })
                  }
                />
                <span
                  className={`text-xs font-medium ${formData.isPaid ? "text-primary" : "text-muted-foreground"}`}
                >
                  Paid
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <label className="text-sm font-medium">Active Status</label>
              <Toggle
                checked={formData.isActive}
                onChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setErrorMessage("");
              }}
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
              {editingTest ? "Update" : "Create"} Test
            </button>
          </div>
        </form>
      </Modal>

      {/* Rankings Modal */}
      <Modal
        isOpen={isRankingModalOpen}
        onClose={() => {
          setIsRankingModalOpen(false);
          setSelectedTestId(null);
        }}
        title="Test Rankings"
        size="lg"
      >
        {isRankLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : isRankError ? (
          <div className="text-center text-destructive p-6">
            Failed to load rankings
          </div>
        ) : rankings ? (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <h4 className="font-semibold">Top Rankers</h4>
                <span className="text-sm text-muted-foreground">
                  Total Participants: {rankings.totalParticipants}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {rankings.topRankers?.length ? (
                  rankings.topRankers.map((user: any) => (
                    <div
                      key={user.rank}
                      className="flex justify-between items-center border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-primary w-8">
                          #{user.rank}
                        </div>
                        <div>
                          <div className="font-medium">{user.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {user.totalMarks} marks
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    No ranking data available
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            No ranking data found
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Tests;
