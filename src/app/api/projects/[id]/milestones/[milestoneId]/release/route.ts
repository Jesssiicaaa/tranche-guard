import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";

export async function POST(
  _req: Request,
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

  if (milestone.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Funds can only be released for APPROVED milestones" },
      { status: 400 }
    );
  }

  milestone.status = "RELEASED";
  milestone.releasedAt = new Date().toISOString();

  project.auditLog.push({
    id: crypto.randomUUID(),
    actor: "Donor",
    action: "FUNDS_RELEASED",
    milestoneTitle: milestone.title,
    milestoneIndex: project.milestones.indexOf(milestone),
    timestamp: new Date().toISOString(),
    detail: `$${milestone.trancheAmount.toLocaleString()} released to contractor`,
  });

  saveProject(project);
  return NextResponse.json(project);
}
