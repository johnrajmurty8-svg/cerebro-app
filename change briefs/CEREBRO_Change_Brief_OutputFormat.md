# Change Brief: Output Format Upgrade + Document Upload
# Drop this file into your cerebro project folder

## Summary
Three changes in this brief:
1. **System prompt rewrite** — The SYS prompt currently produces a single text blob. This upgrade rewrites it so Claude (in any fresh conversation, no project context) knows exactly what 10 files to produce, what to name them, and how to format both .md and .docx versions.
2. **Response parser update** — The API response parser is updated to handle the new file-delimited format, with backward compatibility for the old separator format.
3. **Document upload on the Docs tab** — Each document slot (PRD, App Flow, Design, Backend, Security) gets an upload button so users who use the copy-paste method can upload their generated .md and .docx files back into CEREBRO. Uploaded content is stored, displayed in the Docs tab, and persisted with the project.

---

## What's Wrong Now
- The SYS prompt is a single compressed line with minimal instructions
- It says "Generate 5 docs separated by ---DOC_SEPARATOR---" but never tells Claude the filenames
- It never asks for Word documents at all
- A user who copies the prompt and pastes it into a fresh Claude chat gets one giant text blob they have to manually slice into 5 files
- If a user generates documents via the copy-paste method (outside CEREBRO), there is no way to bring those documents back into CEREBRO's Docs tab — the tab stays empty or shows the API failure message
- The Docs tab only works when the in-app Generate button succeeds via API

---

## PART A: System Prompt Rewrite

### 1. Replace the SYS Constant

Find this line (around line 127 in Cerebro_Master_Code.jsx):

```javascript
const SYS=`You are a senior product/technical lead. Generate 5 docs separated by "---DOC_SEPARATOR---". Each starts "# DOC_N: Title" (N=1-5). DOC1: PRD (14 sections, FR-001 IDs, acceptance criteria, MoSCoW). DOC2: App Flow (routes, actions, conditionals). DOC3: UI Guide/DESIGN.md (tokens, components, breakpoints). DOC4: Backend (data models, API endpoints, services). DOC5: Security (auth, encryption, OWASP, compliance). Flag gaps with [⚠️ ATTENTION NEEDED]. 800-2000 words each.`;
```

Replace it with:

```javascript
const SYS=`You are a senior product/technical lead generating a complete build package from a product intake form. You must produce 10 files total — 5 Markdown files and 5 matching Word documents (.docx).

## OUTPUT FORMAT

Generate each document as a clearly separated section using this exact format:

---FILE: [filename]---
[full document content]
---END FILE---

The 10 files you must produce, in order:

### Markdown Files (for Claude Code / AI tools)
1. **prd.md** — Product Requirements Document. 14 sections: Document Control, Problem Statement, User Personas, Goals & Metrics, Functional Requirements (grouped by Epic with FR-001 IDs, acceptance criteria, MoSCoW priority), Non-Functional Requirements, Scope (in/out), Technical Architecture, Release Plan, Go/No-Go Criteria, Risks & Mitigations, Open Questions. 1000-2000 words.
2. **app-flow.md** — App Flow & Navigation. Route map (every URL), authentication flow, onboarding flow, main app layout, screen-by-screen interaction flows (what loads, what user does, what happens), error & edge cases. 800-1500 words.
3. **design.md** — UI Design Guide (DESIGN.md). Design tokens (colors with hex values, typography scale, spacing, radius, shadows), breakpoints with responsive behavior, component specifications (dimensions, states, styling), motion & animation specs, iconography. 800-1500 words.
4. **backend-spec.md** — Backend Specification. Data models (every table with fields, types, constraints, relationships), API endpoints (route, method, description), services (what each does), environment variables list, folder structure. 1000-2000 words.
5. **security-checklist.md** — Security Checklist. Authentication (provider, session management), authorization (RBAC model, row-level security), encryption (transit, rest, secrets), input validation, OWASP Top 10 coverage table, integration security (per external service), API headers, compliance (GDPR, SOC2 as applicable), AI-specific security, incident response. 800-1500 words.

