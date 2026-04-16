# Change Brief: V2 — Workflow Realignment & Version System Decommission
**Product:** CEREBRO — Master Build Package Generator
**Date:** April 7, 2026
**Version:** V2
**Prepared for:** Claude Code

---

## Summary

This brief decommissions two systems that are no longer needed — the built-in versioning/diff engine and the Usage tab — and replaces their value with a fully rebuilt Workflow tab that mirrors the complete CEREBRO Build OS V3 framework (P1 through P7). Token-saving tips are folded into each sprint/phase rather than living in a standalone tab. The workflow is the single source of guidance for users from first idea to every future iteration.

---

## What's Changing

### 1. Decommission: Versioning + Diff Engine
- Remove the `versions` tab entirely from the tab bar (tab label: "🔄 Versions" or similar)
- Remove the `versions` tab panel/content from the JSX
- Remove the `computeDiff()` function and all calls to it
- Remove the `generateChangeBrief()` function and all calls to it
- Remove all version-snapshot logic (V1 save on generate, V2+ diff highlighting of changed fields)
- Remove amber/green/red field highlighting in the intake form (diff indicators)
- Remove the "Change Brief" document slot from the Docs tab (if present as a generated doc)
- Remove any UI that says "Generate V2", "V1 snapshot saved", or references the internal change brief
- The intake form should simply save answers to the current project — no versioning triggers
- The generate/copy button should not trigger any version snapshot

### 2. Decommission: Usage Tab
- Remove the "Usage" tab entirely from the tab bar
- Remove the Usage tab panel/content from the JSX
- All token/model/platform tips that were in the Usage tab are NOT lost — they are redistributed into the Workflow tab (see below)

### 3. Rebuild: Workflow Tab — Full CEREBRO Build OS V3

Replace the existing Workflow tab content entirely with the full 7-phase CEREBRO Build OS V3 framework. The tab should render all phases and sprints in order, from P1 to P7.

#### Overall structure
The Workflow tab should display:
- A brief intro line: "Your complete build system — from first idea to shipped product."
- All 7 phases listed in order as collapsible/expandable panels
- Each phase panel shows: phase name, phase description (1–2 sentences), and its sprint card(s) with copy-paste prompts

#### Phase naming — use exactly these names:
| Phase | Label |
|---|---|
| P1 | Phase 1 — Ideation & Scoping |
| P2 | Phase 2 — CEREBRO Intake |
| P3 | Phase 3 — Project Setup |
| P4 | Phase 4 — Sprint Build |
| P5 | Phase 5 — Iteration (Change Brief Loop) |
| P6 | Phase 6 — UI Polish (Stitch Loop) |
| P7 | Phase 7 — Deploy & Monitor |

#### Sprint naming — use exactly these names:
| Sprint | Label |
|---|---|
| Sprint 0 | Sprint 0 — Project Setup [P3] |
| Sprint 1 | Sprint 1 — Build Plan + Backend Foundation [P4] |
| Sprint 2 | Sprint 2 — Frontend Shell + Feature Pages [P4] |
| Sprint 3 | Sprint 3 — Polish + First Deploy [P4] |
| Sprint 4+ | Sprint 4+ — [Feature Name] — V[N] Iteration [P5] (template card) |
| Sprint N | Sprint N — UI Polish — Stitch Refresh [P6] (optional) |

#### Phase 1 content — Ideation & Scoping
- Description: "Run the cerebro-build-os skill in a new Claude chat. It guides you through a 12-question ideation interview and produces a confirmed project brief before you touch CEREBRO."
- No sprint card. Note: "No sprint card — this phase is a Claude chat."
- Gate: "You can answer: what does it do, who uses it, what are the must-haves?"

#### Phase 2 content — CEREBRO Intake
- Description: "Run CEREBRO to generate your 8 build documents. Choose Avatar State (~47 questions) or Spirit Guide (~31 questions)."
- No sprint card. Note: "No sprint card — this phase IS CEREBRO."
- Gate: "All 8 .md files generated and saved locally."

