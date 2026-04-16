---
name: cerebro-status
description: Run a visual sprint status update for the CEREBRO project. Use this skill whenever John asks for a status update, sprint summary, task tracker, progress review, or wants to know what's done and what's next on CEREBRO. Also triggers when John says things like "update the tracker", "what's left to do", "mark X as done", or "show me where we are". This skill reads the project files, assesses current state, and renders a styled interactive sprint tracker table.
---

# CEREBRO Sprint Status Skill

## What This Skill Does

Reads the CEREBRO project files, combines them with any status updates provided in the conversation, and renders a styled HTML sprint tracker table organised into four sections: **Next sprint**, **Completed**, **Queued**, and **Parked**.

---

## Step 1 — Read the Project Files

Before rendering anything, read these files from the project folder to understand current state. They are listed in priority order — read as many as are available:

| File | What to extract |
|---|---|
| `CEREBRO_BuilderSession1_Handoff.docx` | Baseline feature list, what was built vs queued at handoff |
| `CEREBRO_Overview_Guide_V1.docx` | Full feature set, workflow, document list |
| `CEREBRO_Change_Brief_MultiProject.md` | Multi-project upgrade scope |
| `CEREBRO_Change_Brief_Workflow.md` | Workflow tab + mode switching scope |
| `CEREBRO_Change_Brief_OutputFormat.md` | Output format upgrade scope (if present) |
| `CEREBRO_Status.md` | Ground truth task completion log (if present — see Step 2) |

Use `cat` to read `.md` files. Use `pandoc <file> -t plain` for `.docx` files.

---

## Step 2 — Determine Task Completion Status

Claude cannot infer completion from code alone. Use this priority order:

1. **`CEREBRO_Status.md`** — if present, this is the ground truth. Read it and trust it.
2. **Conversation history** — if John has said "X is done" or "completed 1 and 2" in this chat, use that.
3. **Ask John** — if neither source is available, ask: *"Which tasks have been completed since the last session?"* before rendering the tracker.

---

## Step 3 — Assess the Full Task List

Evaluate every task against one of these statuses:

| Status | Meaning |
|---|---|
| **Up next** | Immediate next action — only ONE task should have this at a time |
| **Pending** | In this sprint, not yet started |
| **Queued** | Planned but blocked on a prior task (e.g. needs Vercel deployed first) |
| **Done** | Confirmed completed |
| **Parked** | Deliberately deferred — not in current scope |

### The Standard CEREBRO Task List

Use this as your baseline. Add new tasks if Change Briefs or conversation history introduce them.

**Core build (from Builder Session 1):**
- Core intake engine — Avatar State + Spirit Guide *(likely Done from handoff)*
- 8-document generation pipeline *(likely Done from handoff)*
- Versioning + diff engine *(likely Done from handoff)*
- Test data auto-fill (FlowBoard) *(likely Done from handoff)*
- Master user guide (CEREBRO_Overview_Guide_V1.docx) *(likely Done from handoff)*

**Sprint tasks (from Change Briefs):**
- Apply Multi-Project Change Brief
- Apply Workflow Tab Change Brief
- End-to-end QA with FlowBoard
- Deploy to Vercel
- Apply OutputFormat Change Brief *(queued until post-deploy)*