### Word Documents (.docx) (for stakeholder sharing)
6. **prd.docx** — Same content as prd.md, formatted as a professional Word document with branded header/footer, styled tables for requirements, color-coded priority labels, attention boxes for flagged items.
7. **app-flow.docx** — Same content as app-flow.md, formatted as a professional Word document with route table, numbered flow steps, and attention boxes.
8. **design.docx** — Same content as design.md, formatted as a professional Word document with token tables, component spec sections, and breakpoint matrix.
9. **backend-spec.docx** — Same content as backend-spec.md, formatted as a professional Word document with data model tables, endpoint tables, and service descriptions.
10. **security-checklist.docx** — Same content as security-checklist.md, formatted as a professional Word document with OWASP coverage table, compliance checklists, and attention boxes.

## WORD DOCUMENT FORMATTING REQUIREMENTS
All .docx files must:
- Use Arial font, 11pt body text
- Include a branded title page with product name (large, bold), document type subtitle, and one-liner description
- Include header with product name + document type, and footer with page numbers + "Confidential"
- Use professional table formatting: colored header rows, consistent borders, cell padding
- Use attention/warning boxes with amber left-border and yellow background for [⚠️ ATTENTION NEEDED] items
- Be print-ready and suitable for sharing with stakeholders, investors, or cross-functional teams

## RULES
- Flag ambiguities or missing info with [⚠️ ATTENTION NEEDED] — never invent answers
- Use the product name from the intake in all headers and titles
- Every functional requirement needs a unique ID (FR-001, FR-002, etc.), a MoSCoW priority, and acceptance criteria
- Data models must include field names, types, constraints (PK, FK, NOT NULL, UNIQUE), and relationships
- Design tokens must include actual hex color values, not just descriptions
- The .md files should be usable by Claude Code with no further editing
- The .docx files should be ready to share with non-technical stakeholders with no further editing

Below is the complete project intake form. Generate all 10 files from this information.`;
```

---

## PART B: Response Parser Update

### 2. Update the API Generation Parser

Find the section in `handleGen` that parses the API response (approximately):

```javascript
const parts=full.split("---DOC_SEPARATOR---").map(p=>p.trim()).filter(Boolean);
const dm={prd:"",appFlow:"",design:"",backend:"",security:""};const ks=["prd","appFlow","design","backend","security"];
if(parts.length>=5)ks.forEach((k,i)=>{dm[k]=parts[i];});else{dm.prd=full;ks.slice(1).forEach(k=>{dm[k]="[⚠️] Use Copy to Clipboard.
```

Replace that parsing block with:

```javascript
// Parse new format: ---FILE: filename--- ... ---END FILE---
const fileRegex = /---FILE:\s*(.+?)---\s*\n([\s\S]*?)---END FILE---/g;
const dm = { prd: "", appFlow: "", design: "", backend: "", security: "" };
const fileMap = {
  "prd.md": "prd", "prd.docx": "prd",
  "app-flow.md": "appFlow", "app-flow.docx": "appFlow",
  "design.md": "design", "design.docx": "design",
  "backend-spec.md": "backend", "backend-spec.docx": "backend",
  "security-checklist.md": "security", "security-checklist.docx": "security"
};
let match;
while ((match = fileRegex.exec(full)) !== null) {
  const fname = match[1].trim();
  const content = match[2].trim();
  const key = fileMap[fname];
  if (key && fname.endsWith(".md")) dm[key] = content;
}
// Fallback: try old separator format
if (!dm.prd) {
  const parts = full.split("---DOC_SEPARATOR---").map(p => p.trim()).filter(Boolean);
  const ks = ["prd", "appFlow", "design", "backend", "security"];
  if (parts.length >= 5) ks.forEach((k, i) => { dm[k] = parts[i]; });
  else { dm.prd = full; ks.slice(1).forEach(k => { dm[k] = "[⚠️] Use Copy to Clipboard — paste the prompt into a new Claude chat (Opus recommended) to generate all documents."; }); }
}
```

---

## PART C: Document Upload Feature

### 3. The Problem This Solves

When a user generates documents via the copy-paste method (copying the prompt from CEREBRO, pasting it into a separate Claude chat, and getting documents back), the Docs tab in CEREBRO stays empty. The user has their documents as separate files but CEREBRO doesn't know about them. This means:
- The Docs tab shows "Generate from Intake first" even though the documents exist
- The user can't view, copy, or manage their documents from within CEREBRO
- There's a disconnect between the intake and the output

