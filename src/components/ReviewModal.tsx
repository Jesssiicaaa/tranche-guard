"use client";
import { useState } from "react";
import { Milestone } from "@/types";

interface Props {
  milestone: Milestone;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface AiResult {
  conditionIndex: number;
  description: string;
  verified: boolean;
  note: string;
}

export default function ReviewModal({ milestone, projectId, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [aiResults, setAiResults] = useState<AiResult[] | null>(null);
  const [aiVerifying, setAiVerifying] = useState(false);

  const conditions = milestone.conditions || [];
  // Judge can use: uploaded file (fileData) OR evidence URL (imageUrl) — no file dump required
  const hasEvidenceForAi = !!(milestone.evidence?.fileData || milestone.evidence?.url);
  const aiVerifiableConditions = conditions.filter((c) => c.verificationType === "image" || c.verificationType === "document");

  const runAiVerification = async () => {
    if ((!milestone.evidence?.fileData && !milestone.evidence?.url) || aiVerifiableConditions.length === 0) return;
    setAiVerifying(true);
    setAiResults(null);
    const results: AiResult[] = [];
    for (let i = 0; i < aiVerifiableConditions.length; i++) {
      const c = aiVerifiableConditions[i];
      try {
        const res = await fetch("/api/verify-condition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(milestone.evidence?.fileData
              ? { imageBase64: milestone.evidence.fileData }
              : { imageUrl: milestone.evidence?.url }),
            conditionDescription: c.description,
          }),
        });
        const data = await res.json();
        results.push({
          conditionIndex: i,
          description: c.description,
          verified: data.verified ?? false,
          note: data.note || (data.error ? String(data.error) : "—"),
        });
      } catch (err) {
        results.push({
          conditionIndex: i,
          description: c.description,
          verified: false,
          note: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
        });
      }
    }
    setAiResults(results);
    setAiVerifying(false);
  };

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

          {/* Conditions & AI Verification */}
          {conditions.length > 0 && (
            <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>📋 Conditions to verify</div>
              <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {conditions.map((c, i) => (
                  <li key={i}>
                    {c.description}
                    <span style={{ marginLeft: 6, fontSize: "0.72rem", color: "var(--auditor)" }}>
                      ({c.verificationType})
                    </span>
                  </li>
                ))}
              </ul>
              {hasEvidenceForAi && aiVerifiableConditions.length > 0 && (
                <>
                  <button
                    className="action-btn btn-purple btn-sm"
                    onClick={runAiVerification}
                    disabled={aiVerifying}
                  >
                    {aiVerifying ? "Verifying…" : "🤖 Verify conditions with AI"}
                  </button>
                  {aiResults && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: 8 }}>AI Verification Results</div>
                      {aiResults.map((r, i) => (
                        <div key={i} style={{ marginBottom: 10, fontSize: "0.85rem" }}>
                          <span style={{ color: r.verified ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                            {r.verified ? "✓" : "✗"}
                          </span>{" "}
                          {r.description}
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4, marginLeft: 18 }}>
                            {r.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {conditions.length > 0 && !hasEvidenceForAi && (
                <p className="form-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                  No image/document uploaded. Contractor can add one for AI verification.
                </p>
              )}
            </div>
          )}

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