**Parked (from devil's advocate analysis):**
- Per-document revision notes
- API proxy auto-generation *(parked until Vercel is live)*

---

## Step 4 — Render the Sprint Tracker

Render the tracker as an HTML widget using the exact template below. Do not summarise in prose — render the table directly.

**Section order:**
1. Next sprint — action required (pending + up next tasks)
2. Completed
3. Parked

**Status badge colours:**

| Status | Background | Text |
|---|---|---|
| Up next | `#FAEEDA` | `#854F0B` |
| Pending | `#FAEEDA` | `#854F0B` |
| Done | `#EAF3DE` | `#3B6D11` |
| Queued post-deploy | `#E6F1FB` | `#185FA5` |
| Parked | `#F1EFE8` | `#5F5E5A` |

**Priority circle colours (for numbered tasks):**

| Priority | Background | Text |
|---|---|---|
| 1 | `#FCEBEB` | `#791F1F` |
| 2 | `#FAEEDA` | `#633806` |
| 3 | `#E6F1FB` | `#0C447C` |
| 4+ / completed | `#F1EFE8` | `#444441` |

**Table columns:** # · Task · Description · Method · Status

**HTML template to adapt:**

```html
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); }
.tracker { padding: 1.5rem 0; }
.section-label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--color-text-tertiary);
  margin: 1.5rem 0 0.5rem; padding-bottom: 6px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
.section-label:first-child { margin-top: 0; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead th {
  text-align: left; font-size: 11px; font-weight: 500;
  color: var(--color-text-tertiary); padding: 6px 12px;
  background: var(--color-background-secondary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
thead th:first-child { border-radius: 8px 0 0 0; }
thead th:last-child { border-radius: 0 8px 0 0; }
tbody tr { border-bottom: 0.5px solid var(--color-border-tertiary); }
tbody tr:last-child { border-bottom: none; }
tbody td { padding: 10px 12px; vertical-align: top; color: var(--color-text-primary); line-height: 1.5; }
.priority {
  font-size: 12px; font-weight: 500; width: 28px; height: 28px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.badge {
  display: inline-flex; align-items: center; padding: 3px 9px;
  border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap;
}
.task-name { font-weight: 500; font-size: 13px; margin-bottom: 2px; color: var(--color-text-primary); }
.task-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }
.method { font-size: 12px; color: var(--color-text-secondary); }
.col-priority { width: 52px; }
.col-task { width: 34%; }
.col-method { width: 20%; }
.col-status { width: 110px; }
</style>

<div class="tracker">
  <div class="section-label">Next sprint — action required</div>
  <table>
    <thead>
      <tr>
        <th class="col-priority">#</th>
        <th class="col-task">Task</th>
        <th>Description</th>
        <th class="col-method">Method</th>
        <th class="col-status">Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- One row per pending/up-next task -->
      <tr>
        <td><div class="priority" style="background:#FCEBEB;color:#791F1F;">1</div></td>
        <td><div class="task-name">Task name here</div></td>
        <td class="task-desc">What this task does and why it matters.</td>
        <td class="method">Claude Code<br>Plan-first gate</td>
        <td><span class="badge" style="background:#FAEEDA;color:#854F0B;">Up next</span></td>
      </tr>
    </tbody>
  </table>

  <div class="section-label">Completed</div>
  <table>
    <thead>
      <tr>
        <th class="col-priority">#</th>
        <th class="col-task">Task</th>
        <th>Description</th>
        <th class="col-method">Method</th>
        <th class="col-status">Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- One row per completed task -->
      <tr>
        <td><div class="priority" style="background:#F1EFE8;color:#444441;">—</div></td>
        <td><div class="task-name">Task name here</div></td>
        <td class="task-desc">Brief description of what was built.</td>
        <td class="method">Claude Code</td>
        <td><span class="badge" style="background:#EAF3DE;color:#3B6D11;">Done</span></td>
      </tr>
    </tbody>
  </table>

  <div class="section-label">Parked — not in scope</div>
  <table>
    <thead>
      <tr>
        <th class="col-priority">#</th>
        <th class="col-task">Task</th>
        <th>Description</th>
        <th class="col-method">Reason parked</th>
        <th class="col-status">Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- One row per parked task -->
      <tr>
        <td><div class="priority" style="background:#F1EFE8;color:#444441;">—</div></td>
        <td><div class="task-name">Task name here</div></td>
        <td class="task-desc">What this is and why it was deferred.</td>
        <td class="method">Reason for parking</td>
        <td><span class="badge" style="background:#F1EFE8;color:#5F5E5A;">Parked</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Step 5 — After the Tracker

After rendering, add one short sentence (2–3 lines max) pointing to the immediate next action. Do not repeat what's in the table. Example:

> *Task 5 is up next — ready to walk through the OutputFormat Change Brief in Claude Code whenever you are.*

---

## Updating the Status Log

After each session where tasks are completed, offer to update `CEREBRO_Status.md` in the project folder. Format:

```markdown
# CEREBRO Status Log

## Completed
- [x] Core intake engine
- [x] 8-document generation
- [x] Versioning + diff engine
- [x] Test data auto-fill
- [x] Master user guide
- [x] Apply Multi-Project Change Brief
- [x] Apply Workflow Tab Change Brief
- [x] End-to-end QA with FlowBoard
- [x] Deploy to Vercel

## In Progress
- [ ] Apply OutputFormat Change Brief

## Queued
- [ ] API proxy auto-generation (needs Vercel first)

## Parked
- [ ] Per-document revision notes
```

Tell John to drop this file into his CEREBRO project folder so future sessions can read it as ground truth.

---

## Trigger Phrases

This skill should activate when John says any of the following (or close variations):

- "Give me a status update"
- "Show me where we are"
- "Update the tracker"
- "Mark X as done"
- "What's left to do"
- "Sprint summary"
- "What's next"
- "Run a status check"
- "X and Y are completed"
