import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface Comment {
  id: number;
  content: string;
  parentId: number | null;
  createdAt: string;
  userId: number;
  user: {
    id: number;
    username: string;
    role: string;
    employee: { name: string } | null;
  };
}

interface Props {
  applicationId: number;
}

const getRoleColor = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "#dc2626";
    case "TRAINING_CENTER_SECTION_HEAD":
      return "#2563eb";
    case "TRAINING_IN_CHARGE":
      return "#7c3aed";
    case "RECOMMENDING_EMPLOYEE":
      return "#059669";
    default:
      return "#6b7280";
  }
};

const formatTimestamp = (ts: string): string => {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const CommentsSection: React.FC<Props> = ({ applicationId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadComments = async () => {
    try {
      const res = await api.get(`/applications/${applicationId}/comments`);
      setComments(res.data.data || []);
    } catch {
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [applicationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/applications/${applicationId}/comments`, { content: newComment.trim() });
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <p style={{ color: "var(--text-secondary)" }}>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          💬 Notes & Comments
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 400,
              background: "var(--nav-hover)",
              padding: "2px 10px",
              borderRadius: "12px",
            }}
          >
            {comments.length} {comments.length === 1 ? "note" : "notes"}
          </span>
        </h3>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: "6px",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            {error}
            <button
              onClick={() => setError("")}
              style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Comment Input */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            alignItems: "flex-start",
          }}
        >
          <textarea
            className="form-input"
            style={{
              flex: 1,
              minHeight: "48px",
              resize: "vertical",
              fontSize: "13px",
            }}
            placeholder="Add an internal note... (Enter to send, Shift+Enter for new line)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            style={{ whiteSpace: "nowrap", minWidth: "70px" }}
          >
            {submitting ? "..." : "Send"}
          </button>
        </div>

        {/* Comments List */}
        <div style={{ maxHeight: "500px", overflow: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
              No notes yet. Add the first note above.
            </p>
          ) : (
            comments.map((comment) => {
              const isOwnComment = comment.userId === user?.id;
              const displayName = comment.user.employee?.name || comment.user.username;
              const roleLabel = comment.user.role.replace(/_/g, " ");
              return (
                <div
                  key={comment.id}
                  style={{
                    background: "var(--nav-active-bg)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    borderLeft: `3px solid ${getRoleColor(comment.user.role)}`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: getRoleColor(comment.user.role),
                        }}
                      >
                        {displayName}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          background: getRoleColor(comment.user.role) + "20",
                          color: getRoleColor(comment.user.role),
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {roleLabel}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{formatTimestamp(comment.createdAt)}</span>
                    </div>
                    {isOwnComment && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          padding: "2px 4px",
                          borderRadius: "4px",
                        }}
                        title="Delete note"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
