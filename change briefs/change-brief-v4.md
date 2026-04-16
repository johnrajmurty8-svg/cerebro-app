# Change Brief: V4 — Test Data Replacement (FlowBoard → Family Recipe Book)
**Product:** CEREBRO
**Date:** April 8, 2026
**Version:** V4
**Prepared for:** Claude Code

---

## Summary

Replace the built-in FlowBoard test data project with a new sample project: **FamilyTable** — a family recipe book app where users can upload photos, raw recipe notes, and ingredient lists to generate and store full structured recipes. This gives CEREBRO a richer, more relatable demo project that showcases the intake form's depth across a consumer/lifestyle use case rather than a B2B SaaS product.

---

## What's Changing

### Test Data Object (`loadTestData` function in `Cerebro_Master_Code.jsx`)

Replace the entire `td` object inside `loadTestData()` with FamilyTable data. All field IDs remain the same — only the values change.

**New test project: FamilyTable**
- **Product name:** FamilyTable
- **One-liner:** A family recipe book app where you upload photos, handwritten notes, and ingredient lists — and AI generates a beautiful, searchable full recipe to preserve for generations
- **Author:** Jamie Okafor, Product Designer & Home Cook
- **Stakeholders:**
  - Nadia Okafor — Engineering Lead (Approver)
  - Marcus Teo — Mobile Developer (Contributor)
  - Priya Okafor — Grandmother / Primary User (Informed)
  - Sam Chen — QA Lead (Consulted)
- **Target date:** Q4 2026 — October 31 target
- **Version:** 0.1 (Draft)
- **Team size:** 1 designer/PM (me), 1 mobile developer + Claude Code for acceleration. Using Figma for design, VS Code + Claude Code for dev.
- **Problem statement:** Family recipes are stored on scraps of paper, in notebooks, and in people's heads. When grandparents pass away, these recipes are often lost forever. Digitising them is painful — scanning, transcribing, guessing at missing measurements, and reformatting all takes hours. There's no easy way to capture the real story behind a recipe along with the instructions.
- **Who's affected:** Primary: Home cooks (25–65) who want to preserve family food heritage. Secondary: Family members who want to browse and cook from a shared digital cookbook. Tertiary: Food bloggers and recipe creators who want a faster way to document their cooking.
- **User journey:**
  1. Grandma cooks her signature chicken curry from memory
  2. Jamie photographs the dish, the handwritten recipe card, and the raw ingredients
  3. Uploads all three photos into FamilyTable
  4. Adds a few voice or text notes: "less chilli than the card says, Grandma always adjusts"
  5. FamilyTable AI generates a full structured recipe: title, servings, ingredients with measurements, step-by-step instructions, tips, and a story intro
  6. Jamie reviews, edits a few lines, and saves
  7. Recipe is added to the family cookbook — browsable by family member, cuisine, occasion, or ingredient
  8. Family members can comment, rate, and add their own variations
- **Jobs to be done:**
  - When I find a handwritten recipe card, I want to photograph it and get a clean digital version so I don't have to transcribe it manually
  - When I cook from memory, I want to record what I made quickly so I can repeat it later
  - When a family member passes, I want all their recipes safely stored and shareable so future generations can cook their dishes
  - When my kids ask how to make a dish, I want to send them a clear, tested recipe with photos so they can cook it themselves
- **Product goals:**
  1. Allow upload of photos, notes, and ingredient lists — generate a full structured recipe in under 30 seconds
  2. Store and organise all recipes in a searchable family cookbook
  3. Support multi-user family sharing — every family member can contribute and browse
  4. Achieve 80% recipe generation accuracy without manual correction
  5. Reach 10,000 active family cookbooks within 6 months of launch
- **Success metrics:**
  - Recipe generation time: under 30 seconds per recipe
  - Edit rate after generation: less than 20% of fields need manual correction
  - Weekly active family members per cookbook: 3+
  - Recipe retention rate: 90%+ of generated recipes saved (not discarded)
  - NPS: 60+ within 3 months
