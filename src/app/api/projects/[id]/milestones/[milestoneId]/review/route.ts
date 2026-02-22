import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";

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

  if (milestone.status !== "EVIDENCE_SUBMITTED") {
    return NextResponse.json(
      { error: "Only milestones with submitted evidence can be reviewed" },
      { status: 400 }
    );
  }

  if (!milestone.evidence) {
    return NextResponse.json({ error: "No evidence to review" }, { status: 400 });
  }

  const body = await req.json();
  const { decision, comment } = body;

  if (decision !== "APPROVE" && decision !== "REJECT") {
    return NextResponse.json({ error: "Decision must be APPROVE or REJECT" }, { status: 400 });
  }

  if (decision === "REJECT" && !comment?.trim()) {
    return NextResponse.json({ error: "Rejection requires a comment" }, { status: 400 });
  }

  if (decision === "APPROVE") {
    milestone.status = "APPROVED";
    milestone.approvedAt = new Date().toISOString();
    milestone.auditorComment = comment || "";
    project.auditLog.push({
      id: crypto.randomUUID(),
      actor: "Auditor",
      action: "MILESTONE_APPROVED",
      milestoneTitle: milestone.title,
      milestoneIndex: project.milestones.indexOf(milestone),
      timestamp: new Date().toISOString(),
      detail: comment ? `Approved with comment: "${comment}"` : "Approved without comment",
    });
  } else {
    milestone.status = "REJECTED";
    milestone.auditorComment = comment || "";
    project.auditLog.push({
      id: crypto.randomUUID(),
      actor: "Auditor",
      action: "MILESTONE_REJECTED",
      milestoneTitle: milestone.title,
      milestoneIndex: project.milestones.indexOf(milestone),
      timestamp: new Date().toISOString(),
      detail: `Rejected: "${comment}"`,
    });
  }

  saveProject(project);
  return NextResponse.json(project);
}
