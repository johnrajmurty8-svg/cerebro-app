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

const CEREBRO_PAYLOAD_VERSION="1.0";

/* ═══ System prompt, generators ═══ */
const SYS=`You are a senior product/technical lead generating a complete build package from a product intake form. You must produce 13 output items total — 8 Markdown files and 5 Word document descriptions.

## OUTPUT FORMAT

Generate each document as a clearly separated section using this exact format:

---FILE: [filename]---
[full document content]
---END FILE---

The 13 items you must produce, in order:

### Markdown Files (1–5: core technical docs)
1. **prd.md** — Product Requirements Document. 14 sections: Document Control, Problem Statement, User Personas, Goals & Metrics, Functional Requirements (grouped by Epic with FR-001 IDs, acceptance criteria, MoSCoW priority), Non-Functional Requirements, Scope (in/out), Technical Architecture, Release Plan, Go/No-Go Criteria, Risks & Mitigations, Open Questions. 1000–2000 words.
2. **app-flow.md** — App Flow & Navigation. Route map (every URL), authentication flow, onboarding flow, main app layout, screen-by-screen interaction flows (what loads, what user does, what happens), error & edge cases. 800–1500 words.
3. **design.md** — UI Design Guide. Design tokens (colors with hex values, typography scale, spacing, radius, shadows), breakpoints with responsive behavior, component specifications (dimensions, states, styling), motion & animation specs, iconography. 800–1500 words.
4. **backend-spec.md** — Backend Specification. Data models (every table with fields, types, constraints, relationships), API endpoints (route, method, description), services, environment variables list, folder structure. 1000–2000 words.
5. **security-checklist.md** — Security Checklist. Authentication, authorization (RBAC, row-level security), encryption (transit, rest, secrets), input validation, OWASP Top 10 coverage table, integration security, API headers, compliance (GDPR, SOC2 as applicable), AI-specific security, incident response. 800–1500 words.

### Word Documents (6–10: stakeholder versions — describe content as if writing a Word doc)
6. **prd.docx** — Same content as prd.md formatted as a professional Word document with branded header, styled requirement tables, color-coded MoSCoW labels, and attention boxes for flagged items.
7. **app-flow.docx** — Same content as app-flow.md formatted as a professional Word document with route table, numbered flow steps, and attention boxes.
8. **design.docx** — Same content as design.md formatted as a professional Word document with token tables, component spec sections, and breakpoint matrix.
9. **backend-spec.docx** — Same content as backend-spec.md formatted as a professional Word document with data model tables and endpoint tables.
10. **security-checklist.docx** — Same content as security-checklist.md formatted as a professional Word document with OWASP coverage table and compliance checklists.

### Operational Markdown Files (11–13: Claude Code session files)
11. **CLAUDE.md** — Claude Code auto-read instructions. Include: product name + one-liner; stack section (from intake, or best recommendation if blank); Rules: read project-brief.md first, write plan.md before any code and wait for approval, follow design.md / backend-spec.md / security-checklist.md / app-flow.md, use TypeScript, write tests, keep components small, use env vars for all secrets; Workflow: Read docs → Plan → Approve → Build → Test → Report; Principles: simplicity, no shortcuts, minimal blast radius, ask when unsure. 200–400 words.
12. **project-brief.md** — One-page project overview. Include: product name + one-liner; owner, launch date, team size (from intake); top 3–5 goals (from intake); build order: 1. Setup, 2. DB + Auth, 3. API, 4. UI Shell, 5. Features, 6. Polish, 7. Deploy; document map listing all 8 filenames. 300–500 words.
13. **startup-prompts.md** — Ready-to-paste Claude Code session prompts. Include: Session 1 — Setup (~20 min): Read CLAUDE.md + all docs, create plan.md with phases, no code yet. Session 2 — Backend (~1–2 hr): Execute phases 1–3, follow backend-spec.md + security-checklist.md. Session 3 — Frontend (~1–2 hr): Execute phases 4–5, follow design.md + app-flow.md. Session 4 — Polish (~1 hr): Phases 6–7, errors, loading states, responsive, tests, deploy. Optional Stitch Session: Redesign in Stitch → export HTML or DESIGN.md → "Update [component] to match. Keep functionality." Each session block must be copy-paste ready — a self-contained prompt the user can drop into Claude Code without editing. 400–600 words.

## RULES
- Flag ambiguities or missing info with [⚠️ ATTENTION NEEDED] — never invent answers
- Use the product name from the intake in all headers and titles
- Every functional requirement needs a unique ID (FR-001, FR-002, etc.), a MoSCoW priority, and acceptance criteria
- Data models must include field names, types, constraints (PK, FK, NOT NULL, UNIQUE), and relationships
- Design tokens must include actual hex color values, not just descriptions
- The .md files should be usable by Claude Code with no further editing

Below is the complete project intake form. Generate all 13 items from this information.`;

function genClaudeMd(a){return `# ${a.product_name||"Product"} — Claude Code Instructions\n\n## Overview\n${a.one_liner||"See project-brief.md"}\n\n## Stack\n${a.tech_stack||"Best modern stack"}\n\n## Rules\n- Read project-brief.md FIRST\n- plan.md before coding — wait for approval\n- Follow design.md, backend-spec.md, security-checklist.md, app-flow.md\n- TypeScript, tests, small components, env vars\n\n## Workflow\n1. Read doc → 2. Plan → 3. Approve → 4. Build → 5. Test → 6. Report\n\n## Principles\nSimplicity. No shortcuts. Minimal impact. Ask when unsure.`;}
function genBrief(a){return `# ${a.product_name||"Product"} — Brief\n\n> ${a.one_liner||""}\n\nOwner: ${a.author||"TBD"} | Launch: ${a.target_date||"TBD"} | Team: ${a.team_size||"Solo+AI"}\n\n## Build Order\n1. Setup 2. DB+Auth 3. API 4. UI Shell 5. Features 6. Polish 7. Deploy\n\n## Docs\nprd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md, CLAUDE.md`;}
function genPrompts(a){return `# Prompts for ${a.product_name||"Product"}\n\n═══ SESSION 1: SETUP (~20min) ═══\nRead CLAUDE.md + all docs. Create plan.md with phases. No code yet.\n\n═══ SESSION 2: BACKEND (~1-2hr) ═══\nExecute Phase 1-3. Follow backend-spec.md + security-checklist.md.\n\n═══ SESSION 3: FRONTEND (~1-2hr) ═══\nExecute Phase 4-5. Follow design.md + app-flow.md.\n\n═══ SESSION 4: POLISH (~1hr) ═══\nPhase 6-7. Errors, loading, responsive, tests, deploy.\n\n═══ OPTIONAL: STITCH ═══\nRedesign in Stitch → export → "Update [component] to match. Keep functionality."`;}

/* ═══ DIFF ENGINE ═══ */
function computeDiff(oldAns, newAns, sections) {
  const changes = { added: [], modified: [], removed: [], unchanged: 0 };
  const allQs = sections.flatMap(s => s.questions.map(q => ({ ...q, section: s.title })));
  allQs.forEach(q => {
    const o = (oldAns[q.id] || "").trim();
    const n = (newAns[q.id] || "").trim();
    if (!o && n) changes.added.push({ id: q.id, label: q.label, section: q.section, newVal: n });
    else if (o && !n) changes.removed.push({ id: q.id, label: q.label, section: q.section, oldVal: o });
    else if (o && n && o !== n) changes.modified.push({ id: q.id, label: q.label, section: q.section, oldVal: o, newVal: n });
    else if (o && n && o === n) changes.unchanged++;
  });
  return changes;
}