#### Phase 3 content — Project Setup (Sprint 0)
- Description: "Configure everything before writing a single line of feature code. Deploy first, build second."
- Sprint 0 checklist (render as interactive checkboxes, saved to localStorage per project):
  - Create desktop folder structure (/docs, /change-briefs, /sprints, /assets)
  - Copy all 8 CEREBRO .md files into /docs/
  - Copy CLAUDE.md from /docs/ to the project root
  - Create Claude Project → upload all 8 .md files to Project Knowledge
  - Set system prompt in Claude Project
  - Create GitHub repo → init commit → push
  - Connect repo to Vercel → confirm blank deploy works
  - Set all env vars in Vercel dashboard
  - Open VS Code → confirm Claude Code extension is installed
- Gate: "Claude Project configured. Vercel deploying (even if blank). CLAUDE.md in the project root."

#### Phase 4 content — Sprint Build (Sprints 1–3)
- Description: "Build V1 using Claude Code. Three sprints, new Claude Code session per sprint. Always use the plan-first gate."
- Token tip (baked in, not in a separate tab): "💡 Use Sonnet for implementation — it's faster and cheaper. Type /model in Claude Code to switch. Use Opus only for complex architecture decisions. Type /compact when sessions feel slow. Commit after every working session."

**Sprint 1 — Build Plan + Backend Foundation**
- Checklist:
  - Open VS Code → new Claude Code session
  - Paste Session 1 prompt (below) → review build plan → approve
  - Claude Code: Phase 1 — project setup, dependencies, folder structure
  - Claude Code: Phase 2 — database schema + authentication
  - Claude Code: Phase 3 — core API endpoints
  - Run any available tests → fix errors
  - Commit: 'feat: backend foundation and auth'
  - Update plan.md to mark phases done
  - Run P7 deploy → smoke test API endpoints
- Session 1 prompt (copyable):
```
Read CLAUDE.md and all .md files in the /docs/ folder carefully.

Then create a detailed build plan in plan.md with these phases:
  Phase 1: Project setup (dependencies, folder structure, env config)
  Phase 2: Database schema and authentication setup
  Phase 3: Core API endpoints
  Phase 4: Frontend shell (layout, navigation, routing)
  Phase 5: Feature pages (one subsection per screen from app-flow.md)
  Phase 6: Polish (error handling, loading states, responsive design)
  Phase 7: Testing and deployment

For each phase, list the specific files you will create or modify.
Do NOT write any code yet. Show me the plan and wait for my approval.
```

**Sprint 2 — Frontend Shell + Feature Pages**
- Checklist:
  - Open VS Code → new Claude Code session
  - Paste Session 3 prompt (below) → review plan if needed → approve
  - Claude Code: Phase 4 — frontend shell, layout, navigation, routing
  - Claude Code: Phase 5 — feature pages per app-flow.md
  - QA each screen in the browser → fix layout and connection issues
  - Commit: 'feat: frontend shell and feature pages'
  - Run P7 deploy → smoke test all screens
- Session 3 prompt (copyable):
```
Read CLAUDE.md. Continue from plan.md.

Execute Phase 4 (frontend shell) and Phase 5 (feature pages).
Follow design.md for all visual decisions — colours, typography, spacing, components.
Follow app-flow.md for routing, navigation structure, and screen transitions.

Build each screen listed in app-flow.md, connecting to the API endpoints from Phase 3.
After completing each phase, update plan.md.
Report what was built and any issues encountered.
```

**Sprint 3 — Polish + First Deploy**
- Checklist:
  - Open VS Code → new Claude Code session
  - Paste Session 4 prompt (below) → approve
  - Claude Code: Phase 6 — error handling, loading states, responsive design
  - Claude Code: Phase 7 — run tests, fix failures, deployment config
  - Verify mobile responsive at minimum 375px width
  - Commit: 'feat: polish and error handling'
  - Merge to main → Vercel auto-deploys
  - Smoke test 5 core user flows on the live URL
  - Update change-log.md in /change-briefs/ to note V1 complete
