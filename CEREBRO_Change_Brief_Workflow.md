# Change Brief: Workflow Tab Upgrade + Mode Switching
# Drop this file into your cerebro project folder

## Summary
Two changes in this brief:
1. The Workflow tab currently shows 5 static session cards with no prompts or interaction. This upgrade makes it a fully functional build guide with expandable sessions, copy-paste prompts, completion tracking, tips, and iteration mode.
2. Users cannot currently switch between Avatar State and Spirit Guide modes after starting a project. This upgrade adds mid-project mode switching.

---

## What's Wrong Now
- Session cards are display-only — no click interaction
- No copy-paste prompts for Claude Code
- No tips or guidance
- No iteration mode for V2+ projects
- No way to track which sessions are complete
- The descriptions are too brief to be useful
- Mode (Avatar State / Spirit Guide) is locked once a project starts — users cannot switch mid-project

---

## PART A: Mode Switching

### The Problem
Currently, the mode (Avatar State vs Spirit Guide) is selected when creating a project and cannot be changed afterward. Users may want to:
- Start with Spirit Guide (simpler questions) and later switch to Avatar State to add more technical detail
- Start with Avatar State and realize they don't need that level of detail, switching to Spirit Guide
- Fill some sections in Spirit Guide mode and others in Avatar State mode

### What to Build

#### 1. Mode Toggle in Project View
Add a mode toggle button in the project header bar (near the version badge and status dropdown). It should show the current mode with an icon and be clickable to switch:
- Current display: `⚡ Avatar State` or `🌿 Spirit Guide`
- Clicking it opens a small confirmation dialog: "Switch to [other mode]? Your existing answers will be kept. Questions that exist in both modes share the same data. You may see additional questions in Avatar State that aren't in Spirit Guide."
- On confirm: switch the mode for the current project and save to localStorage

#### 2. Answer Preservation Logic
This is the critical part. Both modes share many question IDs (like `product_name`, `problem_statement`, `primary_persona`, `core_features`, etc.). When switching modes:
- **Shared question IDs**: Answers are preserved automatically because they use the same ID. For example, `product_name` exists in both Avatar State and Spirit Guide — the answer carries over.
- **Avatar-only questions**: When switching from Avatar to Spirit, answers to Avatar-only questions (like `jobs_to_be_done`, `kpis`, `leading_indicators`, `user_stories`, `performance`, `accessibility`, `navigation`, `interactions`, `milestones`, `launch_criteria`, `mitigations`, `dependencies`, `existing_research`, `competitors`, `anything_else`) are NOT deleted. They're retained in the answers object. If the user switches back to Avatar, they reappear.
- **No data loss**: Switching modes never deletes any answers. It only changes which questions are displayed in the intake form.

#### 3. Mode Indicator in Sidebar
The sidebar section list should update to show the sections for the current mode. When switching from Avatar (12 sections) to Spirit (8 sections), the sidebar updates immediately. Section progress recalculates based on the visible questions.

#### 4. Mode Stored Per Project
Each project in localStorage stores its current mode. Different projects can be in different modes. The mode is included in version snapshots so the version history shows which mode was active for each version.

#### 5. Mode Shown in Version History
Each version card in the Versions tab should show which mode was used: "V1 — ⚡ Avatar State" or "V2 — 🌿 Spirit Guide". This is informational only — loading a previous version does NOT change the current mode unless the user explicitly switches.

---

## What to Build

## PART B: Workflow Tab Upgrade

### 1. Expandable Session Cards
Each of the 5 session cards should be expandable (click to open/close). When collapsed, show: session number, title, estimated time, and a one-line description. When expanded, show all of the content below.

### 2. Full Prompt for Each Session
Each expanded card must contain a ready-to-paste prompt inside a styled code block with a "📋 Copy Prompt" button. Here are the prompts:

**Session 1: Setup & Plan (~20 min)**
```
Read CLAUDE.md and project-brief.md carefully. Then read all documents in this folder: prd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md.

Create a detailed build plan in plan.md with these phases:
- Phase 1: Project setup (dependencies, folder structure, environment config)
- Phase 2: Database schema and authentication setup
- Phase 3: Core API endpoints
- Phase 4: Frontend shell (layout, navigation, routing)
- Phase 5: Feature pages (one subsection per screen)
- Phase 6: Polish (error handling, loading states, responsive design)
- Phase 7: Testing and deployment

For each phase, list the specific files you will create or modify.
Do NOT write any code yet. Just the plan. Wait for my approval.
```

**Session 2: Backend (~1-2 hours)**
```
Read CLAUDE.md. Continue from plan.md.

Execute Phase 1 (project setup), Phase 2 (database + auth), and Phase 3 (core API).
Follow backend-spec.md for data models and API endpoints.
Follow security-checklist.md for authentication implementation.

After completing each phase, update plan.md to mark it done.
Run any available tests after Phase 3.
Report what was built and any issues encountered.
```

**Session 3: Frontend (~1-2 hours)**
```
Read CLAUDE.md. Continue from plan.md.

Execute Phase 4 (frontend shell) and Phase 5 (feature pages).
Follow design.md for all visual decisions — colors, typography, spacing, components.
Follow app-flow.md for routing, navigation structure, and screen transitions.

Build each screen listed in app-flow.md, connecting to the API endpoints from Phase 3.
After completing each phase, update plan.md.
Report what was built and any issues encountered.
```

