# Change Brief: V5 — Reference Files Metadata in Intake Output
**Product:** CEREBRO
**Date:** April 16, 2026
**Version:** V5
**Prepared for:** Claude Code

---

## Summary

Users can attach files (images, PDFs, sketches) to intake questions via the 📎 button, but those attachments currently exist only in the CEREBRO UI — they are never referenced in the prompt produced by `buildIntake()`. When users copy the prompt into a new Claude chat, Claude has no idea those files exist. This change adds attachment metadata to the intake output: an inline note under each answer that has files, plus a consolidated Reference Files appendix at the end of the prompt. File contents are **not** transmitted — only filenames and MIME types — along with a short instruction telling Claude to ask the user to drag the actual files into the chat if visual analysis is needed.

---

## What's Changing

### buildIntake() — Per-question inline attachment note
- After writing each question's answer, check if `files[q.id]` has any entries
- If it does, append an italicized line immediately after the answer in the format:
  - `*Attached files: filename1.png, filename2.pdf, filename3.jpg*`
- Filenames only — no MIME types in the inline note (keeps it readable)
- Skip the line entirely if the question has no attachments
- Indentation and blank-line spacing should match the existing answer formatting

### buildIntake() — Reference Files appendix at the end of the output
- After all sections have been written, check if any question has attachments
- If at least one question has files, append a new section:
  - Header: `## 📎 Reference Files Attached`
  - For each question that has files, a sub-block grouped by question **label** (not ID):
    - Sub-header: `**[Question Label]**` (bold, not H3)
    - Under it, a bullet list of `- filename.ext (MIME type)`
  - Blank line between each question group
- After the file listings, include this static note:
  - `> Note: These files were attached in CEREBRO but not transmitted via clipboard. If you want me to analyze the actual content, attach them directly to this chat before sending.`
- If **zero** questions have attachments across the whole intake, do not render the appendix at all — keep the prompt clean

---

## What's NOT Changing

- File attachment UI — 📎 button, `FileChip` component, `addF`/`rmF` functions — no changes
- `files` state object structure — no changes
- `AVATAR` and `SPIRIT` question arrays — no changes
- Copy Prompt button and Generate via API button — no logic changes to the buttons themselves
- `SYS` system prompt — no changes
- `handleGen` and the response parser — no changes
- Local generators `genClaudeMd`, `genBrief`, `genPrompts` — no changes
- Docs tab, Workflow tab, multi-project workspace, mode selector — no changes
- localStorage schema — no changes (files are not persisted to localStorage, they live only in React state — this behavior is preserved)
- `app/api/generate/route.ts` — no changes
- Single-file JSX architecture — no splitting

---

## Design Notes

- The inline note should be subtle — italic, muted. It's signal for Claude, not a headline.
- The appendix header should use the same `## ` markdown level as existing section headers so it renders consistently when pasted into Claude.
- Group by question **label** (human-readable, e.g. "Primary User Journey") rather than question ID (`user_journey`) so Claude can correlate files to the answer they belong to.
- MIME type in the appendix gives Claude a cleaner signal than filename extension alone (e.g. `image/png` tells it the file is an image even if the filename is weird).
- The closing "drag them into this chat" note is critical — it closes the loop and converts a silent gap into a prompt-and-respond moment.
- Since the 📎 UI already lets users attach multiple files per question, make sure multi-file questions render correctly in both the inline note and the appendix.

---

## Affected Documents

- [ ] PRD — minor: document the reference file behavior in the intake output section
- [ ] App Flow — no
- [ ] UI Guide — no
- [ ] Backend Spec — no
- [ ] Security Checklist — no

---

## Test Checklist

- [ ] Load FamilyTable test data using the 🧪 Test button
- [ ] Navigate to the UI/UX section and attach 2 image files (PNG and JPG) via 📎
- [ ] Navigate to another section (e.g. Personas) and attach 1 PDF file
- [ ] Click Copy Prompt and paste the result into a plain text editor
- [ ] Verify the UI/UX question shows `*Attached files: ...*` listing both images on the line immediately below the answer
- [ ] Verify the Personas question shows `*Attached files: ...*` listing the PDF below the answer
- [ ] Scroll to the end of the pasted prompt — verify the `## 📎 Reference Files Attached` appendix appears
- [ ] Verify the appendix groups files under the correct human-readable question labels, not IDs
- [ ] Verify each file entry in the appendix shows filename and MIME type (e.g. `- wireframe.png (image/png)`)
- [ ] Verify the closing "drag them into this chat" note appears after the file listings
- [ ] Remove all attachments from all questions, click Copy Prompt again, paste to editor
- [ ] Verify no inline `*Attached files*` lines appear anywhere
- [ ] Verify the `## 📎 Reference Files Attached` appendix is completely absent
- [ ] Regression: confirm all text answers still render under their question headings exactly as before
- [ ] Regression: confirm the Generate via API button still works (no parser errors introduced)
- [ ] Regression: confirm existing intake navigation, file attach UI, and file chips are unaffected

---

## Claude Code Prompt

Paste this into a new Claude Code session:

---

Read `change-brief-v5.md` and `change-log.md` in this project folder.

This is a V5 update. Make ONLY the changes listed in the brief.

**Before writing any code:**
1. List every file you will modify (should be `Cerebro_Master_Code.jsx` only)
2. Describe the exact changes you will make to `buildIntake()` — both the inline note logic and the appendix logic
3. Confirm you will not touch any of the items in the "What's NOT Changing" section
4. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only. The entire change should live inside `buildIntake()` and require no new state, no new UI components, and no schema changes.

---
