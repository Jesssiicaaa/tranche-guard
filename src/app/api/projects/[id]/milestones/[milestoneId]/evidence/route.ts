import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";
import type { Evidence } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id: projectId, milestoneId } = await params;
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const milestone = project.milestones.find((m) => m.id === milestoneId);
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  if (milestone.status !== "LOCKED" && milestone.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Evidence can only be submitted for LOCKED or REJECTED milestones" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { url, note, fileData, fileType } = body;

  if (!url) {
    return NextResponse.json({ error: "Evidence URL is required" }, { status: 400 });
  }

  const evidence: Evidence = {
    url,
    note: note || "",
    submittedAt: new Date().toISOString(),
    ...(fileData && { fileData, fileType: fileType || "image" }),
  };

  milestone.evidence = evidence;
  milestone.status = "EVIDENCE_SUBMITTED";
  delete milestone.auditorComment;

  project.auditLog.push({
    id: crypto.randomUUID(),
    actor: "Contractor",
    action: "EVIDENCE_SUBMITTED",
    milestoneTitle: milestone.title,
    milestoneIndex: project.milestones.indexOf(milestone),
    timestamp: new Date().toISOString(),
    detail: `URL: ${url} | Note: ${note || "(none)"}`,
  });

  saveProject(project);
  return NextResponse.json(project);
}
