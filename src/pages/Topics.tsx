import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/common/Modal";
import { Badge } from "@/components/common/Badge";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from "@/hooks/useTopic";
import { useSubjects } from "@/hooks/useSubject";

interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  hasStudyMaterial: boolean;
  hasVideo: boolean;
  questionsCount: number;
  studyContent?: string;
  videoUrl?: string;
  displayOrder?: number;
}

export const Topics = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );

  const { 
    data: subjectsData,
    isError: isSubjectsError 
  } = useSubjects({ limit: 10000 });
  
  const { 
    data: topicsData, 
    isLoading: isTopicsLoading,
    isError: isTopicsError 
  } = useTopics(selectedSubject ? { subjectId: selectedSubject, limit: 10000 } : { limit: 10000 });

  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();
  const deleteMutation = useDeleteTopic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    name: "",
    description: "",
    studyContent: "",
    videoUrl: "",
    displayOrder: 1,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const subjects = subjectsData?.data?.subjects || [];
  const topics = topicsData?.data?.topics || [];

  const displayedSubjects = selectedSubject
    ? subjects.filter((s: any) => s.id === selectedSubject)
    : subjects;

  const groupedTopics = displayedSubjects.map((subject: any) => ({
    ...subject,
    topics: topics.filter((t: Topic) => t.subjectId === subject.id),
  }));

  const toggleExpanded = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleOpenModal = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        subjectId: topic.subjectId,
        name: topic.name,
        description: topic.description,
        studyContent: topic.studyContent || "",
        videoUrl: topic.videoUrl || "",
        displayOrder: topic.displayOrder || 1,
      });
    } else {
      setEditingTopic(null);
      setFormData({
        subjectId: selectedSubject || "",
        name: "",
        description: "",
        studyContent: "",
        videoUrl: "",
        displayOrder: 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.subjectId) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      subjectId: formData.subjectId,
      name: formData.name,
      description: formData.description,
      hasStudyMaterial: formData.studyContent.trim().length > 0,
      hasVideo: formData.videoUrl.trim().length > 0,
      studyContent: formData.studyContent,
      videoUrl: formData.videoUrl,
      displayOrder: formData.displayOrder,
    };

    try {
      if (editingTopic) {
        await updateMutation.mutateAsync({
          id: editingTopic.id,
          data: payload,
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
    if (!confirm("Are you sure you want to delete this topic?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  return (
    <DashboardLayout
      title="Manage Topics & Study Material"
      breadcrumbs={[{ label: "Topics" }]}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {isSubjectsError ? (
          <div className="w-full sm:w-64 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Unable to load subjects</p>
          </div>
        ) : (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-field w-full sm:w-64"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub: any) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
          disabled={isSubjectsError}
        >
          <Plus className="w-4 h-4" />
          Add New Topic
        </button>
      </div>

      {isTopicsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isTopicsError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load topics</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem loading the topics. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-outline"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTopics.length === 0 ? (
            <div className="dashboard-card p-8">
              <div className="text-center text-muted-foreground">
                {isSubjectsError ? (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>Unable to load subjects. Please try again.</p>
                  </>
                ) : (
                  <p>No subjects found. Please create a subject first.</p>
                )}
              </div>
            </div>
          ) : (
            groupedTopics.map((subject: any) => (
              <div key={subject.id} className="dashboard-card overflow-hidden">
                <button
                  onClick={() => toggleExpanded(subject.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedSubjects.has(subject.id) ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject?.topics?.length || 0} topics
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary">{subject?.topics?.length || 0}</Badge>
                </button>

                {expandedSubjects.has(subject.id) && (
                  <div className="border-t border-border">
                    {subject?.topics?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No topics found for this subject
                      </div>
                    ) : (
                      subject?.topics?.map((topic: Topic) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{topic.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {topic.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1.5">
                                <FileText
                                  className={`w-4 h-4 ${topic.hasStudyMaterial ? "text-success" : "text-muted-foreground"}`}
                                />
                                <span className="text-xs">
                                  {topic.hasStudyMaterial
                                    ? "Has Study Material"
                                    : "No Material"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Video
                                  className={`w-4 h-4 ${topic.hasVideo ? "text-success" : "text-muted-foreground"}`}
                                />
                                <span className="text-xs">
                                  {topic.hasVideo ? "Has Video" : "No Video"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs">
                                  {topic.questionsCount || 0} questions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal(topic)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(topic.id)}
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
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopic ? "Edit Topic" : "Add New Topic"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Subject <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) =>
                setFormData({ ...formData, subjectId: e.target.value })
              }
              className="input-field"
              disabled={isSubmitting}
            >
              <option value="">Select Subject</option>
              {subjects.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Topic Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="Enter topic name"
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
              className="input-field min-h-[80px] resize-none"
              placeholder="Enter topic description"
              disabled={isSubmitting}
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-1">
              Study Content
            </label>
            <textarea
              value={formData.studyContent}
              onChange={(e) =>
                setFormData({ ...formData, studyContent: e.target.value })
              }
              className="input-field min-h-[120px] resize-none"
              placeholder="Enter study material content"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Video URL
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) =>
                setFormData({ ...formData, videoUrl: e.target.value })
              }
              className="input-field"
              placeholder="https://youtube.com/watch?v=..."
              disabled={isSubmitting}
            />
          </div> */}

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
                  displayOrder: parseInt(e.target.value) || 1,
                })
              }
              className="input-field w-32"
              min={1}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              {editingTopic ? "Update" : "Create"} Topic
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Topics;