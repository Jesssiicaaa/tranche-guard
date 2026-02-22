"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/types";

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false); });
  }, []);

  const totalCommitted = (p: Project) =>
    p.milestones.reduce((s, m) => s + m.trancheAmount, 0);
  const totalReleased = (p: Project) =>
    p.milestones.filter((m) => m.status === "RELEASED").reduce((s, m) => s + m.trancheAmount, 0);

  return (
    <div className="app-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">All milestone-based funding projects</p>
        </div>
        <Link href="/app/create" className="btn-primary action-btn btn-blue" style={{ textDecoration: "none" }}>
          + New Project
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No projects yet</div>
          <p className="empty-desc">Create your first project to get started with milestone-based fund releases.</p>
          <Link href="/app/create" className="btn-primary action-btn btn-blue" style={{ textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => {
            const committed = totalCommitted(p);
            const released = totalReleased(p);
            const pct = committed > 0 ? Math.round((released / committed) * 100) : 0;
            const completed = p.milestones.filter((m) => m.status === "RELEASED").length;
            return (
              <Link key={p.id} href={`/app/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="project-card">
                  <div className="project-card-title">{p.title}</div>
                  <div className="project-card-meta">
                    {p.donorName} → {p.contractorName} · {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                  {p.description && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
                      {p.description.slice(0, 80)}{p.description.length > 80 ? "…" : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "8px" }}>
                    <span className="text-muted">${released.toLocaleString()} released</span>
                    <span className="text-muted">{completed}/{p.milestones.length} milestones</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px", textAlign: "right" }}>
                    {pct}% of ${committed.toLocaleString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
