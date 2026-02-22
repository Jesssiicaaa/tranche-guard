import fs from "fs";
import path from "path";
import { Project } from "@/types";

const DATA_FILE = path.join(process.cwd(), "src/data/projects.json");

export function readProjects(): Project[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function writeProjects(projects: Project[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

export function getProject(id: string): Project | undefined {
  return readProjects().find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeProjects(projects);
}

export function checkAndExpireMilestones(project: Project): Project {
  const now = new Date();
  let changed = false;
  for (const m of project.milestones) {
    if (
      m.status !== "RELEASED" &&
      m.status !== "EXPIRED" &&
      new Date(m.deadline) < now
    ) {
      m.status = "EXPIRED";
      changed = true;
      project.auditLog.push({
        id: crypto.randomUUID(),
        actor: "Donor",
        action: "MILESTONE_EXPIRED",
        milestoneTitle: m.title,
        milestoneIndex: project.milestones.indexOf(m),
        timestamp: now.toISOString(),
        detail: "Deadline passed without release",
      });
    }
  }
  if (changed) saveProject(project);
  return project;
}