- Session 4 prompt (copyable):
```
Read CLAUDE.md. Continue from plan.md.

Execute Phase 6 (polish) and Phase 7 (testing + deployment):
  - Add error handling to all API calls
  - Add loading states to all async operations
  - Ensure responsive design works on mobile (min 375px width)
  - Run all tests and fix any failures
  - Set up deployment configuration

Update plan.md with final status.
Give me a summary of: what was built, what works, what needs attention.
```

- Gate: "Core app works end-to-end and is live on Vercel."

#### Phase 5 content — Iteration / Change Brief Loop
- Description: "After V1 ships, every new feature or change uses the cerebro-change-brief skill inside your Claude Project. Changes are surgical, documented, and version-tracked."
- Token tip (baked in): "💡 Claude Code: use Sonnet for implementation. Claude Project: use Opus for writing and refining change briefs."

**Sprint 4+ template — Change Brief Iteration**
- Checklist:
  - Open Claude Project → new chat named: CB-[date]-[feature]
  - Type: CB: [describe what you want to change] — this triggers the skill
  - Upload current change-log.md (V3+ only)
  - Skill searches project knowledge and writes the change brief
  - Review change brief → confirm scope and 'What's NOT Changing' section
  - Save change-brief-v[N].md and change-log.md to /change-briefs/
  - Open new Claude Code session → paste Claude Code prompt from the brief
  - Review plan → approve → Claude Code implements
  - QA in browser → fix → commit
  - P7 deploy → close sprint in Notion
- Change brief trigger prompt (copyable):
```
CB: [describe what you want to change]

[upload your current change-log.md here — required for V3+]
```
- Claude Code implementation prompt (copyable):
```
Read change-brief-v[N].md and change-log.md in this project folder.

This is a V[N] update. Make ONLY the changes listed in the brief.

Before writing any code:
1. List every file you will modify
2. Describe what you will change in each file
3. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only.
```

#### Phase 6 content — UI Polish (Stitch Loop)
- Description: "Optional. When the app works but the visual design needs a lift. Google Stitch lets you redesign screens, then Claude Code applies the visual changes without touching business logic."
- Token tip: "💡 This is visual-layer only. Never pass your full codebase into a Stitch session — just describe or import the screen you want to redesign."

**Sprint N — UI Polish — Stitch Refresh**
- Checklist:
  - Identify the screen(s) to redesign
  - Open stitch.withgoogle.com → redesign the selected screen(s)
  - Export as HTML or write DESIGN.md with the changes
  - Open new Claude Code session → paste Stitch prompt
  - QA visual changes → no logic should be broken
  - Commit: 'design: [screen name] visual refresh'
  - P7 deploy → smoke test
- Stitch session prompt (copyable):
```
I have redesigned [SCREEN NAME] using Google Stitch.
The new design is: [paste HTML or describe the changes]

Update the existing component to match this new design.
Keep ALL existing functionality — only change the visual layer.
Follow design.md for design tokens (colours, spacing, typography).
Do not modify any API calls, state management, or business logic.
```

#### Phase 7 content — Deploy & Monitor
- Description: "P7 runs after every sprint — not just at the end of the project. Every merge to main triggers a Vercel auto-deploy. Verify it worked and log the state."
- Deploy checklist (informational, not interactive checkboxes):
  - Merge sprint branch to main → Vercel auto-deploys
  - Open the live Vercel URL → confirm the deploy succeeded
  - Smoke test 3–5 core user flows on the live URL
  - Check Vercel function logs for any runtime errors
  - Update change-log.md in /change-briefs/ — note what was deployed and when
  - Archive the sprint in Notion → mark status: Complete
