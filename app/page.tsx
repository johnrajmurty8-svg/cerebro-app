'use client'

type QuestionDef = { id: string; label: string; type: string; placeholder: string; guidance: string; required?: boolean; };
type SectionDef = { id: string; title: string; icon: string; description: string; questions: QuestionDef[]; };
type DocxFileEntry = { name: string; data: string; uploadedAt: string };
type MdUploadEntry = { name: string; content: string; uploadedAt: string };
type Project = { id: string; name: string; status: string; mode: string | null; created: string; lastEdited: string; currentAnswers: Record<string, string>; docs: Record<string, string> | null; workflowStatus: Record<string, boolean>; docxFiles?: Record<string, DocxFileEntry[]>; docSources?: Record<string, "api" | "uploaded" | "pasted">; mdUploads?: Record<string, MdUploadEntry[]>; };
// NOTE: Anthropic API calls from localhost will fail with CORS.
// PRIMARY FLOW: Use the 📋 Copy button on the last intake section,
// then paste into Claude.ai to generate your documents.

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══ AVATAR STATE questions (technical, 12 sections) ═══ */
const AVATAR=[
  {id:"doc_ctrl",title:"Document Control",icon:"📋",description:"PRD metadata and stakeholders.",questions:[
    {id:"product_name",label:"Product / Project Name",type:"text",placeholder:"e.g. SnapInvoice — AI Invoice Manager",guidance:"Clear, memorable name.",required:true},
    {id:"one_liner",label:"One-Line Description",type:"text",placeholder:"e.g. AI-powered invoicing for freelancers",guidance:"Concise tagline.",required:true},
    {id:"author",label:"Author / Owner",type:"text",placeholder:"e.g. Jane Doe, PM",guidance:"Accountable person.",required:true},
    {id:"stakeholders",label:"Key Stakeholders",type:"textarea",placeholder:"e.g. Sarah Kim — Eng Lead (Approver)\nMarcus Chen — Design (Contributor)",guidance:"RACI roles."},
    {id:"target_date",label:"Target Launch Date",type:"text",placeholder:"e.g. Q3 2026",guidance:"Rough quarter is fine."},
  ]},
  {id:"prob",title:"Problem & Opportunity",icon:"🔍",description:"The problem and why it matters.",questions:[
    {id:"problem_statement",label:"Problem Statement",type:"textarea",placeholder:"e.g. Freelancers spend 5+ hrs/week on invoicing...",guidance:"Specific, data-backed pain.",required:true},
    {id:"who_affected",label:"Who is affected?",type:"textarea",placeholder:"e.g. Solo freelancers billing 5-30 clients/month",guidance:"Specific segments."},
    {id:"current_solutions",label:"Current Solutions & Gaps",type:"textarea",placeholder:"e.g. Spreadsheets (40%), QuickBooks (30%)...",guidance:"Alternatives and what's broken."},
    {id:"business_case",label:"Business Opportunity",type:"textarea",placeholder:"e.g. $4.2B market, 14% YoY growth",guidance:"Market size, competitive gap."},
    {id:"cost_of_inaction",label:"Cost of Inaction",type:"textarea",placeholder:"e.g. Lose first-mover advantage...",guidance:"Why now."},
  ]},
  {id:"personas",title:"User Personas & Journey",icon:"👤",description:"Users and their experience.",questions:[
    {id:"primary_persona",label:"Primary Persona",type:"textarea",placeholder:"Name: Alex\nRole: Freelance designer\nGoals: Get paid faster\nFrustrations: Chasing payments",guidance:"Name, role, goals, frustrations, tech level.",required:true},
    {id:"secondary_personas",label:"Secondary Personas",type:"textarea",placeholder:"e.g. Sam the Agency Owner...",guidance:"Optional 1-2 more."},
    {id:"user_journey",label:"Primary User Journey",type:"textarea",placeholder:"1. Finishes project → 2. Auto-invoice → 3. Send → 4. Remind → 5. Paid",guidance:"Step by step."},
    {id:"jobs_to_be_done",label:"Jobs to Be Done",type:"textarea",placeholder:"When I finish a project, I want to invoice instantly so I don't lose momentum",guidance:"When [situation], I want [action], so that [outcome]."},
  ]},
  {id:"goals",title:"Goals & Metrics",icon:"🎯",description:"Success measurement.",questions:[
    {id:"product_goals",label:"Top 3-5 Goals",type:"textarea",placeholder:"1. Invoice time: 15min → 2min\n2. Collection: 34 → 14 days\n3. 1K users in 6 months",guidance:"Specific, measurable.",required:true},
    {id:"kpis",label:"KPIs",type:"textarea",placeholder:"Invoice time: baseline 15min → target <2min\nActivation: 70% in 24h",guidance:"Metric, baseline, target."},
    {id:"leading_indicators",label:"Leading Indicators",type:"textarea",placeholder:"Sign-up to first invoice rate, payment link CTR",guidance:"Early signals."},
  ]},
  {id:"scope",title:"Scope Definition",icon:"📐",description:"What's in and out.",questions:[
    {id:"in_scope",label:"In Scope (MVP)",type:"textarea",placeholder:"• AI invoices\n• Stripe payments\n• Auto-reminders\n• Dashboard",guidance:"Every feature in this release.",required:true},
    {id:"out_of_scope",label:"Out of Scope",type:"textarea",placeholder:"• Native mobile — Phase 2\n• Multi-currency — Phase 2\n• Tax calc — never",guidance:"Equally important.",required:true},
    {id:"future_phases",label:"Future Phases",type:"textarea",placeholder:"Phase 2: Mobile + multi-currency\nPhase 3: Accounting integrations",guidance:"Later roadmap."},
  ]},
  {id:"func",title:"Functional Requirements",icon:"⚙️",description:"Features and behaviors.",questions:[
    {id:"core_features",label:"Core Features / Epics",type:"textarea",placeholder:"Epic 1: Invoice Generation\n- Auto-generate from project\n- Edit line items\n\nEpic 2: Payments\n- Stripe integration\n- Payment links",guidance:"Group by epic. Claude expands into numbered FRs.",required:true},
    {id:"user_stories",label:"User Stories",type:"textarea",placeholder:"As a freelancer, I want to generate invoices from project details so I don't enter line items manually",guidance:"As a [role], I want [action], so that [outcome]."},
    {id:"priority_notes",label:"Priority Notes",type:"textarea",placeholder:"Invoice gen + payments = MUST. Dashboard = SHOULD. Branding = COULD.",guidance:"MoSCoW guidance."},
  ]},
  {id:"nonfunc",title:"Non-Functional Requirements",icon:"🛡️",description:"Performance, security, accessibility.",questions:[
    {id:"performance",label:"Performance",type:"textarea",placeholder:"Page load <2s, 10K concurrent users",guidance:"Load times, throughput."},
    {id:"security",label:"Security & Compliance",type:"textarea",placeholder:"OAuth 2.0, AES-256, GDPR for EU",guidance:"Auth, encryption, compliance."},
    {id:"accessibility",label:"Accessibility",type:"textarea",placeholder:"WCAG 2.1 AA, keyboard nav, screen readers",guidance:"Standards."},
    {id:"platforms",label:"Platform Support",type:"textarea",placeholder:"Chrome, Firefox, Safari, Edge. Responsive. Min 375px.",guidance:"Browsers, devices.",required:true},
  ]},
  {id:"tech",title:"Technical Architecture",icon:"🏗️",description:"Stack, integrations, AI instructions.",questions:[
    {id:"tech_stack",label:"Tech Stack",type:"textarea",placeholder:"Next.js + Tailwind, Supabase, Clerk auth, Stripe, Claude API",guidance:"Preferences or 'recommend for me'."},
    {id:"integrations",label:"Integrations",type:"textarea",placeholder:"Stripe, SendGrid, Google OAuth, Plaid (Phase 2)",guidance:"External services."},
    {id:"data_model",label:"Key Data Entities",type:"textarea",placeholder:"Users, Clients, Invoices, Line Items, Payments, Reminders",guidance:"Main objects and relationships."},
    {id:"ai_instructions",label:"AI Agent Instructions",type:"textarea",placeholder:"Claude Code for backend, Stitch for UI. Atomic components. Tests for all endpoints.",guidance:"Instructions for AI coding tools."},
  ]},
  {id:"ux",title:"UX / UI",icon:"🎨",description:"Design direction and screens.",questions:[
    {id:"design_direction",label:"Design Direction",type:"textarea",placeholder:"Clean SaaS, like Linear/Notion. Navy + blue. Light mode primary.",guidance:"Visual feel, references, colors.",required:true},
    {id:"key_screens",label:"Key Screens",type:"textarea",placeholder:"1. Dashboard\n2. Invoice Builder\n3. Client View\n4. Settings",guidance:"Main pages."},
    {id:"navigation",label:"Navigation",type:"textarea",placeholder:"Left sidebar: Dashboard, Invoices, Clients, Settings. Mobile: bottom tabs.",guidance:"Nav structure."},
    {id:"interactions",label:"Interaction Patterns",type:"textarea",placeholder:"Drag-and-drop line items, inline editing, AI suggestion chips",guidance:"Micro-interactions."},
  ]},
  {id:"release",title:"Release Plan",icon:"🚀",description:"Timeline and milestones.",questions:[
    {id:"phases",label:"Release Phases",type:"textarea",placeholder:"Phase 0: Discovery (2wk)\nPhase 1: MVP (6wk)\nPhase 2: Beta (2wk)\nPhase 3: Launch (1wk)",guidance:"Phases with durations."},
    {id:"milestones",label:"Key Milestones",type:"textarea",placeholder:"Design: Apr 15\nAPI: May 30\nBeta: Jun 15\nLaunch: Jul 1",guidance:"Dates."},
    {id:"launch_criteria",label:"Go/No-Go Criteria",type:"textarea",placeholder:"GO: P0 bugs resolved, load test passed\nNO-GO: Any P0 open",guidance:"Launch requirements."},
    {id:"team_size",label:"Team & Resources",type:"textarea",placeholder:"1 PM + 1 designer + 2 engineers + Claude Code",guidance:"Team composition."},
  ]},
  {id:"risks",title:"Risks & Mitigations",icon:"⚠️",description:"What could go wrong.",questions:[
    {id:"known_risks",label:"Known Risks",type:"textarea",placeholder:"1. Stripe complexity\n2. AI accuracy\n3. Solo builder",guidance:"All risk categories."},
    {id:"mitigations",label:"Mitigations",type:"textarea",placeholder:"1. Use hosted checkout\n2. Always preview before send\n3. Document everything",guidance:"Plan B for each."},
    {id:"dependencies",label:"External Dependencies",type:"textarea",placeholder:"Stripe approval (3-5 days), SendGrid verification",guidance:"Blocking external items."},
  ]},
  {id:"extra",title:"Additional Context",icon:"📎",description:"Anything else.",questions:[
    {id:"existing_research",label:"Research / Documents",type:"textarea",placeholder:"12 user interviews, key: 90% want auto-reminders",guidance:"Prior research."},
    {id:"competitors",label:"Competitors",type:"textarea",placeholder:"FreshBooks ($17/mo, no AI)\nWave (free, limited)\nXero (enterprise)",guidance:"Competitive landscape."},
    {id:"budget",label:"Budget & Constraints",type:"textarea",placeholder:"$0 infra, 8 weeks max, no dedicated QA",guidance:"Hard limits."},
    {id:"anything_else",label:"Anything Else",type:"textarea",placeholder:"Pitching YC in September, must be demo-ready by August",guidance:"Final context."},
  ]},
];