- **MVP scope (in):** Photo upload (up to 3 images per recipe), text/voice note input, AI recipe generation (title, servings, ingredients, steps, tips, story intro), recipe card view, family cookbook dashboard, basic search by name or ingredient, family invite link sharing
- **MVP scope (out):** Video upload, grocery list generation, meal planning, public recipe sharing, print formatting, social features beyond family sharing, nutritional analysis
- **Core screens:** Onboarding / family cookbook setup, Home dashboard (recent + featured recipes), Upload screen (photo + notes input), AI generation loading screen, Recipe review + edit screen, Recipe card view, Cookbook browser (search, filter by cuisine/occasion/family member), Family member profiles, Settings
- **Tech stack:** React Native (iOS + Android), Node.js backend, PostgreSQL, AWS S3 for image storage, Claude API for recipe generation and OCR, Expo for local dev and builds
- **Auth:** Email/password + Google Sign-In; family invite via shareable link; role-based access (Owner, Contributor, Viewer)
- **Integrations:** Claude API (recipe generation, OCR on handwritten cards), AWS S3 (image storage), Firebase Cloud Messaging (family activity notifications), Apple/Google Sign-In
- **Data model (key entities):**
  - User (id, name, email, avatar, family_id, role)
  - Family (id, name, cookbook_name, invite_code, created_at)
  - Recipe (id, family_id, created_by, title, description, servings, prep_time, cook_time, cuisine, occasion, story, status, created_at, updated_at)
  - Ingredient (id, recipe_id, name, quantity, unit, notes)
  - Step (id, recipe_id, order, instruction, tip)
  - RecipeImage (id, recipe_id, type [dish/card/ingredients], s3_url, caption)
  - Comment (id, recipe_id, user_id, body, created_at)
  - Variation (id, recipe_id, user_id, title, notes)
- **Security requirements:** Image uploads scanned for inappropriate content before storage; family invite links expire after 7 days; PII limited to name, email, and avatar; no public access to family cookbooks without invite; HTTPS enforced; API keys server-side only
- **Risks:**
  - AI generation quality varies with photo quality — mitigation: clear upload guidelines and image quality warnings
  - Handwritten recipe OCR accuracy on old/faded cards — mitigation: allow manual text correction as fallback
  - Family sharing complexity — mitigation: start with invite-link simplicity, no complex role management in MVP
- **Open questions:**
  - Should we support voice memo input at launch or defer to V2?
  - How do we handle recipes that exist in multiple family variations (e.g. everyone has their own twist on the curry)?
  - Should generation be triggered automatically on upload or only on explicit user action?

### Tooltip / title attribute on the 🧪 Test button

Update the `title` attribute from:
```
"Fill form with sample FlowBoard project"
```
to:
```
"Fill form with sample FamilyTable project"
```

---

## What's NOT Changing

- Intake form — Avatar State and Spirit Guide question sets, section structure, field IDs, navigation, sidebar, progress bars
- All 8-document generation pipeline logic — prompt construction, API calls, parser, doc slots
- Multi-project workspace — dashboard, project cards, status badges, project switcher, archive/delete
- Mode selector — Avatar State / Spirit Guide toggle
- The 🧪 Test button itself — location, styling, and behaviour (click to load) unchanged
- Workflow tab — all phases, prompts, checkboxes unchanged
- Versioning logic — no version snapshots, no diff engine changes
- localStorage project data structure — no schema changes
- API proxy (`app/api/generate/route.ts`) — do not touch
- Single-file JSX architecture — no file splitting

---

## Design Notes

No visual or structural changes. This is a data-only swap inside the `loadTestData()` function. The button, its placement, and its behaviour are all unchanged. Only the `td` object values and one `title` attribute change.

---

## Affected Documents

- [ ] PRD — No change
- [ ] App Flow — No change
- [ ] UI Guide — No change (button appearance unchanged)
- [ ] Backend Spec — No change
- [ ] Security Checklist — No change

---

## Test Checklist

- [ ] Click the 🧪 Test button — confirm it loads without error
- [ ] Confirm the product name field shows "FamilyTable" (not "FlowBoard")
- [ ] Navigate through all intake sections — confirm all fields are populated with FamilyTable data
- [ ] Confirm the button tooltip reads "Fill form with sample FamilyTable project"
- [ ] Click Copy Prompt — confirm the copied prompt references FamilyTable, not FlowBoard
- [ ] Generate documents (via API or clipboard paste) — confirm the PRD reflects the FamilyTable product
- [ ] Confirm no FlowBoard references remain anywhere in the loaded test data
- [ ] Regression: confirm existing projects in localStorage are not affected by loading the new test data
- [ ] Regression: confirm Reset button still clears the form correctly after loading FamilyTable test data

---

## Claude Code Prompt

Paste this into a new Claude Code session:

---

Read `change-brief-v4.md` and `change-log.md` in this project folder.

This is a V4 update. Make ONLY the changes listed in the brief.

**Before writing any code:**
1. List every file you will modify
2. Describe what you will change in each file
3. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only.

---
