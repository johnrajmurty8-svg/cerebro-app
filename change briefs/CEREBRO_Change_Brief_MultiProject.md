# Change Brief: CEREBRO Multi-Project Upgrade
# Drop this file into your cerebro project folder

## Summary
Upgrade CEREBRO from a single-project tool to a multi-project workspace.
Users should be able to create, manage, and switch between multiple product 
projects — each with independent answers, versions, documents, and status.

---

## What to Add

### 1. Project Dashboard (new landing page)
- After mode selection (Avatar State / Spirit Guide), show a PROJECT DASHBOARD
- Dashboard displays all saved projects as cards in a grid
- Each card shows: project name, current version number, status badge, last edited date, mode used (Avatar/Spirit)
- Cards are clickable — opens that project's intake form
- "+ New Project" button starts a fresh blank intake
- If no projects exist yet, show an empty state with "Create your first project" prompt
- The 🧪 Test button should create a test project (FlowBoard) and add it to the dashboard

### 2. Project Data Structure
Change localStorage storage from flat answers to a projects array:

```
Key: "cerebro-projects"
Value: {
  activeProjectId: "proj_abc123",
  projects: [
    {
      id: "proj_abc123",        // unique ID (use Date.now() or Math.random)
      name: "FlowBoard",        // from product_name answer
      status: "active",          // draft | active | building | shipped | archived
      mode: "avatar",            // avatar | spirit
      created: "2026-03-28T...", // ISO timestamp
      lastEdited: "2026-03-28T...",
      currentAnswers: { product_name: "FlowBoard", ... },  // current working answers
      versions: [
        { ver: 1, date: "2026-03-28T...", ans: {...} },
        { ver: 2, date: "2026-04-02T...", ans: {...}, changeBrief: "..." }
      ],
      docs: null  // generated documents for the latest version, or null
    }
  ]
}
```

### 3. Project Switcher in Top Nav
- Add a dropdown/selector in the header bar showing the current project name
- Clicking it shows a list of all projects — click to switch
- Switching projects loads that project's answers, versions, and docs into the UI
- Show the project name prominently in the header when inside a project

### 4. Project Status
- Each project has a status: Draft, Active, Building, Shipped, Archived
- Status is shown as a colored badge on dashboard cards and in the nav
- User can change status from a dropdown in the project view
- Status colors: Draft=gray, Active=blue, Building=amber, Shipped=green, Archived=dim gray

### 5. Back to Dashboard
- Add a "← All Projects" button in the top nav when inside a project
- Clicking it returns to the dashboard without losing any state

### 6. Delete / Archive Projects
- Each project card on the dashboard has a "..." menu with Archive and Delete options
- Delete asks for confirmation
- Archived projects move to a collapsible "Archived" section at bottom of dashboard

---

## What to Keep (do NOT change)
- Avatar State and Spirit Guide question sets (AVATAR and SPIRIT arrays)
- All intake form UI (sections, sidebar, navigation, progress bars, file attachments)
- Mode selector screen (shown only when creating a NEW project)
- Document generation (system prompt, API call, copy to clipboard)
- Diff engine (computeDiff, generateChangeBrief functions)
- Version history per project
- Diff-highlighted fields when editing V2+
- All tab content (Intake, Results/Docs, Versions, Workflow, Usage Guide)
- Test data (loadTestData function)
- All local generators (genClaudeMd, genBrief, genPrompts)
- The markdown renderer (renderMd function)

---

## Navigation Flow (updated)

```
App opens
  → Mode selector (Avatar / Spirit) — only for NEW projects
    → Project Dashboard (shows all projects)
      → Click project card → Project View (tabs: Intake, Docs, Versions, Workflow, Usage)
      → Click "+ New Project" → Mode selector → Blank intake form → saves as new project
      → Click "🧪 Test" → Creates FlowBoard project and opens it
```

---

## Migration
- Check if old localStorage key "cerebro-v1" exists (single-project format)
- If yes, migrate it into the new projects array as the first project
- Then delete the old key
- This preserves any existing work

---

## Claude Code Update Prompt

After reading this change brief, create an update plan listing:
1. Which files to create or modify
2. The order of changes
3. What to test after each change

Do NOT write code until I approve the plan.
