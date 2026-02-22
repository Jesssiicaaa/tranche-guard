"use client";
import { useState } from "react";
import { Milestone, Role } from "@/types";

interface Props {
  milestone: Milestone;
  role: Role;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EvidenceModal({ milestone, role, projectId, onClose, onSuccess }: Props) {
  const [url, setUrl] = useState(milestone.evidence?.url || "");
  const [note, setNote] = useState(milestone.evidence?.note || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = role === "Contractor" && (milestone.status === "LOCKED" || milestone.status === "REJECTED");

  const handleSubmit = async () => {
    setError("");
    if (!url) { setError("Please provide a URL."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/milestones/${milestone.id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, note }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to submit evidence.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {canSubmit ? "Submit Evidence" : "View Evidence"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
              Milestone: {milestone.title}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {milestone.status === "REJECTED" && (
            <div className="alert alert-warn">
              This evidence was rejected by the Auditor.
              {milestone.auditorComment && ` Reason: "${milestone.auditorComment}"`}
              {canSubmit && " Please fix and resubmit."}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Evidence URL *</label>
            {canSubmit ? (
              <input
                className="form-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/… or site inspection report URL"
              />
            ) : (
              <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "0.9rem" }}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--donor)" }}>
                  {url || "—"}
                </a>
              </div>
            )}
            <p className="form-hint">Link to photos, inspection report, completion certificate, etc.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Note</label>
            {canSubmit ? (
              <textarea
                className="form-textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what was completed and how this evidence demonstrates it…"
              />
            ) : (
              <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "0.9rem", minHeight: 80 }}>
                {note || "—"}
              </div>
            )}
          </div>

          {milestone.evidence?.submittedAt && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Submitted: {new Date(milestone.evidence.submittedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="action-btn btn-outline" onClick={onClose}>
            {canSubmit ? "Cancel" : "Close"}
          </button>
          {canSubmit && (
            <button className="action-btn btn-green" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Evidence for Verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
