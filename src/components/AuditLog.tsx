import { AuditEntry } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  PROJECT_CREATED: "Project created",
  EVIDENCE_SUBMITTED: "Evidence submitted",
  MILESTONE_APPROVED: "Milestone approved",
  MILESTONE_REJECTED: "Evidence rejected",
  FUNDS_RELEASED: "Funds released",
  FUNDS_RETURNED: "Funds returned",
  MILESTONE_EXPIRED: "Milestone expired",
};

export default function AuditLog({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) {
    return <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No entries yet.</p>;
  }

  const sorted = [...entries].reverse();

  return (
    <ul className="audit-log">
      {sorted.map((entry) => (
        <li key={entry.id} className="audit-entry">
          <div className={`audit-dot audit-dot-${entry.actor}`} />
          <div className="audit-content">
            <div className="audit-action">
              {ACTION_LABELS[entry.action] || entry.action}
            </div>
            <div className="audit-meta">
              <span
                style={{
                  display: "inline-block",
                  padding: "1px 7px",
                  borderRadius: 20,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  background:
                    entry.actor === "Donor"
                      ? "rgba(37,99,235,0.1)"
                      : entry.actor === "Auditor"
                      ? "rgba(147,51,234,0.1)"
                      : "rgba(22,163,74,0.1)",
                  color:
                    entry.actor === "Donor"
                      ? "var(--donor)"
                      : entry.actor === "Auditor"
                      ? "var(--auditor)"
                      : "var(--contractor)",
                  marginRight: 6,
                }}
              >
                {entry.actor}
              </span>
              {entry.milestoneTitle !== "—" && (
                <span>on "{entry.milestoneTitle}" · </span>
              )}
              {new Date(entry.timestamp).toLocaleString()}
            </div>
            {entry.detail && (
              <div className="audit-detail">{entry.detail}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
