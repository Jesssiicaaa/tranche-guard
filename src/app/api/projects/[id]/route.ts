import { NextResponse } from "next/server";
import { getProject, checkAndExpireMilestones } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const updated = checkAndExpireMilestones(project);
  return NextResponse.json(updated);
}
