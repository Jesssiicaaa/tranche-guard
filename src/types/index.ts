export type Role = "Donor" | "Contractor" | "Auditor";

export type MilestoneStatus =
  | "LOCKED"
  | "EVIDENCE_SUBMITTED"
  | "APPROVED"
  | "RELEASED"
  | "REJECTED"
  | "EXPIRED";

export interface Evidence {
  url: string;
  note: string;
  submittedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: Role;
  action: string;
  milestoneTitle: string;
  milestoneIndex: number;
  timestamp: string;
  detail?: string;
}

export interface Milestone {
  id: string;
  title: string;
  trancheAmount: number;
  deadline: string;
  status: MilestoneStatus;
  evidence?: Evidence;
  auditorComment?: string;
  approvedAt?: string;
  releasedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  donorName: string;
  contractorName: string;
  createdAt: string;
  milestones: Milestone[];
  auditLog: AuditEntry[];
}
