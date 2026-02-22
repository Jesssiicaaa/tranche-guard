# TrancheGuard — Code Explanation & How It Works

This document explains the TrancheGuard escrow system, the **Conditions** feature, and how the **condition judge** works.

---

## Core Idea: Condition + Judge

You define **conditions** (what must be verified). The **package judges** whether each condition is met.

- **Condition metric**: A description like "Foundation concrete has been poured"
- **Judge**: The `/api/verify-condition` endpoint — give it a condition + image (URL or base64), it returns `verified: true/false`

**No file upload required.** Paste a URL to an image; the judge fetches it and verifies.

---

## What TrancheGuard Does

TrancheGuard is a **milestone-based escrow platform** for releasing funds conditionally:

1. **Donor** creates a project with milestones (each has an amount + deadline)
2. **Contractor** completes work and submits evidence for each milestone
3. **Auditor** reviews evidence and approves or rejects
4. **Donor** releases funds only after Auditor approval

Money is released **only when conditions are met** and verified.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                         │
│  /app (projects list)  /app/create  /app/projects/[id] (detail)  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes (Next.js)                       │
│  GET/POST /api/projects  GET /api/projects/[id]                   │
│  POST .../milestones/[id]/evidence | review | release | return    │
│  POST /api/verify-condition (AI verification)                     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data (src/data/projects.json)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files & What They Do

### Types (`src/types/index.ts`)

- **Role**: `Donor | Contractor | Auditor`
- **MilestoneStatus**: `LOCKED | EVIDENCE_SUBMITTED | APPROVED | RELEASED | REJECTED | EXPIRED`
- **Condition**: What must be verified before release (description + verification type)
- **ConditionVerificationType**: `image` (AI from photo), `document` (AI from file), `manual` (Auditor only)
- **Evidence**: URL + note + optional fileData (base64 for AI)

### Create Project (`src/app/app/create/page.tsx`)

When creating a project:

1. **Project Details**: Title, description, donor, contractor
2. **Milestones**: Title, amount, deadline
3. **Conditions** (new): Per milestone, you add conditions like:
   - "Foundation concrete has been poured"
   - "Inspection report signed by engineer"
   - Each with a verification type: **Image (AI)**, **Document (AI)**, or **Manual (Auditor)**

### Project Detail (`src/app/app/projects/[id]/page.tsx`)

Shows the project dashboard:

- Stats (total committed, released, progress %)
- Milestones table with status badges
- Actions per role (Submit Evidence, Review, Release Funds, Return Funds)
- Audit log
- Technical appendix (XRPL escrow templates)

### Evidence Modal (`src/components/EvidenceModal.tsx`)

Contractor submits evidence:

- **URL** (required): Link to report, photos, etc.
- **File upload** (optional): Image or document for AI verification
- **Note**: Description of what was completed

If conditions exist, they are listed so the contractor knows what to show.

### Review Modal (`src/components/ReviewModal.tsx`)

Auditor reviews evidence:

- Sees submitted URL, note, file
- **Conditions list**: What must be verified
- **"Verify conditions with AI"** button: If file was uploaded, calls `/api/verify-condition` for each AI-verifiable condition
- Displays AI results (verified ✓ or failed ✗ + note)
- Approve or Reject with comment

### Condition Judge API (`src/app/api/verify-condition/route.ts`)

- **Input**: `conditionDescription` (required) + either `imageBase64` OR `imageUrl`
- **Output**: `{ verified: boolean, note: string }`

No file dump needed — pass `imageUrl` and the judge fetches and verifies.

**Without `OPENAI_API_KEY`**: Demo stub. **With it**: Real AI (OpenAI Vision) judges the condition.

---

## Flow: From Condition Setup to Release

```
1. Donor creates project
   └─ Adds milestones + conditions per milestone
      e.g. "Foundation poured" (image), "Engineer signed" (document)

2. Contractor submits evidence
   └─ URL + note + optional image/document
   └─ File is stored as base64 in evidence

3. Auditor opens Review
   └─ Sees conditions list
   └─ Clicks "Verify conditions with AI" (if file uploaded)
   └─ AI returns verified/failed for each condition
   └─ Auditor approves or rejects

4. Donor releases funds (only if APPROVED)
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project (with milestones + conditions) |
| GET | `/api/projects/[id]` | Get single project (checks expiry) |
| POST | `/api/projects/[id]/milestones/[mid]/evidence` | Submit evidence |
| POST | `/api/projects/[id]/milestones/[mid]/review` | Approve/reject |
| POST | `/api/projects/[id]/milestones/[mid]/release` | Release funds |
| POST | `/api/projects/[id]/milestones/[mid]/return` | Return expired funds |
| POST | `/api/verify-condition` | AI verification (image + condition) |

---

## Enabling Real AI Verification

1. Create `.env.local` in project root
2. Add: `OPENAI_API_KEY=sk-your-key-here`
3. Restart dev server

The `/api/verify-condition` endpoint will then use OpenAI Vision to analyze uploaded images and return whether conditions are met.

---

## Data Model (projects.json)

```json
{
  "id": "...",
  "title": "...",
  "milestones": [
    {
      "id": "...",
      "title": "...",
      "trancheAmount": 25000,
      "deadline": "...",
      "status": "LOCKED",
      "conditions": [
        {
          "id": "...",
          "description": "Foundation concrete has been poured",
          "verificationType": "image"
        }
      ],
      "evidence": { "url": "...", "note": "...", "fileData": "...", "fileType": "image" }
    }
  ],
  "auditLog": [...]
}
```

---

## Publishing & Understanding in VS Code

1. **Open in VS Code**: Open the `tranche-guard` folder as the workspace.
2. **Key files to read**:
   - `src/types/index.ts` — data shapes (Condition, Milestone, etc.)
   - `src/app/api/verify-condition/route.ts` — the **condition judge**
   - `src/app/app/create/page.tsx` — where conditions are added
   - `src/components/ReviewModal.tsx` — where "Verify with AI" calls the judge
3. **Publish to GitHub**: `git add . && git commit -m "Add conditions + judge" && git push`
4. **Run locally**: `npm run dev` → http://localhost:3000/app

---

## Summary

- **Conditions** = what must be verified (description + type: image/document/manual).
- **Judge** = `/api/verify-condition` — pass condition + imageUrl (or imageBase64), get verified/failed.
- No file upload required — URL to an image is enough.
- Contractor submits evidence URL. Auditor clicks "Verify with AI" → judge runs.
- Donor releases funds only after Auditor approval.