- Failed deploy prompt (copyable):
```
The Vercel deploy failed. Check the build logs and terminal output.
Diagnose the error and fix it. Report what the error was and what you changed.
```

#### Completion tracking
- Each sprint checklist item should be individually checkable (toggle on/off)
- State saved to the project's localStorage data (per project)
- A sprint shows a completion indicator (e.g. "3/9 done") next to its header
- Checking all items in a sprint marks it ✅ Complete automatically

---

## What's NOT Changing
- The intake form itself (Avatar State and Spirit Guide question sets, section structure, navigation, sidebar, progress bars) — do not touch
- The Docs tab and document generation pipeline (all 8 document slots, copy, download, upload)
- The multi-project workspace (dashboard, project cards, status badges, project switcher, archive/delete)
- The mode selector (Avatar State / Spirit Guide toggle)
- The test data auto-fill (FlowBoard 🧪 button)
- The generate/copy prompt button at the end of intake — keep it, just remove any version-snapshot side effects
- The `localStorage` data structure for projects (answers, docs, mode, status) — do not break existing project data
- The API proxy (`app/api/generate/route.ts`) — do not touch
- The `.env.local` and Vercel environment variable setup
- The single-file JSX architecture — no splitting

---

## Design Notes
- The Workflow tab should feel like a structured playbook, not a feature list — ordered phases, scannable headers, expandable panels
- Phase headers should be bold and clearly numbered (P1–P7)
- Sprint cards within a phase should be visually nested/indented under the phase
- Copy-paste prompts should appear in a dark code-style block with a 📋 copy button (same pattern as the existing Workflow tab prompts)
- Token tips should appear as a small 💡 callout inside the relevant phase — not as a header-level section
- P1 and P2 have no sprint cards — just a description and gate note
- Collapsed state default: all phases collapsed, user expands what they need

---

## Affected Documents
- [ ] PRD — no change
- [ ] App Flow — minor: remove Versions tab from navigation map
- [ ] UI Guide — minor: tab bar now has 4 tabs (Intake, Docs, Workflow, Guide) not 6
- [ ] Backend Spec — no change
- [ ] Security Checklist — no change

---

## Test Checklist
- [ ] Load FlowBoard test data using the 🧪 Test button — confirm it loads without error
- [ ] Confirm the Versions tab is gone from the tab bar
- [ ] Confirm the Usage tab is gone from the tab bar
- [ ] Confirm intake form fields are NOT highlighted amber/green/red on edit
- [ ] Confirm clicking "Generate" or "Copy Prompt" does NOT save a version snapshot
- [ ] Confirm the Workflow tab renders all 7 phases (P1–P7) in order
- [ ] Confirm phase names match exactly: "Phase 1 — Ideation & Scoping", "Phase 4 — Sprint Build", "Phase 5 — Iteration (Change Brief Loop)", etc.
- [ ] Confirm sprint names match exactly: "Sprint 1 — Build Plan + Backend Foundation", etc.
- [ ] Expand Sprint 1 — confirm Session 1 prompt is present and copyable
- [ ] Expand Sprint 4+ — confirm the CB: trigger prompt and Claude Code prompt are present and copyable
- [ ] Expand Phase 7 — confirm the failed deploy prompt is present and copyable
- [ ] Check a checklist item in Sprint 0 — confirm it saves state and persists after refresh
- [ ] Confirm the 💡 token tips appear inside Phase 4 and Phase 5
- [ ] Regression: confirm the Docs tab, intake form, and project switching all still work
- [ ] Regression: confirm existing FlowBoard project data is not lost or corrupted

---

## Claude Code Prompt

Paste this into a new Claude Code session:

---

Read `change-brief-v2.md` and `change-log.md` in this project folder.

This is a V2 update. Make ONLY the changes listed in the brief.

**Before writing any code:**
1. List every file you will modify
2. Describe what you will change in each file
3. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only.

---
