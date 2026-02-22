"use client";
import { useState } from "react";
import { Milestone } from "@/types";

interface Props {
  milestone: Milestone;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ milestone, projectId, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    if (decision === "REJECT" && !comment) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/milestones/${milestone.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to submit review.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">🔍 Auditor Review</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
              Milestone: {milestone.title} · ${milestone.trancheAmount.toLocaleString()}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            Your decision will be permanently recorded in the audit log. A rejection allows the contractor to resubmit.
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Evidence Review */}
          <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>📎 Submitted Evidence</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>URL</div>
              <a
                href={milestone.evidence?.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--donor)", fontSize: "0.9rem", wordBreak: "break-all" }}
              >
                {milestone.evidence?.url}
              </a>
            </div>
            {milestone.evidence?.note && (
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Contractor Note</div>
                <div style={{ fontSize: "0.9rem" }}>{milestone.evidence.note}</div>
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Submitted: {milestone.evidence?.submittedAt ? new Date(milestone.evidence.submittedAt).toLocaleString() : "—"}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Auditor Comment</label>
            <textarea
              className="form-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment about your decision (required if rejecting)…"
            />
            <p className="form-hint">This comment will be visible to all parties and permanently logged.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="action-btn btn-red"
            onClick={() => handleDecision("REJECT")}
            disabled={submitting}
          >
            {submitting ? "…" : "✗ Reject Evidence"}
          </button>
          <button
            className="action-btn btn-green"
            onClick={() => handleDecision("APPROVE")}
            disabled={submitting}
          >
            {submitting ? "…" : "✓ Approve & Unlock Release"}
          </button>
        </div>
      </div>
    </div>
  );
}