### 4. What to Build

#### 4a. Upload Buttons on the Docs Tab

When the Docs tab has no content for a given document (either because generation hasn't been run, or it failed), show an upload area for that document. When content already exists (from API generation), show the content as normal but also offer a "Replace" upload option.

**For the 5 core document types** (PRD, App Flow, Design, Backend, Security), add:

**Empty state (no doc content):**
```
┌──────────────────────────────────────────────┐
│  📋 PRD                          prd.md      │
│──────────────────────────────────────────────│
│                                              │
│     📄                                       │
│     No document yet                          │
│                                              │
│     Generate using the 🚀 button, or         │
│     upload your document below:              │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  📎 Upload .md file    📎 Upload .docx│    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Or paste markdown content directly:         │
│  ┌──────────────────────────────────────┐    │
│  │  [paste area]                         │    │
│  └──────────────────────────────────────┘    │
│  [💾 Save pasted content]                    │
│                                              │
└──────────────────────────────────────────────┘
```

**Has content state:**
Show the existing rendered markdown content as normal, plus a small toolbar at the top:
```
┌──────────────────────────────────────────────────────┐
│ 📋 PRD        prd.md + prd.docx      [📋 Copy] [📎 Replace] │
│──────────────────────────────────────────────────────│
│ [rendered markdown content...]                        │
└──────────────────────────────────────────────────────┘
```

The "📎 Replace" button opens a small dropdown/panel with:
- Upload .md file (replaces the displayed markdown)
- Upload .docx file (stores as attachment, shows a "📄 .docx attached" badge)
- Paste markdown (textarea that replaces the content on save)

#### 4b. File Handling Logic

**For .md file uploads:**
- Use a hidden `<input type="file" accept=".md,.txt,.markdown">` element
- Read the file content using `FileReader.readAsText()`
- Store the text content in the `docs` state object under the appropriate key (e.g., `docs.prd = fileContent`)
- The content immediately renders in the Docs tab using the existing `renderMd()` function
- Persist to localStorage as part of the project data

**For .docx file uploads:**
- Use a hidden `<input type="file" accept=".docx">` element
- Read the file as a data URL using `FileReader.readAsDataURL()`
- Store the base64 string in a new state property: `docxFiles` (e.g., `docxFiles.prd = { name: "prd.docx", data: base64String, uploadedAt: timestamp }`)
- Display a badge/chip on the doc tab: "📄 prd.docx attached" with a download button
- The .docx is not rendered in the browser (Word files can't be rendered inline) — it's stored so the user can re-download it later or include it in exports
- Persist to localStorage as part of the project data

**For paste-in markdown:**
- Show a textarea (monospace, dark background, matching the app style)
- "Save" button stores the pasted text into `docs[key]`
- Content immediately renders via `renderMd()`

#### 4c. State Management

Add new state variables:
```javascript
const [docxFiles, setDocxFiles] = useState({});
// Shape: { prd: { name: "prd.docx", data: "base64...", uploadedAt: "..." }, ... }

const [docSources, setDocSources] = useState({});
// Shape: { prd: "api" | "uploaded" | "pasted", appFlow: "uploaded", ... }
```

Update the auto-save effect to include `docxFiles` and `docSources`:
```javascript
// In the save/auto-save logic, add alongside existing data
{ ans, sec, mode, versions, currentVer, docs, docxFiles, docSources }
```

Update the load effect to restore them:
```javascript
// In the useEffect that loads from localStorage
if (d.docxFiles) setDocxFiles(d.docxFiles);
if (d.docs) setDocs(d.docs);
if (d.docSources) setDocSources(d.docSources);
```

#### 4d. Upload Source Indicator

When a document was uploaded (not generated by API), show a small indicator:
- API-generated: no indicator (default)
- Uploaded .md: show "📤 Uploaded" badge next to the document title
- Pasted: show "📝 Pasted" badge next to the document title

#### 4e. Upload for Locally Generated Docs Too

The three locally-generated documents (CLAUDE.md, project-brief.md, startup-prompts.md) do NOT need upload buttons — they are always generated locally by CEREBRO and are always available. No changes needed for these.

The Change Brief tab also does NOT need an upload button — it is generated by the diff engine.

Upload buttons are ONLY for the 5 Claude-generated documents: PRD, App Flow, Design, Backend, Security.

### 5. Update the DT Array

Find:
```javascript
const DT=[{key:"prd",label:"📋 PRD",file:"prd.md"},{key:"appFlow",label:"🗺️ Flow",file:"app-flow.md"},{key:"design",label:"🎨 UI",file:"design.md"},{key:"backend",label:"⚙️ Backend",file:"backend-spec.md"},{key:"security",label:"🛡️ Security",file:"security-checklist.md"},{key:"claudeMd",label:"🤖 CLAUDE",file:"CLAUDE.md"},{key:"projectBrief",label:"📦 Brief",file:"project-brief.md"},{key:"prompts",label:"💬 Prompts",file:"prompts.md"},{key:"changeBrief",label:"🔄 Changes",file:"change-brief.md"}];
```

Replace with:
```javascript
const DT=[
  {key:"prd",label:"📋 PRD",file:"prd.md + prd.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"appFlow",label:"🗺️ Flow",file:"app-flow.md + app-flow.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"design",label:"🎨 UI",file:"design.md + design.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"backend",label:"⚙️ Backend",file:"backend-spec.md + backend-spec.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"security",label:"🛡️ Security",file:"security-checklist.md + security-checklist.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"claudeMd",label:"🤖 CLAUDE",file:"CLAUDE.md",uploadable:false},
  {key:"projectBrief",label:"📦 Brief",file:"project-brief.md",uploadable:false},
  {key:"prompts",label:"💬 Prompts",file:"prompts.md",uploadable:false},
  {key:"changeBrief",label:"🔄 Changes",file:"change-brief.md",uploadable:false}
];
```

### 6. Docs Tab Rendering Update

Update the Docs tab rendering to handle the three states per document:

```
IF docs[activeDoc] has content:
  → Show document header with title, filename, Copy button, and Replace button (if uploadable)
  → Show rendered markdown content
  → IF docxFiles[activeDoc] exists: show "📄 [filename] attached" chip with download button
  → IF docSources[activeDoc]: show source badge ("📤 Uploaded" or "📝 Pasted")

ELSE IF activeDoc is uploadable:
  → Show empty state with upload options:
    - "Upload .md file" button (hidden file input)
    - "Upload .docx file" button (hidden file input)
    - "Or paste markdown" expandable textarea with Save button
  → Show helpful message: "Generate using 🚀 Generate, or upload documents you created via the copy-paste method."

ELSE (locally generated doc with no content):
  → Show "Generate from Intake first" (existing behavior)
```

### 7. Handler Functions to Add

```javascript
const handleMdUpload = (key, file) => {
  if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    setDocs(prev => ({
      ...(prev || { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" }),
      [key]: content
    }));
    setDocSources(prev => ({ ...prev, [key]: "uploaded" }));
  };
  reader.readAsText(file);
};

const handleDocxUpload = (key, file) => {
  if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    setDocxFiles(prev => ({
      ...prev,
      [key]: { name: file.name, data: e.target.result, uploadedAt: new Date().toISOString() }
    }));
  };
  reader.readAsDataURL(file);
};

const handlePaste = (key, content) => {
  setDocs(prev => ({
    ...(prev || { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" }),
    [key]: content
  }));
  setDocSources(prev => ({ ...prev, [key]: "pasted" }));
};

const downloadDocx = (key) => {
  const file = docxFiles[key];
  if (!file) return;
  const byteString = atob(file.data.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = file.name; a.click();
  URL.revokeObjectURL(url);
};
```

### 8. Tab Activation on Upload

Currently, the Docs tab button is disabled when `docs` is null. Update the tab disable logic so the Docs tab is always accessible:

Find:
```javascript
disabled={!["intake","versions","usage"].includes(t)&&!docs&&!generating}
```

Change to:
```javascript
disabled={!["intake","results","versions","usage"].includes(t)&&!docs&&!generating}
```

This ensures the "results" (Docs) tab is always clickable. The empty state with upload buttons handles the UX.

---

## PART D: Usage Guide Update

### 9. Update the Usage Guide Tab

Update references to "5 documents" to "10 files (5 Markdown + 5 Word documents)". Also add a note about the upload feature:

- "Claude generates 10 files — 5 Markdown files for Claude Code and 5 Word documents for stakeholder sharing"
- "Save the .md files in your project folder for Claude Code. Keep the .docx files for sharing with your team, investors, or stakeholders."
- "If you used the copy-paste method, you can upload your generated documents back into CEREBRO's Docs tab using the upload buttons."

---

## What NOT to Change
- Don't change the buildIntake() function — the intake format stays the same
- Don't change any question arrays (AVATAR, SPIRIT)
- Don't change the local generators (genClaudeMd, genBrief, genPrompts) — these still generate CLAUDE.md, project-brief.md, and startup-prompts.md locally
- Don't change the diff engine or version system
- Don't change the mode switching logic
- Don't add upload buttons to CLAUDE.md, project-brief.md, or startup-prompts.md — these are always generated locally
- Don't add upload to the Change Brief tab — this is always generated by the diff engine

---

## Design Notes
- Upload buttons should use the same ghost button style as other buttons in the app (transparent bg, border, subtle text)
- The paste textarea should have a dark background (matching code blocks), monospace font, and a "Save" button below it
- The .docx attached chip should be subtle — small, rounded, with a download icon
- Source badges ("📤 Uploaded", "📝 Pasted") should be small, colored pills similar to the version badge style
- The empty state upload area should be visually inviting but not cluttered — centered with clear CTAs
- File type validation: only accept .md/.txt/.markdown for markdown uploads, only .docx for Word uploads. Show a brief error toast if wrong file type is selected.
- File size limit: reject files over 5MB with an error message

---

## localStorage Size Considerations
- .docx files stored as base64 will be roughly 1.3x their original file size
- A typical generated .docx is 10-30KB, so base64 is ~15-40KB — well within localStorage limits
- However, if a user uploads very large .docx files (e.g., 2MB+), this could approach localStorage's ~5-10MB limit
- Enforce the 5MB per-file limit mentioned in Design Notes
- If localStorage save fails (quota exceeded), show an error toast: "File too large to store locally. Save it to your project folder instead."

---

## Testing
After implementation, verify:

**System prompt:**
1. Copy the prompt, paste into a fresh Claude chat (no project context). Claude should produce 10 separate files with ---FILE: / ---END FILE--- markers.
2. Backward compatibility: old ---DOC_SEPARATOR--- format still parses correctly.

**Document upload — .md files:**
3. Click "Upload .md" on the PRD tab when empty. Select a .md file. Content appears rendered in the Docs tab immediately.
4. "📤 Uploaded" badge appears next to the document title.
5. Content persists after page refresh.
6. Copy button works on uploaded content.
7. "Replace" button lets you upload a different file, replacing the content.

**Document upload — .docx files:**
8. Click "Upload .docx" on the PRD tab. Select a .docx file. "📄 prd.docx attached" chip appears.
9. Download button on the chip triggers a browser download of the stored .docx.
10. .docx attachment persists after page refresh.
11. Uploading a new .docx replaces the previous one.

**Paste markdown:**
12. Click "Paste markdown" to expand the textarea. Paste content. Click "Save". Content renders immediately.
13. "📝 Pasted" badge appears.

**Mixed usage:**
14. Generate via API (some docs succeed). Upload remaining docs manually. All 5 doc tabs show content.
15. Upload a .md AND a .docx for the same doc type. Both are stored — .md renders, .docx shows as attached.

**Edge cases:**
16. Upload a non-.md file to the .md upload — error toast, file rejected.
17. Upload a file over 5MB — error toast, file rejected.
18. Docs tab is accessible even when docs state is null (upload empty state shows).

---

## Claude Code Update Prompt

After reading this change brief, create an update plan listing:
1. Which lines in Cerebro_Master_Code.jsx to modify
2. The exact old text to replace and new text to insert for each change
3. New state variables to add
4. New handler functions to add
5. How to test each change

Do NOT write code until I approve the plan.
