# CEREBRO — Change Log

---

## V6 — April 19, 2026
**Change:** P1 Payload Loader
**Brief:** `change-brief-v6.md`

### What Changed
- Added "📋 Load P1 Brief" button to the intake form header — opens a modal for pasting a structured payload block
- Added `parseP1Payload()` function — detects `---CEREBRO-PAYLOAD---` delimiters, parses JSON body, maps keys to CEREBRO question IDs
- On successful load: merges payload values into `answers` state, optionally switches intake mode, shows toast with field count
- Error handling in modal: distinct messages for missing delimiters and malformed JSON
- Defined `CEREBRO_PAYLOAD_VERSION = "1.0"` constant and 23-key payload schema
- Payload keys map directly to existing AVATAR and SPIRIT question IDs — no question arrays modified

### What Didn't Change
- AVATAR and SPIRIT question arrays — no changes to questions, IDs, labels, types, or required flags
- `buildIntake()` function — unchanged
- `SYS` system prompt — unchanged
- 8-document generation pipeline
- Copy Prompt and Generate via API buttons
- Docs tab, Workflow tab
- Multi-project workspace (dashboard, cards, switcher, archive/delete)
- FamilyTable test data auto-fill (🧪 Test button)
- `localStorage` schema (`cerebro-projects`)
- `app/api/generate/route.ts`
- Single-file JSX architecture

### Affected Documents
- PRD: Minor — document the P1 Payload Loader as a new intake convenience feature
- App Flow: Minor — new modal added to intake screen flow
- UI Guide: No
- Backend Spec: No
- Security Checklist: No

---

## V5 — April 16, 2026
**Change:** Reference Files Metadata in Intake Output
**Brief:** `change-brief-v5.md`

### What Changed
- `buildIntake()` now appends a per-question inline attachment note (italicized, filenames only) immediately after any answer that has files attached via the 📎 button
- `buildIntake()` now appends a consolidated `## 📎 Reference Files Attached` appendix at the end of the prompt, grouping files by question label with filename and MIME type
- Appendix includes a closing instruction telling Claude to ask the user to drag actual files into the chat if visual analysis is needed
- Appendix is omitted entirely when no questions have attachments

### What Didn't Change
- File attachment UI (📎 button, `FileChip`, `addF`/`rmF`) — unchanged
- `files` state object structure — unchanged
- `AVATAR` and `SPIRIT` question arrays — unchanged
- Copy Prompt and Generate via API buttons — unchanged
- `SYS` system prompt and response parser — unchanged
- Local generators `genClaudeMd`, `genBrief`, `genPrompts` — unchanged
- Docs tab, Workflow tab, multi-project workspace, mode selector — unchanged
- localStorage schema — unchanged
- `app/api/generate/route.ts` — unchanged
- Single-file JSX architecture — unchanged

### Affected Documents
- PRD: Minor — document the reference file behavior in the intake output section
- App Flow: No
- UI Guide: No
- Backend Spec: No
- Security Checklist: No

---

## V4 — April 8, 2026
**Change:** Test Data Replacement (FlowBoard → FamilyTable)
**Brief:** `change-brief-v4.md`

### What Changed
- Replaced the built-in FlowBoard test data object in `loadTestData()` with a new sample project: FamilyTable — a family recipe book app
- FamilyTable covers: photo upload, handwritten recipe card OCR, AI recipe generation, family sharing, searchable cookbook
- All Avatar State intake fields populated with FamilyTable-appropriate content (goals, user journeys, data model, tech stack, security, risks)
- Updated Test button tooltip from "FlowBoard" to "FamilyTable"

### What Didn't Change
- Intake form — all field IDs, question sets, section structure, navigation unchanged
- 8-document generation pipeline — no logic changes
- Multi-project workspace, mode selector, workflow tab, versioning logic, localStorage schema
- API proxy (`app/api/generate/route.ts`) and single-file JSX architecture

### Affected Documents
- PRD: No
- App Flow: No
- UI Guide: No
- Backend Spec: No
- Security Checklist: No

---

## V3 — April 8, 2026
**Change:** Complete 8-Document Output for Copy-Paste Workflow
**Brief:** `change-brief-v3.md`

### What Changed
- Expanded `SYS` prompt to instruct Claude to generate 8 documents instead of 5
- Added generation specs for 3 previously missing documents: `CLAUDE.md`, `project-brief.md`, `startup-prompts.md`
- New total output from a single copy-paste session: 13 files (5 .md + 5 .docx + 3 additional .md)
- Updated response parser to extract and store the 3 new documents from Claude's output
- Local generator functions (`genClaudeMd`, `genBrief`, `genPrompts`) retained as fallback if API call fails
- Docs tab sub-tab bar updated to show all 8 document slots

### What Didn't Change
- Intake form — Avatar State and Spirit Guide question sets unchanged
- `buildIntake()` function — unchanged
- Multi-project workspace, mode selector, test data auto-fill (FlowBoard)
- Diff engine and version system logic, workflow tab content
- `app/api/generate/route.ts` and single-file JSX architecture

### Affected Documents
- PRD: No
- App Flow: Minor — Docs tab sub-tabs now reflect 8 documents
- UI Guide: No
- Backend Spec: No
- Security Checklist: No

---

## V2 — April 7, 2026
**Change:** Workflow Realignment & Version System Decommission
**Brief:** `change-brief-v2.md`

### What Changed
- Decommissioned the built-in versioning + diff engine (V1 snapshot, field highlighting, internal change brief generation)
- Removed the Versions tab from the tab bar entirely
- Removed the Usage tab from the tab bar entirely
- Token-saving and model/platform tips redistributed as 💡 callouts inside relevant Workflow tab phases
- Rebuilt the Workflow tab to match the full CEREBRO Build OS V3 framework (P1–P7)
- Phase and sprint names now aligned exactly with Build OS V3 naming conventions
- All 7 phases included: Ideation, CEREBRO Intake, Project Setup, Sprint Build, Change Brief Loop, Stitch Polish, Deploy & Monitor
- Copy-paste session prompts added for all build sprints (Sessions 1, 3, 4) and the Stitch session
- Change brief trigger prompt and Claude Code implementation prompt added to Sprint 4+ (P5)
- Failed deploy prompt added to Phase 7
- Per-sprint checklist completion tracking (checkboxes, saved to localStorage per project)

### What Didn't Change
- Intake form — Avatar State and Spirit Guide question sets unchanged
- Docs tab and 8-document generation pipeline
- Multi-project workspace (dashboard, cards, switcher, archive/delete)
- Mode selector (Avatar State / Spirit Guide)
- Test data auto-fill (FlowBoard)
- Generate/Copy Prompt button — kept, version-snapshot side effects removed
- localStorage project data structure — existing projects not affected
- API proxy (app/api/generate/route.ts)
- Single-file JSX architecture

### Affected Documents
- PRD: No
- App Flow: Minor — Versions and Usage tabs removed from navigation
- UI Guide: Minor — tab bar reduced from 6 to 4 tabs
- Backend Spec: No
- Security Checklist: No

---
