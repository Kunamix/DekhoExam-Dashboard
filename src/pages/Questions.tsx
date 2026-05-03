import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Toggle } from "@/components/common/Toggle";
import { Badge } from "@/components/common/Badge";
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  Loader2,
  Search,
  AlertCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useSubjects } from "@/hooks/useSubject";
import { useTopics } from "@/hooks/useTopic";
import {
  useQuestions,
  useQuestionStats,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useBulkUploadQuestions,
} from "@/hooks/useQuestion";

interface Question {
  id: string;
  topicId: string;
  questionText: string;
  questionImageUrl?: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  explanation: string;
  explanationImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  topic?: {
    subject?: {
      name: string;
    };
    name: string;
  };
}

const csvHeaders = [
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Explanation",
  "Difficulty",
];

const csvSampleData = [
  {
    Question: "What is the capital of India?",
    "Option A": "Mumbai",
    "Option B": "Delhi",
    "Option C": "Chennai",
    "Option D": "Kolkata",
    "Correct Answer": "B",
    Explanation: "Delhi is the capital of India",
    Difficulty: "EASY",
  },
  {
    Question: "What is 2+2?",
    "Option A": "3",
    "Option B": "4",
    "Option C": "5",
    "Option D": "6",
    "Correct Answer": "B",
    Explanation: "Basic arithmetic: 2+2=4",
    Difficulty: "EASY",
  },
];

