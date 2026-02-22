"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Project, Milestone, Role } from "@/types";
import { useRole } from "@/lib/role-context";
import EvidenceModal from "@/components/EvidenceModal";
import ReviewModal from "@/components/ReviewModal";
import AuditLog from "@/components/AuditLog";
import ProofView from "@/components/ProofView";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useRole();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceModal, setEvidenceModal] = useState<Milestone | null>(null);
  const [reviewModal, setReviewModal] = useState<Milestone | null>(null);

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  if (loading) return <div className="app-page"><p className="text-muted">Loading…</p></div>;
  if (!project) return <div className="app-page"><p className="text-muted">Project not found.</p><Link href="/app">← Back to Projects</Link></div>;

  const totalCommitted = project.milestones.reduce((s, m) => s + m.trancheAmount, 0);
  const totalReleased = project.milestones.filter((m) => m.status === "RELEASED").reduce((s, m) => s + m.trancheAmount, 0);
  const pct = totalCommitted > 0 ? Math.round((totalReleased / totalCommitted) * 100) : 0;

  const canSubmitEvidence = (m: Milestone) =>
    role === "Contractor" && (m.status === "LOCKED" || m.status === "REJECTED");
  const canReview = (m: Milestone) =>
    role === "Auditor" && m.status === "EVIDENCE_SUBMITTED";
  const canRelease = (m: Milestone) =>
    role === "Donor" && m.status === "APPROVED";
  const canReturn = (m: Milestone) =>
    role === "Donor" && m.status === "EXPIRED";

  return (
    <div className="app-page">
      <div className="page-header">
        <div>
          <Link href="/app" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8, display: "block" }}>← Back to Projects</Link>
          <h1 className="page-title">{project.title}</h1>
          <p className="page-sub">{project.donorName} → {project.contractorName} · {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {project.description && (
        <p style={{ marginBottom: 24, color: "var(--text-muted)", lineHeight: 1.5 }}>{project.description}</p>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Committed</div>
          <div className="stat-value">${totalCommitted.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Released</div>
          <div className="stat-value">${totalReleased.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Progress</div>
          <div className="stat-value">{pct}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Milestones</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="milestones-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m, i) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.title}</div>
                    {m.conditions && m.conditions.length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                        {m.conditions.length} condition{m.conditions.length !== 1 ? "s" : ""}: {m.conditions.map((c) => c.description).join("; ").slice(0, 60)}…
                      </div>
                    )}
                  </td>
                  <td>${m.trancheAmount.toLocaleString()}</td>
                  <td>{new Date(m.deadline).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${m.status}`}>{m.status.replace(/_/g, " ")}</span>
                    {m.evidence && <span className="evidence-pill" style={{ marginLeft: 6 }}>📎 Evidence</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(canSubmitEvidence(m) || m.evidence) && (
                        <button
                          className="action-btn btn-outline btn-sm"
                          onClick={() => setEvidenceModal(m)}
                        >
                          {canSubmitEvidence(m) ? "Submit Evidence" : "View Evidence"}
                        </button>
                      )}
                      {canReview(m) && (
                        <button className="action-btn btn-purple btn-sm" onClick={() => setReviewModal(m)}>
                          Review
                        </button>
                      )}
                      {canRelease(m) && (
                        <button
                          className="action-btn btn-green btn-sm"
                          onClick={async () => {
                            const res = await fetch(`/api/projects/${id}/milestones/${m.id}/release`, { method: "POST" });
                            if (res.ok) fetchProject();
                          }}
                        >
                          Release Funds
                        </button>
                      )}
                      {canReturn(m) && (
                        <button
                          className="action-btn btn-outline btn-sm"
                          onClick={async () => {
                            const res = await fetch(`/api/projects/${id}/milestones/${m.id}/return`, { method: "POST" });
                            if (res.ok) fetchProject();
                          }}
                        >
                          Return Funds
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Audit Log</span>
        </div>
        <div className="card-body">
          <AuditLog entries={project.auditLog} />
        </div>
      </div>

      <ProofView milestones={project.milestones} projectId={project.id} />

      {evidenceModal && (
        <EvidenceModal
          milestone={evidenceModal}
          role={role}
          projectId={id}
          onClose={() => setEvidenceModal(null)}
          onSuccess={() => { fetchProject(); setEvidenceModal(null); }}
        />
      )}
      {reviewModal && (
        <ReviewModal
          milestone={reviewModal}
          projectId={id}
          onClose={() => setReviewModal(null)}
          onSuccess={() => { fetchProject(); setReviewModal(null); }}
        />
      )}
    </div>
  );
}
