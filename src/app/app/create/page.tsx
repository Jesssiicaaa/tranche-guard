"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConditionVerificationType } from "@/types";

interface ConditionInput {
  description: string;
  verificationType: ConditionVerificationType;
}

interface MilestoneInput {
  title: string;
  trancheAmount: string;
  deadline: string;
  conditions: ConditionInput[];
}

const EMPTY_CONDITION: ConditionInput = { description: "", verificationType: "image" };

export default function CreateProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [donorName, setDonorName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", trancheAmount: "", deadline: "", conditions: [] },
    { title: "", trancheAmount: "", deadline: "", conditions: [] },
    { title: "", trancheAmount: "", deadline: "", conditions: [] },
    { title: "", trancheAmount: "", deadline: "", conditions: [] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateMilestone = (i: number, field: keyof MilestoneInput, val: string | ConditionInput[]) => {
    setMilestones((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const addCondition = (milestoneIdx: number) => {
    setMilestones((prev) =>
      prev.map((m, idx) =>
        idx === milestoneIdx
          ? { ...m, conditions: [...(m.conditions || []), { ...EMPTY_CONDITION }] }
          : m
      )
    );
  };

  const updateCondition = (milestoneIdx: number, condIdx: number, field: keyof ConditionInput, val: string | ConditionVerificationType) => {
    setMilestones((prev) =>
      prev.map((m, idx) =>
        idx === milestoneIdx
          ? {
              ...m,
              conditions: (m.conditions || []).map((c, ci) =>
                ci === condIdx ? { ...c, [field]: val } : c
              ),
            }
          : m
      )
    );
  };

  const removeCondition = (milestoneIdx: number, condIdx: number) => {
    setMilestones((prev) =>
      prev.map((m, idx) =>
        idx === milestoneIdx
          ? { ...m, conditions: (m.conditions || []).filter((_, ci) => ci !== condIdx) }
          : m
      )
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!title || !donorName || !contractorName) {
      setError("Please fill in project title, donor, and contractor names.");
      return;
    }
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m.title || !m.trancheAmount || !m.deadline) {
        setError(`Milestone ${i + 1} is incomplete.`);
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, donorName, contractorName,
        milestones: milestones.map((m) => ({
          title: m.title,
          trancheAmount: parseFloat(m.trancheAmount),
          deadline: new Date(m.deadline).toISOString(),
          conditions: (m.conditions || [])
            .filter((c) => c.description?.trim())
            .map((c) => ({
              id: crypto.randomUUID(),
              description: c.description.trim(),
              verificationType: c.verificationType,
            })),
        })),
      }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/app/projects/${project.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create project.");
      setSubmitting(false);
    }
  };

  const totalAmount = milestones.reduce((s, m) => s + (parseFloat(m.trancheAmount) || 0), 0);

  return (
    <div className="app-page" style={{ maxWidth: 740 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Project</h1>
          <p className="page-sub">Set up 4 milestones with amounts and deadlines</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Project Details</span>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. School Construction — Nairobi West" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project…" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Donor Name *</label>
              <input className="form-input" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Global Education Fund" />
            </div>
            <div className="form-group">
              <label className="form-label">Contractor Name *</label>
              <input className="form-input" value={contractorName} onChange={(e) => setContractorName(e.target.value)}
                placeholder="e.g. BuildRight Ltd." />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Milestones</span>
          {totalAmount > 0 && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Total committed: <strong>${totalAmount.toLocaleString()}</strong>
            </span>
          )}
        </div>
        <div className="card-body">
          {milestones.map((m, i) => (
            <div className="milestone-row" key={i}>
              <div className="milestone-row-num">Milestone {i + 1}</div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={m.title} onChange={(e) => updateMilestone(i, "title", e.target.value)}
                  placeholder={`e.g. Foundation & Site Clearance`} />
              </div>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tranche Amount (USD) *</label>
                  <input className="form-input" type="number" min="0" value={m.trancheAmount}
                    onChange={(e) => updateMilestone(i, "trancheAmount", e.target.value)}
                    placeholder="e.g. 25000" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Deadline *</label>
                  <input className="form-input" type="date" value={m.deadline}
                    onChange={(e) => updateMilestone(i, "deadline", e.target.value)} />
                </div>
              </div>

              {/* Conditions — what must be verified before release (AI can verify from image/file) */}
              <div className="form-group" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <label className="form-label">Conditions (AI-verifiable from picture or file)</label>
                <p className="form-hint" style={{ marginBottom: 12 }}>
                  List what must be verified before funds release. AI can check images/documents, or Auditor can verify manually.
                </p>
                {(m.conditions || []).map((cond, ci) => (
                  <div key={ci} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      value={cond.description}
                      onChange={(e) => updateCondition(i, ci, "description", e.target.value)}
                      placeholder="e.g. Foundation concrete has been poured and cured"
                    />
                    <select
                      className="form-select"
                      style={{ width: 140 }}
                      value={cond.verificationType}
                      onChange={(e) => updateCondition(i, ci, "verificationType", e.target.value as ConditionVerificationType)}
                    >
                      <option value="image">Image (AI)</option>
                      <option value="document">Document (AI)</option>
                      <option value="manual">Manual (Auditor)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCondition(i, ci)}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "8px 12px" }}
                      title="Remove condition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addCondition(i)}
                  style={{
                    padding: "8px 14px",
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--radius)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  + Add Condition
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button className="action-btn btn-outline" onClick={() => router.back()}>Cancel</button>
        <button className="action-btn btn-blue" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating…" : "Create Project & Lock Funds →"}
        </button>
      </div>
    </div>
  );
}
