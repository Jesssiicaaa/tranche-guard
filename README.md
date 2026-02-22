# TrancheGuard — Milestone-Based Fund Release Platform

> **Lock funds. Verify work. Release only what's earned.**

TrancheGuard is a hackathon MVP that enables donors to fund multi-milestone projects where **an independent Auditor acts as the release gate** — no tranche is paid out until evidence is reviewed and approved.

---

## The Problem

In international development and infrastructure contracting:
- Donors wire money upfront and hope contractors deliver
- Contractors have little accountability to show progress
- Verifying work remotely is expensive (donor travel)
- Disputes arise because there's no immutable record of who approved what

**TrancheGuard** solves this with role-separated verification and an append-only audit trail.

---

## How the Auditor Verification Works

```
Contractor submits evidence (URL + note)
         ↓
Auditor reviews evidence
    ├─ REJECT → contractor must fix and resubmit
    └─ APPROVE → milestone status becomes "Verified — Pending Release"
                        ↓
              Donor clicks "Release Funds"
                        ↓
               Funds flow to contractor
```

### Why the Auditor matters:
- **Separation of duties**: The entity that benefits (contractor) cannot approve their own work. The entity paying (donor) cannot release without independent verification.
- **Remote verification**: A trusted local inspector, NGO field officer, or certified engineer can serve as Auditor without the donor traveling.
- **Accountability**: Every Auditor decision is timestamped and logged. You know exactly who approved what, when, based on which evidence.
- **Rejection flow**: If evidence is insufficient, the Auditor rejects with a comment. Contractor fixes and resubmits. This creates a documented trail of the full review history.

---

## Business Rules Enforced

| Rule | Enforcement |
|------|-------------|
| Cannot approve without evidence | API returns 400 if no evidence exists |
| Cannot release without approval | API returns 400 if status ≠ APPROVED |
| Expired milestones lock out | Auto-detected on each project load |
| Donor can Return Funds only on EXPIRED | API enforces EXPIRED status check |
| Audit log is append-only | New entries only; no deletes |

---

## File Tree

```
tranche-guard/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + role switcher
│   │   ├── globals.css             # All styles
│   │   ├── page.tsx                # Landing page
│   │   ├── api/
│   │   │   └── projects/
│   │   │       ├── route.ts                        # GET list, POST create
│   │   │       └── [id]/
│   │   │           ├── route.ts                    # GET single project
│   │   │           └── milestones/[milestoneId]/
│   │   │               ├── evidence/route.ts       # POST submit evidence
│   │   │               ├── review/route.ts         # POST approve/reject
│   │   │               ├── release/route.ts        # POST release funds
│   │   │               └── return/route.ts         # POST return expired funds
│   │   └── app/
│   │       ├── page.tsx                            # Projects list
│   │       ├── create/page.tsx                     # Create project form
│   │       └── projects/[id]/page.tsx              # Project dashboard
│   ├── components/
│   │   ├── EvidenceModal.tsx       # Submit / view evidence
│   │   ├── ReviewModal.tsx         # Auditor approve/reject
│   │   ├── AuditLog.tsx            # Append-only log display
│   │   └── ProofView.tsx           # Collapsed XRPL template panel
│   ├── lib/
│   │   └── db.ts                   # JSON file read/write helpers
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── data/
│       └── projects.json           # Local persistence (gitignored in prod)
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## How to Run

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
open http://localhost:3000
```

---

## Demo Walkthrough

1. **Open app** → Go to `http://localhost:3000`
2. **Read landing** → Understand the three-role model
3. **Click "Launch App"** → Go to `/app`
4. **Switch role to Donor** (top-right role switcher)
5. **Click "New Project"** → Fill in:
   - Title: "School Construction — Nairobi West"
   - Donor: "Global Education Fund"
   - Contractor: "BuildRight Ltd."
   - 4 milestones with titles, amounts ($10k each), and deadlines
6. **Click "Create Project"** → See project dashboard with 4 LOCKED milestones
7. **Switch role to Contractor**
8. **Click "Submit Evidence"** on Milestone 1 → Enter URL + note
9. **Switch role to Auditor**
10. **Click "Review"** on Milestone 1 → See evidence → **Approve** with a comment
11. **Switch role to Donor**
12. **Click "Release Funds"** on Milestone 1 → Funds released!
13. **Check Audit Log** → See full history with actors, timestamps, details
14. **Scroll down** → Expand "Technical Appendix" to see XRPL escrow templates
15. **Try rejection flow**: Submit evidence → Auditor rejects → Contractor resubmits

---

## Future: XRPL Escrow Integration

The "Technical Appendix" panel in each project shows read-only XRPL transaction templates. In a production version:

| Current (MVP) | Future (XRPL) |
|---------------|---------------|
| JSON file storage | XRPL Ledger as source of truth |
| Simulated "fund lock" | `EscrowCreate` with crypto-condition |
| Simulated "release" | `EscrowFinish` with auditor-held fulfillment |
| Simulated "return" | `EscrowCancel` after deadline |
| App audit log | On-ledger transaction memos |

### Key XRPL Concepts:
- **EscrowCreate**: Donor locks XRP with a `FinishAfter` time and a crypto-condition. Only the Auditor holds the fulfillment secret.
- **EscrowFinish**: After Auditor approves off-chain, they reveal the fulfillment, triggering on-chain fund release.
- **EscrowCancel**: After `CancelAfter` time, donor reclaims funds from expired escrow.

### References:
- [XRPL Escrow Overview](https://xrpl.org/escrow.html)
- [EscrowCreate Transaction](https://xrpl.org/escrowcreate.html)
- [EscrowFinish Transaction](https://xrpl.org/escrowfinish.html)
- [EscrowCancel Transaction](https://xrpl.org/escrowcancel.html)
- [Crypto-Conditions (RFC)](https://tools.ietf.org/html/draft-thomas-crypto-conditions)

---

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Local JSON** (`/src/data/projects.json`) for persistence — swap for a database in production
- **No external UI libraries** — pure CSS with custom design system
- **No auth** — role switcher in header for demo purposes

---

*Built for hackathon demo. Not production-ready — uses filesystem storage and has no authentication.*
