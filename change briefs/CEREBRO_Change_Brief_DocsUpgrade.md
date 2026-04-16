# Change Brief: Docs Tab Downloads, Multi-Upload & Generation Options
# Drop this file into your cerebro project folder

## Summary
Three changes in this brief:
1. **Dual download buttons** — The Docs tab gets two download-all buttons: one for all .md files and one for all .docx files. Currently there is only a single download for .md files.
2. **Multi-upload instead of replace** — The "Replace" button is renamed to "Upload" and redesigned to allow uploading multiple files per document slot. Users can store multiple versions (e.g., PRD V1 and PRD V2) in the same slot. Separate buttons for uploading .md and .docx files.
3. **Generation options at end of intake** — The two buttons at the end of the intake form (Copy and Generate) are expanded into a clear set of generation options so the user can choose their preferred method.

---

## What's Wrong Now

### Downloads
- There is only one download button that downloads .md files
- There is no way to download all .docx files at once
- Users who uploaded .docx files have to download them one at a time from each doc tab

### Upload
- The button is labeled "Replace" which implies destructive action — users may hesitate
- Only one file can exist per document slot — uploading a new file replaces the previous one
- Users who want to keep multiple versions (V1, V2) of the same document type have no way to do so
- The .md and .docx upload options are not clearly separated

### Generation Options
- The end of the intake form only has two buttons: Copy (📋) and Generate (🚀)
- "Copy" copies the system prompt + intake with no explanation of what to do next
- "Generate" calls the API directly, which may fail due to CORS
- There is no visual distinction between the two methods or explanation of which to choose
- New users may not understand the difference

---

## PART A: Dual Download Buttons

### 1. Add Download All Buttons to Docs Tab Header

Currently, the Docs tab has document sub-tabs (PRD, Flow, UI, etc.) and a content area. Add a download toolbar above or alongside the document sub-tabs.

**New toolbar layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [PRD] [Flow] [UI] [Backend] [Security] [CLAUDE] ...    │
│                                                         │
│ ⬇️ Download All .md    ⬇️ Download All .docx            │
└─────────────────────────────────────────────────────────┘
```

**"Download All .md" button:**
- Collects all 5 Claude-generated .md documents (prd, appFlow, design, backend, security) plus the 3 local docs (claudeMd, projectBrief, prompts) — 8 total
- Only includes docs that have content (skip empty ones)
- Creates a single .zip file containing all .md files with correct filenames: prd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md, CLAUDE.md, project-brief.md, startup-prompts.md
- If a Change Brief exists, include it as change-brief.md
- Uses JSZip library (add as dependency) to create the zip in-browser
- Triggers browser download of `[project-name]-docs-md.zip`

**"Download All .docx" button:**
- Collects all uploaded .docx files from `docxFiles` state
- Only includes slots that have .docx files uploaded
- Creates a single .zip file containing all .docx files with their original filenames
- Triggers browser download of `[project-name]-docs-docx.zip`
- If no .docx files are uploaded, the button should be disabled/dimmed with a tooltip: "No Word documents uploaded yet"

**Implementation notes:**
- Add JSZip as a dependency: `npm install jszip`
- Import dynamically to avoid bundle size impact: `const JSZip = (await import('jszip')).default;`
- Both buttons should show a brief loading state while creating the zip

### 2. JSZip Download Functions

```javascript
const downloadAllMd = async () => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const fileMap = {
    prd: "prd.md", appFlow: "app-flow.md", design: "design.md",
    backend: "backend-spec.md", security: "security-checklist.md",
    claudeMd: "CLAUDE.md", projectBrief: "project-brief.md",
    prompts: "startup-prompts.md"
  };
  Object.entries(fileMap).forEach(([key, filename]) => {
    const content = docs?.[key];
    if (content && content.trim()) zip.file(filename, content);
  });
  if (changeBrief && changeBrief.trim()) zip.file("change-brief.md", changeBrief);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ans.product_name || "project").replace(/\s+/g, "-").toLowerCase()}-docs-md.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadAllDocx = async () => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  Object.entries(docxFiles).forEach(([key, files]) => {
    if (Array.isArray(files)) {
      files.forEach(f => {
        const byteString = atob(f.data.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        zip.file(f.name, ab);
      });
    }
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ans.product_name || "project").replace(/\s+/g, "-").toLowerCase()}-docs-docx.zip`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## PART B: Multi-Upload (Replace → Upload)

### 3. Rename "Replace" to "Upload" Everywhere

Find all instances of "Replace" in the upload UI added by the OutputFormat Change Brief and rename to "Upload".

### 4. Change docxFiles State to Support Multiple Files Per Slot

The current `docxFiles` state stores one file per document key:
```javascript
// OLD: single file per slot
{ prd: { name: "prd.docx", data: "base64...", uploadedAt: "..." } }
```

Change to an array of files per slot:
```javascript
// NEW: multiple files per slot
{ prd: [
    { name: "prd-v1.docx", data: "base64...", uploadedAt: "..." },
    { name: "prd-v2.docx", data: "base64...", uploadedAt: "..." }
  ]
}
```

### 5. Update Upload Handlers

**handleDocxUpload** — Append instead of replace:
```javascript
const handleDocxUpload = (key, file) => {
  if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    setDocxFiles(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { name: file.name, data: e.target.result, uploadedAt: new Date().toISOString() }]
    }));
  };
  reader.readAsDataURL(file);
};
```

**handleMdUpload** — Also support multiple .md files per slot:

Change `docs` state for uploadable docs to also support arrays. However, only the LATEST .md is rendered in the main content area. Previous versions are shown as file chips below.

```javascript
// Add a new state for uploaded md file history
const [mdUploads, setMdUploads] = useState({});
// Shape: { prd: [{ name: "prd.md", content: "...", uploadedAt: "..." }], ... }

