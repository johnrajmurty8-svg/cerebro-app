# Change Brief: V3 — Complete 8-Document Output for Copy-Paste Workflow

**Product:** CEREBRO
**Date:** April 8, 2026
**Version:** V3
**Prepared for:** Claude Code

---

## Summary

The copy-paste workflow currently instructs Claude to generate only 5 documents (the 5 core technical docs). The remaining 3 documents — `CLAUDE.md`, `project-brief.md`, and `startup-prompts.md` — are generated locally by CEREBRO's own functions (`genClaudeMd`, `genBrief`, `genPrompts`) and are never included in the clipboard prompt. This means users who rely on the copy-paste method receive an incomplete build package and must manually create or retrieve these 3 files separately. This brief updates the `SYS` prompt so that all 8 documents are produced in a single Claude session, giving users a complete 13-file output (5 `.md` + 5 `.docx` + 3 additional `.md`).

---

## What's Changing

### 1. `SYS` Prompt (in `Cerebro_Master_Code.jsx`)

The `SYS` constant must be rewritten to instruct Claude to generate **8 documents** instead of 5, using the `---FILE: [filename]---` / `---END FILE---` delimiter format (already established by the OutputFormat Change Brief).

**New document order:**

| # | File | Format |
|---|---|---|
| 1 | `prd.md` | Markdown |
| 2 | `app-flow.md` | Markdown |
| 3 | `design.md` | Markdown |
| 4 | `backend-spec.md` | Markdown |
| 5 | `security-checklist.md` | Markdown |
| 6 | `prd.docx` | Word (instructions only — Claude describes content) |
| 7 | `app-flow.docx` | Word |
| 8 | `design.docx` | Word |
| 9 | `backend-spec.docx` | Word |
| 10 | `security-checklist.docx` | Word |
| 11 | `CLAUDE.md` | Markdown |
| 12 | `project-brief.md` | Markdown |
| 13 | `startup-prompts.md` | Markdown |

The 3 new `.md` files (items 11–13) are appended **after** the 10 existing files. No `.docx` counterparts are required for these 3.

---

### 2. Specs for the 3 New Documents (add to `SYS` prompt)

#### `CLAUDE.md`
Claude Code auto-read instructions. Must include:
- Product name + one-liner (from intake)
- Stack section (from intake, or best recommendation if blank)
- Rules: Read `project-brief.md` first; write `plan.md` before any code; wait for approval before proceeding; follow `design.md`, `backend-spec.md`, `security-checklist.md`, `app-flow.md`; use TypeScript; write tests; keep components small; use env vars for all secrets
- Workflow: Read docs → Plan → Approve → Build → Test → Report
- Principles: Simplicity, no shortcuts, minimal blast radius, ask when unsure
- Target length: 200–400 words

#### `project-brief.md`
One-page project overview. Must include:
- Product name + one-liner
- Owner, launch date, team size (from intake)
- Top 3–5 goals (from intake)
- Build order: 1. Setup, 2. DB + Auth, 3. API, 4. UI Shell, 5. Features, 6. Polish, 7. Deploy
- Document map listing all 8 filenames
- Target length: 300–500 words

#### `startup-prompts.md`
Ready-to-paste Claude Code session prompts. Must include:
- Session 1 — Setup (~20 min): Read `CLAUDE.md` + all docs. Create `plan.md` with phases. No code yet.
- Session 2 — Backend (~1–2 hr): Execute phases 1–3. Follow `backend-spec.md` + `security-checklist.md`.
- Session 3 — Frontend (~1–2 hr): Execute phases 4–5. Follow `design.md` + `app-flow.md`.
- Session 4 — Polish (~1 hr): Phases 6–7. Errors, loading states, responsive, tests, deploy.
- Optional Stitch Session: Redesign in Stitch → export HTML or `DESIGN.md` → "Update [component] to match. Keep functionality."
- Each session block must be copy-paste ready — a self-contained prompt the user can drop into Claude Code without editing
- Target length: 400–600 words

---

### 3. Response Parser Update

The parser in `handleGen` that splits Claude's response currently splits on `---DOC_SEPARATOR---` and maps to 5 keys (`prd`, `appFlow`, `design`, `backend`, `security`). This must be updated to:
- Continue using the `---FILE: [filename]---` / `---END FILE---` delimiter format (from OutputFormat Change Brief)
- Parse and store the 3 new files: `claudeMd`, `projectBrief`, `prompts` (already exist as state vars, currently populated by local generators)
- If Claude returns all 8 via the new format, use Claude's output for all 8
- If the API call fails or returns fewer than 8 blocks, fall back to the existing local generators for the 3 operational docs (`genClaudeMd`, `genBrief`, `genPrompts`) — do NOT remove those functions

---

## What's NOT Changing

- `buildIntake()` function — do not touch
- Avatar State and Spirit Guide question arrays (`AVATAR`, `SPIRIT`) — do not touch
- Local generator functions `genClaudeMd`, `genBrief`, `genPrompts` — keep as fallback, do not remove
- Diff engine and version system logic — do not touch
- Mode switching logic — do not touch
- Multi-project workspace — do not touch
- Docs tab UI and upload/download features — do not touch
- Workflow tab content — do not touch
- Test data auto-fill (FlowBoard) — do not touch
- `app/api/generate/route.ts` — do not touch
- Single-file JSX architecture — do not split

---

## Design Notes

- The Docs tab should display all 8 documents, not just 5. The 3 new tabs (`CLAUDE.md`, `Project Brief`, `Startup Prompts`) should appear after the 5 core docs in the sub-tab bar.
- If these 3 docs were previously generated locally and are already displaying in the tab bar, this change simply upgrades their content source from local generators to Claude's output (with local generators as fallback).
- No visual changes required to the generation options panel or clipboard button.

---

## Affected Documents

- [ ] PRD — No change
- [ ] App Flow — Minor: Docs tab sub-tabs now show 8 entries instead of 5 (if not already)
- [ ] UI Guide — No change
- [ ] Backend Spec — No change
- [ ] Security Checklist — No change

---

## Test Checklist

- [ ] Load FlowBoard test data using the 🧪 Test button — confirm it loads without error
- [ ] Click Copy Prompt — paste into a new Claude chat and confirm Claude returns **13 files** (5 `.md` + 5 `.docx` descriptions + 3 additional `.md`)
- [ ] Confirm `CLAUDE.md` output contains FlowBoard's product name, tech stack (Next.js, Supabase, etc.), and the plan-first rule
- [ ] Confirm `project-brief.md` contains owner (Alex Rivera), launch date (August 15, Q3 2026), and build order
- [ ] Confirm `startup-prompts.md` contains all 4 session prompts plus the optional Stitch session
- [ ] Confirm the Docs tab shows all 8 document sub-tabs (not just 5)
- [ ] Confirm the 3 new tabs display Claude's generated content (not the local generator fallback) after a successful API generate
- [ ] Confirm the 3 new tabs fall back to local generator content if the API call fails
- [ ] Regression: confirm the 5 core docs (PRD, App Flow, Design, Backend, Security) still generate correctly
- [ ] Regression: confirm existing FlowBoard project data is not affected after the update

---

## Claude Code Prompt

Paste this into a new Claude Code session:

---

Read `change-brief-v3.md` and `change-log.md` in this project folder.

This is a V3 update to CEREBRO. Make ONLY the changes listed in the brief.

**Before writing any code:**
1. List every file you will modify
2. Describe what you will change in each file
3. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only.

---
