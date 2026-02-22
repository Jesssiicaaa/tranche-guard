export type Role = "Donor" | "Contractor" | "Auditor";

export type MilestoneStatus =
  | "LOCKED"
  | "EVIDENCE_SUBMITTED"
  | "APPROVED"
  | "RELEASED"
  | "REJECTED"
  | "EXPIRED";

/** How a condition can be verified: image (AI from photo), document (AI from file), or manual (Auditor only) */
export type ConditionVerificationType = "image" | "document" | "manual";

export interface Condition {
  id: string;
  /** Human-readable description of what must be verified, e.g. "Foundation concrete has been poured" */
  description: string;
  /** What kind of evidence AI can verify from: image, document, or manual review */
  verificationType: ConditionVerificationType;
  /** If AI verified: pending | verified | failed. Manual conditions stay null until Auditor decides. */
  aiVerificationStatus?: "pending" | "verified" | "failed";
  /** AI's reasoning when it verified or failed (optional) */
  aiVerificationNote?: string;
}

export interface Evidence {
  url: string;
  note: string;
  submittedAt: string;
  /** Optional: base64 or URL of uploaded image/file for AI verification */
  fileData?: string;
  fileType?: "image" | "document";
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
  /** Conditions that must be met before funds can be released. AI can verify from image/document. */
  conditions?: Condition[];
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
