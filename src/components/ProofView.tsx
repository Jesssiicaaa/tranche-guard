"use client";
import { useState } from "react";
import { Milestone } from "@/types";

interface Props {
  milestones: Milestone[];
  projectId: string;
}

export default function ProofView({ milestones, projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"create" | "finish" | "cancel">("create");

  const escrowCreateTemplate = (m: Milestone) => ({
    TransactionType: "EscrowCreate",
    Account: "DONOR_WALLET_ADDRESS",
    Destination: "CONTRACTOR_WALLET_ADDRESS",
    Amount: String(m.trancheAmount * 1_000_000), // in drops
    FinishAfter: Math.floor(new Date(m.deadline).getTime() / 1000),
    CancelAfter: Math.floor(new Date(m.deadline).getTime() / 1000) + 86400 * 30,
    Condition: `CRYPTO_CONDITION_FOR_${m.id.slice(0, 8).toUpperCase()}`,
    Memos: [
      {
        Memo: {
          MemoData: Buffer.from(JSON.stringify({ projectId, milestoneId: m.id, title: m.title })).toString("hex"),
          MemoType: Buffer.from("application/json").toString("hex"),
        },
      },
    ],
  });

  const escrowFinishTemplate = (m: Milestone) => ({
    TransactionType: "EscrowFinish",
    Account: "DONOR_WALLET_ADDRESS",
    Owner: "DONOR_WALLET_ADDRESS",
    OfferSequence: 0, // placeholder — replaced with actual sequence
    Condition: `CRYPTO_CONDITION_FOR_${m.id.slice(0, 8).toUpperCase()}`,
    Fulfillment: `FULFILLMENT_REVEALED_AFTER_AUDITOR_APPROVAL_${m.id.slice(0, 8).toUpperCase()}`,
    Memos: [
      {
        Memo: {
          MemoData: Buffer.from(JSON.stringify({ action: "release", milestoneId: m.id, approvedAt: m.approvedAt || "pending" })).toString("hex"),
          MemoType: Buffer.from("application/json").toString("hex"),
        },
      },
    ],
  });

  const escrowCancelTemplate = (m: Milestone) => ({
    TransactionType: "EscrowCancel",
    Account: "DONOR_WALLET_ADDRESS",
    Owner: "DONOR_WALLET_ADDRESS",
    OfferSequence: 0, // placeholder
    Memos: [
      {
        Memo: {
          MemoData: Buffer.from(JSON.stringify({ action: "cancel", milestoneId: m.id, reason: "deadline_expired" })).toString("hex"),
          MemoType: Buffer.from("application/json").toString("hex"),
        },
      },
    ],
  });

  const getTemplate = (m: Milestone) => {
    if (selected === "create") return escrowCreateTemplate(m);
    if (selected === "finish") return escrowFinishTemplate(m);
    return escrowCancelTemplate(m);
  };

  const formatJSON = (obj: object) =>
    JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '<span class="proof-key">"$1":</span>')
      .replace(/: "([^"]+)"/g, ': <span class="proof-val">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="proof-val">$1</span>');

  return (
    <div className="proof-panel">
      <button className="proof-toggle" onClick={() => setOpen(!open)}>
        <span>🔧 Technical Appendix — Future XRPL Escrow Templates</span>
        <span>{open ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {open && (
        <div className="proof-content">
          <div className="proof-comment">
            {`/* ─────────────────────────────────────────────────── */}
{/* Future integration: XRPL Escrow Smart Contracts        */}
{/* These templates show how each action maps to           */}
{/* an on-chain escrow transaction on the XRP Ledger.      */}
{/* Not active in this MVP — for audit/technical reference */}
{/* ─────────────────────────────────────────────────── */}`}
          </div>
          <div style={{ margin: "12px 0", display: "flex", gap: 8 }}>
            {(["create", "finish", "cancel"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelected(t)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: selected === t ? "#ffd700" : "#444",
                  background: selected === t ? "#ffd70022" : "transparent",
                  color: selected === t ? "#ffd700" : "#888",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                }}
              >
                Escrow{t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {milestones.map((m, i) => (
            <div key={m.id} style={{ marginBottom: 20 }}>
              <div style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>
                {`// Milestone ${i + 1}: ${m.title}`}
              </div>
              <pre
                style={{ fontSize: "0.72rem", overflowX: "auto", whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: formatJSON(getTemplate(m)) }}
              />
            </div>
          ))}
          <div style={{ marginTop: 16, color: "#555", fontSize: "0.72rem", lineHeight: 1.6 }}>
            {`/* Reference: https://xrpl.org/escrow.html */}
/* EscrowCreate → funds locked     */}
/* EscrowFinish → funds released   */}
/* EscrowCancel → funds returned   */}`}
          </div>
        </div>
      )}
    </div>
  );
}
