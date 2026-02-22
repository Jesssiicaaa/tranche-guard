import { NextResponse } from "next/server";
import { readProjects, saveProject } from "@/lib/db";
import { Project, Milestone } from "@/types";

export async function GET() {
  const projects = readProjects();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, description, donorName, contractorName, milestones } = body;

  if (!title || !milestones || milestones.length < 1) {
    return NextResponse.json({ error: "Invalid project data: need at least one milestone" }, { status: 400 });
  }

  const project: Project = {
    id: crypto.randomUUID(),
    title,
    description,
    donorName,
    contractorName,
    createdAt: new Date().toISOString(),
    milestones: milestones.map((m: Omit<Milestone, "id" | "status"> & { conditions?: Milestone["conditions"] }) => ({
      id: crypto.randomUUID(),
      title: m.title,
      trancheAmount: m.trancheAmount,
      deadline: m.deadline,
      status: "LOCKED",
      conditions: m.conditions || [],
    })),
    auditLog: [
      {
        id: crypto.randomUUID(),
        actor: "Donor",
        action: "PROJECT_CREATED",
        milestoneTitle: "—",
        milestoneIndex: -1,
        timestamp: new Date().toISOString(),
        detail: `Project "${title}" created with 4 milestones`,
      },
    ],
  };

  saveProject(project);
  return NextResponse.json(project, { status: 201 });
}