function generateChangeBrief(diff, oldVer, newVer, productName) {
  let b = `# Change Brief: V${oldVer} → V${newVer}\n`;
  b += `Product: ${productName}\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
  b += `## Summary\n`;
  b += `- ${diff.added.length} fields added\n- ${diff.modified.length} fields modified\n- ${diff.removed.length} fields removed\n- ${diff.unchanged} fields unchanged\n\n`;
  if (diff.modified.length) {
    b += `## Modified\n`;
    diff.modified.forEach(c => {
      b += `### ${c.section} → ${c.label}\n`;
      b += `**Was:** ${c.oldVal.substring(0, 200)}${c.oldVal.length > 200 ? "..." : ""}\n`;
      b += `**Now:** ${c.newVal.substring(0, 200)}${c.newVal.length > 200 ? "..." : ""}\n\n`;
    });
  }
  if (diff.added.length) {
    b += `## Added\n`;
    diff.added.forEach(c => { b += `### ${c.section} → ${c.label}\n${c.newVal.substring(0, 200)}${c.newVal.length > 200 ? "..." : ""}\n\n`; });
  }
  if (diff.removed.length) {
    b += `## Removed\n`;
    diff.removed.forEach(c => { b += `### ${c.section} → ${c.label}\n~~${c.oldVal.substring(0, 200)}~~\n\n`; });
  }
  b += `\n---\n\n## Claude Code Update Prompt\n\nPaste this into Claude Code:\n\n`;
  b += `Read change-brief.md. This describes changes from V${oldVer} to V${newVer}.\nMake ONLY the listed changes. Do not rebuild unchanged features.\nCreate an update plan first — do not code until I approve.\nFor each change, update the minimum files needed.\n`;
  return b;
}

function parseP1Payload(text){
  const start=text.indexOf("---CEREBRO-PAYLOAD---");
  const end=text.indexOf("---END-PAYLOAD---");
  if(start===-1||end===-1)return{error:"no_delimiter"};
  const jsonStr=text.slice(start+21,end).trim();
  try{
    const obj=JSON.parse(jsonStr);
    const fields={};let count=0;
    Object.entries(obj).forEach(([k,v])=>{
      if(k==="payload_version"||k==="mode")return;
      if(v&&String(v).trim()){fields[k]=String(v).trim();count++;}
    });
    return{fields,mode:obj.mode||null,count};
  }catch{
    return{error:"invalid_json"};
  }
}