export const Questions = () => {
  const [limit, setLimit] = useState(10);
  const [bulkSubjectId, setBulkSubjectId] = useState("");
  const [bulkTopicId, setBulkTopicId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showCsvFormat, setShowCsvFormat] = useState(false);

  const { data: subjectsData, isError: isSubjectsError } = useSubjects();

  const { data: topicsData, isError: isTopicsError } =
    useTopics(selectedSubject);

  const { data: statsData, isError: isStatsError } = useQuestionStats();

  const {
    data: questionsResponse,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
  } = useQuestions({
    subjectId: selectedSubject,
    topicId: selectedTopic,
    difficultyLevel: selectedDifficulty as any,
    search: searchQuery,
    page,
    limit,
  });

  const subjects = subjectsData?.data?.subjects || [];
  const topics = topicsData?.data?.topics || [];
  const questionsList = questionsResponse?.data?.questions || [];
  const pagination = questionsResponse?.data?.pagination || {
    total: 0,
    totalPages: 1,
    page: 1,
  };
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
  };

  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();
  const bulkUploadMutation = useBulkUploadQuestions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Image state
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>("");
  const [explanationImageFile, setExplanationImageFile] = useState<File | null>(
    null,
  );
  const [explanationImagePreview, setExplanationImagePreview] =
    useState<string>("");

  const [removeQuestionImage, setRemoveQuestionImage] = useState(false);
  const [removeExplanationImage, setRemoveExplanationImage] = useState(false);

  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    topicId: "",
    questionText: "",
    questionImageUrl: "",
    explanationImageUrl: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctOption: 1,
    explanation: "",
    difficultyLevel: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
    isActive: true,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const getSubjectName = (item: any) => item.topic?.subject?.name || "Unknown";
  const getTopicName = (item: any) => item.topic?.name || "Unknown";

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "explanation",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      if (type === "question" && questionImageInputRef.current) {
        questionImageInputRef.current.value = "";
      } else if (type === "explanation" && explanationImageInputRef.current) {
        explanationImageInputRef.current.value = "";
      }
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 2MB. Please choose a smaller image.");
      if (type === "question" && questionImageInputRef.current) {
        questionImageInputRef.current.value = "";
      } else if (type === "explanation" && explanationImageInputRef.current) {
        explanationImageInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === "question") {
        setQuestionImageFile(file);
        setQuestionImagePreview(preview);
        setRemoveQuestionImage(false);
      } else {
        setExplanationImageFile(file);
        setExplanationImagePreview(preview);
        setRemoveExplanationImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (type: "question" | "explanation") => {
    if (type === "question") {
      setQuestionImageFile(null);
      setQuestionImagePreview("");
      if (editingQuestion && formData.questionImageUrl) {
        setRemoveQuestionImage(true);
      }
      setFormData({ ...formData, questionImageUrl: "" });
      if (questionImageInputRef.current) {
        questionImageInputRef.current.value = "";
      }
    } else {
      setExplanationImageFile(null);
      setExplanationImagePreview("");
      if (editingQuestion && formData.explanationImageUrl) {
        setRemoveExplanationImage(true);
      }
      setFormData({ ...formData, explanationImageUrl: "" });
      if (explanationImageInputRef.current) {
        explanationImageInputRef.current.value = "";
      }
    }
  };

  const handleOpenModal = (question?: any) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        subjectId: question.topic?.subject?.id || "",
        topicId: question.topicId,
        questionText: question.questionText || question.text,
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
        explanationImageUrl: question.explanationImageUrl || "",
        questionImageUrl: question.questionImageUrl || "",
        correctOption: question.correctOption,
        explanation: question.explanation || "",
        difficultyLevel: question.difficultyLevel || question.difficulty,
        isActive: question.isActive,
      });
      setQuestionImagePreview(question.questionImageUrl || "");
      setExplanationImagePreview(question.explanationImageUrl || "");
      setQuestionImageFile(null);
      setExplanationImageFile(null);
      setRemoveQuestionImage(false);
      setRemoveExplanationImage(false);
    } else {
      setEditingQuestion(null);
      setFormData({
        subjectId: selectedSubject || "",
        topicId: selectedTopic || "",
        questionText: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctOption: 1,
        explanationImageUrl: "",
        questionImageUrl: "",
        explanation: "",
        difficultyLevel: "MEDIUM",
        isActive: true,
      });
      setQuestionImageFile(null);
      setQuestionImagePreview("");
      setExplanationImageFile(null);
      setExplanationImagePreview("");
      setRemoveQuestionImage(false);
      setRemoveExplanationImage(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setQuestionImageFile(null);
    setQuestionImagePreview("");
    setExplanationImageFile(null);
    setExplanationImagePreview("");
    setRemoveQuestionImage(false);
    setRemoveExplanationImage(false);
    if (questionImageInputRef.current) {
      questionImageInputRef.current.value = "";
    }
    if (explanationImageInputRef.current) {
      explanationImageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.questionText.trim() || !formData.topicId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) {
      toast.error("All 4 options are required");
      return;
    }

    if (questionImageFile && questionImageFile.size > 2 * 1024 * 1024) {
      toast.error("Question image size must be less than 2MB.");
      return;
    }

    if (explanationImageFile && explanationImageFile.size > 2 * 1024 * 1024) {
      toast.error("Explanation image size must be less than 2MB.");
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append("topicId", formData.topicId);
      submitFormData.append("questionText", formData.questionText);
      submitFormData.append("option1", formData.option1);
      submitFormData.append("option2", formData.option2);
      submitFormData.append("option3", formData.option3);
      submitFormData.append("option4", formData.option4);
      submitFormData.append("correctOption", String(formData.correctOption));
      submitFormData.append("difficultyLevel", formData.difficultyLevel);
      submitFormData.append("explanation", formData.explanation);
      submitFormData.append("isActive", String(formData.isActive));

      if (questionImageFile) {
        submitFormData.append("questionImage", questionImageFile);
      } else if (editingQuestion && removeQuestionImage) {
        submitFormData.append("removeImageQuestion", "true");
      }

      if (explanationImageFile) {
        submitFormData.append("explanationImage", explanationImageFile);
      } else if (editingQuestion && removeExplanationImage) {
        submitFormData.append("removeImageExplanation", "true");
      }

      if (editingQuestion) {
        await updateMutation.mutateAsync({ id: editingQuestion.id, data: submitFormData });
      } else {
        await createMutation.mutateAsync(submitFormData);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error("Question submission error:", error);
      toast.error(error.message || "Failed to save question. Please try again.");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !bulkTopicId) {
      toast.error("Topic and CSV file required");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("topicId", bulkTopicId);
    if (bulkSubjectId) {
      formData.append("subjectId", bulkSubjectId);
    }

    try {
      await bulkUploadMutation.mutateAsync(formData);
      setIsBulkModalOpen(false);
      setCsvFile(null);
      setBulkSubjectId("");
      setBulkTopicId("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question? All associated images will also be deleted.")) {
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
      const toggleFormData = new FormData();
      toggleFormData.append("isActive", String(!currentStatus));
      await updateMutation.mutateAsync({ id, data: toggleFormData });
    } catch (error) {
      // Error handled by hook
    }
  };

  const difficultyVariant = {
    EASY: "success" as const,
    MEDIUM: "warning" as const,
    HARD: "danger" as const,
  };

  const columns = [
    {
      key: "questionText",
      label: "Question",
      render: (item: any) => (
        <div className="flex items-start gap-2">
          {item.questionImageUrl && (
            <ImageIcon className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
          )}
          <span className="line-clamp-2 max-w-md text-sm" title={item.questionText}>
            {item.questionText}
          </span>
        </div>
      ),
    },
    {
      key: "subject",
      label: "Subject → Topic",
      render: (item: any) => (
        <span className="text-xs text-muted-foreground">
          {getSubjectName(item)} → {getTopicName(item)}
        </span>
      ),
    },
    {
      key: "difficultyLevel",
      label: "Difficulty",
      render: (item: any) => (
        <Badge
          variant={
            difficultyVariant[item.difficultyLevel as keyof typeof difficultyVariant] || "default"
          }
        >
          {item.difficultyLevel}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: any) => (
        <Toggle
          checked={item.isActive}
          onChange={() => handleToggleActive(item.id, item.isActive)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(item)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
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
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Manage Questions"
      breadcrumbs={[{ label: "Questions" }]}
    >
      {/* Stats */}
      {!isStatsError && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Total Questions</p>
            <p className="text-2xl font-bold mt-1">{stats.total || 0}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Active</p>
            <p className="text-2xl font-bold mt-1 text-success">{stats.active || 0}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase">Easy / Med / Hard</p>
            <p className="text-sm font-medium mt-2">
              {stats.byDifficulty?.EASY || 0} /{" "}
              {stats.byDifficulty?.MEDIUM || 0} /{" "}
              {stats.byDifficulty?.HARD || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 w-full md:w-64"
              />
            </div>

            {isSubjectsError ? (
              <div className="p-2 bg-muted/30 rounded border border-border text-xs text-muted-foreground">
                Unable to load subjects
              </div>
            ) : (
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic("");
                }}
                className="input-field w-40"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            )}

            {isTopicsError ? (
              <div className="p-2 bg-muted/30 rounded border border-border text-xs text-muted-foreground">
                Unable to load topics
              </div>
            ) : (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="input-field w-40"
              >
                <option value="">All Topics</option>
                {topics.map((topic: any) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            )}

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-field w-32"
            >
              <option value="">Difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="btn-outline flex items-center gap-2"
              disabled={isSubjectsError || isTopicsError}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
              disabled={isSubjectsError || isTopicsError}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isQuestionsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isQuestionsError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the questions. Please try again.
          </p>
          <button onClick={() => window.location.reload()} className="btn-outline">
            Refresh Page
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={questionsList}
          searchPlaceholder="Search questions..."
          searchable={false}
          emptyMessage="No questions found"
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemsPerPageOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingQuestion ? "Edit Question" : "Add New Question"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Subject <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) =>
                  setFormData({ ...formData, subjectId: e.target.value, topicId: "" })
                }
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="">Select Subject</option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Topic <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.topicId}
                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                className="input-field"
                disabled={!formData.subjectId || isSubmitting}
              >
                <option value="">Select Topic</option>
                {topics
                  .filter((t: any) => t.subjectId === formData.subjectId)
                  .map((topic: any) => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Question Text <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Enter the question"
              disabled={isSubmitting}
            />
          </div>

          {/* Question Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Question Image (optional)
            </label>
            {questionImagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img
                  src={questionImagePreview}
                  alt="Question Preview"
                  className="w-full h-full object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("question")}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
                {editingQuestion && formData.questionImageUrl && !questionImageFile && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded">
                    Existing Image
                  </div>
                )}
                {questionImageFile && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-success/90 text-white text-xs rounded">
                    New Image Selected
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isSubmitting && questionImageInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload question image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF (Max: 2MB)</p>
              </div>
            )}
            <input
              ref={questionImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, "question")}
              className="hidden"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">⚠️ Image must be less than 2MB</p>
            {editingQuestion && removeQuestionImage && (
              <p className="text-xs text-destructive mt-1">⚠️ Image will be deleted on save</p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="relative">
                <label className="block text-sm font-medium mb-1">
                  Option {num} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData[`option${num}` as keyof typeof formData] as string}
                    onChange={(e) =>
                      setFormData({ ...formData, [`option${num}`]: e.target.value })
                    }
                    className="input-field pr-10"
                    placeholder={`Option ${num}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, correctOption: num })}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      formData.correctOption === num
                        ? "text-success"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Mark as correct"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Explanation</label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Enter explanation for the correct answer"
              disabled={isSubmitting}
            />
          </div>

          {/* Explanation Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Explanation Image (optional)
            </label>
            {explanationImagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img
                  src={explanationImagePreview}
                  alt="Explanation Preview"
                  className="w-full h-full object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("explanation")}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
                {editingQuestion && formData.explanationImageUrl && !explanationImageFile && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded">
                    Existing Image
                  </div>
                )}
                {explanationImageFile && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-success/90 text-white text-xs rounded">
                    New Image Selected
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isSubmitting && explanationImageInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload explanation image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF (Max: 2MB)</p>
              </div>
            )}
            <input
              ref={explanationImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, "explanation")}
              className="hidden"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">⚠️ Image must be less than 2MB</p>
            {editingQuestion && removeExplanationImage && (
              <p className="text-xs text-destructive mt-1">⚠️ Image will be deleted on save</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty Level</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficultyLevel: e.target.value as "EASY" | "MEDIUM" | "HARD",
                  })
                }
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-6">
              <label className="text-sm font-medium">Active Status</label>
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
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
              {editingQuestion ? "Update" : "Create"} Question
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Upload Questions"
        size="lg"
      >
        <form onSubmit={handleBulkUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Subject <span className="text-destructive">*</span>
              </label>
              <select
                value={bulkSubjectId}
                onChange={(e) => {
                  setBulkSubjectId(e.target.value);
                  setBulkTopicId("");
                }}
                className="input-field"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Topic <span className="text-destructive">*</span>
              </label>
              <select
                value={bulkTopicId}
                onChange={(e) => setBulkTopicId(e.target.value)}
                className="input-field"
                disabled={!bulkSubjectId}
                required
              >
                <option value="">Select Topic</option>
                {topics
                  .filter((t: any) => t.subjectId === bulkSubjectId)
                  .map((topic: any) => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">CSV Rules</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>No subjectId or topicId needed in CSV</li>
              <li>correctOption can be <b>1–4</b> or <b>A–D</b></li>
              <li>Maximum 1000 questions per upload</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowCsvFormat(true)}
              className="btn-outline mt-3 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              View CSV Format
            </button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center relative">
            <input
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">
              {csvFile ? csvFile.name : "Click or drop CSV / Excel file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported: .csv, .xls, .xlsx
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={!csvFile || !bulkTopicId || bulkUploadMutation.isPending}
            >
              {bulkUploadMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Upload Questions
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Format Preview Modal */}
      <Modal
        isOpen={showCsvFormat}
        onClose={() => setShowCsvFormat(false)}
        title="CSV Format Reference"
        size="xl"
      >
        <div className="space-y-4">
          {/* Column descriptions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Column Descriptions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {[
                { col: "Question", desc: "The question text", required: true },
                { col: "Option A", desc: "First answer choice", required: true },
                { col: "Option B", desc: "Second answer choice", required: true },
                { col: "Option C", desc: "Third answer choice", required: true },
                { col: "Option D", desc: "Fourth answer choice", required: true },
                { col: "Correct Answer", desc: "Use A/B/C/D or 1/2/3/4", required: true },
                { col: "Explanation", desc: "Explanation for the answer", required: false },
                { col: "Difficulty", desc: "EASY, MEDIUM, or HARD", required: false },
              ].map((item) => (
                <div
                  key={item.col}
                  className="flex items-start gap-2 bg-background rounded p-2 border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        {item.col}
                      </span>
                      {item.required ? (
                        <span className="text-[10px] text-destructive font-medium">required</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">optional</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample table */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Sample Data</h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    {csvHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-b border-border"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvSampleData.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      {csvHeaders.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 text-muted-foreground whitespace-nowrap border-b border-border"
                        >
                          {row[h as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warnings */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ⚠️ Important Notes
            </p>
            <ul className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-2 space-y-1 list-disc list-inside">
              <li>Do NOT include subjectId or topicId columns — select them from dropdowns above</li>
              <li>First row must be the header row exactly as shown above</li>
              <li>Maximum 1000 questions per upload</li>
              <li>Accepted formats: CSV, XLS, XLSX</li>
              <li>Difficulty defaults to MEDIUM if left blank</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowCsvFormat(false)}
              className="btn-primary"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Questions;