/* ═══ SPIRIT GUIDE questions (simplified, 8 sections) ═══ */
const SPIRIT=[
  {id:"basics",title:"The Basics",icon:"💡",description:"Your product idea in simple terms.",questions:[
    {id:"product_name",label:"What's it called?",type:"text",placeholder:"e.g. SnapInvoice",guidance:"Short, memorable name.",required:true},
    {id:"one_liner",label:"One sentence description",type:"text",placeholder:"e.g. An app that helps freelancers invoice in under 2 minutes",guidance:"Coffee-shop pitch.",required:true},
    {id:"author",label:"Your name",type:"text",placeholder:"e.g. Jane Doe, PM",guidance:"Who's responsible?",required:true},
    {id:"target_date",label:"Launch target?",type:"text",placeholder:"e.g. August 2026",guidance:"Even rough is fine."},
    {id:"team_size",label:"Your team?",type:"textarea",placeholder:"e.g. Just me + AI tools",guidance:"Solo is fine."},
  ]},
  {id:"problem",title:"The Problem",icon:"🔍",description:"What pain point are you solving?",questions:[
    {id:"problem_statement",label:"What problem?",type:"textarea",placeholder:"e.g. Freelancers waste 5+ hrs/week on invoicing",guidance:"Who suffers and how?",required:true},
    {id:"who_affected",label:"Who has it?",type:"textarea",placeholder:"e.g. Solo freelancers billing 5-30 clients",guidance:"Specific people."},
    {id:"current_solutions",label:"Current solutions?",type:"textarea",placeholder:"e.g. Spreadsheets, QuickBooks (too complex)",guidance:"What's broken?"},
    {id:"business_case",label:"Why now?",type:"textarea",placeholder:"e.g. AI can auto-generate invoices, no one's done it well",guidance:"Timing."},
  ]},
  {id:"users",title:"Your Users",icon:"👤",description:"Who uses it?",questions:[
    {id:"primary_persona",label:"Main user",type:"textarea",placeholder:"Alex, 32, freelance designer, hates admin, tech-savvy",guidance:"Name, age, goals, frustrations.",required:true},
    {id:"secondary_personas",label:"Other users?",type:"textarea",placeholder:"Agency owners, accountants",guidance:"Optional."},
    {id:"user_journey",label:"Ideal experience",type:"textarea",placeholder:"1. Finish project → 2. App suggests invoice → 3. Send → 4. Auto-remind → 5. Paid",guidance:"Step by step."},
  ]},
  {id:"features",title:"What It Does",icon:"⚙️",description:"Features list.",questions:[
    {id:"core_features",label:"Must-have features",type:"textarea",placeholder:"• Create invoices\n• Stripe payments\n• Auto-reminders\n• Dashboard",guidance:"Can't launch without.",required:true},
    {id:"priority_notes",label:"Nice-to-have",type:"textarea",placeholder:"• Custom branding\n• Multi-currency\n• Reports",guidance:"After launch."},
    {id:"out_of_scope",label:"NOT building",type:"textarea",placeholder:"• No mobile app\n• No tax features",guidance:"Prevents scope creep.",required:true},
    {id:"future_phases",label:"V2/V3 vision?",type:"textarea",placeholder:"V2: Mobile + multi-currency",guidance:"Long-term."},
  ]},
  {id:"design",title:"Look & Feel",icon:"🎨",description:"Visual direction.",questions:[
    {id:"design_direction",label:"Describe the vibe",type:"textarea",placeholder:"Clean, modern, like Notion. Light mode, professional.",guidance:"Reference apps you love.",required:true},
    {id:"key_screens",label:"Main screens?",type:"textarea",placeholder:"Dashboard, Invoice Builder, Client View, Settings",guidance:"Names + one line each."},
    {id:"interactions",label:"Apps that inspire you?",type:"textarea",placeholder:"Notion, Stripe Dashboard, Linear",guidance:"Design references."},
  ]},
  {id:"platform",title:"Platform & Access",icon:"📱",description:"Where and how.",questions:[
    {id:"platforms",label:"Where should it work?",type:"textarea",placeholder:"Web app, mobile-friendly",guidance:"Web? Mobile? Both?",required:true},
    {id:"security",label:"How will users log in?",type:"textarea",placeholder:"Google sign-in + email/password",guidance:"Login method."},
    {id:"integrations",label:"Payments?",type:"textarea",placeholder:"Free to start, $10/mo via Stripe",guidance:"Billing model."},
    {id:"data_model",label:"What data will you store?",type:"textarea",placeholder:"Names, emails, invoices, client info. Stripe handles cards.",guidance:"Determines privacy/security."},
  ]},
  {id:"tech",title:"Tech Preferences",icon:"🛠️",description:"Skip what you don't know.",questions:[
    {id:"tech_stack",label:"Preferred tech?",type:"textarea",placeholder:"Next.js + Supabase, or 'Claude should pick'",guidance:"Or say 'recommend'."},
    {id:"ai_instructions",label:"AI tools?",type:"textarea",placeholder:"Claude Code for backend, Stitch for UI",guidance:"Which AI tools."},
  ]},
  {id:"success",title:"Success & Timeline",icon:"🎯",description:"How will you know it works?",questions:[
    {id:"product_goals",label:"Success metrics?",type:"textarea",placeholder:"100 users in month 1, invoices paid in 14 days",guidance:"3-5 metrics.",required:true},
    {id:"phases",label:"Timeline?",type:"textarea",placeholder:"Wk 1-2: Design, Wk 3-6: Build, Wk 7: Beta, Wk 8: Launch",guidance:"Rough phases."},
    {id:"known_risks",label:"What could go wrong?",type:"textarea",placeholder:"Stripe is complex, I'm solo, legal unknowns",guidance:"Claude makes mitigation plans."},
    {id:"budget",label:"Budget?",type:"textarea",placeholder:"Free tiers, must launch by September",guidance:"Hard limits."},
  ]},
];

/* ═══ System prompt, generators ═══ */
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

function genClaudeMd(a: Record<string,string>){return `# ${a.product_name||"Product"} — Claude Code Instructions\n\n## Overview\n${a.one_liner||"See project-brief.md"}\n\n## Stack\n${a.tech_stack||"Best modern stack"}\n\n## Rules\n- Read project-brief.md FIRST\n- plan.md before coding — wait for approval\n- Follow design.md, backend-spec.md, security-checklist.md, app-flow.md\n- TypeScript, tests, small components, env vars\n\n## Workflow\n1. Read doc → 2. Plan → 3. Approve → 4. Build → 5. Test → 6. Report\n\n## Principles\nSimplicity. No shortcuts. Minimal impact. Ask when unsure.`;}
function genBrief(a: Record<string,string>){return `# ${a.product_name||"Product"} — Brief\n\n> ${a.one_liner||""}\n\nOwner: ${a.author||"TBD"} | Launch: ${a.target_date||"TBD"} | Team: ${a.team_size||"Solo+AI"}\n\n## Build Order\n1. Setup 2. DB+Auth 3. API 4. UI Shell 5. Features 6. Polish 7. Deploy\n\n## Docs\nprd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md, CLAUDE.md`;}

const CEREBRO_PAYLOAD_VERSION="1.0";

function parseP1Payload(text: string){
  const start=text.indexOf("---CEREBRO-PAYLOAD---");
  const end=text.indexOf("---END-PAYLOAD---");
  if(start===-1||end===-1)return{error:"no_delimiter"};
  const jsonStr=text.slice(start+21,end).trim();
  try{
    const obj=JSON.parse(jsonStr) as Record<string,string>;
    const fields: Record<string,string>={};let count=0;
    Object.entries(obj).forEach(([k,v])=>{
      if(k==="payload_version"||k==="mode")return;
      if(v&&String(v).trim()){fields[k]=String(v).trim();count++;}
    });
    return{fields,mode:(obj.mode||null) as string|null,count};
  }catch{
    return{error:"invalid_json"};
  }
}