/* ═══ Helpers ═══ */
function FileChip({file,onRemove}){return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#1e293b",border:"1px solid #334155",borderRadius:6,padding:"3px 8px",fontSize:11,maxWidth:160}}><span style={{fontSize:12}}>📁</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:"#94a3b8"}}>{file.name}</span><button onClick={onRemove} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,padding:0}}>×</button></span>;}

const TABS=["intake","results","versions","workflow","usage"];
const TL={intake:"📝 Intake",results:"📄 Docs",versions:"🔄 Versions",workflow:"🗺️ Plan",usage:"⚡ Usage"};
const DT=[{key:"prd",label:"📋 PRD",file:"prd.md"},{key:"appFlow",label:"🗺️ Flow",file:"app-flow.md"},{key:"design",label:"🎨 UI",file:"design.md"},{key:"backend",label:"⚙️ Backend",file:"backend-spec.md"},{key:"security",label:"🛡️ Security",file:"security-checklist.md"},{key:"claudeMd",label:"🤖 CLAUDE",file:"CLAUDE.md"},{key:"projectBrief",label:"📦 Brief",file:"project-brief.md"},{key:"prompts",label:"💬 Prompts",file:"prompts.md"},{key:"changeBrief",label:"🔄 Changes",file:"change-brief.md"}];

/* ═══ MAIN APP ═══ */
export default function Cerebro(){
  const [mode,setMode]=useState(null);
  const [tab,setTab]=useState("intake");
  const [sec,setSec]=useState(0);
  const [ans,setAns]=useState({});
  const [files,setFiles]=useState({});
  const [sidebar,setSidebar]=useState(true);
  const [flash,setFlash]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [genProg,setGenProg]=useState("");
  const [genErr,setGenErr]=useState("");
  const [docs,setDocs]=useState(null);
  const [copied,setCopied]=useState({});
  const [activeDoc,setActiveDoc]=useState("prd");
  const [showP1Modal,setShowP1Modal]=useState(false);
  const [p1Text,setP1Text]=useState("");
  const [p1Error,setP1Error]=useState("");
  const [toast,setToast]=useState("");
  // Versioning
  const [versions,setVersions]=useState([]); // [{ver:1, date:"...", ans:{...}, mode:"avatar"}]
  const [currentVer,setCurrentVer]=useState(0);
  const [changeBrief,setChangeBrief]=useState("");
  const [diffResult,setDiffResult]=useState(null);
  const fR=useRef({});const formRef=useRef(null);

  const SECTIONS=mode==="avatar"?AVATAR:SPIRIT;
  const TOTAL_Q=SECTIONS.flatMap(s=>s.questions).length;

  // Load
  useEffect(()=>{(async()=>{try{const r=await window.storage.get("cerebro-v1");if(r?.value){const d=JSON.parse(r.value);if(d.ans)setAns(d.ans);if(d.sec!=null)setSec(d.sec);if(d.mode)setMode(d.mode);if(d.versions)setVersions(d.versions);if(d.currentVer)setCurrentVer(d.currentVer);}}catch{}})();},[]);
  // Auto-save
  useEffect(()=>{const t=setTimeout(()=>{try{window.storage.set("cerebro-v1",JSON.stringify({ans,sec,mode,versions,currentVer}));}catch{}},1500);return()=>clearTimeout(t);},[ans,sec,mode,versions,currentVer]);

  const save=useCallback(async()=>{try{await window.storage.set("cerebro-v1",JSON.stringify({ans,sec,mode,versions,currentVer}));setFlash(true);setTimeout(()=>setFlash(false),1500);}catch{}},[ans,sec,mode,versions,currentVer]);
  const upd=(id,v)=>setAns(p=>({...p,[id]:v}));
  const addF=(id,f)=>{const arr=Array.from(f);setFiles(p=>({...p,[id]:[...(p[id]||[]),...arr]}));};
  const rmF=(id,i)=>setFiles(p=>({...p,[id]:p[id].filter((_,j)=>j!==i)}));
  const secProg=i=>{const s=SECTIONS[i];if(!s)return 0;return Math.round(s.questions.filter(q=>(ans[q.id]||"").trim()).length/s.questions.length*100);};
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
  const cp=async(t,k)=>{try{await navigator.clipboard.writeText(t);}catch{const el=document.createElement("textarea");el.value=t;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}setCopied(p=>({...p,[k]:true}));setTimeout(()=>setCopied(p=>({...p,[k]:false})),2000);};
  const downloadMd=(key)=>{const content=key==="changeBrief"?changeBrief:docs?.[key];if(!content)return;const fileName=DT.find(d=>d.key===key)?.file||`${key}.md`;const blob=new Blob([content],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);};
  const downloadDocx=async(key)=>{const content=key==="changeBrief"?changeBrief:docs?.[key];if(!content)return;const dtEntry=DT.find(d=>d.key===key);const fileName=dtEntry?.file?.replace(".md",".docx")||`${key}.docx`;const docTitle=dtEntry?.label?.replace(/^[^\w]+/,"").trim()||key;const productName=ans?.product_name||"CEREBRO Project";try{const{Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,HeadingLevel,AlignmentType,WidthType,ShadingType,BorderStyle}=await import("docx");const lines=content.split("\n");const bodyChildren=[];for(const line of lines){if(line.startsWith("### ")){bodyChildren.push(new Paragraph({heading:HeadingLevel.HEADING_3,children:[new TextRun({text:line.slice(4),bold:true,color:"4A90D9",size:24})]}))}else if(line.startsWith("## ")){bodyChildren.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun({text:line.slice(3),bold:true,color:"60A5FA",size:28})]}))}else if(line.startsWith("# ")){bodyChildren.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun({text:line.slice(2),bold:true,color:"93C5FD",size:32})]}))}else if(line.match(/^[-*]\s/)){bodyChildren.push(new Paragraph({bullet:{level:0},children:[new TextRun({text:line.slice(2),size:22,color:"CBD5E1"})]}))}else if(line.match(/^---+$/)){bodyChildren.push(new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:"334155",space:1}},children:[new TextRun("")]}))}else if(!line.trim()){bodyChildren.push(new Paragraph({children:[new TextRun("")]}))}else{const parts=line.split(/(\*\*.*?\*\*)/g);const runs=parts.map(p=>p.startsWith("**")&&p.endsWith("**")?new TextRun({text:p.slice(2,-2),bold:true,size:22,color:"E2E8F0"}):new TextRun({text:p,size:22,color:"CBD5E1"}));bodyChildren.push(new Paragraph({children:runs}));}}const headerTable=new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[9360],rows:[new TableRow({children:[new TableCell({width:{size:9360,type:WidthType.DXA},shading:{fill:"0F172A",type:ShadingType.CLEAR},margins:{top:200,bottom:200,left:300,right:300},borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.SINGLE,size:6,color:"3B82F6"},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},children:[new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:"🧠 CEREBRO",bold:true,size:28,color:"3B82F6",font:"Arial"}),new TextRun({text:"  ·  Master Build Package Generator",size:20,color:"64748B",font:"Arial"})]}),new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:productName,bold:true,size:24,color:"E2E8F0",font:"Arial"}),new TextRun({text:`  ·  ${docTitle}`,size:20,color:"94A3B8",font:"Arial"})]}),new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:`Generated: ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`,size:18,color:"475569",font:"Arial",italics:true})]})]})]})]);const doc=new Document({styles:{default:{document:{run:{font:"Arial",size:22,color:"CBD5E1"}}}},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1440,bottom:1440,left:1440}}},children:[headerTable,new Paragraph({children:[new TextRun("")]}), ...bodyChildren]}]});const buffer=await Packer.toBuffer(doc);const blob=new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);}catch(err){console.error("docx generation failed:",err);alert("Could not generate .docx — downloading .md instead.");downloadMd(key);}};
  const downloadAll=async()=>{if(!docs)return;const exportKeys=DT.filter(d=>d.key!=="changeBrief").map(d=>d.key);for(const key of exportKeys){await downloadMd(key);await new Promise(r=>setTimeout(r,150));}}

  // Save version snapshot
  const saveVersion = () => {
    const newVer = versions.length + 1;
    const snapshot = { ver: newVer, date: new Date().toISOString(), ans: { ...ans }, mode };
    const newVersions = [...versions, snapshot];
    setVersions(newVersions);
    setCurrentVer(newVer);

    // Compute diff if V2+
    if (newVer > 1) {
      const prevAns = versions[versions.length - 1].ans;
      const diff = computeDiff(prevAns, ans, SECTIONS);
      setDiffResult(diff);
      const brief = generateChangeBrief(diff, newVer - 1, newVer, ans.product_name || "Product");
      setChangeBrief(brief);
    }
    return newVersions;
  };

  // Load a previous version's answers
  const loadVersion = (ver) => {
    const v = versions.find(x => x.ver === ver);
    if (v && confirm(`Load V${ver} answers? Current unsaved changes will be lost.`)) {
      setAns({ ...v.ans });
      if (v.mode) setMode(v.mode);
      setCurrentVer(ver);
    }
  };

  // Create V2 from V1
  const startNewVersion = () => {
    setTab("intake");
  };

  // Load test data
  const loadTestData = () => {
    const td = {
      product_name: "FamilyTable",
      one_liner: "A family recipe book app where you upload photos, handwritten notes, and ingredient lists — and AI generates a beautiful, searchable full recipe to preserve for generations",
      author: "Jamie Okafor, Product Designer & Home Cook",
      stakeholders: "• Nadia Okafor — Engineering Lead (Approver)\n• Marcus Teo — Mobile Developer (Contributor)\n• Priya Okafor — Grandmother / Primary User (Informed)\n• Sam Chen — QA Lead (Consulted)",
      target_date: "Q4 2026 — October 31 target",
      version: "0.1 (Draft)",
      team_size: "1 designer/PM (me), 1 mobile developer + Claude Code for acceleration. Using Figma for design, VS Code + Claude Code for dev.",
      problem_statement: "Family recipes are stored on scraps of paper, in notebooks, and in people's heads. When grandparents pass away, these recipes are often lost forever. Digitising them is painful — scanning, transcribing, guessing at missing measurements, and reformatting all takes hours. There's no easy way to capture the real story behind a recipe along with the instructions.",
      who_affected: "Primary: Home cooks (25–65) who want to preserve family food heritage. Secondary: Family members who want to browse and cook from a shared digital cookbook. Tertiary: Food bloggers and recipe creators who want a faster way to document their cooking.",
      current_solutions: "• Handwritten recipe cards — authentic but fragile, easily lost\n• Notes apps (Apple Notes, Google Keep) — unstructured, hard to search\n• Recipe apps (Paprika, Yummly) — designed for web imports, not handwritten originals\n• Photo albums — images saved but not searchable or cookable\n• Word docs / spreadsheets — clunky, not mobile-friendly",
      business_case: "The recipe app market is $300M+ and growing with AI. No current app solves the handwritten-card-to-digital-recipe pipeline with AI OCR and generation. 73M households in the US have a family recipe tradition worth preserving. The emotional value of family food heritage is a powerful retention driver that generic recipe apps can't replicate.",
      cost_of_inaction: "Every year, family members pass away and take their recipes with them. The longer we wait, the more irreplaceable recipes are lost. Competitors are beginning to add AI photo features, but none have focused on the family preservation angle — this window is 12–18 months.",
      primary_persona: "Name: Jamie the Keeper\nRole: Adult child / home cook trying to preserve family recipes\nAge: 38\nGoals: Digitise Grandma's 40+ handwritten recipe cards before she passes. Make them searchable and shareable with the whole family.\nFrustrations: Photos of recipe cards are unreadable on small screens. Transcribing by hand takes 20 min per recipe. Measurements are inconsistent ('a handful', 'cook until done').\nTech proficiency: Medium — comfortable with smartphone apps, uses iCloud Photos, not a developer.",
      secondary_personas: "Persona 2: Priya the Grandmother — 72-year-old who cooks from memory and wants to leave her recipes as a legacy. Doesn't type but is willing to be photographed cooking and to voice-record notes.\n\nPersona 3: Kai the Teen Cook — 16-year-old who wants to learn family recipes but needs clear step-by-step instructions with photos, not handwritten shorthand.",
      user_journey: "1. Grandma cooks her signature chicken curry from memory\n2. Jamie photographs the dish, the handwritten recipe card, and the raw ingredients\n3. Uploads all three photos into FamilyTable\n4. Adds a few voice or text notes: \"less chilli than the card says, Grandma always adjusts\"\n5. FamilyTable AI generates a full structured recipe: title, servings, ingredients with measurements, step-by-step instructions, tips, and a story intro\n6. Jamie reviews, edits a few lines, and saves\n7. Recipe is added to the family cookbook — browsable by family member, cuisine, occasion, or ingredient\n8. Family members can comment, rate, and add their own variations",
      jobs_to_be_done: "• When I find a handwritten recipe card, I want to photograph it and get a clean digital version so I don't have to transcribe it manually\n• When I cook from memory, I want to record what I made quickly so I can repeat it later\n• When a family member passes, I want all their recipes safely stored and shareable so future generations can cook their dishes\n• When my kids ask how to make a dish, I want to send them a clear, tested recipe with photos so they can cook it themselves",
      product_goals: "1. Allow upload of photos, notes, and ingredient lists — generate a full structured recipe in under 30 seconds\n2. Store and organise all recipes in a searchable family cookbook\n3. Support multi-user family sharing — every family member can contribute and browse\n4. Achieve 80% recipe generation accuracy without manual correction\n5. Reach 10,000 active family cookbooks within 6 months of launch",
      kpis: "• Recipe generation time: under 30 seconds per recipe\n• Edit rate after generation: less than 20% of fields need manual correction\n• Weekly active family members per cookbook: 3+\n• Recipe retention rate: 90%+ of generated recipes saved (not discarded)\n• NPS: 60+ within 3 months",
      leading_indicators: "Time to first generated recipe, photo upload completion rate, family invite acceptance rate, return visits within 7 days of first recipe saved",
      in_scope: "• Photo upload (up to 3 images per recipe)\n• Text/voice note input\n• AI recipe generation (title, servings, ingredients, steps, tips, story intro)\n• Recipe card view\n• Family cookbook dashboard\n• Basic search by name or ingredient\n• Family invite link sharing",
      out_of_scope: "• Video upload — V2\n• Grocery list generation — V2\n• Meal planning — V2\n• Public recipe sharing — V2\n• Print formatting — V2\n• Social features beyond family sharing — not planned for MVP\n• Nutritional analysis — not planned for MVP",
      future_phases: "Phase 2 (Q1 2027): Video upload, grocery list generation, meal planning calendar\nPhase 3 (Q2 2027): Print-quality recipe books, public cookbook sharing, food blogger tools\nPhase 4 (Q3 2027): Nutritional analysis, dietary filter engine, recipe scaling AI",
      core_features: "Epic 1: Recipe Capture\n- Upload up to 3 photos (dish, card, ingredients)\n- Add text or voice notes\n- AI generates full structured recipe on submit\n\nEpic 2: Recipe Card\n- Title, story intro, servings, prep/cook time\n- Ingredient list with quantities and units\n- Step-by-step instructions with tips\n- Photo gallery\n\nEpic 3: Family Cookbook\n- Dashboard showing all family recipes\n- Search by name, ingredient, cuisine, occasion\n- Filter by family member contributor\n\nEpic 4: Family Sharing\n- Invite family members via shareable link\n- Role-based access: Owner, Contributor, Viewer\n- Comment and rate recipes\n- Add personal variations",
      user_stories: "• As a home cook, I want to photograph a handwritten recipe card and get a clean digital recipe so I don't have to type it out\n• As a family member, I want to browse all our saved recipes on my phone so I can cook them without asking anyone\n• As a cookbook owner, I want to invite my whole family so everyone can contribute and access our recipes\n• As a contributor, I want to add my own variation of a family recipe so my version is preserved alongside the original",
      priority_notes: "Recipe Capture + AI Generation = MUST HAVE (core value prop)\nRecipe Card View = MUST HAVE\nFamily Cookbook Dashboard + Search = MUST HAVE\nFamily Sharing (invite link) = MUST HAVE\nComments + Variations = SHOULD HAVE\nVoice note input = COULD HAVE for MVP",
      performance: "Photo upload <3s on 4G, AI recipe generation <30s, cookbook loads <1s with 200+ recipes, supports 50K concurrent users at launch, 99.9% uptime",
      security: "Image uploads scanned for inappropriate content before storage; family invite links expire after 7 days; PII limited to name, email, and avatar; no public access to family cookbooks without invite; HTTPS enforced; API keys server-side only",
      accessibility: "WCAG 2.1 AA compliance. Large text mode for older users. High contrast mode. Screen reader support for recipe browsing. Voice input for notes.",
      platforms: "React Native — iOS and Android. Expo for local dev and builds. Min iOS: 15, Min Android: 10. Responsive design for tablet cooking mode.",
      tech_stack: "React Native (iOS + Android), Node.js backend, PostgreSQL, AWS S3 for image storage, Claude API for recipe generation and OCR, Expo for local dev and builds",
      integrations: "• Claude API — recipe generation, OCR on handwritten cards\n• AWS S3 — image storage\n• Firebase Cloud Messaging — family activity notifications\n• Apple Sign-In / Google Sign-In\n• Expo — local dev and OTA builds",
      data_model: "User (id, name, email, avatar, family_id, role)\nFamily (id, name, cookbook_name, invite_code, created_at)\nRecipe (id, family_id, created_by, title, description, servings, prep_time, cook_time, cuisine, occasion, story, status, created_at, updated_at)\nIngredient (id, recipe_id, name, quantity, unit, notes)\nStep (id, recipe_id, order, instruction, tip)\nRecipeImage (id, recipe_id, type [dish/card/ingredients], s3_url, caption)\nComment (id, recipe_id, user_id, body, created_at)\nVariation (id, recipe_id, user_id, title, notes)",
      ai_instructions: "Use Claude Code for all backend logic, API routes, and Claude API integration. Claude API handles two tasks: OCR on handwritten recipe card photos, and structured recipe generation from the combined photo analysis + user notes. All generation must return structured JSON that maps directly to the Recipe, Ingredient, and Step data models. Use Expo for mobile builds. Write integration tests for the photo → generation → save flow.",
      design_direction: "Warm, tactile aesthetic — feels like a real cookbook, not a productivity app. Think aged paper textures, warm typography, photography-forward. Light mode primary (kitchen lighting). Brand colors: Warm terracotta (#C1440E) + Cream (#FDF6EC) + Deep olive (#3B4A2F). Recipe cards should feel like physical index cards. Large tap targets for older users.",
      key_screens: "1. Onboarding / family cookbook setup\n2. Home dashboard (recent + featured recipes)\n3. Upload screen (photo + notes input)\n4. AI generation loading screen\n5. Recipe review + edit screen\n6. Recipe card view\n7. Cookbook browser (search, filter by cuisine/occasion/family member)\n8. Family member profiles\n9. Settings",
      navigation: "Bottom tab bar: Home, Upload, Cookbook, Family, Profile. Upload is the primary CTA — prominent centre tab. Recipe card has full-screen immersive view. Cookbook browser has filter chips at top.",
      interactions: "Tap to upload photos from camera or library. Long-press recipe card to share or edit. Swipe recipe card to add to favourites. Pull to refresh cookbook. Tap ingredient to check it off while cooking. Voice note recording via hold-to-record button.",
      phases: "Phase 0 — Discovery & Design (2 weeks): User interviews with home cooks, Figma wireframes, Claude API OCR spike\nPhase 1 — MVP Build (8 weeks): Photo upload + AI generation + recipe card + basic cookbook\nPhase 2 — Family Features (3 weeks): Invite links, comments, variations, family dashboard\nPhase 3 — Beta (2 weeks): 50 families, feedback loop, accuracy tuning\nPhase 4 — Launch (1 week): App store submission, marketing, onboarding polish",
      milestones: "• Design complete: July 1\n• Claude API OCR + generation pipeline working: July 15\n• Recipe card view complete: August 1\n• Family sharing live: August 20\n• Beta with 50 families: September 1\n• App store submission: October 15\n• Public launch: October 31",
      launch_criteria: "GO: All P0 bugs resolved, AI generation accuracy >80% on test set of 50 recipe cards, photo upload working on iOS + Android, family invite flow verified end-to-end, App Store + Play Store approval received.\nNO-GO: Generation accuracy <75%, any P0 open, image storage not production-ready, no legal sign-off on data handling.",
      known_risks: "1. AI generation quality varies with photo quality — mitigation: clear upload guidelines and image quality warnings\n2. Handwritten recipe OCR accuracy on old/faded cards — mitigation: allow manual text correction as fallback\n3. Family sharing complexity — mitigation: start with invite-link simplicity, no complex role management in MVP\n4. App Store review time — mitigation: submit early, use Expo OTA for post-launch fixes\n5. Scope creep from emotional use case — mitigation: strictly enforce MVP scope, defer V2 features",
      mitigations: "1. Image quality check before upload — warn user if photo is too dark or blurry\n2. Manual edit mode always available on every generated field\n3. Simple invite link (no email required) — lowest friction for non-technical family members\n4. Submit to App Store 2 weeks before target launch date\n5. Maintain a strict V2 backlog — any new idea goes there, not into the MVP sprint",
      dependencies: "AWS S3 bucket provisioning, Claude API access (OCR + generation), Expo build pipeline setup, Apple Developer + Google Play account registration, Firebase project for push notifications",
      existing_research: "Conducted 12 user interviews with home cooks and adult children of elderly parents (March 2026). Key findings:\n• 89% have at least one family recipe they're worried about losing\n• 76% have tried photographing recipe cards but found the photos hard to use when actually cooking\n• 68% would share a recipe app with their family if setup took under 5 minutes\n• Average time to manually transcribe a handwritten recipe: 18 minutes\n• Top emotional driver: 'I want my kids to be able to make this after I'm gone'",
      competitors: "• Paprika: Popular recipe manager but import-focused (web URLs), no handwriting OCR, no family sharing. $4.99 one-time.\n• Yummly: Discovery-focused, not preservation-focused. No handwritten import.\n• Recipe Keeper: Basic digitisation but no AI generation. No family sharing.\n• Google Photos: Stores images but no recipe structure or cooking interface.\n• Notion / Notion AI: Power users use this but too complex for non-technical family members.",
      budget: "Infrastructure: ~$50-150/month (AWS S3, PostgreSQL on Railway, Claude API ~$80/mo for generation). No design contractor — using Figma ourselves. Expo free tier for builds. Target: profitable at 500 active family cookbooks on a $4.99/month subscription.",
      anything_else: "The emotional hook is the product's biggest asset and biggest responsibility. We're not just building a utility — we're helping families preserve irreplaceable memories. Every UX decision should reinforce that this is something precious worth keeping. Open questions: Should we support voice memo input at launch or defer to V2? How do we handle recipes that exist in multiple family variations? Should generation be triggered automatically on upload or only on explicit user action?",
    };
    setAns(td);
    setSec(0);
    setTab("intake");
    formRef.current?.scrollTo(0, 0);
  };

  // Get diff status for a question
  const getFieldStatus = (qId) => {
    if (!versions.length) return null;
    const prev = versions[versions.length - 1].ans;
    const o = (prev[qId] || "").trim();
    const n = (ans[qId] || "").trim();
    if (!o && n) return "added";
    if (o && !n) return "removed";
    if (o && n && o !== n) return "modified";
    return null;
  };

  const fieldBorder = (qId) => {
    const s = getFieldStatus(qId);
    if (s === "added") return "1px solid #22c55e";
    if (s === "modified") return "1px solid #f59e0b";
    if (s === "removed") return "1px solid #ef4444";
    return "1px solid #334155";
  };
  const fieldBadge = (qId) => {
    const s = getFieldStatus(qId);
    if (!s) return null;
    const c = { added: { bg: "#22c55e22", color: "#4ade80", text: "NEW" }, modified: { bg: "#f59e0b22", color: "#fbbf24", text: "CHANGED" }, removed: { bg: "#ef444422", color: "#f87171", text: "REMOVED" } }[s];
    return <span style={{ padding: "2px 6px", borderRadius: 4, background: c.bg, color: c.color, fontSize: 10, fontWeight: 600, marginLeft: 6 }}>{c.text}</span>;
  };

  const handleGen=async()=>{
    const savedVersions = saveVersion();
    setGenerating(true);setGenErr("");setGenProg("Preparing...");setTab("results");
    const intake=buildIntake(),cMd=genClaudeMd(ans),pB=genBrief(ans),pr=genPrompts(ans);
    try{
      setGenProg("Claude is writing 8 documents...");
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:16000,system:SYS,messages:[{role:"user",content:intake}]})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`);}
      const data=await r.json();const full=data.content.filter(i=>i.type==="text").map(i=>i.text).join("\n");
      // Parse ---FILE: [filename]--- / ---END FILE--- format
      const fileRegex=/---FILE:\s*(.+?)---\s*\n([\s\S]*?)---END FILE---/g;
      const fileMap={"prd.md":"prd","app-flow.md":"appFlow","design.md":"design","backend-spec.md":"backend","security-checklist.md":"security","CLAUDE.md":"claudeMd","project-brief.md":"projectBrief","startup-prompts.md":"prompts"};
      const dm={prd:"",appFlow:"",design:"",backend:"",security:"",claudeMd:"",projectBrief:"",prompts:""};
      let fm;while((fm=fileRegex.exec(full))!==null){const fname=fm[1].trim();const key=fileMap[fname];if(key&&fname.endsWith(".md"))dm[key]=fm[2].trim();}
      // Fallback: old ---DOC_SEPARATOR--- format for 5 core docs
      if(!dm.prd){const parts=full.split("---DOC_SEPARATOR---").map(p=>p.trim()).filter(Boolean);const ks=["prd","appFlow","design","backend","security"];if(parts.length>=5)ks.forEach((k,i)=>{dm[k]=parts[i];});else{dm.prd=full;ks.slice(1).forEach(k=>{dm[k]="[⚠️] Use Copy to Clipboard.";});}}
      // Fallback: local generators for 3 operational docs if Claude didn't return them
      if(!dm.claudeMd)dm.claudeMd=cMd;if(!dm.projectBrief)dm.projectBrief=pB;if(!dm.prompts)dm.prompts=pr;
      setDocs({...dm,changeBrief:changeBrief||"No previous version to compare."});setGenProg("");
    }catch(e){setGenErr(e.message);setDocs({prd:"",appFlow:"",design:"",backend:"",security:"",claudeMd:cMd,projectBrief:pB,prompts:pr,changeBrief:changeBrief||"",_failed:true});setGenProg("");}
    finally{setGenerating(false);}
  };

  const handleReset=async()=>{if(confirm("Clear everything including all versions?")){setAns({});setFiles({});setSec(0);setDocs(null);setTab("intake");setMode(null);setVersions([]);setCurrentVer(0);setChangeBrief("");setDiffResult(null);try{await window.storage.delete("cerebro-v1");}catch{}}};

  const renderMd=text=>{
    if(!text)return <p style={{color:"#64748b",fontStyle:"italic"}}>No content.</p>;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("### "))return <h3 key={i} style={{fontSize:15,fontWeight:600,color:"#bfdbfe",margin:"16px 0 5px"}}>{line.slice(4)}</h3>;
      if(line.startsWith("## "))return <h2 key={i} style={{fontSize:18,fontWeight:700,color:"#93c5fd",margin:"22px 0 7px"}}>{line.slice(3)}</h2>;
      if(line.startsWith("# "))return <h1 key={i} style={{fontSize:22,fontWeight:700,color:"#e2e8f0",margin:"26px 0 8px",borderBottom:"1px solid #334155",paddingBottom:5}}>{line.slice(2)}</h1>;
      if(line.match(/^[\-\*]\s/))return <div key={i} style={{display:"flex",gap:5,margin:"2px 0 2px 10px",color:"#cbd5e1",fontSize:13,lineHeight:1.6}}>•<span>{line.slice(2)}</span></div>;
      if(line.includes("⚠️"))return <div key={i} style={{background:"#78350f33",border:"1px solid #92400e",borderRadius:7,padding:"7px 10px",margin:"5px 0",color:"#fbbf24",fontSize:12}}>{line}</div>;
      if(line.startsWith("~~"))return <div key={i} style={{textDecoration:"line-through",color:"#ef4444",fontSize:13,margin:"2px 0"}}>{line.replace(/~~/g,"")}</div>;
      if(line.match(/^\*\*Was:\*\*/))return <div key={i} style={{background:"#ef444411",borderLeft:"3px solid #ef4444",padding:"4px 10px",margin:"3px 0",fontSize:12,color:"#fca5a5"}}>{line.replace(/\*\*/g,"")}</div>;
      if(line.match(/^\*\*Now:\*\*/))return <div key={i} style={{background:"#22c55e11",borderLeft:"3px solid #22c55e",padding:"4px 10px",margin:"3px 0",fontSize:12,color:"#86efac"}}>{line.replace(/\*\*/g,"")}</div>;
      if(line.match(/^---+$/))return <hr key={i} style={{border:"none",borderTop:"1px solid #334155",margin:"14px 0"}}/>;
      if(!line.trim())return <div key={i} style={{height:5}}/>;
      const parts=line.split(/(\*\*.*?\*\*)/g).map((p,pi)=>p.startsWith("**")&&p.endsWith("**")?<strong key={pi} style={{color:"#e2e8f0",fontWeight:600}}>{p.slice(2,-2)}</strong>:p);
      return <p key={i} style={{margin:"2px 0",color:"#cbd5e1",fontSize:13,lineHeight:1.7}}>{parts}</p>;
    });
  };

  const section=SECTIONS[sec];
  const F="'DM Sans','Segoe UI',sans-serif";
  const accent=mode==="avatar"?"#8b5cf6":"#22c55e";

  /* ═══ MODE SELECTOR ═══ */
  if(!mode)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,background:"#0f172a",color:"#e2e8f0"}}>
      <div style={{maxWidth:680,width:"100%",padding:"36px 20px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:44,marginBottom:10}}>🧠</div>
          <h1 style={{fontSize:26,fontWeight:800,margin:"0 0 6px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CEREBRO</h1>
          <p style={{fontSize:14,color:"#94a3b8",margin:0}}>Master Build Package Generator — PRD, app flow, UI guide, backend spec, security checklist.</p>
          {versions.length > 0 && <p style={{fontSize:12,color:"#64748b",marginTop:8}}>{versions.length} version{versions.length>1?"s":""} saved. Your answers will be restored.</p>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <button onClick={()=>setMode("avatar")} style={{background:"#1e293b",border:"2px solid #334155",borderRadius:14,padding:"24px 20px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#8b5cf6"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#8b5cf6,#3b82f6)"}}/>
            <div style={{fontSize:32,marginBottom:10}}>⚡</div>
            <h2 style={{fontSize:18,fontWeight:700,color:"#e2e8f0",margin:"0 0 3px"}}>Avatar State</h2>
            <div style={{fontSize:11,fontWeight:600,color:"#8b5cf6",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Full Power</div>
            <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 12px",lineHeight:1.5}}>12 sections, ~47 technical questions. Personas, JTBD, NFRs, architecture, risks.</p>
            <div style={{fontSize:11,color:"#64748b"}}>For: Technical PMs, cross-functional teams</div>
          </button>
          <button onClick={()=>setMode("spirit")} style={{background:"#1e293b",border:"2px solid #334155",borderRadius:14,padding:"24px 20px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#22c55e"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#22c55e,#3b82f6)"}}/>
            <div style={{fontSize:32,marginBottom:10}}>🌿</div>
            <h2 style={{fontSize:18,fontWeight:700,color:"#e2e8f0",margin:"0 0 3px"}}>Spirit Guide</h2>
            <div style={{fontSize:11,fontWeight:600,color:"#22c55e",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Guided Mode</div>
            <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 12px",lineHeight:1.5}}>8 sections, ~31 plain-English questions. Same output quality, less jargon.</p>
            <div style={{fontSize:11,color:"#64748b"}}>For: Non-technical PMs, solo builders</div>
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={()=>{setMode("avatar");setTimeout(loadTestData,100);}} style={{padding:"6px 16px",borderRadius:8,border:"1px dashed #f59e0b44",background:"transparent",color:"#f59e0b",cursor:"pointer",fontSize:12}}>🧪 Load test project (FamilyTable) to try it out</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",fontFamily:F,background:"#0f172a",color:"#e2e8f0"}}>
      {/* TOP NAV */}
      <header style={{display:"flex",alignItems:"center",padding:"8px 14px",borderBottom:"1px solid #334155",background:"#1e293b",gap:5,flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:15,fontWeight:700,marginRight:6}}>🧠</span>
        <button onClick={()=>{if(confirm("Switch mode?"))setMode(null);}} style={{padding:"2px 8px",borderRadius:10,border:`1px solid ${accent}`,background:accent+"22",color:accent,cursor:"pointer",fontSize:10,fontWeight:600}}>
          {mode==="avatar"?"⚡ Avatar":"🌿 Spirit"}
        </button>
        {currentVer > 0 && <span style={{padding:"2px 8px",borderRadius:10,background:"#3b82f622",color:"#60a5fa",fontSize:10,fontWeight:600}}>V{currentVer}</span>}
        <div style={{display:"flex",gap:1,flex:1,minWidth:160,marginLeft:6}}>
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} disabled={!["intake","versions","usage"].includes(t)&&!docs&&!generating}
            style={{padding:"4px 8px",borderRadius:4,border:"none",fontSize:11,fontWeight:tab===t?600:400,background:tab===t?"#334155":"transparent",color:tab===t?"#e2e8f0":(!["intake","versions","usage"].includes(t)&&!docs&&!generating)?"#334155":"#94a3b8",cursor:(!["intake","versions","usage"].includes(t)&&!docs&&!generating)?"default":"pointer"}}>{TL[t]}</button>)}
        </div>
        {tab==="intake"&&<button onClick={()=>{setShowP1Modal(true);setP1Text("");setP1Error("");}} style={{padding:"3px 9px",borderRadius:4,border:"1px solid #475569",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:10,fontWeight:500,whiteSpace:"nowrap"}}>📋 Load P1 Brief</button>}
        <button onClick={loadTestData} style={{padding:"3px 7px",borderRadius:4,border:"1px solid #334155",background:"#1e293b",color:"#f59e0b",cursor:"pointer",fontSize:10,fontWeight:500}} title="Fill form with sample FamilyTable project">🧪 Test</button>
        <button onClick={handleReset} style={{padding:"3px 7px",borderRadius:4,border:"1px solid #334155",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:10,opacity:.7}}>Reset</button>
      </header>

      {/* ═══ INTAKE ═══ */}
      {tab==="intake"&&<div style={{display:"flex",flex:1,minHeight:0}}>
        {sidebar&&<aside style={{width:230,minWidth:230,background:"#1e293b",borderRight:"1px solid #334155",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 10px 7px",borderBottom:"1px solid #334155"}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1,color:"#64748b",marginBottom:4}}>Sections</div>
            <div style={{background:"#0f172a",borderRadius:3,height:4,overflow:"hidden",marginBottom:2}}><div style={{height:"100%",width:`${totProg}%`,background:`linear-gradient(90deg,${accent},#3b82f6)`,borderRadius:3,transition:"width .5s"}}/></div>
            <div style={{fontSize:9,color:"#64748b"}}>{totAns}/{TOTAL_Q} answered{versions.length>0?` • V${currentVer||versions.length}`:""}</div>
          </div>
          <nav style={{flex:1,overflowY:"auto",padding:"2px 0"}}>{SECTIONS.map((s,i)=>{const p=secProg(i);const a=i===sec;return <button key={s.id} onClick={()=>{setSec(i);formRef.current?.scrollTo(0,0);}} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"5px 10px",border:"none",cursor:"pointer",textAlign:"left",background:a?"#334155":"transparent",borderLeft:a?`3px solid ${accent}`:"3px solid transparent"}}>
            <span style={{fontSize:13}}>{s.icon}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:a?600:400,color:a?"#e2e8f0":"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><div style={{flex:1,height:2,background:"#0f172a",borderRadius:2}}><div style={{height:"100%",width:`${p}%`,background:p===100?"#22c55e":"#3b82f6",borderRadius:2,transition:"width .4s"}}/></div><span style={{fontSize:8,color:"#64748b"}}>{p}%</span></div></div>
            {p===100&&<span style={{color:"#22c55e",fontSize:9}}>✓</span>}
          </button>;})}</nav>
          <div style={{padding:"7px 10px",borderTop:"1px solid #334155",display:"flex",gap:4}}>
            <button onClick={save} style={{flex:1,padding:"4px 0",borderRadius:4,border:"1px solid #334155",background:flash?"#22c55e22":"transparent",color:flash?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:10,transition:"all .3s"}}>{flash?"✓":"💾"}</button>
          </div>
        </aside>}
        <main style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderBottom:"1px solid #334155",background:"#1e293b",flexShrink:0}}>
            <button onClick={()=>setSidebar(!sidebar)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:15,padding:"1px 3px"}}>☰</button>
            <span style={{fontSize:12,fontWeight:600}}>{section?.icon} {section?.title}</span>
            <span style={{fontSize:10,color:"#64748b"}}>({sec+1}/{SECTIONS.length})</span>
            {versions.length > 0 && <span style={{marginLeft:"auto",fontSize:10,color:"#64748b"}}>Editing V{(currentVer||versions.length)+1} draft</span>}
          </div>
          <div ref={formRef} style={{flex:1,overflowY:"auto",padding:"16px 22px 100px",maxWidth:660,width:"100%",margin:"0 auto"}}>
            <div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700,margin:"0 0 2px"}}>{section?.icon} {section?.title}</h2><p style={{fontSize:12,color:"#94a3b8",margin:0}}>{section?.description}</p></div>
            {section?.questions.map(q=><div key={q.id} style={{marginBottom:16,background:"#1e293b",borderRadius:8,border:fieldBorder(q.id),overflow:"hidden"}}>
              <div style={{padding:"10px 12px 0"}}><label style={{fontSize:12,fontWeight:600}}>{q.label}{q.required&&<span style={{color:"#f43f5e",marginLeft:2}}>*</span>}{fieldBadge(q.id)}</label><p style={{fontSize:10,color:"#64748b",margin:"1px 0 6px",fontStyle:"italic"}}>{q.guidance}</p></div>
              <div style={{padding:"0 12px 8px"}}>{q.type==="text"?<input type="text" value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder} style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #334155",background:"#0f172a",color:"#e2e8f0",fontSize:12,outline:"none",boxSizing:"border-box"}}/>:<textarea value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder} rows={3} style={{width:"100%",padding:"6px 8px",borderRadius:4,border:"1px solid #334155",background:"#0f172a",color:"#e2e8f0",fontSize:12,outline:"none",resize:"vertical",lineHeight:1.6,minHeight:56,boxSizing:"border-box"}}/>}</div>
              <div style={{padding:"0 12px 6px",borderTop:"1px solid #1e293b55",paddingTop:4}}><div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                <button onClick={()=>fR.current[q.id]?.click()} style={{display:"inline-flex",alignItems:"center",gap:2,padding:"2px 6px",borderRadius:3,border:"1px dashed #475569",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:10}}>📎</button>
                <input ref={el=>fR.current[q.id]=el} type="file" multiple onChange={e=>{if(e.target.files.length)addF(q.id,e.target.files);e.target.value="";}} style={{display:"none"}}/>
                {(files[q.id]||[]).map((f,fi)=><FileChip key={fi} file={f} onRemove={()=>rmF(q.id,fi)}/>)}
              </div></div>
            </div>)}
          </div>
          <div style={{position:"sticky",bottom:0,padding:"8px 22px",background:"linear-gradient(to top,#1e293b 80%,transparent)",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #334155"}}>
            <button onClick={()=>{setSec(Math.max(0,sec-1));formRef.current?.scrollTo(0,0);}} disabled={sec===0} style={{padding:"5px 14px",borderRadius:5,border:"1px solid #334155",background:"transparent",color:sec===0?"#334155":"#94a3b8",cursor:sec===0?"default":"pointer",fontSize:11}}>←</button>
            <div style={{display:"flex",gap:2}}>{SECTIONS.map((_,i)=><button key={i} onClick={()=>{setSec(i);formRef.current?.scrollTo(0,0);}} style={{width:i===sec?14:4,height:4,borderRadius:2,border:"none",background:i===sec?accent:secProg(i)===100?"#22c55e":"#334155",cursor:"pointer",padding:0,transition:"all .3s"}}/>)}</div>
            {sec<SECTIONS.length-1?<button onClick={()=>{setSec(sec+1);formRef.current?.scrollTo(0,0);}} style={{padding:"5px 14px",borderRadius:5,border:"none",background:`linear-gradient(135deg,${accent},#3b82f6)`,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600}}>→</button>
            :<div style={{display:"flex",gap:4}}>
              <button onClick={()=>cp(SYS+"\n\n---\n\n"+buildIntake(),"cb")} style={{padding:"5px 10px",borderRadius:5,border:"1px solid #334155",background:copied.cb?"#22c55e22":"#1e293b",color:copied.cb?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:11}}>{copied.cb?"✓":"📋"}</button>
              <button onClick={handleGen} disabled={reqMiss.length>0} style={{padding:"5px 14px",borderRadius:5,border:"none",background:reqMiss.length>0?"#334155":"linear-gradient(135deg,#22c55e,#16a34a)",color:reqMiss.length>0?"#64748b":"#fff",cursor:reqMiss.length>0?"default":"pointer",fontSize:11,fontWeight:600}}>🚀 Generate V{(versions.length||0)+1}</button>
            </div>}
          </div>
        </main>
      </div>}

      {/* ═══ RESULTS ═══ */}
      {tab==="results"&&<div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        {generating?<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:36}}><div style={{width:36,height:36,border:"3px solid #334155",borderTop:`3px solid ${accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:14}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><p style={{fontSize:14,color:"#94a3b8"}}>{genProg}</p></div>
        :!docs?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#64748b",fontSize:13}}>Generate from Intake first.</p></div>
        :<>
          {genErr&&<div style={{margin:"8px 14px 0",padding:"7px 10px",background:"#7f1d1d33",border:"1px solid #991b1b",borderRadius:6,color:"#fca5a5",fontSize:11}}>{genErr}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",borderBottom:"1px solid #334155",flexShrink:0,flexWrap:"wrap",gap:4}}>
            <div style={{display:"flex",gap:1,overflowX:"auto"}}>{DT.filter(d=>d.key!=="changeBrief"||changeBrief).map(d=><button key={d.key} onClick={()=>setActiveDoc(d.key)} style={{padding:"3px 7px",borderRadius:3,border:"none",fontSize:10,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?"#334155":"transparent",color:activeDoc===d.key?"#e2e8f0":d.key==="changeBrief"?"#f59e0b":"#94a3b8",cursor:"pointer"}}>{d.label}</button>)}</div>
            <button onClick={downloadAll} style={{padding:"3px 12px",borderRadius:4,border:"1px solid #22c55e44",background:"#22c55e11",color:"#4ade80",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>⬇ Download All (.md)</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px 32px"}}><div style={{maxWidth:760,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,margin:0}}>{DT.find(d=>d.key===activeDoc)?.label}</h3>
                <span style={{fontSize:10,color:"#64748b"}}>{DT.find(d=>d.key===activeDoc)?.file}</span>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <button onClick={()=>cp(docs[activeDoc]||changeBrief||"",activeDoc)} style={{padding:"3px 10px",borderRadius:3,border:"1px solid #334155",background:copied[activeDoc]?"#22c55e22":"#1e293b",color:copied[activeDoc]?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:10}}>{copied[activeDoc]?"✓":"📋 Copy"}</button>
                <button onClick={()=>downloadMd(activeDoc)} style={{padding:"3px 10px",borderRadius:3,border:"1px solid #334155",background:"#1e293b",color:"#60a5fa",cursor:"pointer",fontSize:10}}>⬇ .md</button>
                <button onClick={()=>downloadDocx(activeDoc)} style={{padding:"3px 10px",borderRadius:3,border:"1px solid #3b82f644",background:"#3b82f611",color:"#93c5fd",cursor:"pointer",fontSize:10,fontWeight:600}}>⬇ .docx</button>
              </div>
            </div>
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"16px 20px"}}>{renderMd(activeDoc==="changeBrief"?changeBrief:docs[activeDoc])}</div>
          </div></div>
        </>}
      </div>}

      {/* ═══ VERSIONS ═══ */}
      {tab==="versions"&&<div style={{flex:1,overflowY:"auto",padding:"16px 22px 36px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:"0 0 3px"}}>🔄 Version History</h2>
        <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>Each generation saves a snapshot. Create new versions to iterate without rebuilding.</p>

        {versions.length===0?<div style={{background:"#1e293b",borderRadius:8,border:"1px solid #334155",padding:20,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>📭</div><p style={{color:"#64748b",fontSize:13}}>No versions yet. Fill the intake form and generate to create V1.</p></div>
        :<>
          {versions.map((v,i)=><div key={v.ver} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,marginBottom:8,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
              <div style={{width:28,height:28,borderRadius:6,background:accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:accent}}>V{v.ver}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{v.ans.product_name||"Untitled"}</div><div style={{fontSize:10,color:"#64748b"}}>{new Date(v.date).toLocaleString()} • {v.mode==="avatar"?"⚡ Avatar":"🌿 Spirit"}</div></div>
              <button onClick={()=>loadVersion(v.ver)} style={{padding:"3px 10px",borderRadius:4,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:10}}>Load</button>
            </div>
            {i>0&&<div style={{padding:"0 14px 10px"}}>
              {(()=>{const prev=versions[i-1].ans;const diff=computeDiff(prev,v.ans,mode==="avatar"?AVATAR:SPIRIT);return <div style={{fontSize:11,color:"#64748b",display:"flex",gap:10}}>
                {diff.added.length>0&&<span style={{color:"#4ade80"}}>+{diff.added.length} added</span>}
                {diff.modified.length>0&&<span style={{color:"#fbbf24"}}>{diff.modified.length} changed</span>}
                {diff.removed.length>0&&<span style={{color:"#f87171"}}>{diff.removed.length} removed</span>}
                <span>{diff.unchanged} unchanged</span>
              </div>;})()}
            </div>}
          </div>)}

          <div style={{background:"#1e293b",borderRadius:8,border:`1px dashed ${accent}`,padding:16,textAlign:"center",marginTop:12}}>
            <p style={{fontSize:13,color:"#94a3b8",margin:"0 0 10px"}}>Ready to iterate? Your current answers are the draft for V{versions.length+1}.</p>
            <button onClick={startNewVersion} style={{padding:"7px 20px",borderRadius:6,border:"none",background:`linear-gradient(135deg,${accent},#3b82f6)`,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Edit & Create V{versions.length+1}</button>
          </div>

          {changeBrief&&<div style={{background:"#1e293b",borderRadius:8,border:"1px solid #f59e0b44",padding:14,marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#fbbf24",margin:0}}>📋 Latest Change Brief</h3>
              <button onClick={()=>cp(changeBrief,"vbr")} style={{padding:"3px 10px",borderRadius:4,border:"1px solid #334155",background:copied.vbr?"#22c55e22":"transparent",color:copied.vbr?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:10}}>{copied.vbr?"✓":"📋 Copy"}</button>
            </div>
            <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 6px"}}>Paste this into your project folder as change-brief.md, then give Claude Code the update prompt at the bottom.</p>
            <details><summary style={{fontSize:11,color:"#64748b",cursor:"pointer"}}>Preview</summary><div style={{background:"#0f172a",borderRadius:5,padding:10,marginTop:4,maxHeight:300,overflowY:"auto"}}>{renderMd(changeBrief)}</div></details>
          </div>}
        </>}
      </div></div>}

      {/* ═══ WORKFLOW ═══ */}
      {tab==="workflow"&&<div style={{flex:1,overflowY:"auto",padding:"16px 22px 36px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:"0 0 3px"}}>🗺️ Build Workflow</h2>
        <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>{currentVer>1?"V2+ iteration: use the Change Brief from Versions tab.":"V1: Follow sessions in order."}</p>
        {currentVer>1&&<div style={{background:"#f59e0b11",border:"1px solid #f59e0b44",borderRadius:8,padding:14,marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:600,color:"#fbbf24",margin:"0 0 6px"}}>🔄 Iteration Mode</h3>
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 8px"}}>You're on V{currentVer}. Instead of the full build sessions below, use the Change Brief:</p>
          <p style={{fontSize:12,color:"#cbd5e1",margin:"0 0 8px",fontFamily:"monospace",background:"#0f172a",padding:10,borderRadius:5}}>Read change-brief.md. Make ONLY the listed changes. Plan first — no code until I approve.</p>
          <button onClick={()=>{setTab("versions");}} style={{padding:"5px 14px",borderRadius:5,border:"none",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600}}>Go to Versions tab →</button>
        </div>}
        {[{n:1,t:"Setup & Plan",tm:"~20 min",c:"#8b5cf6",d:"Read all docs, create plan.md."},{n:2,t:"Backend",tm:"1-2 hrs",c:"#3b82f6",d:"DB, auth, API endpoints."},{n:3,t:"Frontend",tm:"1-2 hrs",c:"#22c55e",d:"All screens + API connections."},{n:4,t:"Polish + Deploy",tm:"~1 hr",c:"#f59e0b",d:"Errors, responsive, tests, deploy."},{n:5,t:"Stitch (optional)",tm:"~30 min",c:"#ec4899",d:"Redesign screens, apply via Claude Code."}].map(s=>
          <div key={s.n} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,marginBottom:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:24,height:24,borderRadius:5,background:s.c+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:s.c}}>{s.n}</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{s.t}</div><div style={{fontSize:10,color:"#64748b"}}>{s.tm}</div></div>
            <div style={{fontSize:11,color:"#94a3b8",maxWidth:200}}>{s.d}</div>
          </div>
        )}
      </div></div>}

      {/* ═══ P1 PAYLOAD MODAL ═══ */}
      {showP1Modal&&<div style={{position:"fixed",inset:0,background:"#00000099",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)setShowP1Modal(false);}}>
        <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:24,width:"100%",maxWidth:520,margin:"0 20px"}}>
          <h2 style={{fontSize:17,fontWeight:700,margin:"0 0 6px",color:"#e2e8f0"}}>Load P1 Brief</h2>
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 14px",lineHeight:1.5}}>Paste the payload block from your Build OS P1 session. CEREBRO will pre-fill your intake form — you can edit anything after.</p>
          <textarea value={p1Text} onChange={e=>setP1Text(e.target.value)} placeholder="Paste your ---CEREBRO-PAYLOAD--- block here" rows={10} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #334155",background:"#0f172a",color:"#e2e8f0",fontSize:12,fontFamily:"monospace",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
          {p1Error&&<p style={{color:"#f87171",fontSize:11,margin:"6px 0 0"}}>{p1Error}</p>}
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowP1Modal(false)} style={{padding:"6px 16px",borderRadius:6,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:12}}>Cancel</button>
            <button onClick={()=>{
              const result=parseP1Payload(p1Text);
              if(result.error==="no_delimiter"){setP1Error("Payload not detected. Copy the full block including the --- markers.");return;}
              if(result.error==="invalid_json"){setP1Error("Payload format is invalid. Copy the block exactly as generated.");return;}
              if(result.mode==="avatar"||result.mode==="spirit")setMode(result.mode);
              setAns(prev=>({...prev,...result.fields}));
              setShowP1Modal(false);
              setToast(`✓ ${result.count} fields pre-filled from your P1 brief. Review and edit anything.`);
              setTimeout(()=>setToast(""),3500);
            }} style={{padding:"6px 16px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Load</button>
          </div>
        </div>
      </div>}

      {/* ═══ TOAST ═══ */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1e293b",border:"1px solid #22c55e55",borderRadius:8,padding:"10px 16px",color:"#4ade80",fontSize:12,fontWeight:500,zIndex:1100,whiteSpace:"nowrap",boxShadow:"0 4px 20px #00000066",pointerEvents:"none"}}>{toast}</div>}

      {/* ═══ USAGE ═══ */}
      {tab==="usage"&&<div style={{flex:1,overflowY:"auto",padding:"16px 22px 36px"}}><div style={{maxWidth:700,margin:"0 auto"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:"0 0 14px"}}>⚡ Usage Guide</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:14}}>
          {[{p:"Pro",pr:"$20/mo",c:"#3b82f6"},{p:"Max 5x",pr:"$100/mo",c:"#8b5cf6"},{p:"Max 20x",pr:"$200/mo",c:"#f59e0b"}].map(x=><div key={x.p} style={{background:"#1e293b",borderRadius:7,border:"1px solid #334155",padding:10}}><div style={{fontSize:14,fontWeight:700,color:x.c}}>{x.p}</div><div style={{fontSize:16,fontWeight:700}}>{x.pr}</div></div>)}
        </div>
        <div style={{background:"#1e293b",borderRadius:8,border:"1px solid #334155",padding:14,marginBottom:14}}>
          <h3 style={{fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Token-Saving Tips</h3>
          {["Sonnet for building (/model)","Fresh sessions per task","Use /compact when slow","Be specific in prompts","Off-peak hours stretch further","Instructions in files, not chat"].map((t,i)=><p key={i} style={{margin:"0 0 4px",fontSize:12,color:"#94a3b8"}}>{i+1}. {t}</p>)}
        </div>
        <div style={{background:"#1e293b",borderRadius:8,border:"1px solid #334155",padding:14}}>
          <h3 style={{fontSize:13,fontWeight:600,margin:"0 0 8px"}}>V1 vs Iteration Cost</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[{l:"V1 full build",v:"4-6 hrs"},{l:"V2+ iteration",v:"30-60 min"},{l:"V1 on Pro",v:"2-3 days"},{l:"V2+ on Pro",v:"1 session"}].map(s=><div key={s.l} style={{background:"#0f172a",borderRadius:5,padding:"6px 10px"}}><div style={{fontSize:9,color:"#64748b"}}>{s.l}</div><div style={{fontSize:14,fontWeight:700}}>{s.v}</div></div>)}
          </div>
          <p style={{margin:"8px 0 0",fontSize:10,color:"#64748b"}}>Iterations use the change brief — much less tokens than a full rebuild.</p>
        </div>
      </div></div>}
    </div>
  );
}