const handleMdUpload = (key, file) => {
  if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    // Update the displayed doc content to the latest upload
    setDocs(prev => ({
      ...(prev || { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" }),
      [key]: content
    }));
    // Add to upload history
    setMdUploads(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { name: file.name, content, uploadedAt: new Date().toISOString() }]
    }));
    setDocSources(prev => ({ ...prev, [key]: "uploaded" }));
  };
  reader.readAsText(file);
};
```

### 6. Update the Upload UI Per Document Slot

Each uploadable document slot should show:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 PRD       prd.md + prd.docx       [📋 Copy]         │
│──────────────────────────────────────────────────────────│
│ [rendered markdown content of latest .md]                │
│                                                          │
│ ── Uploaded Files ───────────────────────────────────── │
│ 📄 .md files:                                            │
│   📎 prd-v1.md  (Apr 3, 2026)  [👁️ View] [⬇️]  [🗑️]   │
│   📎 prd-v2.md  (Apr 5, 2026)  [👁️ View] [⬇️]  [🗑️]   │
│                                                          │
│ 📄 .docx files:                                          │
│   📎 prd-v1.docx  (Apr 3, 2026)  [⬇️]  [🗑️]            │
│   📎 prd-v2.docx  (Apr 5, 2026)  [⬇️]  [🗑️]            │
│                                                          │
│ [📎 Upload .md]  [📎 Upload .docx]                       │
└─────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- "View" on an .md file sets it as the currently displayed document in the main content area
- Download (⬇️) triggers a browser download of that specific file
- Delete (🗑️) removes the file from the uploads list (with confirmation)
- The "Uploaded Files" section only shows if there are uploaded files
- Upload buttons are always visible at the bottom, whether the slot is empty or has content
- Multiple files can be uploaded over time — they accumulate, not replace

### 7. Update downloadDocx for Array Format

The existing `downloadDocx` function needs to handle the array format:
```javascript
const downloadDocx = (key, index) => {
  const files = docxFiles[key];
  if (!files || !files[index]) return;
  const file = files[index];
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

### 8. Persist mdUploads

Add `mdUploads` to the auto-save and load effects alongside `docxFiles` and `docSources`.

---

## PART C: Generation Options at End of Intake

### 9. Replace the Two Buttons with a Generation Options Panel

Currently, the last section of the intake form shows:
```
[← Back]  [•••progress dots•••]  [📋 Copy] [🚀 Generate V1]
```

Replace the two buttons on the right with a more descriptive generation options panel:

```
[← Back]  [•••progress dots•••]  [Choose how to generate ▼]
```

When the user reaches the last section, instead of just two small buttons, show a clear options panel below the last form section (above the navigation dots):

```
┌─────────────────────────────────────────────────────────┐
│ 🚀 Ready to Generate                                    │
│                                                          │
│ Choose how you'd like to create your build package:      │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📋  Copy Prompt to Clipboard                        │ │
│ │                                                      │ │
│ │ Copies the full prompt so you can paste it into a    │ │
│ │ new Claude chat (Opus recommended). Best for the     │ │
│ │ copy-paste workflow. You'll get 10 files back        │ │
│ │ (5 .md + 5 .docx) which you can upload back here.   │ │
│ │                                                      │ │
│ │ [📋 Copy Prompt]                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚡  Generate via API                                 │ │
│ │                                                      │ │
│ │ Calls the Claude API directly to generate your       │ │
│ │ documents. Results appear in the Docs tab. Requires  │ │
│ │ API access (may not work on localhost due to CORS).  │ │
│ │                                                      │ │
│ │ [⚡ Generate V1]                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ℹ️ Both methods save a V1 snapshot of your answers.     │
│ After V1, edit your answers and regenerate to create     │
│ V2 with a Change Brief.                                  │
└─────────────────────────────────────────────────────────┘
```

### 10. Implementation Details

**When on the last section**, replace the current right-side button group:

```javascript
// OLD (current):
<div style={{display:"flex",gap:4}}>
  <button onClick={()=>cp(SYS+"\n\n---\n\n"+buildIntake(),"cb")} ...>{copied.cb?"✓":"📋"}</button>
  <button onClick={handleGen} ...>🚀 Generate V{...}</button>
</div>

// NEW:
// Show the navigation dots and back arrow as normal,
// but render the generation options panel as a section ABOVE the bottom nav bar
```

The generation options panel should:
- Appear only when `sec === SECTIONS.length - 1` (last section)
- Be rendered inside the form scroll area, below the last question, above the bottom nav
- Both option cards should be styled as bordered cards with a subtle background
- The Copy Prompt card should show a checkmark for 2 seconds after copying (existing behavior)
- The Generate card should be disabled if required fields are missing (existing behavior) with a note: "Complete required fields first"
- The info note at the bottom should be subtle (small text, muted color)

### 11. Version Save on Copy

Currently, clicking Copy just copies to clipboard without saving a version. Update so that clicking "Copy Prompt" ALSO saves a version snapshot (same as Generate does), so the versioning system stays in sync regardless of which method the user chooses.

```javascript
// On Copy Prompt click:
const handleCopyPrompt = () => {
  saveVersion(); // Save V1 snapshot
  cp(SYS + "\n\n---\n\n" + buildIntake(), "cb");
};
```

---

## What NOT to Change
- Don't change the buildIntake() function
- Don't change any question arrays (AVATAR, SPIRIT)
- Don't change the local generators (genClaudeMd, genBrief, genPrompts)
- Don't change the diff engine or version system logic
- Don't change the mode switching logic
- Don't change the SYS prompt (already updated by the OutputFormat Change Brief)
- Don't change the response parser (already updated by the OutputFormat Change Brief)

---

## Design Notes
- Download buttons should be compact and sit alongside the doc sub-tabs, not take up a full row
- Use the existing ghost button style (transparent bg, border, subtle text) for download and upload buttons
- The uploaded files list should be clean and compact — use small file chips with icons, not a full table
- The generation options panel should feel like a natural conclusion to the intake form, not a separate modal or popup
- Option cards should have a left-side icon/emoji, a title, a short description, and the action button
- The active/selected option should not be persistent — both options are always available
- File delete (🗑️) should ask for confirmation before removing

---

## localStorage Size Considerations
- Multiple .docx uploads per slot will increase storage usage
- Enforce the existing 5MB per-file limit
- Add a total project storage indicator if feasible (stretch goal, not required)
- If localStorage save fails, show an error toast

---

## Dependencies
- Add `jszip` as a project dependency for zip file creation
- Import dynamically: `const JSZip = (await import('jszip')).default;`

---

## Testing
After implementation, verify:

**Download buttons:**
1. "Download All .md" creates a zip with all .md docs that have content
2. Zip filenames are correct (prd.md, app-flow.md, etc.)
3. "Download All .docx" creates a zip with all uploaded .docx files
4. .docx download button is disabled when no .docx files are uploaded
5. Both buttons work when only some documents have content

**Multi-upload:**
6. "Upload .md" button lets you upload a file — it renders in the content area
7. Upload a second .md file for the same doc — both appear in the uploaded files list
8. The latest .md upload is displayed as the main content
9. "View" on an older .md upload switches the displayed content
10. Upload .docx files — they appear as file chips with download buttons
11. Upload multiple .docx files for the same doc — all are listed
12. Delete a file from the uploads list (with confirmation)
13. All uploads persist after page refresh

**Generation options:**
14. On the last intake section, the generation options panel appears below the last question
15. "Copy Prompt" copies to clipboard AND saves a version snapshot
16. "Generate via API" works as before (calls API, shows results in Docs tab)
17. Generate button is disabled when required fields are missing
18. Both methods produce the same version number
19. Info note appears below both options

---

## Claude Code Update Prompt

After reading this change brief, create an update plan listing:
1. Which lines in Cerebro_Master_Code.jsx to modify
2. New state variables to add
3. New dependencies to install (jszip)
4. New handler functions to add
5. The order of implementation
6. How to test each change

Do NOT write code until I approve the plan.
