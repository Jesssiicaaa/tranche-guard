"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface MilestoneInput {
  title: string;
  trancheAmount: string;
  deadline: string;
}

const EMPTY_MILESTONE: MilestoneInput = { title: "", trancheAmount: "", deadline: "" };

export default function CreateProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [donorName, setDonorName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", trancheAmount: "", deadline: "" },
    { title: "", trancheAmount: "", deadline: "" },
    { title: "", trancheAmount: "", deadline: "" },
    { title: "", trancheAmount: "", deadline: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateMilestone = (i: number, field: keyof MilestoneInput, val: string) => {
    setMilestones((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const addMilestone = () => {
    setMilestones((prev) => [...prev, { ...EMPTY_MILESTONE }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return; // keep at least 1
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
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
          <p className="page-sub">{milestones.length} milestone{milestones.length !== 1 ? "s" : ""} — add as many as you need</p>
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
          <span style={{ fontWeight: 600 }}>
            Milestones
            <span style={{ marginLeft: 8, fontSize: "0.78rem", fontWeight: 400, color: "var(--text-muted)" }}>
              ({milestones.length} total)
            </span>
          </span>
          {totalAmount > 0 && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Total committed: <strong>${totalAmount.toLocaleString()}</strong>
            </span>
          )}
        </div>
        <div className="card-body">
          {milestones.map((m, i) => (
            <div className="milestone-row" key={i}>
              <div className="milestone-row-num" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", right: 16 }}>
                <span>Milestone {i + 1}</span>
                {milestones.length > 1 && (
                  <button
                    onClick={() => removeMilestone(i)}
                    title="Remove this milestone"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "0 0 0 10px",
                    }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                  placeholder="e.g. Foundation & Site Clearance" />
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
            </div>
          ))}

          {/* Add Milestone Button */}
          <button
            onClick={addMilestone}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px dashed var(--border)",
              borderRadius: "var(--radius)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              marginTop: 4,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "var(--donor)";
              e.currentTarget.style.color = "var(--donor)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            + Add Another Milestone
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button className="action-btn btn-outline" onClick={() => router.back()}>Cancel</button>
        <button className="action-btn btn-blue" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating…" : `Create Project with ${milestones.length} Milestones →`}
        </button>
      </div>
    </div>
  );
}