/* ═══ Helpers ═══ */
function FileChip({file,onRemove}: {file: File, onRemove: ()=>void}){return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f7f6f3",border:"1px solid #e3e2e0",borderRadius:6,padding:"3px 8px",fontSize:11,maxWidth:160}}><span style={{fontSize:12}}>📁</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:"#787774"}}>{file.name}</span><button onClick={onRemove} style={{background:"none",border:"none",color:"#9b9b9b",cursor:"pointer",fontSize:13,padding:0}}>×</button></span>;}

const TABS=["intake","results","workflow"];
const TL: Record<string,string>={intake:"Intake",results:"Docs",workflow:"Workflow"};
const DT=[
  {key:"prd",label:"📋 PRD",file:"prd.md + prd.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"appFlow",label:"🗺️ Flow",file:"app-flow.md + app-flow.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"design",label:"🎨 UI",file:"design.md + design.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"backend",label:"⚙️ Backend",file:"backend-spec.md + backend-spec.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"security",label:"🛡️ Security",file:"security-checklist.md + security-checklist.docx",uploadable:true,accepts:{md:".md,.txt,.markdown",docx:".docx"}},
  {key:"claudeMd",label:"🤖 CLAUDE",file:"CLAUDE.md",uploadable:false},
  {key:"projectBrief",label:"📦 Brief",file:"project-brief.md",uploadable:false},
  {key:"prompts",label:"💬 Prompts",file:"prompts.md",uploadable:false},
];

/* ═══ STORAGE HELPERS ═══ */
const genId=()=>`proj_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const blankProject=(mode: string|null, id?: string)=>({id:id||genId(),name:"Untitled Project",status:"draft",mode,created:new Date().toISOString(),lastEdited:new Date().toISOString(),currentAnswers:{},docs:null,workflowStatus:{}});

function saveStorage(data: {projects: Project[], activeProjectId: string|null}){try{localStorage.setItem("cerebro-projects",JSON.stringify(data));}catch{}}
function migrateIfNeeded(){try{const r=localStorage.getItem("cerebro-projects");if(r){const d=JSON.parse(r);if(d?.projects){const patched={...d,projects:d.projects.map((p: Project)=>({...p,workflowStatus:p.workflowStatus||{}}))};return patched;}}}catch{}try{const old=localStorage.getItem("cerebro-v1");if(old){const d=JSON.parse(old);const id=genId();const project={id,name:d.ans?.product_name||"Migrated Project",status:"draft",mode:d.mode||"avatar",created:new Date().toISOString(),lastEdited:new Date().toISOString(),currentAnswers:d.ans||{},docs:null,workflowStatus:{}};const data={projects:[project],activeProjectId:null};saveStorage(data);localStorage.removeItem("cerebro-v1");return data;}}catch{}return{projects:[],activeProjectId:null};}

/* ═══ STATUS CONFIG ═══ */
const SC={
  draft:    {label:"Draft",    color:"#787774", bg:"rgba(120,119,116,0.1)"},
  active:   {label:"Active",   color:"#2383e2", bg:"rgba(35,131,226,0.1)"},
  building: {label:"Building", color:"#d9730d", bg:"rgba(217,115,13,0.1)"},
  shipped:  {label:"Shipped",  color:"#448361", bg:"rgba(68,131,97,0.1)"},
  archived: {label:"Archived", color:"#787774", bg:"rgba(120,119,116,0.06)"},
  deleted:  {label:"Deleted",  color:"#eb5757", bg:"rgba(235,87,87,0.1)"},
};

/* ═══ TEST DATA ═══ */
const TEST_DATA={product_name:"FamilyTable",one_liner:"A family recipe book app where you upload photos, handwritten notes, and ingredient lists — and AI generates a beautiful, searchable full recipe to preserve for generations",author:"Jamie Okafor, Product Designer & Home Cook",stakeholders:"• Nadia Okafor — Engineering Lead (Approver)\n• Marcus Teo — Mobile Developer (Contributor)\n• Priya Okafor — Grandmother / Primary User (Informed)\n• Sam Chen — QA Lead (Consulted)",target_date:"Q4 2026 — October 31 target",team_size:"1 designer/PM (me), 1 mobile developer + Claude Code for acceleration. Using Figma for design, VS Code + Claude Code for dev.",problem_statement:"Family recipes are stored on scraps of paper, in notebooks, and in people's heads. When grandparents pass away, these recipes are often lost forever. Digitising them is painful — scanning, transcribing, guessing at missing measurements, and reformatting all takes hours. There's no easy way to capture the real story behind a recipe along with the instructions.",who_affected:"Primary: Home cooks (25–65) who want to preserve family food heritage. Secondary: Family members who want to browse and cook from a shared digital cookbook. Tertiary: Food bloggers and recipe creators who want a faster way to document their cooking.",current_solutions:"• Handwritten recipe cards — authentic but fragile, easily lost\n• Notes apps (Apple Notes, Google Keep) — unstructured, hard to search\n• Recipe apps (Paprika, Yummly) — designed for web imports, not handwritten originals\n• Photo albums — images saved but not searchable or cookable\n• Word docs / spreadsheets — clunky, not mobile-friendly",business_case:"The recipe app market is $300M+ and growing with AI. No current app solves the handwritten-card-to-digital-recipe pipeline with AI OCR and generation. 73M households in the US have a family recipe tradition worth preserving.",cost_of_inaction:"Every year, family members pass away and take their recipes with them. The longer we wait, the more irreplaceable recipes are lost. Competitors are beginning to add AI photo features, but none have focused on the family preservation angle — this window is 12–18 months.",primary_persona:"Name: Jamie the Keeper\nRole: Adult child / home cook trying to preserve family recipes\nAge: 38\nGoals: Digitise Grandma's 40+ handwritten recipe cards before she passes.\nFrustrations: Photos of recipe cards are unreadable on small screens. Transcribing by hand takes 20 min per recipe.",secondary_personas:"Persona 2: Priya the Grandmother — 72-year-old who cooks from memory. Doesn't type but willing to be photographed cooking and voice-record notes.\n\nPersona 3: Kai the Teen Cook — 16-year-old who wants to learn family recipes but needs clear step-by-step instructions, not handwritten shorthand.",user_journey:"1. Grandma cooks her signature chicken curry from memory\n2. Jamie photographs the dish, the handwritten recipe card, and the raw ingredients\n3. Uploads all three photos into FamilyTable\n4. Adds a few voice or text notes: \"less chilli than the card says, Grandma always adjusts\"\n5. FamilyTable AI generates a full structured recipe: title, servings, ingredients with measurements, step-by-step instructions, tips, and a story intro\n6. Jamie reviews, edits a few lines, and saves\n7. Recipe is added to the family cookbook — browsable by family member, cuisine, occasion, or ingredient\n8. Family members can comment, rate, and add their own variations",jobs_to_be_done:"• When I find a handwritten recipe card, I want to photograph it and get a clean digital version so I don't have to transcribe it manually\n• When I cook from memory, I want to record what I made quickly so I can repeat it later\n• When a family member passes, I want all their recipes safely stored and shareable so future generations can cook their dishes\n• When my kids ask how to make a dish, I want to send them a clear, tested recipe with photos so they can cook it themselves",product_goals:"1. Allow upload of photos, notes, and ingredient lists — generate a full structured recipe in under 30 seconds\n2. Store and organise all recipes in a searchable family cookbook\n3. Support multi-user family sharing — every family member can contribute and browse\n4. Achieve 80% recipe generation accuracy without manual correction\n5. Reach 10,000 active family cookbooks within 6 months of launch",kpis:"• Recipe generation time: under 30 seconds per recipe\n• Edit rate after generation: less than 20% of fields need manual correction\n• Weekly active family members per cookbook: 3+\n• Recipe retention rate: 90%+ of generated recipes saved (not discarded)\n• NPS: 60+ within 3 months",leading_indicators:"Time to first generated recipe, photo upload completion rate, family invite acceptance rate, return visits within 7 days of first recipe saved",in_scope:"• Photo upload (up to 3 images per recipe)\n• Text/voice note input\n• AI recipe generation (title, servings, ingredients, steps, tips, story intro)\n• Recipe card view\n• Family cookbook dashboard\n• Basic search by name or ingredient\n• Family invite link sharing",out_of_scope:"• Video upload — V2\n• Grocery list generation — V2\n• Meal planning — V2\n• Public recipe sharing — V2\n• Print formatting — V2\n• Nutritional analysis — not planned for MVP",future_phases:"Phase 2 (Q1 2027): Video upload, grocery list generation, meal planning calendar\nPhase 3 (Q2 2027): Print-quality recipe books, public cookbook sharing\nPhase 4 (Q3 2027): Nutritional analysis, dietary filter engine, recipe scaling AI",core_features:"Epic 1: Recipe Capture\n- Upload up to 3 photos (dish, card, ingredients)\n- Add text or voice notes\n- AI generates full structured recipe on submit\n\nEpic 2: Recipe Card\n- Title, story intro, servings, prep/cook time\n- Ingredient list with quantities and units\n- Step-by-step instructions with tips\n- Photo gallery\n\nEpic 3: Family Cookbook\n- Dashboard showing all family recipes\n- Search by name, ingredient, cuisine, occasion\n- Filter by family member contributor\n\nEpic 4: Family Sharing\n- Invite family members via shareable link\n- Role-based access: Owner, Contributor, Viewer\n- Comment and rate recipes\n- Add personal variations",user_stories:"• As a home cook, I want to photograph a handwritten recipe card and get a clean digital recipe so I don't have to type it out\n• As a family member, I want to browse all our saved recipes on my phone so I can cook them without asking anyone\n• As a cookbook owner, I want to invite my whole family so everyone can contribute and access our recipes\n• As a contributor, I want to add my own variation of a family recipe so my version is preserved alongside the original",priority_notes:"Recipe Capture + AI Generation = MUST HAVE (core value prop)\nRecipe Card View = MUST HAVE\nFamily Cookbook Dashboard + Search = MUST HAVE\nFamily Sharing (invite link) = MUST HAVE\nComments + Variations = SHOULD HAVE",performance:"Photo upload <3s on 4G, AI recipe generation <30s, cookbook loads <1s with 200+ recipes, supports 50K concurrent users at launch, 99.9% uptime",security:"Image uploads scanned for inappropriate content before storage; family invite links expire after 7 days; PII limited to name, email, and avatar; no public access to family cookbooks without invite; HTTPS enforced; API keys server-side only",accessibility:"WCAG 2.1 AA compliance. Large text mode for older users. High contrast mode. Screen reader support for recipe browsing. Voice input for notes.",platforms:"React Native — iOS and Android. Expo for local dev and builds. Min iOS: 15, Min Android: 10. Responsive design for tablet cooking mode.",tech_stack:"React Native (iOS + Android), Node.js backend, PostgreSQL, AWS S3 for image storage, Claude API for recipe generation and OCR, Expo for local dev and builds",integrations:"• Claude API — recipe generation, OCR on handwritten cards\n• AWS S3 — image storage\n• Firebase Cloud Messaging — family activity notifications\n• Apple Sign-In / Google Sign-In\n• Expo — local dev and OTA builds",data_model:"User (id, name, email, avatar, family_id, role)\nFamily (id, name, cookbook_name, invite_code, created_at)\nRecipe (id, family_id, created_by, title, description, servings, prep_time, cook_time, cuisine, occasion, story, status)\nIngredient (id, recipe_id, name, quantity, unit, notes)\nStep (id, recipe_id, order, instruction, tip)\nRecipeImage (id, recipe_id, type [dish/card/ingredients], s3_url, caption)\nComment (id, recipe_id, user_id, body, created_at)\nVariation (id, recipe_id, user_id, title, notes)",ai_instructions:"Use Claude Code for all backend logic, API routes, and Claude API integration. Claude API handles two tasks: OCR on handwritten recipe card photos, and structured recipe generation from the combined photo analysis + user notes. All generation must return structured JSON that maps directly to the Recipe, Ingredient, and Step data models. Use Expo for mobile builds.",design_direction:"Warm, tactile aesthetic — feels like a real cookbook, not a productivity app. Light mode primary. Brand colors: Warm terracotta (#C1440E) + Cream (#FDF6EC) + Deep olive (#3B4A2F). Recipe cards should feel like physical index cards. Large tap targets for older users.",key_screens:"1. Onboarding / family cookbook setup\n2. Home dashboard (recent + featured recipes)\n3. Upload screen (photo + notes input)\n4. AI generation loading screen\n5. Recipe review + edit screen\n6. Recipe card view\n7. Cookbook browser (search, filter by cuisine/occasion/family member)\n8. Family member profiles\n9. Settings",navigation:"Bottom tab bar: Home, Upload, Cookbook, Family, Profile. Upload is the primary CTA — prominent centre tab. Recipe card has full-screen immersive view. Cookbook browser has filter chips at top.",interactions:"Tap to upload photos from camera or library. Long-press recipe card to share or edit. Swipe recipe card to add to favourites. Pull to refresh cookbook. Tap ingredient to check it off while cooking.",phases:"Phase 0 — Discovery & Design (2 weeks): User interviews, Figma wireframes, Claude API OCR spike\nPhase 1 — MVP Build (8 weeks): Photo upload + AI generation + recipe card + basic cookbook\nPhase 2 — Family Features (3 weeks): Invite links, comments, variations\nPhase 3 — Beta (2 weeks): 50 families, feedback loop, accuracy tuning\nPhase 4 — Launch (1 week): App store submission, marketing, onboarding polish",milestones:"• Design complete: July 1\n• Claude API OCR + generation pipeline working: July 15\n• Recipe card view complete: August 1\n• Family sharing live: August 20\n• Beta with 50 families: September 1\n• App store submission: October 15\n• Public launch: October 31",launch_criteria:"GO: All P0 bugs resolved, AI generation accuracy >80% on test set of 50 recipe cards, photo upload working on iOS + Android, family invite flow verified end-to-end, App Store + Play Store approval received.\nNO-GO: Generation accuracy <75%, any P0 open, image storage not production-ready.",known_risks:"1. AI generation quality varies with photo quality — mitigation: image quality warnings before upload\n2. Handwritten recipe OCR accuracy on old/faded cards — mitigation: allow manual text correction as fallback\n3. Family sharing complexity — mitigation: start with invite-link simplicity, no complex role management in MVP\n4. App Store review time — mitigation: submit 2 weeks before target launch date\n5. Scope creep from emotional use case — mitigation: strictly enforce MVP scope",mitigations:"1. Image quality check before upload — warn user if photo is too dark or blurry\n2. Manual edit mode always available on every generated field\n3. Simple invite link (no email required) — lowest friction for non-technical family members\n4. Submit to App Store 2 weeks before target launch date\n5. Maintain a strict V2 backlog — any new idea goes there, not into the MVP sprint",dependencies:"AWS S3 bucket provisioning, Claude API access (OCR + generation), Expo build pipeline setup, Apple Developer + Google Play account registration, Firebase project for push notifications",existing_research:"12 user interviews with home cooks and adult children of elderly parents (March 2026). 89% have at least one family recipe they're worried about losing. 76% have tried photographing recipe cards but found the photos hard to use when actually cooking. Average time to manually transcribe a handwritten recipe: 18 minutes.",competitors:"• Paprika: Popular recipe manager but import-focused (web URLs), no handwriting OCR, no family sharing. $4.99 one-time.\n• Yummly: Discovery-focused, not preservation-focused. No handwritten import.\n• Recipe Keeper: Basic digitisation but no AI generation. No family sharing.\n• Google Photos: Stores images but no recipe structure or cooking interface.",budget:"Infrastructure: ~$50-150/month (AWS S3, PostgreSQL on Railway, Claude API ~$80/mo for generation). Target: profitable at 500 active family cookbooks on a $4.99/month subscription.",anything_else:"The emotional hook is the product's biggest asset and biggest responsibility. We're not just building a utility — we're helping families preserve irreplaceable memories. Open questions: Should we support voice memo input at launch or defer to V2? How do we handle recipes that exist in multiple family variations? Should generation be triggered automatically on upload or only on explicit user action?"};


/* ═══ MAIN APP ═══ */
export default function Cerebro(){
  const [view,setView]=useState("dashboard");
  const [projects,setProjects]=useState<Project[]>([]);
  const [activeProjectId,setActiveProjectId]=useState<string|null>(null);
  const [openMenu,setOpenMenu]=useState<string|null>(null);
  const [showArchived,setShowArchived]=useState(false);
  const [showSwitcher,setShowSwitcher]=useState(false);
  const [showStatusMenu,setShowStatusMenu]=useState(false);
  const hasLoaded=useRef(false);
  const [tab,setTab]=useState("intake");
  const [sec,setSec]=useState(0);
  const [flash,setFlash]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [genProg,setGenProg]=useState("");
  const [genErr,setGenErr]=useState("");
  const [copied,setCopied]=useState<Record<string,boolean>>({});
  const [activeDoc,setActiveDoc]=useState("prd");
  const [files,setFiles]=useState<Record<string,File[]>>({});
  const [showModeConfirm,setShowModeConfirm]=useState(false);
  const [showP1Modal,setShowP1Modal]=useState(false);
  const [p1Text,setP1Text]=useState("");
  const [p1Error,setP1Error]=useState("");
  const [toast,setToast]=useState("");
  const [pasteContent,setPasteContent]=useState<Record<string,string>>({});
  const [showPaste,setShowPaste]=useState<Record<string,boolean>>({});
  const [zipLoading,setZipLoading]=useState<Record<string,boolean>>({});
  const [expandedSession,setExpandedSession]=useState<number|null>(null);
  const fR=useRef<Record<string,HTMLInputElement|null>>({});
  const formRef=useRef<HTMLDivElement>(null);

  /* ── Design tokens ── */
  const N={bg:"#ffffff",sbg:"#f7f6f3",hov:"rgba(55,53,47,0.08)",act:"rgba(55,53,47,0.12)",tx:"#37352f",ts:"#787774",tm:"#9b9b9b",bd:"#e3e2e0"};
  const CL={blue:"#2383e2",purple:"#9065b0",green:"#448361",red:"#eb5757",amber:"#d9730d"};
  const F="'Inter','Segoe UI',sans-serif";

  /* ── Derived from active project ── */
  const activeProject=projects.find(p=>p.id===activeProjectId)||null;
  const ans=activeProject?.currentAnswers||{};
  const docs=activeProject?.docs||null;
  const docxFiles=activeProject?.docxFiles||{};
  const docSources=activeProject?.docSources||{};
  const mdUploads=activeProject?.mdUploads||{};
  const mode=activeProject?.mode||null;
  const SECTIONS=mode==="avatar"?AVATAR:SPIRIT;
  const TOTAL_Q=SECTIONS.flatMap(s=>s.questions).length;
  const accent=mode==="avatar"?CL.purple:CL.green;

  /* ── Shared derived ── */
  const fmtDate=(iso: string)=>{try{return new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});}catch{return"";}};
  const active_ps=projects.filter(p=>p.status!=="archived"&&p.status!=="deleted");
  const inactive_ps=projects.filter(p=>p.status==="archived"||p.status==="deleted");

  /* ── Load ── */
  useEffect(()=>{
    const data=migrateIfNeeded();
    setProjects(data.projects||[]);
    hasLoaded.current=true;
  },[]);

  /* ── Auto-save ── */
  useEffect(()=>{
    if(!hasLoaded.current)return;
    const t=setTimeout(()=>{saveStorage({projects,activeProjectId});},1500);
    return()=>clearTimeout(t);
  },[projects,activeProjectId]);

  /* ── Helpers ── */
  const updateActiveProject=useCallback((updates: Partial<Project>)=>{
    setProjects(prev=>prev.map(p=>p.id===activeProjectId?{...p,...updates,lastEdited:new Date().toISOString()}:p));
  },[activeProjectId]);

  const openProject=(id: string)=>{setActiveProjectId(id);setView("project");setTab("intake");setSec(0);setFiles({});setGenErr("");};
  const goToDashboard=()=>{setView("dashboard");setActiveProjectId(null);setShowSwitcher(false);setShowStatusMenu(false);};
  const createProject=(selectedMode: string)=>{const id=genId();setProjects(prev=>[...prev,blankProject(selectedMode,id)]);setActiveProjectId(id);setView("project");setTab("intake");setSec(0);setFiles({});setGenErr("");};
  const archiveProject=(id: string)=>{setProjects(prev=>prev.map(p=>p.id===id?{...p,status:"archived"}:p));setOpenMenu(null);};
  const deleteProject=(id: string)=>{setProjects(prev=>prev.map(p=>p.id===id?{...p,status:"deleted"}:p));setOpenMenu(null);};
  const restoreProject=(id: string)=>{setProjects(prev=>prev.map(p=>p.id===id?{...p,status:"draft"}:p));setOpenMenu(null);};
  const permanentDelete=(id: string)=>{if(confirm("Permanently delete? This cannot be undone.")){setProjects(prev=>prev.filter(p=>p.id!==id));setOpenMenu(null);}};

  const upd=(id: string,v: string)=>{const na={...ans,[id]:v};updateActiveProject({currentAnswers:na,name:id==="product_name"?(v.trim()||activeProject?.name||"Untitled Project"):(activeProject?.name||"Untitled Project")});};
  const addF=(id: string,f: FileList)=>{const arr=Array.from(f);setFiles(p=>({...p,[id]:[...(p[id]||[]),...arr]}));};
  const rmF=(id: string,i: number)=>setFiles(p=>({...p,[id]:p[id].filter((_,j)=>j!==i)}));
  const secProg=(i: number)=>{const s=SECTIONS[i];if(!s)return 0;return Math.round(s.questions.filter(q=>(ans[q.id]||"").trim()).length/s.questions.length*100);};
  const totAns=SECTIONS.flatMap(s=>s.questions).filter(q=>(ans[q.id]||"").trim()).length;
  const totProg=TOTAL_Q?Math.round(totAns/TOTAL_Q*100):0;
  const reqMiss=SECTIONS.flatMap(s=>s.questions).filter(q=>q.required&&!(ans[q.id]||"").trim());
  const buildIntake=()=>{
    let o="# PROJECT INTAKE\n\n";
    SECTIONS.forEach(s=>{
      o+=`## ${s.icon} ${s.title}\n\n`;
      s.questions.forEach(q=>{
        o+=`### ${q.label}\n${(ans[q.id]||"").trim()||"*[Not provided]*"}\n\n`;
        const qFiles=files[q.id]||[];
        if(qFiles.length>0){
          o+=`*Attached files: ${qFiles.map(f=>f.name).join(", ")}*\n\n`;
        }
      });
    });
    const allFiledQs=SECTIONS.flatMap(s=>s.questions).filter(q=>(files[q.id]||[]).length>0);
    if(allFiledQs.length>0){
      o+=`## 📎 Reference Files Attached\n\n`;
      allFiledQs.forEach(q=>{
        o+=`**${q.label}**\n`;
        (files[q.id]||[]).forEach(f=>{o+=`- ${f.name} (${f.type})\n`;});
        o+="\n";
      });
      o+=`> Note: These files were attached in CEREBRO but not transmitted via clipboard. If you want me to analyze the actual content, attach them directly to this chat before sending.`;
    }
    return o;
  };
  const cp=async(t: string,k: string)=>{try{await navigator.clipboard.writeText(t);}catch{const el=document.createElement("textarea");el.value=t;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}setCopied(p=>({...p,[k]:true}));setTimeout(()=>setCopied(p=>({...p,[k]:false})),2000);};
  const downloadMd = (key: string) => {
    const content = docs?.[key];
    if (!content) return;
    const fileName = DT.find(d => d.key === key)?.file || `${key}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadDocx = async (key: string) => {
    const content = docs?.[key];
    if (!content) return;
    const dtEntry = DT.find(d => d.key === key);
    const fileName = dtEntry?.file?.replace(".md", ".docx") || `${key}.docx`;
    const docTitle = dtEntry?.label?.replace(/^[^\w]+/, "").trim() || key;
    const productName = ans?.product_name || "CEREBRO Project";
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle } = await import("docx");
      const lines = content.split("\n");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bodyChildren: any[] = [];
      for (const line of lines) {
        if (line.startsWith("### ")) {
          bodyChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: line.slice(4), bold: true, color: "4A90D9", size: 24 })] }));
        } else if (line.startsWith("## ")) {
          bodyChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line.slice(3), bold: true, color: "60A5FA", size: 28 })] }));
        } else if (line.startsWith("# ")) {
          bodyChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: line.slice(2), bold: true, color: "93C5FD", size: 32 })] }));
        } else if (line.match(/^[-*]\s/)) {
          bodyChildren.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: line.slice(2), size: 22, color: "CBD5E1" })] }));
        } else if (line.match(/^---+$/)) {
          bodyChildren.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "334155", space: 1 } }, children: [new TextRun("")] }));
        } else if (!line.trim()) {
          bodyChildren.push(new Paragraph({ children: [new TextRun("")] }));
        } else {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const runs = parts.map((p: string) => p.startsWith("**") && p.endsWith("**")
            ? new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: "E2E8F0" })
            : new TextRun({ text: p, size: 22, color: "CBD5E1" }));
          bodyChildren.push(new Paragraph({ children: runs }));
        }
      }
      const headerTable = new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: "0F172A", type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 300, right: 300 },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: "3B82F6" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "🧠 CEREBRO", bold: true, size: 28, color: "3B82F6", font: "Arial" }), new TextRun({ text: "  ·  Master Build Package Generator", size: 20, color: "64748B", font: "Arial" })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: productName, bold: true, size: 24, color: "E2E8F0", font: "Arial" }), new TextRun({ text: `  ·  ${docTitle}`, size: 20, color: "94A3B8", font: "Arial" })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, size: 18, color: "475569", font: "Arial", italics: true })] }),
          ],
        })]})],
      });
      const doc = new Document({
        styles: { default: { document: { run: { font: "Arial", size: 22, color: "CBD5E1" } } } },
        sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: [headerTable, new Paragraph({ children: [new TextRun("")] }), ...bodyChildren] }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("docx generation failed:", err);
      alert("Could not generate .docx — downloading .md instead.");
      downloadMd(key);
    }
  };
  const downloadAllMd = async () => {
    setZipLoading(p => ({ ...p, md: true }));
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const fileMap: Record<string, string> = {
        prd: "prd.md", appFlow: "app-flow.md", design: "design.md",
        backend: "backend-spec.md", security: "security-checklist.md",
        claudeMd: "CLAUDE.md", projectBrief: "project-brief.md", prompts: "startup-prompts.md",
      };
      Object.entries(fileMap).forEach(([key, filename]) => {
        const content = docs?.[key];
        if (content && content.trim()) zip.file(filename, content);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(ans.product_name || "project").replace(/\s+/g, "-").toLowerCase()}-docs-md.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipLoading(p => ({ ...p, md: false }));
    }
  };

  const downloadAllDocx = async () => {
    setZipLoading(p => ({ ...p, docx: true }));
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      Object.entries(docxFiles).forEach(([, files]) => {
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
    } finally {
      setZipLoading(p => ({ ...p, docx: false }));
    }
  };

  const handleMdUpload = (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emptyDocs = { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" };
      const newEntry: MdUploadEntry = { name: file.name, content, uploadedAt: new Date().toISOString() };
      updateActiveProject({
        docs: { ...(docs || emptyDocs), [key]: content },
        docSources: { ...docSources, [key]: "uploaded" },
        mdUploads: { ...mdUploads, [key]: [...(mdUploads[key] || []), newEntry] },
      });
    };
    reader.readAsText(file);
  };

  const handleDocxUpload = (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const newEntry: DocxFileEntry = { name: file.name, data: e.target?.result as string, uploadedAt: new Date().toISOString() };
        updateActiveProject({ docxFiles: { ...docxFiles, [key]: [...(docxFiles[key] || []), newEntry] } });
      } catch {
        alert("File too large to store locally. Save it to your project folder instead.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (key: string, content: string) => {
    const emptyDocs = { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" };
    updateActiveProject({ docs: { ...(docs || emptyDocs), [key]: content }, docSources: { ...docSources, [key]: "pasted" } });
    setPasteContent(p => ({ ...p, [key]: "" }));
    setShowPaste(p => ({ ...p, [key]: false }));
  };

  const downloadUploadedDocx = (key: string, index: number) => {
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

  const downloadUploadedMd = (entry: MdUploadEntry) => {
    const blob = new Blob([entry.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = entry.name; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteMdUpload = (key: string, index: number) => {
    if (!confirm(`Remove "${mdUploads[key]?.[index]?.name}"?`)) return;
    const updated = (mdUploads[key] || []).filter((_, i) => i !== index);
    const newMdUploads = { ...mdUploads, [key]: updated };
    // If the deleted file was the displayed one and there are others, show the last one
    const remaining = updated;
    const emptyDocs = { prd: "", appFlow: "", design: "", backend: "", security: "", claudeMd: "", projectBrief: "", prompts: "", changeBrief: "" };
    const newDocs = remaining.length > 0
      ? { ...(docs || emptyDocs), [key]: remaining[remaining.length - 1].content }
      : { ...(docs || emptyDocs), [key]: "" };
    updateActiveProject({ mdUploads: newMdUploads, docs: newDocs });
  };

  const deleteDocxUpload = (key: string, index: number) => {
    if (!confirm(`Remove "${docxFiles[key]?.[index]?.name}"?`)) return;
    const updated = (docxFiles[key] || []).filter((_, i) => i !== index);
    updateActiveProject({ docxFiles: { ...docxFiles, [key]: updated } });
  };
  const save=useCallback(()=>{saveStorage({projects,activeProjectId});setFlash(true);setTimeout(()=>setFlash(false),1500);},[projects,activeProjectId]);



  const renderMd=(text: string)=>{
    if(!text)return <p style={{color:N.ts,fontStyle:"italic",fontSize:13}}>No content.</p>;
    return text.split("\n").map((line: string,i: number)=>{
      if(line.startsWith("### "))return <h3 key={i} style={{fontSize:15,fontWeight:600,color:N.tx,margin:"16px 0 5px"}}>{line.slice(4)}</h3>;
      if(line.startsWith("## "))return <h2 key={i} style={{fontSize:18,fontWeight:700,color:N.tx,margin:"22px 0 7px"}}>{line.slice(3)}</h2>;
      if(line.startsWith("# "))return <h1 key={i} style={{fontSize:22,fontWeight:700,color:N.tx,margin:"26px 0 8px",borderBottom:`1px solid ${N.bd}`,paddingBottom:5}}>{line.slice(2)}</h1>;
      if(line.match(/^[\-\*]\s/))return <div key={i} style={{display:"flex",gap:5,margin:"2px 0 2px 10px",color:N.ts,fontSize:13,lineHeight:1.6}}>•<span>{line.slice(2)}</span></div>;
      if(line.includes("⚠️"))return <div key={i} style={{background:"rgba(217,115,13,0.08)",border:`1px solid rgba(217,115,13,0.25)`,borderRadius:6,padding:"7px 10px",margin:"5px 0",color:CL.amber,fontSize:12}}>{line}</div>;
      if(line.startsWith("~~"))return <div key={i} style={{textDecoration:"line-through",color:CL.red,fontSize:13,margin:"2px 0"}}>{line.replace(/~~/g,"")}</div>;
      if(line.match(/^\*\*Was:\*\*/))return <div key={i} style={{background:"rgba(235,87,87,0.06)",borderLeft:`3px solid ${CL.red}`,padding:"4px 10px",margin:"3px 0",fontSize:12,color:CL.red}}>{line.replace(/\*\*/g,"")}</div>;
      if(line.match(/^\*\*Now:\*\*/))return <div key={i} style={{background:"rgba(68,131,97,0.06)",borderLeft:`3px solid ${CL.green}`,padding:"4px 10px",margin:"3px 0",fontSize:12,color:CL.green}}>{line.replace(/\*\*/g,"")}</div>;
      if(line.match(/^---+$/))return <hr key={i} style={{border:"none",borderTop:`1px solid ${N.bd}`,margin:"14px 0"}}/>;
      if(!line.trim())return <div key={i} style={{height:5}}/>;
      const parts=line.split(/(\*\*.*?\*\*)/g).map((p: string,pi: number)=>p.startsWith("**")&&p.endsWith("**")?<strong key={pi} style={{color:N.tx,fontWeight:600}}>{p.slice(2,-2)}</strong>:p);
      return <p key={i} style={{margin:"2px 0",color:N.ts,fontSize:13,lineHeight:1.7}}>{parts}</p>;
    });
  };

  /* ── Generate ── */
  const handleCopyPrompt=()=>{
    cp(SYS+"\n\n---\n\n"+buildIntake(),"cb");
  };

  const handleGen=async()=>{
    setGenerating(true);setGenErr("");setGenProg("Preparing...");setTab("results");
    const intake=buildIntake(),cMd=genClaudeMd(ans),pB=genBrief(ans);
    try{
      const callAPI=async(sys: string)=>{const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:sys,messages:[{role:"user",content:intake}]})});if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`);}const data=await r.json();return(data.content as {type:string;text:string}[]).filter(i=>i.type==="text").map(i=>i.text).join("\n");};
      const SYS1=`You are a senior product/technical lead generating part of a build package. Produce exactly 3 files using this format:\n\n---FILE: [filename]---\n[content]\n---END FILE---\n\nFiles to produce:\n1. prd.md — PRD (14 sections, FR-001 IDs, acceptance criteria, MoSCoW priority). 800-1000 words.\n2. app-flow.md — App Flow (every route, auth flow, screen-by-screen interactions). 600-800 words.\n3. design.md — UI Design Guide (design tokens with hex values, components, breakpoints). 600-800 words.\n\nFlag gaps with [⚠️ ATTENTION NEEDED]. Use the product name in all headers.`;
      const SYS2=`You are a senior product/technical lead generating part of a build package. Produce exactly 2 files using this format:\n\n---FILE: [filename]---\n[content]\n---END FILE---\n\nFiles to produce:\n1. backend-spec.md — Backend Spec (data models with fields/types/constraints, API endpoints, services, env vars, folder structure). 800-1000 words.\n2. security-checklist.md — Security Checklist (auth, RBAC, encryption, OWASP Top 10 table, compliance, incident response). 600-800 words.\n\nFlag gaps with [⚠️ ATTENTION NEEDED]. Use the product name in all headers.`;
      setGenProg("Generating PRD, App Flow & UI Guide… (1/2)");
      const full1=await callAPI(SYS1);
      setGenProg("Generating Backend & Security docs… (2/2)");
      const full2=await callAPI(SYS2);
      const fileMap: Record<string,string>={
        "prd.md":"prd","app-flow.md":"appFlow","design.md":"design",
        "backend-spec.md":"backend","security-checklist.md":"security"
      };
      const parseFiles=(raw: string,dm: Record<string,string>)=>{
        const fileRegex=/---FILE:\s*(.+?)---\s*\n([\s\S]*?)---END FILE---/g;
        let m;
        while((m=fileRegex.exec(raw))!==null){
          const fname=m[1].trim();const content=m[2].trim();
          const key=fileMap[fname];
          if(key&&fname.endsWith(".md"))dm[key]=content;
        }
      };
      const dm: Record<string,string>={prd:"",appFlow:"",design:"",backend:"",security:""};
      parseFiles(full1,dm);
      parseFiles(full2,dm);
      // Fallback: old ---DOC_SEPARATOR--- format
      if(!dm.prd){
        const parts1=full1.split("---DOC_SEPARATOR---").map((p: string)=>p.trim()).filter(Boolean);
        const parts2=full2.split("---DOC_SEPARATOR---").map((p: string)=>p.trim()).filter(Boolean);
        const ks=["prd","appFlow","design","backend","security"];
        const allParts=[...parts1,...parts2];
        if(allParts.length>=5)ks.forEach((k,i)=>{if(allParts[i])dm[k]=allParts[i];});
        else{dm.prd=full1+"\n\n"+full2;ks.slice(1).forEach(k=>{dm[k]="[⚠️] Use Copy to Clipboard — paste the prompt into a new Claude chat (Opus recommended) to generate all documents.";});}
      }
      updateActiveProject({docs:{...dm,claudeMd:cMd,projectBrief:pB}});
      setGenProg("");
    }catch(e){
      setGenErr(`${e instanceof Error?e.message:String(e)} — Use the Copy button on the last intake section instead.`);
      updateActiveProject({docs:{prd:"",appFlow:"",design:"",backend:"",security:"",claudeMd:cMd,projectBrief:pB}});
      setGenProg("");
    }finally{setGenerating(false);}
  };

  const switchMode=(newMode: string)=>{updateActiveProject({mode:newMode});setShowModeConfirm(false);setSec(0);};
  const handleReset=()=>{if(confirm("Clear this project's current answers? Version history will be kept.")){updateActiveProject({currentAnswers:{},name:"Untitled Project"});setFiles({});setSec(0);setTab("intake");}};
  const loadTestData=()=>{updateActiveProject({currentAnswers:TEST_DATA,name:"FamilyTable"});setSec(0);setTab("intake");formRef.current?.scrollTo(0,0);};
  const createTestProject=()=>{const id=genId();const p={...blankProject("avatar",id),name:"FamilyTable",currentAnswers:TEST_DATA};setProjects(prev=>[...prev,p]);openProject(id);};

  /* ════════════════════════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════════════════════════ */
  if(view==="dashboard"){
    return(
      <div style={{display:"flex",minHeight:"100vh",fontFamily:F,background:N.bg,color:N.tx}}>
        {openMenu!==null&&<div style={{position:"fixed",inset:0,zIndex:50}} onClick={()=>setOpenMenu(null)}/>}

        {/* Sidebar */}
        <aside style={{width:240,minWidth:240,background:N.sbg,borderRight:`1px solid ${N.bd}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
          <div style={{padding:"16px 14px 10px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🧠</span>
            <span style={{fontSize:15,fontWeight:700,color:N.tx,letterSpacing:-0.3}}>CEREBRO</span>
          </div>
          <div style={{padding:"0 8px 8px"}}>
            <button onClick={()=>setView("modeSelect")} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:4,border:"none",background:"transparent",color:N.ts,cursor:"pointer",fontSize:13,textAlign:"left"}}
              onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:16,lineHeight:1,color:N.tm}}>+</span> New Project
            </button>
          </div>
          <div style={{borderTop:`1px solid ${N.bd}`,margin:"0 0 4px"}}/>
          <div style={{flex:1,overflowY:"auto",padding:"4px 8px"}}>
            <div style={{fontSize:11,fontWeight:600,color:N.tm,padding:"4px 8px",letterSpacing:.5,textTransform:"uppercase"}}>Projects</div>
            {active_ps.length===0&&<div style={{padding:"6px 8px",fontSize:13,color:N.tm,fontStyle:"italic"}}>No projects yet</div>}
            {active_ps.map(p=>(
              <button key={p.id} onClick={()=>openProject(p.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:N.tx,cursor:"pointer",fontSize:13,textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{fontSize:13,flexShrink:0}}>{p.mode==="avatar"?"⚡":"🌿"}</span>
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
              </button>
            ))}
          </div>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${N.bd}`,display:"flex",gap:8}}>
            <button onClick={createTestProject} style={{background:"none",border:"none",color:N.tm,cursor:"pointer",fontSize:12,padding:0}}
              onMouseEnter={e=>e.currentTarget.style.color=CL.amber} onMouseLeave={e=>e.currentTarget.style.color=N.tm}>🧪 Test data</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,padding:"48px 56px",maxWidth:860,boxSizing:"border-box"}}>
          <div style={{marginBottom:32}}>
            <h1 style={{fontSize:30,fontWeight:700,color:N.tx,margin:"0 0 6px",letterSpacing:-0.5}}>Projects</h1>
            <p style={{fontSize:14,color:N.ts,margin:0}}>{active_ps.length} project{active_ps.length!==1?"s":""}</p>
          </div>

          {active_ps.length===0&&(
            <div style={{border:`2px dashed ${N.bd}`,borderRadius:8,padding:"64px 24px",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:14}}>📭</div>
              <h3 style={{fontSize:20,fontWeight:600,color:N.tx,margin:"0 0 8px"}}>No projects yet</h3>
              <p style={{fontSize:14,color:N.ts,margin:"0 0 24px"}}>Create your first project to get started with CEREBRO.</p>
              <button onClick={()=>setView("modeSelect")} style={{padding:"9px 22px",borderRadius:6,border:"none",background:CL.blue,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:500}}>+ New Project</button>
            </div>
          )}

          {active_ps.length>0&&(
            <div style={{border:`1px solid ${N.bd}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 110px 36px",gap:8,padding:"8px 16px",background:N.sbg,borderBottom:`1px solid ${N.bd}`}}>
                {["Name","Status","Mode","Last Edited",""].map((h,i)=>(
                  <div key={i} style={{fontSize:11,fontWeight:600,color:N.tm,textTransform:"uppercase",letterSpacing:.5}}>{h}</div>
                ))}
              </div>
              {active_ps.map((p,idx)=>{
                const st=SC[p.status as keyof typeof SC]||SC.draft;
                return(
                  <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 110px 36px",gap:8,padding:"11px 16px",borderBottom:idx<active_ps.length-1?`1px solid ${N.bd}`:"none",alignItems:"center",cursor:"pointer",position:"relative",zIndex:openMenu===p.id?200:"auto"}}
                    onClick={()=>openProject(p.id)}
                    onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden"}}>
                      <span style={{fontSize:14,flexShrink:0}}>{p.mode==="avatar"?"⚡":"🌿"}</span>
                      <span style={{fontSize:14,fontWeight:500,color:N.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                    </div>
                    <div><span style={{padding:"2px 9px",borderRadius:12,background:st.bg,color:st.color,fontSize:11,fontWeight:500}}>{st.label}</span></div>
                    <div style={{fontSize:13,color:N.ts}}>{p.mode==="avatar"?"Avatar":"Spirit"}</div>
                    <div style={{fontSize:13,color:N.ts}}>{fmtDate(p.lastEdited)}</div>
                    <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>{e.stopPropagation();setOpenMenu(openMenu===p.id?null:p.id);}}
                        style={{background:"none",border:"none",color:N.ts,cursor:"pointer",fontSize:18,padding:"2px 5px",borderRadius:4,lineHeight:1,display:"flex",alignItems:"center"}}
                        onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="none"}>⋯</button>
                      {openMenu===p.id&&(
                        <div style={{position:"absolute",top:"calc(100% + 2px)",right:0,background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:4,minWidth:140,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>archiveProject(p.id)} style={{display:"block",width:"100%",padding:"7px 12px",background:"none",border:"none",color:N.tx,cursor:"pointer",fontSize:13,textAlign:"left",borderRadius:5}}
                            onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="none"}>Archive</button>
                          <button onClick={()=>deleteProject(p.id)} style={{display:"block",width:"100%",padding:"7px 12px",background:"none",border:"none",color:CL.red,cursor:"pointer",fontSize:13,textAlign:"left",borderRadius:5}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(235,87,87,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {inactive_ps.length>0&&(
            <div style={{marginTop:24}}>
              <button onClick={()=>setShowArchived(!showArchived)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:N.ts,cursor:"pointer",fontSize:13,padding:"4px 0",marginBottom:10}}
                onMouseEnter={e=>e.currentTarget.style.color=N.tx} onMouseLeave={e=>e.currentTarget.style.color=N.ts}>
                <span style={{fontSize:10}}>{showArchived?"▾":"▸"}</span>
                Archived & Deleted
                <span style={{padding:"1px 7px",borderRadius:10,background:N.hov,color:N.ts,fontSize:11,marginLeft:2}}>{inactive_ps.length}</span>
              </button>
              {showArchived&&(
                <div style={{border:`1px solid ${N.bd}`,borderRadius:8,overflow:"hidden"}}>
                  {inactive_ps.map((p,idx)=>{
                    const isDeleted=p.status==="deleted";
                    return(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:idx<inactive_ps.length-1?`1px solid ${N.bd}`:"none",opacity:.6}}>
                        <span style={{fontSize:14}}>{p.mode==="avatar"?"⚡":"🌿"}</span>
                        <span style={{fontSize:14,color:N.ts,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                        <span style={{padding:"2px 9px",borderRadius:12,fontSize:11,background:isDeleted?"rgba(235,87,87,0.1)":"rgba(120,119,116,0.1)",color:isDeleted?CL.red:N.ts,flexShrink:0}}>{isDeleted?"Deleted":"Archived"}</span>
                        <button onClick={()=>restoreProject(p.id)} style={{padding:"4px 12px",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12,flexShrink:0}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=CL.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>Restore</button>
                        {!isDeleted&&<button onClick={()=>openProject(p.id)} style={{padding:"4px 12px",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12,flexShrink:0}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=CL.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>Open</button>}
                        <button onClick={()=>permanentDelete(p.id)} style={{padding:"4px 8px",borderRadius:5,border:"none",background:"none",color:CL.red,cursor:"pointer",fontSize:13,flexShrink:0}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(235,87,87,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     MODE SELECT
  ════════════════════════════════════════════════════════ */
  if(view==="modeSelect"){
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,background:N.bg,color:N.tx}}>
        <div style={{maxWidth:600,width:"100%",padding:"40px 24px"}}>
          <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:N.ts,cursor:"pointer",fontSize:13,marginBottom:28,padding:0,display:"flex",alignItems:"center",gap:4}}
            onMouseEnter={e=>e.currentTarget.style.color=N.tx} onMouseLeave={e=>e.currentTarget.style.color=N.ts}>← Back to Projects</button>
          <div style={{marginBottom:32}}>
            <h1 style={{fontSize:28,fontWeight:700,color:N.tx,margin:"0 0 8px",letterSpacing:-0.5}}>Choose a mode</h1>
            <p style={{fontSize:15,color:N.ts,margin:0}}>Select how you&apos;d like to fill in your new project.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <button onClick={()=>createProject("avatar")} style={{background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:"26px 22px",cursor:"pointer",textAlign:"left",transition:"border-color .15s,box-shadow .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=CL.purple;e.currentTarget.style.boxShadow=`0 0 0 3px rgba(144,101,176,0.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=N.bd;e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontSize:30,marginBottom:14}}>⚡</div>
              <div style={{fontSize:16,fontWeight:600,color:N.tx,marginBottom:4}}>Avatar State</div>
              <div style={{fontSize:12,fontWeight:600,color:CL.purple,marginBottom:10,letterSpacing:.3}}>Full Power</div>
              <p style={{fontSize:13,color:N.ts,margin:"0 0 10px",lineHeight:1.6}}>12 sections, ~47 technical questions. Personas, JTBD, NFRs, architecture, risks.</p>
              <div style={{fontSize:12,color:N.tm}}>For: Technical PMs, cross-functional teams</div>
            </button>
            <button onClick={()=>createProject("spirit")} style={{background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:"26px 22px",cursor:"pointer",textAlign:"left",transition:"border-color .15s,box-shadow .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=CL.green;e.currentTarget.style.boxShadow=`0 0 0 3px rgba(68,131,97,0.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=N.bd;e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontSize:30,marginBottom:14}}>🌿</div>
              <div style={{fontSize:16,fontWeight:600,color:N.tx,marginBottom:4}}>Spirit Guide</div>
              <div style={{fontSize:12,fontWeight:600,color:CL.green,marginBottom:10,letterSpacing:.3}}>Guided Mode</div>
              <p style={{fontSize:13,color:N.ts,margin:"0 0 10px",lineHeight:1.6}}>8 sections, ~31 plain-English questions. Same output quality, less jargon.</p>
              <div style={{fontSize:12,color:N.tm}}>For: Non-technical PMs, solo builders</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     PROJECT VIEW
  ════════════════════════════════════════════════════════ */
  if(!activeProject)return null;
  const section=SECTIONS[sec];
  const pStatus=SC[activeProject.status as keyof typeof SC]||SC.draft;

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F,background:N.bg,color:N.tx}}>
      {(showSwitcher||showStatusMenu||showModeConfirm)&&<div style={{position:"fixed",inset:0,zIndex:150}} onClick={()=>{setShowSwitcher(false);setShowStatusMenu(false);setShowModeConfirm(false);}}/>}

      {/* ── Sidebar ── */}
      <aside style={{width:240,minWidth:240,background:N.sbg,borderRight:`1px solid ${N.bd}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0,overflowY:"auto"}}>
        {/* Logo */}
        <div style={{padding:"16px 14px 10px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <span style={{fontSize:20}}>🧠</span>
          <span style={{fontSize:15,fontWeight:700,color:N.tx,letterSpacing:-0.3}}>CEREBRO</span>
        </div>

        <div style={{padding:"0 8px",flex:1,display:"flex",flexDirection:"column",gap:0}}>
          {/* Back */}
          <button onClick={goToDashboard} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:N.ts,cursor:"pointer",fontSize:13,textAlign:"left",marginBottom:2}}
            onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            ← All Projects
          </button>

          <div style={{borderTop:`1px solid ${N.bd}`,margin:"6px 0"}}/>

          {/* Project list */}
          <div style={{fontSize:11,fontWeight:600,color:N.tm,padding:"2px 8px 4px",letterSpacing:.5,textTransform:"uppercase"}}>Workspace</div>
          {active_ps.map(p=>(
            <button key={p.id} onClick={()=>openProject(p.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:4,border:"none",background:p.id===activeProjectId?N.act:"transparent",color:p.id===activeProjectId?N.tx:N.ts,cursor:"pointer",fontSize:13,textAlign:"left",fontWeight:p.id===activeProjectId?500:400}}
              onMouseEnter={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background="transparent";}}>
              <span style={{fontSize:13,flexShrink:0}}>{p.mode==="avatar"?"⚡":"🌿"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
              {p.id===activeProjectId&&<span style={{width:6,height:6,borderRadius:"50%",background:accent,flexShrink:0}}/>}
            </button>
          ))}
          <button onClick={()=>setView("modeSelect")} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:N.tm,cursor:"pointer",fontSize:13,textAlign:"left",marginTop:2}}
            onMouseEnter={e=>e.currentTarget.style.background=N.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontSize:14}}>+</span> New Project
          </button>

          <div style={{borderTop:`1px solid ${N.bd}`,margin:"6px 0"}}/>

          {/* Tab nav */}
          <div style={{fontSize:11,fontWeight:600,color:N.tm,padding:"2px 8px 4px",letterSpacing:.5,textTransform:"uppercase"}}>Navigation</div>
          {TABS.map(t=>{
            const disabled=!["intake","results"].includes(t)&&!docs&&!generating;
            return(
              <button key={t} onClick={()=>!disabled&&setTab(t)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:4,border:"none",background:tab===t?N.act:"transparent",color:disabled?N.tm:(tab===t?N.tx:N.ts),cursor:disabled?"default":"pointer",fontSize:13,textAlign:"left",fontWeight:tab===t?500:400}}
                onMouseEnter={e=>{if(!disabled&&tab!==t)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(tab!==t)e.currentTarget.style.background="transparent";}}>
                {t==="intake"&&"📝"}{t==="results"&&"📄"}{t==="workflow"&&"🗺️"} {TL[t as keyof typeof TL]}
              </button>
            );
          })}

          {/* Section nav (intake only) */}
          {tab==="intake"&&(
            <>
              <div style={{borderTop:`1px solid ${N.bd}`,margin:"6px 0"}}/>
              <div style={{fontSize:11,fontWeight:600,color:N.tm,padding:"2px 8px 4px",letterSpacing:.5,textTransform:"uppercase"}}>Sections</div>
              {SECTIONS.map((s,i)=>{
                const p=secProg(i);const a=i===sec;
                return(
                  <button key={s.id} onClick={()=>{setSec(i);formRef.current?.scrollTo(0,0);}} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:4,border:"none",background:a?N.act:"transparent",color:a?N.tx:N.ts,cursor:"pointer",fontSize:12,textAlign:"left",fontWeight:a?500:400}}
                    onMouseEnter={e=>{if(!a)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(!a)e.currentTarget.style.background="transparent";}}>
                    <span style={{fontSize:11,flexShrink:0}}>{s.icon}</span>
                    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</span>
                    {p===100?<span style={{fontSize:10,color:CL.green,flexShrink:0}}>✓</span>:p>0?<span style={{fontSize:10,color:N.tm,flexShrink:0}}>{p}%</span>:null}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Sidebar footer */}
        <div style={{padding:"10px 12px",borderTop:`1px solid ${N.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <button onClick={loadTestData} style={{background:"none",border:"none",color:N.tm,cursor:"pointer",fontSize:12,padding:0}}
            onMouseEnter={e=>e.currentTarget.style.color=CL.amber} onMouseLeave={e=>e.currentTarget.style.color=N.tm}>🧪 Test</button>
          <button onClick={save} style={{background:"none",border:"none",color:flash?CL.green:N.tm,cursor:"pointer",fontSize:12,padding:0,fontWeight:flash?600:400}}
            onMouseEnter={e=>{if(!flash)e.currentTarget.style.color=N.ts;}} onMouseLeave={e=>{if(!flash)e.currentTarget.style.color=N.tm;}}>
            {flash?"Saved ✓":"Save"}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* Top bar */}
        <header style={{display:"flex",alignItems:"center",gap:10,padding:"12px 28px",borderBottom:`1px solid ${N.bd}`,background:N.bg,flexShrink:0}}>
          <h1 style={{fontSize:16,fontWeight:600,color:N.tx,margin:0,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeProject.name}</h1>

          {/* Status */}
          <div style={{position:"relative",flexShrink:0}} onMouseDown={e=>e.stopPropagation()}>
            <button onClick={()=>{setShowStatusMenu(!showStatusMenu);setShowSwitcher(false);}}
              style={{padding:"3px 11px",borderRadius:12,border:"none",background:pStatus.bg,color:pStatus.color,cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
              {pStatus.label}<span style={{fontSize:9}}>▾</span>
            </button>
            {showStatusMenu&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:4,zIndex:200,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:148}}>
                {Object.entries(SC).filter(([k])=>k!=="archived"&&k!=="deleted").map(([k,v])=>(
                  <button key={k} onClick={()=>{updateActiveProject({status:k});setShowStatusMenu(false);}}
                    style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 10px",background:activeProject.status===k?N.hov:"none",border:"none",color:N.tx,cursor:"pointer",fontSize:13,textAlign:"left",borderRadius:5}}
                    onMouseEnter={e=>{if(activeProject.status!==k)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(activeProject.status!==k)e.currentTarget.style.background="none";}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:v.color,flexShrink:0,display:"inline-block"}}/>
                    <span style={{color:v.color,fontWeight:500}}>{v.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Mode toggle */}
          <div style={{position:"relative",flexShrink:0}}>
            <button onClick={()=>setShowModeConfirm(!showModeConfirm)}
              style={{padding:"3px 10px",borderRadius:12,border:`1px solid ${N.bd}`,background:"transparent",color:N.ts,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=accent} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>
              {mode==="avatar"?"⚡ Avatar":"🌿 Spirit"}<span style={{fontSize:9}}>▾</span>
            </button>
            {showModeConfirm&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:14,zIndex:200,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:260}}>
                <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:N.tx}}>Switch to {mode==="avatar"?"🌿 Spirit Guide":"⚡ Avatar State"}?</p>
                <p style={{margin:"0 0 12px",fontSize:12,color:N.ts,lineHeight:1.5}}>Your existing answers will be kept. Questions shared between modes carry over automatically.</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>switchMode(mode==="avatar"?"spirit":"avatar")}
                    style={{flex:1,padding:"6px 0",borderRadius:5,border:"none",background:accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:500}}>Confirm</button>
                  <button onClick={()=>setShowModeConfirm(false)}
                    style={{flex:1,padding:"6px 0",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12}}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {tab==="intake"&&<button onClick={()=>{setShowP1Modal(true);setP1Text("");setP1Error("");}}
            style={{padding:"3px 10px",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12,flexShrink:0,whiteSpace:"nowrap"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=accent} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>📋 Load P1 Brief</button>}
          <button onClick={handleReset} style={{padding:"3px 10px",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12,flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.color=CL.red} onMouseLeave={e=>e.currentTarget.style.color=N.ts}>Reset</button>
        </header>

        {/* Progress bar */}
        {tab==="intake"&&<div style={{height:2,background:N.bd,flexShrink:0}}><div style={{height:"100%",width:`${totProg}%`,background:accent,transition:"width .5s"}}/></div>}

        {/* ═══ INTAKE ═══ */}
        {tab==="intake"&&(
          <div style={{display:"flex",flex:1,flexDirection:"column",minHeight:0}}>
            <div ref={formRef} style={{flex:1,overflowY:"auto",padding:"40px 56px 120px",maxWidth:740,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:12,color:N.ts,marginBottom:8,fontWeight:500}}>{sec+1} of {SECTIONS.length}</div>
                <h2 style={{fontSize:26,fontWeight:700,color:N.tx,margin:"0 0 8px",letterSpacing:-0.3}}>{section?.icon} {section?.title}</h2>
                <p style={{fontSize:14,color:N.ts,margin:0,lineHeight:1.6}}>{section?.description}</p>
              </div>

              {section?.questions.map(q=>(
                <div key={q.id} style={{marginBottom:28}}>
                  <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <label style={{fontSize:14,fontWeight:600,color:N.tx}}>{q.label}{q.required&&<span style={{color:CL.red,marginLeft:3}}>*</span>}</label>
                  </div>
                  <p style={{fontSize:12,color:N.ts,margin:"0 0 8px",lineHeight:1.5}}>{q.guidance}</p>
                  {q.type==="text"
                    ?<input type="text" value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder}
                        style={{width:"100%",padding:"9px 12px",borderRadius:6,border:`1px solid ${N.bd}`,background:N.bg,color:N.tx,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:F,transition:"border-color .15s",lineHeight:1.5}}
                        onFocus={e=>e.currentTarget.style.borderColor=CL.blue} onBlur={e=>e.currentTarget.style.borderColor=N.bd}/>
                    :<textarea value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder} rows={3}
                        style={{width:"100%",padding:"9px 12px",borderRadius:6,border:`1px solid ${N.bd}`,background:N.bg,color:N.tx,fontSize:14,outline:"none",resize:"vertical",lineHeight:1.6,minHeight:88,boxSizing:"border-box",fontFamily:F,transition:"border-color .15s"}}
                        onFocus={e=>e.currentTarget.style.borderColor=CL.blue} onBlur={e=>e.currentTarget.style.borderColor=N.bd}/>
                  }
                  <div style={{marginTop:7,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <button onClick={()=>fR.current[q.id]?.click()} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:4,border:`1px dashed ${N.bd}`,background:"transparent",color:N.ts,cursor:"pointer",fontSize:12}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=N.ts} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>📎 Attach</button>
                    <input ref={el=>{fR.current[q.id]=el;}} type="file" multiple onChange={e=>{if(e.target.files?.length)addF(q.id,e.target.files!);e.target.value="";}} style={{display:"none"}}/>
                    {(files[q.id]||[]).map((f,fi)=><FileChip key={fi} file={f} onRemove={()=>rmF(q.id,fi)}/>)}
                  </div>
                </div>
              ))}

              {/* Generation options panel — only on last section */}
              {sec===SECTIONS.length-1&&(
                <div style={{marginTop:32,padding:"24px",border:`1px solid ${N.bd}`,borderRadius:12,background:N.sbg}}>
                  <h3 style={{fontSize:17,fontWeight:700,color:N.tx,margin:"0 0 4px"}}>🚀 Ready to Generate</h3>
                  <p style={{fontSize:13,color:N.ts,margin:"0 0 20px"}}>Choose how you&apos;d like to create your build package:</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    {/* Card 1 — Copy Prompt */}
                    <div style={{border:`1px solid ${N.bd}`,borderRadius:8,padding:"18px 18px 16px",background:N.bg}}>
                      <div style={{fontSize:20,marginBottom:8}}>📋</div>
                      <p style={{fontSize:14,fontWeight:600,color:N.tx,margin:"0 0 6px"}}>Copy Prompt to Clipboard</p>
                      <p style={{fontSize:12,color:N.ts,margin:"0 0 16px",lineHeight:1.6}}>Paste into a new Claude chat (Opus recommended). You&apos;ll get 10 files back (5 .md + 5 .docx) which you can upload here.</p>
                      <button onClick={handleCopyPrompt}
                        style={{padding:"7px 16px",borderRadius:6,border:`1px solid ${N.bd}`,background:copied.cb?"rgba(68,131,97,0.08)":N.bg,color:copied.cb?CL.green:N.ts,cursor:"pointer",fontSize:13,fontWeight:500}}>
                        {copied.cb?"✓ Copied!":"📋 Copy Prompt"}</button>
                    </div>
                    {/* Card 2 — Generate via API */}
                    <div style={{border:`1px solid ${N.bd}`,borderRadius:8,padding:"18px 18px 16px",background:N.bg}}>
                      <div style={{fontSize:20,marginBottom:8}}>⚡</div>
                      <p style={{fontSize:14,fontWeight:600,color:N.tx,margin:"0 0 6px"}}>Generate via API</p>
                      <p style={{fontSize:12,color:N.ts,margin:"0 0 16px",lineHeight:1.6}}>Calls the Claude API directly. Results appear in the Docs tab. Requires API access (may not work on localhost).</p>
                      <button onClick={handleGen} disabled={reqMiss.length>0}
                        style={{padding:"7px 16px",borderRadius:6,border:"none",background:reqMiss.length>0?N.hov:CL.green,color:reqMiss.length>0?N.tm:"#fff",cursor:reqMiss.length>0?"default":"pointer",fontSize:13,fontWeight:500}}>
                        ⚡ Generate Docs</button>
                      {reqMiss.length>0&&<p style={{margin:"6px 0 0",fontSize:11,color:CL.red}}>Complete required fields first</p>}
                    </div>
                  </div>
                  <p style={{margin:0,fontSize:12,color:N.ts,lineHeight:1.6}}>ℹ️ Copy the prompt to generate docs manually, or use Generate Docs to call the API directly.</p>
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div style={{position:"sticky",bottom:0,padding:"12px 56px",background:N.bg,borderTop:`1px solid ${N.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <button onClick={()=>{setSec(Math.max(0,sec-1));formRef.current?.scrollTo(0,0);}} disabled={sec===0}
                style={{padding:"7px 18px",borderRadius:6,border:`1px solid ${N.bd}`,background:"none",color:sec===0?N.tm:N.ts,cursor:sec===0?"default":"pointer",fontSize:13}}>← Back</button>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:N.ts}}>{totAns}/{TOTAL_Q} answered</span>
                <div style={{display:"flex",gap:2}}>
                  {SECTIONS.map((_,i)=>(
                    <div key={i} style={{width:i===sec?16:4,height:3,borderRadius:2,background:i===sec?accent:secProg(i)===100?CL.green:N.bd,transition:"all .3s",cursor:"pointer"}} onClick={()=>{setSec(i);formRef.current?.scrollTo(0,0);}}/>
                  ))}
                </div>
              </div>
              {sec<SECTIONS.length-1
                ?<button onClick={()=>{setSec(sec+1);formRef.current?.scrollTo(0,0);}}
                    style={{padding:"7px 18px",borderRadius:6,border:"none",background:accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>Next →</button>
                :<div style={{width:90}}/>
              }
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {tab==="results"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
            {generating
              ?<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
                  <div style={{width:32,height:32,border:`2px solid ${N.bd}`,borderTop:`2px solid ${CL.blue}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <p style={{fontSize:14,color:N.ts,margin:0,maxWidth:360,textAlign:"center"}}>{genProg}</p>
                </div>
              :<>
                  {genErr&&<div style={{margin:"12px 24px 0",padding:"10px 14px",background:"rgba(235,87,87,0.06)",border:`1px solid rgba(235,87,87,0.2)`,borderRadius:6,color:CL.red,fontSize:13}}>{genErr}</div>}
                  {/* Tab bar — always shown */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px",borderBottom:`1px solid ${N.bd}`,flexShrink:0,flexWrap:"wrap",gap:4}}>
                    <div style={{display:"flex",gap:1,overflowX:"auto"}}>
                      {DT.map(d=>(
                        <button key={d.key} onClick={()=>{setActiveDoc(d.key);setShowPaste(p=>({...p,[d.key]:false}));}}
                          style={{padding:"5px 12px",borderRadius:5,border:"none",fontSize:13,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?N.act:"transparent",color:activeDoc===d.key?N.tx:N.ts,cursor:"pointer"}}
                          onMouseEnter={e=>{if(activeDoc!==d.key)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(activeDoc!==d.key)e.currentTarget.style.background="transparent";}}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {docs&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={downloadAllMd} disabled={zipLoading.md} style={{padding:"5px 12px",borderRadius:5,border:`1px solid rgba(34,197,94,0.27)`,background:"rgba(34,197,94,0.07)",color:"#4ade80",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",opacity:zipLoading.md?0.6:1}}>
                        {zipLoading.md?"⏳":"⬇"} .md zip
                      </button>
                      <button onClick={downloadAllDocx} disabled={zipLoading.docx||Object.keys(docxFiles).length===0} title={Object.keys(docxFiles).length===0?"No Word documents uploaded yet":undefined} style={{padding:"5px 12px",borderRadius:5,border:"1px solid rgba(59,130,246,0.27)",background:"rgba(59,130,246,0.07)",color:Object.keys(docxFiles).length===0?"#64748b":"#93c5fd",cursor:Object.keys(docxFiles).length===0?"default":"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",opacity:zipLoading.docx?0.6:1}}>
                        {zipLoading.docx?"⏳":"⬇"} .docx zip
                      </button>
                    </div>}
                  </div>

                  {/* Doc content area */}
                  {(()=>{
                    const dtEntry=DT.find(d=>d.key===activeDoc);
                    const hasContent=!!(docs&&docs[activeDoc]);
                    const isUploadable=dtEntry?.uploadable===true;
                    const docContent=docs?.[activeDoc]||"";
                    const source=docSources[activeDoc];
                    const uploadedDocxFiles=docxFiles[activeDoc]||[];
                    const uploadedMdFiles=mdUploads[activeDoc]||[];
                    const hasUploads=uploadedMdFiles.length>0||uploadedDocxFiles.length>0;
                    const mdInputId=`md-upload-${activeDoc}`;
                    const docxInputId=`docx-upload-${activeDoc}`;

                    // Shared upload buttons rendered at bottom of every uploadable slot
                    const uploadButtons=isUploadable&&(
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
                        <label htmlFor={mdInputId} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:N.bg,color:N.ts,cursor:"pointer",fontSize:13}}>
                          📎 Upload .md
                          <input id={mdInputId} type="file" accept={dtEntry?.accepts?.md} style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleMdUpload(activeDoc,f);e.target.value="";}}/>
                        </label>
                        <label htmlFor={docxInputId} style={{padding:"6px 14px",borderRadius:6,border:"1px solid rgba(59,130,246,0.27)",background:"rgba(59,130,246,0.07)",color:"#93c5fd",cursor:"pointer",fontSize:13}}>
                          📎 Upload .docx
                          <input id={docxInputId} type="file" accept={dtEntry?.accepts?.docx} style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleDocxUpload(activeDoc,f);e.target.value="";}}/>
                        </label>
                        <button onClick={()=>setShowPaste(p=>({...p,[activeDoc]:!p[activeDoc]}))} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:showPaste[activeDoc]?N.act:N.bg,color:N.ts,cursor:"pointer",fontSize:13}}>
                          ✏️ Paste
                        </button>
                      </div>
                    );

                    // Shared uploaded files list
                    const uploadedFilesList=(hasUploads&&isUploadable)&&(
                      <div style={{marginTop:20,borderTop:`1px solid ${N.bd}`,paddingTop:16}}>
                        <p style={{margin:"0 0 10px",fontSize:12,fontWeight:600,color:N.ts,textTransform:"uppercase",letterSpacing:0.5}}>Uploaded Files</p>
                        {uploadedMdFiles.length>0&&(
                          <div style={{marginBottom:12}}>
                            <p style={{margin:"0 0 6px",fontSize:12,color:N.ts}}>📄 .md files</p>
                            {uploadedMdFiles.map((f,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,background:N.sbg,marginBottom:4,flexWrap:"wrap"}}>
                                <span style={{fontSize:12,color:N.tx,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {f.name}</span>
                                <span style={{fontSize:11,color:N.ts,whiteSpace:"nowrap"}}>{new Date(f.uploadedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                                <button onClick={()=>{updateActiveProject({docs:{...(docs||{}),[activeDoc]:f.content},docSources:{...docSources,[activeDoc]:"uploaded"}});}} style={{background:"none",border:"none",color:CL.blue,cursor:"pointer",fontSize:12,padding:"0 4px",fontWeight:500}}>👁 View</button>
                                <button onClick={()=>downloadUploadedMd(f)} style={{background:"none",border:"none",color:N.ts,cursor:"pointer",fontSize:12,padding:"0 4px"}}>⬇</button>
                                <button onClick={()=>deleteMdUpload(activeDoc,i)} style={{background:"none",border:"none",color:CL.red,cursor:"pointer",fontSize:12,padding:"0 4px"}}>🗑</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {uploadedDocxFiles.length>0&&(
                          <div>
                            <p style={{margin:"0 0 6px",fontSize:12,color:N.ts}}>📄 .docx files</p>
                            {uploadedDocxFiles.map((f,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,background:N.sbg,marginBottom:4,flexWrap:"wrap"}}>
                                <span style={{fontSize:12,color:N.tx,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {f.name}</span>
                                <span style={{fontSize:11,color:N.ts,whiteSpace:"nowrap"}}>{new Date(f.uploadedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                                <button onClick={()=>downloadUploadedDocx(activeDoc,i)} style={{background:"none",border:"none",color:N.ts,cursor:"pointer",fontSize:12,padding:"0 4px"}}>⬇</button>
                                <button onClick={()=>deleteDocxUpload(activeDoc,i)} style={{background:"none",border:"none",color:CL.red,cursor:"pointer",fontSize:12,padding:"0 4px"}}>🗑</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );

                    // Shared paste panel
                    const pastePanel=isUploadable&&showPaste[activeDoc]&&(
                      <div style={{marginTop:12}}>
                        <textarea value={pasteContent[activeDoc]||""} onChange={e=>setPasteContent(p=>({...p,[activeDoc]:e.target.value}))}
                          placeholder="Paste markdown content here…"
                          style={{width:"100%",minHeight:140,padding:"10px 12px",borderRadius:6,border:`1px solid ${N.bd}`,background:"#1e2a3a",color:"#e2e8f0",fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
                        <button onClick={()=>handlePaste(activeDoc,pasteContent[activeDoc]||"")} disabled={!(pasteContent[activeDoc]||"").trim()}
                          style={{marginTop:6,padding:"6px 16px",borderRadius:6,border:"none",background:CL.green,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500,opacity:(pasteContent[activeDoc]||"").trim()?1:0.4}}>
                          💾 Save</button>
                      </div>
                    );

                    if(hasContent){
                      return(
                        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
                          <div style={{maxWidth:760,margin:"0 auto"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                  <h3 style={{fontSize:20,fontWeight:700,color:N.tx,margin:0}}>{dtEntry?.label}</h3>
                                  {source==="uploaded"&&<span style={{padding:"2px 8px",borderRadius:10,background:`${CL.blue}15`,color:CL.blue,fontSize:11,fontWeight:600}}>📤 Uploaded</span>}
                                  {source==="pasted"&&<span style={{padding:"2px 8px",borderRadius:10,background:`${CL.amber}15`,color:CL.amber,fontSize:11,fontWeight:600}}>📝 Pasted</span>}
                                </div>
                                <span style={{fontSize:12,color:N.ts,fontFamily:"monospace"}}>{dtEntry?.file}</span>
                              </div>
                              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
                                <button onClick={()=>cp(docContent,activeDoc)} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:copied[activeDoc]?"rgba(68,131,97,0.08)":N.bg,color:copied[activeDoc]?CL.green:N.ts,cursor:"pointer",fontSize:13}}>{copied[activeDoc]?"Copied ✓":"📋 Copy"}</button>
                                <button onClick={()=>downloadMd(activeDoc)} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:N.bg,color:"#60a5fa",cursor:"pointer",fontSize:13}}>⬇ .md</button>
                                <button onClick={()=>downloadDocx(activeDoc)} style={{padding:"6px 14px",borderRadius:6,border:"1px solid rgba(59,130,246,0.27)",background:"rgba(59,130,246,0.07)",color:"#93c5fd",cursor:"pointer",fontSize:13,fontWeight:600}}>⬇ .docx</button>
                              </div>
                            </div>
                            <div style={{background:N.sbg,border:`1px solid ${N.bd}`,borderRadius:8,padding:"20px 24px"}}>
                              {renderMd(docContent)}
                            </div>
                            {uploadedFilesList}
                            {uploadButtons}
                            {pastePanel}
                          </div>
                        </div>
                      );
                    } else if(isUploadable){
                      return(
                        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
                          <div style={{maxWidth:760,margin:"0 auto"}}>
                            <div style={{marginBottom:20}}>
                              <h3 style={{fontSize:20,fontWeight:700,color:N.tx,margin:"0 0 3px"}}>{dtEntry?.label}</h3>
                              <span style={{fontSize:12,color:N.ts,fontFamily:"monospace"}}>{dtEntry?.file}</span>
                            </div>
                            <div style={{border:`1px solid ${N.bd}`,borderRadius:10,padding:"28px",background:N.sbg}}>
                              <div style={{fontSize:28,marginBottom:10,textAlign:"center"}}>📄</div>
                              <p style={{fontSize:15,fontWeight:600,color:N.tx,margin:"0 0 6px",textAlign:"center"}}>No document yet</p>
                              <p style={{fontSize:13,color:N.ts,margin:"0 0 20px",lineHeight:1.6,textAlign:"center"}}>Generate using <strong>🚀 Generate</strong>, or upload a document you created via copy-paste.</p>
                              {uploadButtons}
                              {pastePanel}
                            </div>
                            {uploadedFilesList}
                          </div>
                        </div>
                      );
                    } else {
                      return(
                        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <p style={{color:N.ts,fontSize:14}}>Generate from Intake first.</p>
                        </div>
                      );
                    }
                  })()}
                </>
            }
          </div>
        )}


        {/* ═══ WORKFLOW ═══ */}
        {tab==="workflow"&&(()=>{
          type WfPrompt={key:string;text:string};
          type WfSprint={id:string;label:string;items:string[];prompts?:WfPrompt[];promptLabels?:string[]};
          type WfPhase={id:string;label:string;desc:string;gate?:string;noSprint?:string;tipText?:string;sprints?:WfSprint[];deploySteps?:string[];prompts?:WfPrompt[];promptLabels?:string[]};
          const wfStatus=activeProject?.workflowStatus||{};
          const toggleItem=(key: string)=>{updateActiveProject({workflowStatus:{...wfStatus,[key]:!wfStatus[key]}});};
          const cpBlock=(text: string,key: string)=>(
            <div style={{position:"relative",borderRadius:7,overflow:"hidden",marginTop:10}}>
              <div style={{background:"#1e1e2e",padding:"14px 16px",paddingRight:110,borderRadius:7}}>
                <pre style={{margin:0,fontSize:12,color:"#cdd6f4",fontFamily:"'Fira Code','Consolas',monospace",whiteSpace:"pre-wrap",lineHeight:1.75,wordBreak:"break-word"}}>{text}</pre>
              </div>
              <button onClick={()=>cp(text,key)} style={{position:"absolute",top:10,right:10,padding:"4px 10px",borderRadius:5,border:"none",background:copied[key]?"rgba(68,200,120,0.25)":"rgba(255,255,255,0.12)",color:copied[key]?"#6ee7b7":"#cdd6f4",cursor:"pointer",fontSize:11,fontWeight:500,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                {copied[key]?"✓ Copied!":"📋 Copy"}
              </button>
            </div>
          );
          const tip=(text: string)=>(
            <div style={{background:"rgba(253,186,116,0.08)",border:"1px solid rgba(253,186,116,0.2)",borderRadius:6,padding:"8px 12px",margin:"12px 0",fontSize:12,color:"#d97706",lineHeight:1.5}}>💡 {text}</div>
          );
          const checkList=(items: string[],prefix: string)=>{
            const done=items.filter((_,i)=>wfStatus[`${prefix}_${i}`]).length;
            return{done,total:items.length,el:(
              <div style={{marginTop:10}}>
                {items.map((item,i)=>{
                  const k=`${prefix}_${i}`;
                  return(
                    <label key={k} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",cursor:"pointer",fontSize:13,color:wfStatus[k]?N.ts:N.tx,textDecoration:wfStatus[k]?"line-through":"none",lineHeight:1.5}}>
                      <input type="checkbox" checked={!!wfStatus[k]} onChange={()=>toggleItem(k)} style={{marginTop:2,flexShrink:0,accentColor:CL.green}}/>
                      {item}
                    </label>
                  );
                })}
              </div>
            )};
          };

          const PHASES: WfPhase[]=[
            {id:"p1",label:"Phase 1 — Ideation & Scoping",desc:"Run the cerebro-build-os skill in a new Claude chat. It guides you through a 12-question ideation interview and produces a confirmed project brief before you touch CEREBRO.",gate:"You can answer: what does it do, who uses it, what are the must-haves?",noSprint:"No sprint card — this phase is a Claude chat."},
            {id:"p2",label:"Phase 2 — CEREBRO Intake",desc:"Run CEREBRO to generate your 8 build documents. Choose Avatar State (~47 questions) or Spirit Guide (~31 questions).",gate:"All 8 .md files generated and saved locally.",noSprint:"No sprint card — this phase IS CEREBRO."},
            {id:"p3",label:"Phase 3 — Project Setup",desc:"Configure everything before writing a single line of feature code. Deploy first, build second.",gate:"Claude Project configured. Vercel deploying (even if blank). CLAUDE.md in the project root.",sprints:[
              {id:"s0",label:"Sprint 0 — Project Setup [P3]",items:["Create desktop folder structure (/docs, /change-briefs, /sprints, /assets)","Copy all 8 CEREBRO .md files into /docs/","Copy CLAUDE.md from /docs/ to the project root","Create Claude Project → upload all 8 .md files to Project Knowledge","Set system prompt in Claude Project","Create GitHub repo → init commit → push","Connect repo to Vercel → confirm blank deploy works","Set all env vars in Vercel dashboard","Open VS Code → confirm Claude Code extension is installed"]}
            ]},
            {id:"p4",label:"Phase 4 — Sprint Build",desc:"Build V1 using Claude Code. Three sprints, new Claude Code session per sprint. Always use the plan-first gate.",gate:"Core app works end-to-end and is live on Vercel.",tipText:"Use Sonnet for implementation — it's faster and cheaper. Type /model in Claude Code to switch. Use Opus only for complex architecture decisions. Type /compact when sessions feel slow. Commit after every working session.",sprints:[
              {id:"s1",label:"Sprint 1 — Build Plan + Backend Foundation",items:["Open VS Code → new Claude Code session","Paste Session 1 prompt (below) → review build plan → approve","Claude Code: Phase 1 — project setup, dependencies, folder structure","Claude Code: Phase 2 — database schema + authentication","Claude Code: Phase 3 — core API endpoints","Run any available tests → fix errors","Commit: 'feat: backend foundation and auth'","Update plan.md to mark phases done","Run P7 deploy → smoke test API endpoints"],prompts:[{key:"wf_s1",text:`Read CLAUDE.md and all .md files in the /docs/ folder carefully.\n\nThen create a detailed build plan in plan.md with these phases:\n  Phase 1: Project setup (dependencies, folder structure, env config)\n  Phase 2: Database schema and authentication setup\n  Phase 3: Core API endpoints\n  Phase 4: Frontend shell (layout, navigation, routing)\n  Phase 5: Feature pages (one subsection per screen from app-flow.md)\n  Phase 6: Polish (error handling, loading states, responsive design)\n  Phase 7: Testing and deployment\n\nFor each phase, list the specific files you will create or modify.\nDo NOT write any code yet. Show me the plan and wait for my approval.`}]},
              {id:"s2",label:"Sprint 2 — Frontend Shell + Feature Pages",items:["Open VS Code → new Claude Code session","Paste Session 3 prompt (below) → review plan if needed → approve","Claude Code: Phase 4 — frontend shell, layout, navigation, routing","Claude Code: Phase 5 — feature pages per app-flow.md","QA each screen in the browser → fix layout and connection issues","Commit: 'feat: frontend shell and feature pages'","Run P7 deploy → smoke test all screens"],prompts:[{key:"wf_s2",text:`Read CLAUDE.md. Continue from plan.md.\n\nExecute Phase 4 (frontend shell) and Phase 5 (feature pages).\nFollow design.md for all visual decisions — colours, typography, spacing, components.\nFollow app-flow.md for routing, navigation structure, and screen transitions.\n\nBuild each screen listed in app-flow.md, connecting to the API endpoints from Phase 3.\nAfter completing each phase, update plan.md.\nReport what was built and any issues encountered.`}]},
              {id:"s3",label:"Sprint 3 — Polish + First Deploy",items:["Open VS Code → new Claude Code session","Paste Session 4 prompt (below) → approve","Claude Code: Phase 6 — error handling, loading states, responsive design","Claude Code: Phase 7 — run tests, fix failures, deployment config","Verify mobile responsive at minimum 375px width","Commit: 'feat: polish and error handling'","Merge to main → Vercel auto-deploys","Smoke test 5 core user flows on the live URL","Update change-log.md in /change-briefs/ to note V1 complete"],prompts:[{key:"wf_s3",text:`Read CLAUDE.md. Continue from plan.md.\n\nExecute Phase 6 (polish) and Phase 7 (testing + deployment):\n  - Add error handling to all API calls\n  - Add loading states to all async operations\n  - Ensure responsive design works on mobile (min 375px width)\n  - Run all tests and fix any failures\n  - Set up deployment configuration\n\nUpdate plan.md with final status.\nGive me a summary of: what was built, what works, what needs attention.`}]}
            ]},
            {id:"p5",label:"Phase 5 — Iteration (Change Brief Loop)",desc:"After V1 ships, every new feature or change uses the cerebro-change-brief skill inside your Claude Project. Changes are surgical, documented, and version-tracked.",tipText:"Claude Code: use Sonnet for implementation. Claude Project: use Opus for writing and refining change briefs.",sprints:[
              {id:"s4",label:"Sprint 4+ — [Feature Name] — V[N] Iteration",items:["Open Claude Project → new chat named: CB-[date]-[feature]","Type: CB: [describe what you want to change] — this triggers the skill","Upload current change-log.md (V3+ only)","Skill searches project knowledge and writes the change brief","Review change brief → confirm scope and 'What\u2019s NOT Changing' section","Save change-brief-v[N].md and change-log.md to /change-briefs/","Open new Claude Code session → paste Claude Code prompt from the brief","Review plan → approve → Claude Code implements","QA in browser → fix → commit","P7 deploy → close sprint in Notion"],prompts:[{key:"wf_s4_cb",text:`CB: [describe what you want to change]\n\n[upload your current change-log.md here — required for V3+]`},{key:"wf_s4_cc",text:`Read change-brief-v[N].md and change-log.md in this project folder.\n\nThis is a V[N] update. Make ONLY the changes listed in the brief.\n\nBefore writing any code:\n1. List every file you will modify\n2. Describe what you will change in each file\n3. Wait for my approval before proceeding\n\nDo not rebuild from scratch. Surgical edits only.`}],promptLabels:["Change brief trigger prompt","Claude Code implementation prompt"]}
            ]},
            {id:"p6",label:"Phase 6 — UI Polish (Stitch Loop)",desc:"Optional. When the app works but the visual design needs a lift. Google Stitch lets you redesign screens, then Claude Code applies the visual changes without touching business logic.",tipText:"This is visual-layer only. Never pass your full codebase into a Stitch session — just describe or import the screen you want to redesign.",sprints:[
              {id:"sN",label:"Sprint N — UI Polish — Stitch Refresh",items:["Identify the screen(s) to redesign","Open stitch.withgoogle.com → redesign the selected screen(s)","Export as HTML or write DESIGN.md with the changes","Open new Claude Code session → paste Stitch prompt","QA visual changes → no logic should be broken","Commit: 'design: [screen name] visual refresh'","P7 deploy → smoke test"],prompts:[{key:"wf_sN",text:`I have redesigned [SCREEN NAME] using Google Stitch.\nThe new design is: [paste HTML or describe the changes]\n\nUpdate the existing component to match this new design.\nKeep ALL existing functionality — only change the visual layer.\nFollow design.md for design tokens (colours, spacing, typography).\nDo not modify any API calls, state management, or business logic.`}]}
            ]},
            {id:"p7",label:"Phase 7 — Deploy & Monitor",desc:"P7 runs after every sprint — not just at the end of the project. Every merge to main triggers a Vercel auto-deploy. Verify it worked and log the state.",deploySteps:["Merge sprint branch to main → Vercel auto-deploys","Open the live Vercel URL → confirm the deploy succeeded","Smoke test 3–5 core user flows on the live URL","Check Vercel function logs for any runtime errors","Update change-log.md in /change-briefs/ — note what was deployed and when","Archive the sprint in Notion → mark status: Complete"],prompts:[{key:"wf_p7_fail",text:`The Vercel deploy failed. Check the build logs and terminal output.\nDiagnose the error and fix it. Report what the error was and what you changed.`}],promptLabels:["Failed deploy prompt"]}
          ];

          return(
            <div style={{flex:1,overflowY:"auto",padding:"40px 56px 60px"}}>
              <div style={{maxWidth:720,margin:"0 auto"}}>
                <h2 style={{fontSize:26,fontWeight:700,color:N.tx,margin:"0 0 6px",letterSpacing:-0.3}}>Build Workflow</h2>
                <p style={{fontSize:14,color:N.ts,margin:"0 0 28px",lineHeight:1.6}}>Your complete build system — from first idea to shipped product.</p>
                {PHASES.map(phase=>{
                  const isOpen=expandedSession===phase.id as unknown as number;
                  return(
                    <div key={phase.id} style={{border:`1px solid ${isOpen?accent+"88":N.bd}`,borderRadius:9,marginBottom:8,background:isOpen?accent+"05":"transparent",transition:"border-color 0.15s"}}>
                      <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpandedSession(isOpen?null:phase.id as unknown as number)}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:N.tx}}>{phase.label}</div>
                        </div>
                        <span style={{fontSize:11,color:N.tm,flexShrink:0,userSelect:"none"}}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&(
                        <div style={{padding:"0 18px 20px"}}>
                          <p style={{fontSize:13,color:N.ts,margin:"0 0 12px",lineHeight:1.6}}>{phase.desc}</p>
                          {phase.tipText&&tip(phase.tipText)}
                          {phase.noSprint&&<p style={{fontSize:12,color:N.tm,fontStyle:"italic",margin:"0 0 8px"}}>{phase.noSprint}</p>}
                          {phase.gate&&<div style={{background:N.hov,borderRadius:6,padding:"8px 12px",fontSize:12,color:N.ts,margin:"8px 0 0"}}>✅ Gate: {phase.gate}</div>}
                          {phase.sprints&&phase.sprints.map(sprint=>{
                            const cl=checkList(sprint.items,sprint.id);
                            const allDone=cl.done===cl.total;
                            return(
                              <div key={sprint.id} style={{border:`1px solid ${N.bd}`,borderRadius:7,padding:"14px 16px",marginTop:14,background:N.sbg}}>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                                  <div style={{fontSize:14,fontWeight:600,color:N.tx}}>{sprint.label}</div>
                                  <div style={{fontSize:11,color:allDone?CL.green:N.ts,fontWeight:allDone?600:400}}>{allDone?"✅ Complete":`${cl.done}/${cl.total} done`}</div>
                                </div>
                                {cl.el}
                                {sprint.prompts&&sprint.prompts.map((p,pi)=>(
                                  <div key={p.key}>
                                    {sprint.promptLabels&&<div style={{fontSize:12,fontWeight:600,color:N.ts,marginTop:14,marginBottom:2}}>{sprint.promptLabels[pi]}</div>}
                                    {cpBlock(p.text,p.key)}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          {phase.deploySteps&&(
                            <div style={{border:`1px solid ${N.bd}`,borderRadius:7,padding:"14px 16px",marginTop:14,background:N.sbg}}>
                              <div style={{fontSize:14,fontWeight:600,color:N.tx,marginBottom:8}}>Deploy checklist (every sprint)</div>
                              {phase.deploySteps.map((s,i)=>(
                                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"4px 0",fontSize:13,color:N.ts,lineHeight:1.5}}>
                                  <span style={{color:N.tm,flexShrink:0}}>{i+1}.</span>{s}
                                </div>
                              ))}
                              {phase.prompts&&phase.prompts.map((p,pi)=>(
                                <div key={p.key}>
                                  {phase.promptLabels&&<div style={{fontSize:12,fontWeight:600,color:N.ts,marginTop:14,marginBottom:2}}>{phase.promptLabels[pi]}</div>}
                                  {cpBlock(p.text,p.key)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>

      {/* ═══ P1 PAYLOAD MODAL ═══ */}
      {showP1Modal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)setShowP1Modal(false);}}>
        <div style={{background:N.bg,border:`1px solid ${N.bd}`,borderRadius:12,padding:24,width:"100%",maxWidth:520,margin:"0 20px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)"}}>
          <h2 style={{fontSize:17,fontWeight:600,margin:"0 0 6px",color:N.tx}}>Load P1 Brief</h2>
          <p style={{fontSize:13,color:N.ts,margin:"0 0 14px",lineHeight:1.5}}>Paste the payload block from your Build OS P1 session. CEREBRO will pre-fill your intake form — you can edit anything after.</p>
          <textarea value={p1Text} onChange={e=>setP1Text(e.target.value)} placeholder={"Paste your ---CEREBRO-PAYLOAD--- block here"} rows={10} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:`1px solid ${N.bd}`,background:N.bg,color:N.tx,fontSize:12,fontFamily:"monospace",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
          {p1Error&&<p style={{color:CL.red,fontSize:12,margin:"6px 0 0"}}>{p1Error}</p>}
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowP1Modal(false)} style={{padding:"6px 16px",borderRadius:6,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={()=>{
              const result=parseP1Payload(p1Text);
              if("error" in result&&result.error==="no_delimiter"){setP1Error("Payload not detected. Copy the full block including the --- markers.");return;}
              if("error" in result&&result.error==="invalid_json"){setP1Error("Payload format is invalid. Copy the block exactly as generated.");return;}
              if("fields" in result){
                if(result.mode==="avatar"||result.mode==="spirit")switchMode(result.mode);
                updateActiveProject({currentAnswers:{...ans,...result.fields}});
                setShowP1Modal(false);
                setToast(`✓ ${result.count} fields pre-filled from your P1 brief. Review and edit anything.`);
                setTimeout(()=>setToast(""),3500);
              }
            }} style={{padding:"6px 16px",borderRadius:6,border:"none",background:accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>Load</button>
          </div>
        </div>
      </div>}

      {/* ═══ TOAST ═══ */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:N.bg,border:`1px solid ${N.bd}`,borderRadius:8,padding:"10px 18px",color:CL.green,fontSize:13,fontWeight:500,zIndex:1100,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.12)",pointerEvents:"none"}}>{toast}</div>}

    </div>
  );
}