**Session 4: Polish + Deploy (~1 hour)**
```
Read CLAUDE.md. Continue from plan.md.

Execute Phase 6 (polish) and Phase 7 (testing + deployment).
- Add proper error handling to all API calls
- Add loading states to all async operations
- Ensure responsive design works on mobile (min 375px width)
- Run all tests and fix any failures
- Set up deployment configuration

Update plan.md with final status.
Give me a summary of: what was built, what works, what needs attention, and any remaining issues.
```

**Session 5: Stitch UI Refresh (optional, ~30 min)**
```
I have redesigned [SCREEN NAME] using Google Stitch.
The new design is: [PASTE HTML OR DESCRIBE CHANGES]

Update the existing component to match this new design.
Keep ALL existing functionality — only change the visual layer.
Follow design.md for design tokens (colors, spacing, typography).
Do not modify any API calls, state management, or business logic.
```

### 3. Session Status Tracking
Add a status indicator to each session card:
- ⬜ Not started (default)
- 🔄 In progress
- ✅ Complete

User can click to toggle status. Status is saved to the project's localStorage data. This is purely for the user's own tracking — it doesn't affect anything else.

### 4. Tips Section
Below the session cards, add a "Tips" panel with these items:
- **Start each session fresh** — Open a new Claude Code conversation for each session. Old conversation history eats tokens and causes Claude to forget instructions.
- **Don't skip Session 1** — The build plan is the most important step. Review it carefully before approving. It's much cheaper to fix a plan than to fix code.
- **Use Sonnet for building** — Type `/model` in Claude Code to switch to Sonnet. It's faster and uses fewer tokens than Opus for implementation work. Save Opus for complex architecture decisions.
- **Compact regularly** — Type `/compact` when Claude Code feels slow or starts forgetting context. It clears old conversation while keeping important information.
- **Check your usage** — Type `/status` to see how much of your usage limit you've consumed in the current window.
- **Commit after each session** — Tell Claude Code: "Commit with message: [describe what was built]". This creates a checkpoint you can always go back to.

### 5. Iteration Mode Banner
When the project is on V2 or higher (has more than one version in its version history), show a prominent banner at the TOP of the Workflow tab:

Banner content:
- Title: "🔄 Iteration Mode — V[N]"
- Body: "You're on V[N]. Instead of running all build sessions again, use the Change Brief from the Versions tab. It contains only what changed and a ready-to-paste Claude Code prompt for surgical updates."
- A button: "Go to Versions →" that switches to the Versions tab
- Below the banner, show the standard sessions but dimmed/muted with a note: "Full build sessions below are for V1 initial builds. For V2+ iterations, use the Change Brief."

### 6. Copy Prompt Behavior
The "📋 Copy Prompt" button should:
- Copy only the prompt text (inside the code block), not the session title or description
- Show "✓ Copied!" for 2 seconds after clicking, then revert to "📋 Copy Prompt"
- Use the same copy-to-clipboard logic already used elsewhere in the app

---

## What NOT to Change
- Don't change the Intake form layout, question rendering, or file attachment logic
- Don't change the Docs tab or document generation
- Don't change the Usage tab
- Don't delete any answer data when switching modes — only change which questions are visible
- Don't change the AVATAR or SPIRIT question arrays themselves
- Don't change any data storage key names

---

## Design Notes
- Expanded cards should have a subtle background difference from collapsed cards
- The prompt code block should have a dark background (like a terminal) with monospace font
- The Copy button should sit in the top-right corner of the code block
- Use the same color scheme and styling patterns as the rest of the app
- Session number badges should use the existing colored circle style visible in the screenshot
- Tips section should be visually distinct — a bordered card below the sessions
- The mode toggle should match the style of other header badges (version badge, status dropdown)
- The mode switch confirmation dialog should be simple and non-blocking — not a full modal

---

## Testing
After implementation, verify:

**Workflow tab:**
1. Each session card expands and collapses on click
2. Each expanded card shows the full prompt in a code block
3. Copy button works and copies only the prompt text
4. Session status toggles (not started / in progress / complete) persist across page refreshes
5. V2+ projects show the iteration mode banner at top
6. Tips section renders below the sessions
7. "Go to Versions" button in iteration banner navigates correctly

**Mode switching:**
8. Mode toggle appears in project header bar showing current mode
9. Clicking it shows confirmation dialog
10. Switching from Avatar to Spirit: sidebar updates to 8 sections, progress recalculates, all shared answers preserved
11. Switching from Spirit to Avatar: sidebar updates to 12 sections, Avatar-only answers that were previously entered reappear
12. Switching modes never deletes any answer data
13. Mode is saved per project — switching Project A's mode doesn't affect Project B
14. Version history cards show which mode was used for each version
15. The mode is preserved across page refreshes

---

## Claude Code Prompt

After reading this change brief, create an update plan listing which files to modify, the order of changes, and what to test. Do NOT write code until I approve the plan.
