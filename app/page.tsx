'use client'

type WorkflowStatus = Record<number, string>;
type ProjectVersion = { ver: number; date: string; ans: Record<string, string>; mode: string | null; changeBrief?: string; };
type QuestionDef = { id: string; label: string; type: string; placeholder: string; guidance: string; required?: boolean; };
type SectionDef = { id: string; title: string; icon: string; description: string; questions: QuestionDef[]; };
type DiffChange = { id: string; label: string; section: string; oldVal?: string; newVal?: string; };
type DiffResult = { added: DiffChange[]; modified: DiffChange[]; removed: DiffChange[]; unchanged: number; };
type Project = { id: string; name: string; status: string; mode: string | null; created: string; lastEdited: string; currentAnswers: Record<string, string>; versions: ProjectVersion[]; docs: Record<string, string> | null; changeBrief: string; workflowStatus: WorkflowStatus; };
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
const SYS=`You are a senior product/technical lead. Generate 5 docs separated by "---DOC_SEPARATOR---". Each starts "# DOC_N: Title" (N=1-5). DOC1: PRD (14 sections, FR-001 IDs, acceptance criteria, MoSCoW). DOC2: App Flow (routes, actions, conditionals). DOC3: UI Guide/DESIGN.md (tokens, components, breakpoints). DOC4: Backend (data models, API endpoints, services). DOC5: Security (auth, encryption, OWASP, compliance). Flag gaps with [⚠️ ATTENTION NEEDED]. 800-2000 words each.`;

function genClaudeMd(a: Record<string,string>){return `# ${a.product_name||"Product"} — Claude Code Instructions\n\n## Overview\n${a.one_liner||"See project-brief.md"}\n\n## Stack\n${a.tech_stack||"Best modern stack"}\n\n## Rules\n- Read project-brief.md FIRST\n- plan.md before coding — wait for approval\n- Follow design.md, backend-spec.md, security-checklist.md, app-flow.md\n- TypeScript, tests, small components, env vars\n\n## Workflow\n1. Read doc → 2. Plan → 3. Approve → 4. Build → 5. Test → 6. Report\n\n## Principles\nSimplicity. No shortcuts. Minimal impact. Ask when unsure.`;}
function genBrief(a: Record<string,string>){return `# ${a.product_name||"Product"} — Brief\n\n> ${a.one_liner||""}\n\nOwner: ${a.author||"TBD"} | Launch: ${a.target_date||"TBD"} | Team: ${a.team_size||"Solo+AI"}\n\n## Build Order\n1. Setup 2. DB+Auth 3. API 4. UI Shell 5. Features 6. Polish 7. Deploy\n\n## Docs\nprd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md, CLAUDE.md`;}
function genPrompts(a: Record<string,string>){return `# Prompts for ${a.product_name||"Product"}\n\n═══ SESSION 1: SETUP (~20min) ═══\nRead CLAUDE.md + all docs. Create plan.md with phases. No code yet.\n\n═══ SESSION 2: BACKEND (~1-2hr) ═══\nExecute Phase 1-3. Follow backend-spec.md + security-checklist.md.\n\n═══ SESSION 3: FRONTEND (~1-2hr) ═══\nExecute Phase 4-5. Follow design.md + app-flow.md.\n\n═══ SESSION 4: POLISH (~1hr) ═══\nPhase 6-7. Errors, loading, responsive, tests, deploy.\n\n═══ OPTIONAL: STITCH ═══\nRedesign in Stitch → export → "Update [component] to match. Keep functionality."`;}

/* ═══ DIFF ENGINE ═══ */
function computeDiff(oldAns: Record<string,string>,newAns: Record<string,string>,sections: SectionDef[]){const changes: DiffResult={added:[],modified:[],removed:[],unchanged:0};const allQs=sections.flatMap(s=>s.questions.map(q=>({...q,section:s.title})));allQs.forEach(q=>{const o=(oldAns[q.id]||"").trim();const n=(newAns[q.id]||"").trim();if(!o&&n)changes.added.push({id:q.id,label:q.label,section:q.section,newVal:n});else if(o&&!n)changes.removed.push({id:q.id,label:q.label,section:q.section,oldVal:o});else if(o&&n&&o!==n)changes.modified.push({id:q.id,label:q.label,section:q.section,oldVal:o,newVal:n});else if(o&&n&&o===n)changes.unchanged++;});return changes;}

function generateChangeBrief(diff: DiffResult,oldVer: number,newVer: number,productName: string){let b=`# Change Brief: V${oldVer} → V${newVer}\n`;b+=`Product: ${productName}\nGenerated: ${new Date().toLocaleDateString()}\n\n`;b+=`## Summary\n`;b+=`- ${diff.added.length} fields added\n- ${diff.modified.length} fields modified\n- ${diff.removed.length} fields removed\n- ${diff.unchanged} fields unchanged\n\n`;if(diff.modified.length){b+=`## Modified\n`;diff.modified.forEach((c: DiffChange)=>{b+=`### ${c.section} → ${c.label}\n`;b+=`**Was:** ${(c.oldVal||"").substring(0,200)}${(c.oldVal||"").length>200?"...":""}\n`;b+=`**Now:** ${(c.newVal||"").substring(0,200)}${(c.newVal||"").length>200?"...":""}\n\n`;});}if(diff.added.length){b+=`## Added\n`;diff.added.forEach((c: DiffChange)=>{b+=`### ${c.section} → ${c.label}\n${(c.newVal||"").substring(0,200)}${(c.newVal||"").length>200?"...":""}\n\n`;});}if(diff.removed.length){b+=`## Removed\n`;diff.removed.forEach((c: DiffChange)=>{b+=`### ${c.section} → ${c.label}\n~~${(c.oldVal||"").substring(0,200)}~~\n\n`;});}b+=`\n---\n\n## Claude Code Update Prompt\n\nPaste this into Claude Code:\n\n`;b+=`Read change-brief.md. This describes changes from V${oldVer} to V${newVer}.\nMake ONLY the listed changes. Do not rebuild unchanged features.\nCreate an update plan first — do not code until I approve.\nFor each change, update the minimum files needed.\n`;return b;}

/* ═══ Helpers ═══ */
function FileChip({file,onRemove}: {file: File, onRemove: ()=>void}){return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f7f6f3",border:"1px solid #e3e2e0",borderRadius:6,padding:"3px 8px",fontSize:11,maxWidth:160}}><span style={{fontSize:12}}>📁</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:"#787774"}}>{file.name}</span><button onClick={onRemove} style={{background:"none",border:"none",color:"#9b9b9b",cursor:"pointer",fontSize:13,padding:0}}>×</button></span>;}

const TABS=["intake","results","versions","workflow","usage"];
const TL={intake:"Intake",results:"Docs",versions:"Versions",workflow:"Workflow",usage:"Usage"};
const DT=[{key:"prd",label:"PRD",file:"prd.md"},{key:"appFlow",label:"App Flow",file:"app-flow.md"},{key:"design",label:"UI Guide",file:"design.md"},{key:"backend",label:"Backend",file:"backend-spec.md"},{key:"security",label:"Security",file:"security-checklist.md"},{key:"claudeMd",label:"CLAUDE.md",file:"CLAUDE.md"},{key:"projectBrief",label:"Brief",file:"project-brief.md"},{key:"prompts",label:"Prompts",file:"prompts.md"},{key:"changeBrief",label:"Changes",file:"change-brief.md"}];

/* ═══ STORAGE HELPERS ═══ */
const genId=()=>`proj_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const DEFAULT_WF_STATUS: WorkflowStatus={1:"notStarted",2:"notStarted",3:"notStarted",4:"notStarted",5:"notStarted"};
const blankProject=(mode: string|null, id?: string)=>({id:id||genId(),name:"Untitled Project",status:"draft",mode,created:new Date().toISOString(),lastEdited:new Date().toISOString(),currentAnswers:{},versions:[],docs:null,changeBrief:"",workflowStatus:{...DEFAULT_WF_STATUS}});

function saveStorage(data: {projects: Project[], activeProjectId: string|null}){try{localStorage.setItem("cerebro-projects",JSON.stringify(data));}catch{}}
function migrateIfNeeded(){try{const r=localStorage.getItem("cerebro-projects");if(r){const d=JSON.parse(r);if(d?.projects){// Patch existing projects missing workflowStatus
const patched={...d,projects:d.projects.map((p: Project)=>({...p,workflowStatus:p.workflowStatus||{...DEFAULT_WF_STATUS}}))};return patched;}}}catch{}try{const old=localStorage.getItem("cerebro-v1");if(old){const d=JSON.parse(old);const id=genId();const project={id,name:d.ans?.product_name||"Migrated Project",status:"draft",mode:d.mode||"avatar",created:new Date().toISOString(),lastEdited:new Date().toISOString(),currentAnswers:d.ans||{},versions:(d.versions||[]),docs:null,changeBrief:"",workflowStatus:{...DEFAULT_WF_STATUS}};const data={projects:[project],activeProjectId:null};saveStorage(data);localStorage.removeItem("cerebro-v1");return data;}}catch{}return{projects:[],activeProjectId:null};}

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
const TEST_DATA={product_name:"FlowBoard",one_liner:"A visual project management app for remote teams that turns conversations into task boards using AI",author:"Alex Rivera, Product Manager",stakeholders:"• Maya Chen — Engineering Lead (Approver)\n• Jordan Park — Design Lead (Contributor)\n• Sam Torres — CEO (Informed)\n• Priya Mehta — QA Lead (Consulted)",target_date:"Q3 2026 — August 15 target",team_size:"1 PM (me), 1 designer, 2 engineers + Claude Code for acceleration.",problem_statement:"Remote teams waste 6+ hours per week manually converting Slack/Teams conversations into actionable tasks. 73% of action items discussed in meetings are never tracked, leading to missed deadlines and duplicated work.",who_affected:"Primary: Project managers and team leads at remote-first companies (10-50 employees).",current_solutions:"• Jira (45%) — powerful but over-complex, 30min+ daily maintenance\n• Trello (25%) — too simple for real projects, no AI\n• Asana (15%) — good but expensive\n• Spreadsheets + Slack (15%) — chaos",business_case:"Project management software market: $7.1B in 2026, growing 13% YoY. No major player converts conversations to tasks automatically.",cost_of_inaction:"Competitors like Linear are adding AI features in Q4 2026. The window is 6-12 months before incumbents catch up.",primary_persona:"Name: Sarah the Team Lead\nRole: Engineering manager at a 30-person SaaS startup\nAge: 34\nGoals: Keep her team aligned without micromanaging.\nFrustrations: Spends 45 min/day updating Jira.",secondary_personas:"Dev Dan — Senior developer who hates updating task statuses.\nCEO Claire — Needs a 30-second weekly view of all projects.",user_journey:"1. Team finishes a Slack discussion\n2. FlowBoard AI detects action items\n3. Suggests task cards with assignees\n4. Sarah approves with one click\n5. Tasks appear on the team's board",jobs_to_be_done:"• When my team discusses tasks in Slack, I want them auto-captured so nothing falls through\n• When I start my day, I want a clear view of what's blocked",product_goals:"1. Reduce daily PM admin time from 45 min to under 10 min\n2. Capture 90%+ of discussed action items\n3. Achieve 70% weekly active usage within 2 months\n4. Reach 500 paying teams within 6 months\n5. NPS > 50 by month 3",kpis:"• PM admin time: 45 min/day → <10 min/day\n• Task capture rate: ~27% → 90%+\n• Weekly active teams: 70% of signed-up teams",leading_indicators:"Sign-up to first board creation rate, Slack integration completion rate, AI suggestion acceptance rate",in_scope:"• AI conversation-to-task extraction (Slack integration)\n• Visual Kanban board with drag-and-drop\n• Auto-status updates from GitHub\n• Team dashboard with project health metrics\n• Daily digest emails\n• Slack bot for quick task creation",out_of_scope:"• Native mobile apps — Phase 2\n• Microsoft Teams integration — Phase 2\n• Time tracking — Phase 2\n• Gantt charts — Phase 3",future_phases:"Phase 2 (Q4 2026): Native iOS/Android, Teams integration\nPhase 3 (Q1 2027): Gantt charts, custom automations",core_features:"Epic 1: Conversation Intelligence\n- Connect Slack workspace\n- AI scans channels for action items\n- Suggests task cards\n- One-click approve/edit/dismiss\n\nEpic 2: Visual Board\n- Kanban columns (To Do, In Progress, Review, Done)\n- Drag-and-drop cards\n- Card detail view\n\nEpic 3: Auto-Status\n- GitHub integration\n- Auto-move cards based on PR/commit activity",user_stories:"• As a team lead, I want AI to extract tasks from Slack so I don't manually create tickets\n• As a developer, I want my task status to update when I push code",priority_notes:"Conversation Intelligence + Visual Board = MUST HAVE\nAuto-Status from GitHub = SHOULD HAVE\nDashboard + Digest = SHOULD HAVE",performance:"Page load <2s, AI task extraction <5s per conversation, board renders <1s with 500+ cards",security:"OAuth 2.0 (Google + Slack SSO). AES-256 at rest, TLS 1.3 in transit. SOC 2 Type I by month 6. GDPR-compliant.",accessibility:"WCAG 2.1 AA compliance. Full keyboard navigation. Screen reader support.",platforms:"Web: Chrome, Firefox, Safari, Edge (latest 2 versions). Responsive. Min screen: 375px.",tech_stack:"Frontend: Next.js 14 + Tailwind CSS\nBackend: Node.js + tRPC\nDatabase: Supabase (PostgreSQL + Realtime)\nAuth: Clerk\nAI: Claude API\nEmail: Resend",integrations:"• Slack — OAuth app, event subscriptions, bot\n• GitHub — webhooks\n• Google OAuth — social login\n• Resend — transactional emails\n• Stripe — billing",data_model:"Users, Teams, Projects, Boards, Columns, Tasks, TaskComments, SlackConnections, GitHubConnections, AIExtractions",ai_instructions:"Use Claude Code for all backend logic and AI integration. All components must be atomic and typed. Write E2E tests for critical flows.",design_direction:"Modern, clean SaaS inspired by Linear (speed + density) and Notion (flexibility). Dark mode primary. Brand colors: Electric indigo (#6366F1) + Slate (#0F172A).",key_screens:"1. Board View — Kanban columns\n2. Inbox — AI-suggested tasks\n3. Task Detail — Full card\n4. Dashboard — Project health\n5. Settings — Team management\n6. Onboarding — Connect Slack + GitHub",navigation:"Left sidebar: Projects list + Board/Inbox/Dashboard toggle. Top bar: search, filters. Command palette (Cmd+K).",interactions:"Drag-and-drop task cards. Inline editing. Command palette (Cmd+K). Keyboard shortcuts. 60fps drag animations.",phases:"Phase 0 — Discovery & Design (2 weeks)\nPhase 1 — MVP Build (6 weeks)\nPhase 2 — Beta (2 weeks)\nPhase 3 — Public Launch (1 week)",milestones:"• Design complete: May 1\n• Slack integration working: May 15\n• AI extraction pipeline: May 30\n• Board UI complete: June 15\n• Beta launch: July 1\n• Public launch: August 15",launch_criteria:"GO: All P0 bugs resolved, Slack integration verified, AI extraction accuracy >85%, load test passed.\nNO-GO: Any P0 open, Slack API approval pending.",known_risks:"1. Slack API rate limits\n2. AI extraction accuracy variability\n3. GitHub webhook reliability\n4. Small team — key person dependency\n5. Slack app approval process 2-4 weeks",mitigations:"1. Queue-based processing with backoff\n2. Human-in-the-loop: always show suggestions, never auto-create\n3. Retry logic + manual sync fallback\n4. Document everything, use Claude Code\n5. Submit Slack app early in Phase 0",dependencies:"Slack app directory approval (2-4 weeks), GitHub OAuth app registration, Clerk account setup, Supabase project provisioning",existing_research:"15 user interviews with PMs (March 2026). 93% say task capture is their #1 pain. 87% would pay $8-15/user/month.",competitors:"• Linear: Best UX but no conversation integration. $8/user/mo.\n• Jira: Market leader but over-complex. $7.75/user/mo.\n• Asana: Good for non-technical teams. $10.99/user/mo.",budget:"Infrastructure: $0-100/month (Supabase free tier, Vercel free tier). Must launch before September for YC W27.",anything_else:"Applying to YC Winter 2027 batch. MVP needs to be live with real users and revenue traction by October 2026."};

/* ═══ WORKFLOW PROMPTS ═══ */
const WF_PROMPTS: Record<number,string>={
  1:`Read CLAUDE.md and project-brief.md carefully. Then read all documents in this folder: prd.md, app-flow.md, design.md, backend-spec.md, security-checklist.md.

Create a detailed build plan in plan.md with these phases:
- Phase 1: Project setup (dependencies, folder structure, environment config)
- Phase 2: Database schema and authentication setup
- Phase 3: Core API endpoints
- Phase 4: Frontend shell (layout, navigation, routing)
- Phase 5: Feature pages (one subsection per screen)
- Phase 6: Polish (error handling, loading states, responsive design)
- Phase 7: Testing and deployment

For each phase, list the specific files you will create or modify.
Do NOT write any code yet. Just the plan. Wait for my approval.`,
  2:`Read CLAUDE.md. Continue from plan.md.

Execute Phase 1 (project setup), Phase 2 (database + auth), and Phase 3 (core API).
Follow backend-spec.md for data models and API endpoints.
Follow security-checklist.md for authentication implementation.

After completing each phase, update plan.md to mark it done.
Run any available tests after Phase 3.
Report what was built and any issues encountered.`,
  3:`Read CLAUDE.md. Continue from plan.md.

Execute Phase 4 (frontend shell) and Phase 5 (feature pages).
Follow design.md for all visual decisions — colors, typography, spacing, components.
Follow app-flow.md for routing, navigation structure, and screen transitions.

Build each screen listed in app-flow.md, connecting to the API endpoints from Phase 3.
After completing each phase, update plan.md.
Report what was built and any issues encountered.`,
  4:`Read CLAUDE.md. Continue from plan.md.

Execute Phase 6 (polish) and Phase 7 (testing + deployment).
- Add proper error handling to all API calls
- Add loading states to all async operations
- Ensure responsive design works on mobile (min 375px width)
- Run all tests and fix any failures
- Set up deployment configuration

Update plan.md with final status.
Give me a summary of: what was built, what works, what needs attention, and any remaining issues.`,
  5:`I have redesigned [SCREEN NAME] using Google Stitch.
The new design is: [PASTE HTML OR DESCRIBE CHANGES]

Update the existing component to match this new design.
Keep ALL existing functionality — only change the visual layer.
Follow design.md for design tokens (colors, spacing, typography).
Do not modify any API calls, state management, or business logic.`,
};

const WF_SESSIONS=[
  {n:1,t:"Setup & Plan",tm:"~20 min",d:"Read all docs, create plan.md. Do not write code yet.",c:"#9065b0"},
  {n:2,t:"Backend",tm:"1–2 hrs",d:"DB, auth, and core API endpoints.",c:"#2383e2"},
  {n:3,t:"Frontend",tm:"1–2 hrs",d:"All screens connected to the API.",c:"#448361"},
  {n:4,t:"Polish + Deploy",tm:"~1 hr",d:"Error handling, responsive design, tests, and deployment.",c:"#d9730d"},
  {n:5,t:"Stitch UI Refresh",tm:"~30 min",d:"Optional. Redesign screens in Stitch, apply via Claude Code.",c:"#ec4899"},
];

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
  const versions=activeProject?.versions||[];
  const docs=activeProject?.docs||null;
  const changeBrief=activeProject?.changeBrief||"";
  const mode=activeProject?.mode||null;
  const currentVer=versions.length;
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
  const addF=(id: string,f: FileList)=>setFiles(p=>({...p,[id]:[...(p[id]||[]),...Array.from(f)]}));
  const rmF=(id: string,i: number)=>setFiles(p=>({...p,[id]:p[id].filter((_,j)=>j!==i)}));
  const secProg=(i: number)=>{const s=SECTIONS[i];if(!s)return 0;return Math.round(s.questions.filter(q=>(ans[q.id]||"").trim()).length/s.questions.length*100);};
  const totAns=SECTIONS.flatMap(s=>s.questions).filter(q=>(ans[q.id]||"").trim()).length;
  const totProg=TOTAL_Q?Math.round(totAns/TOTAL_Q*100):0;
  const reqMiss=SECTIONS.flatMap(s=>s.questions).filter(q=>q.required&&!(ans[q.id]||"").trim());
  const buildIntake=()=>{let o="# PROJECT INTAKE\n\n";SECTIONS.forEach(s=>{o+=`## ${s.icon} ${s.title}\n\n`;s.questions.forEach(q=>{o+=`### ${q.label}\n${(ans[q.id]||"").trim()||"*[Not provided]*"}\n\n`;});});return o;};
  const cp=async(t: string,k: string)=>{try{await navigator.clipboard.writeText(t);}catch{const el=document.createElement("textarea");el.value=t;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}setCopied(p=>({...p,[k]:true}));setTimeout(()=>setCopied(p=>({...p,[k]:false})),2000);};
  const save=useCallback(()=>{saveStorage({projects,activeProjectId});setFlash(true);setTimeout(()=>setFlash(false),1500);},[projects,activeProjectId]);

  const getFieldStatus=(qId: string)=>{if(!versions.length)return null;const prev=versions[versions.length-1].ans;const o=(prev[qId]||"").trim();const n=(ans[qId]||"").trim();if(!o&&n)return"added";if(o&&!n)return"removed";if(o&&n&&o!==n)return"modified";return null;};
  const fieldBorder=(qId: string)=>{const s=getFieldStatus(qId);if(s==="added")return`1px solid ${CL.green}`;if(s==="modified")return`1px solid ${CL.amber}`;if(s==="removed")return`1px solid ${CL.red}`;return`1px solid ${N.bd}`;};
  const fieldBadge=(qId: string)=>{const s=getFieldStatus(qId);if(!s)return null;const c={added:{bg:"rgba(68,131,97,0.1)",color:CL.green,text:"NEW"},modified:{bg:"rgba(217,115,13,0.1)",color:CL.amber,text:"CHANGED"},removed:{bg:"rgba(235,87,87,0.1)",color:CL.red,text:"REMOVED"}}[s];return <span style={{padding:"1px 6px",borderRadius:4,background:c.bg,color:c.color,fontSize:10,fontWeight:600,marginLeft:6}}>{c.text}</span>;};
  const loadVersion=(ver: number)=>{const v=versions.find(x=>x.ver===ver);if(v&&confirm(`Load V${ver} answers? Current unsaved changes will be lost.`)){updateActiveProject({currentAnswers:{...v.ans}});}};

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
  const handleGen=async()=>{
    const newVer=versions.length+1;
    const snapshot: ProjectVersion={ver:newVer,date:new Date().toISOString(),ans:{...ans},mode:activeProject?.mode||null};
    let newCB=changeBrief;
    if(newVer>1){const prevAns=versions[versions.length-1].ans;const diff=computeDiff(prevAns,ans,SECTIONS);newCB=generateChangeBrief(diff,newVer-1,newVer,ans.product_name||"Product");snapshot.changeBrief=newCB;}
    const newVersions=[...versions,snapshot];
    updateActiveProject({versions:newVersions,changeBrief:newCB});
    setGenerating(true);setGenErr("");setGenProg("Preparing...");setTab("results");
    const intake=buildIntake(),cMd=genClaudeMd(ans),pB=genBrief(ans),pr=genPrompts(ans);
    try{
      setGenProg("Calling Claude API... (may fail due to CORS on localhost — use Copy instead)");
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:16000,system:SYS,messages:[{role:"user",content:intake}]})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`);}
      const data=await r.json();const full=(data.content as {type:string;text:string}[]).filter(i=>i.type==="text").map(i=>i.text).join("\n");
      const parts=full.split("---DOC_SEPARATOR---").map((p: string)=>p.trim()).filter(Boolean);
      const dm: Record<string,string>={prd:"",appFlow:"",design:"",backend:"",security:""};const ks=["prd","appFlow","design","backend","security"];
      if(parts.length>=5)ks.forEach((k,i)=>{dm[k]=parts[i];});else{dm.prd=full;ks.slice(1).forEach(k=>{dm[k]="[⚠️] Use Copy to Clipboard.";});}
      updateActiveProject({docs:{...dm,claudeMd:cMd,projectBrief:pB,prompts:pr,changeBrief:newCB||"No previous version to compare."},versions:newVersions,changeBrief:newCB});
      setGenProg("");
    }catch(e){
      setGenErr(`${e instanceof Error?e.message:String(e)} — Use the Copy button on the last intake section instead.`);
      updateActiveProject({docs:{prd:"",appFlow:"",design:"",backend:"",security:"",claudeMd:cMd,projectBrief:pB,prompts:pr,changeBrief:newCB||""},versions:newVersions,changeBrief:newCB});
      setGenProg("");
    }finally{setGenerating(false);}
  };

  const switchMode=(newMode: string)=>{updateActiveProject({mode:newMode});setShowModeConfirm(false);setSec(0);};
  const cycleWfStatus=(n: number)=>{const cur=(activeProject?.workflowStatus||DEFAULT_WF_STATUS)[n]||"notStarted";const next=cur==="notStarted"?"inProgress":cur==="inProgress"?"complete":"notStarted";updateActiveProject({workflowStatus:{...(activeProject?.workflowStatus||DEFAULT_WF_STATUS),[n]:next}});};
  const handleReset=()=>{if(confirm("Clear this project's current answers? Version history will be kept.")){updateActiveProject({currentAnswers:{},name:"Untitled Project"});setFiles({});setSec(0);setTab("intake");}};
  const loadTestData=()=>{updateActiveProject({currentAnswers:TEST_DATA,name:"FlowBoard"});setSec(0);setTab("intake");formRef.current?.scrollTo(0,0);};
  const createTestProject=()=>{const id=genId();const p={...blankProject("avatar",id),name:"FlowBoard",currentAnswers:TEST_DATA};setProjects(prev=>[...prev,p]);openProject(id);};

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
            const disabled=!["intake","versions","usage"].includes(t)&&!docs&&!generating;
            return(
              <button key={t} onClick={()=>!disabled&&setTab(t)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:4,border:"none",background:tab===t?N.act:"transparent",color:disabled?N.tm:(tab===t?N.tx:N.ts),cursor:disabled?"default":"pointer",fontSize:13,textAlign:"left",fontWeight:tab===t?500:400}}
                onMouseEnter={e=>{if(!disabled&&tab!==t)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(tab!==t)e.currentTarget.style.background="transparent";}}>
                {t==="intake"&&"📝"}{t==="results"&&"📄"}{t==="versions"&&"🔄"}{t==="workflow"&&"🗺️"}{t==="usage"&&"⚡"} {TL[t as keyof typeof TL]}
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

          {currentVer>0&&<span style={{padding:"3px 10px",borderRadius:12,background:N.hov,color:N.ts,fontSize:12,fontWeight:500,flexShrink:0}}>V{currentVer}</span>}

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
                    {fieldBadge(q.id)}
                  </div>
                  <p style={{fontSize:12,color:N.ts,margin:"0 0 8px",lineHeight:1.5}}>{q.guidance}</p>
                  {q.type==="text"
                    ?<input type="text" value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder}
                        style={{width:"100%",padding:"9px 12px",borderRadius:6,border:fieldBorder(q.id),background:N.bg,color:N.tx,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:F,transition:"border-color .15s",lineHeight:1.5}}
                        onFocus={e=>e.currentTarget.style.borderColor=CL.blue} onBlur={e=>e.currentTarget.style.borderColor=N.bd}/>
                    :<textarea value={ans[q.id]||""} onChange={e=>upd(q.id,e.target.value)} placeholder={q.placeholder} rows={3}
                        style={{width:"100%",padding:"9px 12px",borderRadius:6,border:fieldBorder(q.id),background:N.bg,color:N.tx,fontSize:14,outline:"none",resize:"vertical",lineHeight:1.6,minHeight:88,boxSizing:"border-box",fontFamily:F,transition:"border-color .15s"}}
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
                :<div style={{display:"flex",gap:8}}>
                    <button onClick={()=>cp(SYS+"\n\n---\n\n"+buildIntake(),"cb")}
                      style={{padding:"7px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:copied.cb?"rgba(68,131,97,0.08)":N.bg,color:copied.cb?CL.green:N.ts,cursor:"pointer",fontSize:13}}>
                      {copied.cb?"Copied ✓":"📋 Copy"}</button>
                    <button onClick={handleGen} disabled={reqMiss.length>0}
                      style={{padding:"7px 18px",borderRadius:6,border:"none",background:reqMiss.length>0?N.hov:CL.green,color:reqMiss.length>0?N.tm:"#fff",cursor:reqMiss.length>0?"default":"pointer",fontSize:13,fontWeight:500}}>
                      🚀 Generate V{currentVer+1}</button>
                  </div>
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
              :!docs
                ?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:N.ts,fontSize:14}}>Generate from Intake first.</p></div>
                :<>
                  {genErr&&<div style={{margin:"12px 24px 0",padding:"10px 14px",background:"rgba(235,87,87,0.06)",border:`1px solid rgba(235,87,87,0.2)`,borderRadius:6,color:CL.red,fontSize:13}}>{genErr}</div>}
                  <div style={{display:"flex",gap:1,padding:"8px 20px",borderBottom:`1px solid ${N.bd}`,overflowX:"auto",flexShrink:0}}>
                    {DT.filter(d=>d.key!=="changeBrief"||changeBrief).map(d=>(
                      <button key={d.key} onClick={()=>setActiveDoc(d.key)}
                        style={{padding:"5px 12px",borderRadius:5,border:"none",fontSize:13,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?N.act:"transparent",color:activeDoc===d.key?N.tx:d.key==="changeBrief"?CL.amber:N.ts,cursor:"pointer"}}
                        onMouseEnter={e=>{if(activeDoc!==d.key)e.currentTarget.style.background=N.hov;}} onMouseLeave={e=>{if(activeDoc!==d.key)e.currentTarget.style.background="transparent";}}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
                    <div style={{maxWidth:760,margin:"0 auto"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                        <div>
                          <h3 style={{fontSize:20,fontWeight:700,color:N.tx,margin:"0 0 3px"}}>{DT.find(d=>d.key===activeDoc)?.label}</h3>
                          <span style={{fontSize:12,color:N.ts,fontFamily:"monospace"}}>{DT.find(d=>d.key===activeDoc)?.file}</span>
                        </div>
                        <button onClick={()=>cp(docs[activeDoc]||changeBrief||"",activeDoc)}
                          style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${N.bd}`,background:copied[activeDoc]?"rgba(68,131,97,0.08)":N.bg,color:copied[activeDoc]?CL.green:N.ts,cursor:"pointer",fontSize:13,flexShrink:0}}>
                          {copied[activeDoc]?"Copied ✓":"📋 Copy"}</button>
                      </div>
                      <div style={{background:N.sbg,border:`1px solid ${N.bd}`,borderRadius:8,padding:"20px 24px"}}>
                        {renderMd(activeDoc==="changeBrief"?changeBrief:docs[activeDoc])}
                      </div>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* ═══ VERSIONS ═══ */}
        {tab==="versions"&&(
          <div style={{flex:1,overflowY:"auto",padding:"40px 56px 60px"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <h2 style={{fontSize:26,fontWeight:700,color:N.tx,margin:"0 0 8px",letterSpacing:-0.3}}>Version History</h2>
              <p style={{fontSize:14,color:N.ts,margin:"0 0 28px",lineHeight:1.6}}>Each generation saves a snapshot. Iterate without rebuilding from scratch.</p>
              {versions.length===0
                ?<div style={{border:`2px dashed ${N.bd}`,borderRadius:8,padding:48,textAlign:"center"}}>
                    <div style={{fontSize:32,marginBottom:10}}>📭</div>
                    <p style={{color:N.ts,fontSize:14,margin:0}}>No versions yet. Fill the intake form and generate to create V1.</p>
                  </div>
                :<>
                  {versions.map((v,i)=>(
                    <div key={v.ver} style={{border:`1px solid ${N.bd}`,borderRadius:8,marginBottom:8,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
                        <div style={{width:34,height:34,borderRadius:7,background:N.hov,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:accent,flexShrink:0}}>V{v.ver}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600,color:N.tx}}>{v.ans.product_name||"Untitled"}</div>
                          <div style={{fontSize:12,color:N.ts}}>{new Date(v.date).toLocaleString()} · {(v.mode||mode)==="avatar"?"⚡ Avatar State":"🌿 Spirit Guide"}</div>
                        </div>
                        <button onClick={()=>loadVersion(v.ver)} style={{padding:"5px 14px",borderRadius:5,border:`1px solid ${N.bd}`,background:"none",color:N.ts,cursor:"pointer",fontSize:12,flexShrink:0}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=CL.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=N.bd}>Load</button>
                      </div>
                      {i>0&&<div style={{padding:"0 18px 12px"}}>
                        {(()=>{const prev=versions[i-1].ans;const diff=computeDiff(prev,v.ans,mode==="avatar"?AVATAR:SPIRIT);return(
                          <div style={{fontSize:12,color:N.ts,display:"flex",gap:12}}>
                            {diff.added.length>0&&<span style={{color:CL.green}}>+{diff.added.length} added</span>}
                            {diff.modified.length>0&&<span style={{color:CL.amber}}>{diff.modified.length} changed</span>}
                            {diff.removed.length>0&&<span style={{color:CL.red}}>{diff.removed.length} removed</span>}
                            <span>{diff.unchanged} unchanged</span>
                          </div>
                        );})()}
                      </div>}
                    </div>
                  ))}
                  <div style={{border:`1px dashed ${N.bd}`,borderRadius:8,padding:24,textAlign:"center",marginTop:16}}>
                    <p style={{fontSize:14,color:N.ts,margin:"0 0 14px",lineHeight:1.5}}>Ready to iterate? Current answers are the draft for V{versions.length+1}.</p>
                    <button onClick={()=>setTab("intake")} style={{padding:"7px 20px",borderRadius:6,border:"none",background:accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>Edit & Create V{versions.length+1}</button>
                  </div>
                  {changeBrief&&(
                    <div style={{border:`1px solid rgba(217,115,13,0.25)`,borderRadius:8,padding:18,marginTop:16,background:"rgba(217,115,13,0.04)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <h3 style={{fontSize:15,fontWeight:600,color:CL.amber,margin:0}}>Latest Change Brief</h3>
                        <button onClick={()=>cp(changeBrief,"vbr")} style={{padding:"4px 12px",borderRadius:5,border:`1px solid ${N.bd}`,background:copied.vbr?"rgba(68,131,97,0.08)":N.bg,color:copied.vbr?CL.green:N.ts,cursor:"pointer",fontSize:12}}>{copied.vbr?"Copied ✓":"📋 Copy"}</button>
                      </div>
                      <p style={{fontSize:13,color:N.ts,margin:"0 0 10px",lineHeight:1.5}}>Paste as change-brief.md, then give Claude Code the update prompt at the bottom.</p>
                      <details><summary style={{fontSize:13,color:N.ts,cursor:"pointer"}}>Preview</summary>
                        <div style={{background:N.sbg,borderRadius:6,padding:14,marginTop:8,maxHeight:300,overflowY:"auto"}}>{renderMd(changeBrief)}</div>
                      </details>
                    </div>
                  )}
                </>
              }
            </div>
          </div>
        )}

        {/* ═══ WORKFLOW ═══ */}
        {tab==="workflow"&&(
          <div style={{flex:1,overflowY:"auto",padding:"40px 56px 60px"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <h2 style={{fontSize:26,fontWeight:700,color:N.tx,margin:"0 0 8px",letterSpacing:-0.3}}>Build Workflow</h2>
              <p style={{fontSize:14,color:N.ts,margin:"0 0 24px",lineHeight:1.5}}>Follow these sessions in order to build your product with Claude Code.</p>

              {/* Iteration Mode Banner */}
              {currentVer>1&&(
                <div style={{background:"rgba(217,115,13,0.08)",border:`1px solid rgba(217,115,13,0.25)`,borderRadius:10,padding:"18px 20px",marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <h3 style={{fontSize:15,fontWeight:700,color:CL.amber,margin:0}}>🔄 Iteration Mode — V{currentVer}</h3>
                    <button onClick={()=>setTab("versions")} style={{padding:"5px 14px",borderRadius:5,border:"none",background:CL.amber,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Go to Versions →</button>
                  </div>
                  <p style={{fontSize:13,color:N.ts,margin:0,lineHeight:1.5}}>You&apos;re on V{currentVer}. Instead of running all build sessions again, use the Change Brief from the Versions tab. It contains only what changed and a ready-to-paste Claude Code prompt for surgical updates.</p>
                </div>
              )}

              {/* Session Cards */}
              <div style={{opacity:currentVer>1?0.55:1}}>
                {currentVer>1&&<p style={{fontSize:12,color:N.ts,margin:"0 0 12px",fontStyle:"italic"}}>Full build sessions below are for V1 initial builds. For V2+ iterations, use the Change Brief.</p>}
                {WF_SESSIONS.map(s=>{
                  const isOpen=expandedSession===s.n;
                  const wfSt=(activeProject?.workflowStatus||DEFAULT_WF_STATUS)[s.n]||"notStarted";
                  const stIcon=wfSt==="complete"?"✅":wfSt==="inProgress"?"🔄":"⬜";
                  const cpKey=`wf${s.n}`;
                  return(
                    <div key={s.n} style={{border:`1px solid ${isOpen?s.c+"88":N.bd}`,borderRadius:9,marginBottom:8,background:isOpen?s.c+"07":"transparent",transition:"border-color 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpandedSession(isOpen?null:s.n)}>
                        <div style={{width:30,height:30,borderRadius:7,background:s.c+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:s.c,flexShrink:0}}>{s.n}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:600,color:N.tx}}>{s.t}</div>
                          <div style={{fontSize:12,color:N.ts}}>{s.tm}</div>
                        </div>
                        {!isOpen&&<div style={{fontSize:13,color:N.ts,maxWidth:220,textAlign:"right",flexShrink:0}}>{s.d}</div>}
                        <button onClick={e=>{e.stopPropagation();cycleWfStatus(s.n);}} title="Toggle status" style={{fontSize:15,background:"none",border:"none",cursor:"pointer",padding:"2px 4px",flexShrink:0,lineHeight:1}}>{stIcon}</button>
                        <span style={{fontSize:11,color:N.tm,flexShrink:0,userSelect:"none"}}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&(
                        <div style={{padding:"0 18px 16px"}}>
                          <p style={{fontSize:13,color:N.ts,margin:"0 0 12px",lineHeight:1.6}}>{s.d}</p>
                          <div style={{position:"relative",borderRadius:7,overflow:"hidden"}}>
                            <div style={{background:"#1e1e2e",padding:"14px 16px",paddingRight:110,borderRadius:7}}>
                              <pre style={{margin:0,fontSize:12,color:"#cdd6f4",fontFamily:"'Fira Code','Consolas',monospace",whiteSpace:"pre-wrap",lineHeight:1.75,wordBreak:"break-word"}}>{WF_PROMPTS[s.n]}</pre>
                            </div>
                            <button onClick={()=>cp(WF_PROMPTS[s.n],cpKey)} style={{position:"absolute",top:10,right:10,padding:"4px 10px",borderRadius:5,border:"none",background:copied[cpKey]?"rgba(68,200,120,0.25)":"rgba(255,255,255,0.12)",color:copied[cpKey]?"#6ee7b7":"#cdd6f4",cursor:"pointer",fontSize:11,fontWeight:500,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                              {copied[cpKey]?"✓ Copied!":"📋 Copy Prompt"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tips Panel */}
              <div style={{border:`1px solid ${N.bd}`,borderRadius:9,padding:"18px 20px",marginTop:24}}>
                <h3 style={{fontSize:14,fontWeight:700,color:N.tx,margin:"0 0 14px"}}>Tips</h3>
                {[
                  ["Start each session fresh","Open a new Claude Code conversation for each session. Old conversation history eats tokens and causes Claude to forget instructions."],
                  ["Don't skip Session 1","The build plan is the most important step. Review it carefully before approving. It's much cheaper to fix a plan than to fix code."],
                  ["Use Sonnet for building","Type /model in Claude Code to switch to Sonnet. It's faster and uses fewer tokens than Opus for implementation work. Save Opus for complex architecture decisions."],
                  ["Compact regularly","Type /compact when Claude Code feels slow or starts forgetting context. It clears old conversation while keeping important information."],
                  ["Check your usage","Type /status to see how much of your usage limit you've consumed in the current window."],
                  ["Commit after each session","Tell Claude Code: \"Commit with message: [describe what was built]\". This creates a checkpoint you can always go back to."],
                ].map(([title,body],i,arr)=>(
                  <div key={i} style={{marginBottom:i<arr.length-1?10:0}}>
                    <span style={{fontSize:13,fontWeight:600,color:N.tx}}>{title}</span>
                    <span style={{fontSize:13,color:N.ts}}> — {body}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ USAGE ═══ */}
        {tab==="usage"&&(
          <div style={{flex:1,overflowY:"auto",padding:"40px 56px 60px"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <h2 style={{fontSize:26,fontWeight:700,color:N.tx,margin:"0 0 8px",letterSpacing:-0.3}}>Usage Guide</h2>
              <p style={{fontSize:14,color:N.ts,margin:"0 0 28px"}}>Claude subscription plans and token-saving tips.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[{p:"Pro",pr:"$20/mo",c:CL.blue},{p:"Max 5x",pr:"$100/mo",c:CL.purple},{p:"Max 20x",pr:"$200/mo",c:CL.amber}].map(x=>(
                  <div key={x.p} style={{border:`1px solid ${N.bd}`,borderRadius:8,padding:"16px 18px"}}>
                    <div style={{fontSize:12,fontWeight:600,color:x.c,marginBottom:5}}>{x.p}</div>
                    <div style={{fontSize:22,fontWeight:700,color:N.tx}}>{x.pr}</div>
                  </div>
                ))}
              </div>
              <div style={{border:`1px solid ${N.bd}`,borderRadius:8,padding:"18px 20px",marginBottom:14}}>
                <h3 style={{fontSize:15,fontWeight:600,color:N.tx,margin:"0 0 12px"}}>Token-Saving Tips</h3>
                {["Sonnet for building (/model)","Fresh sessions per task","Use /compact when slow","Be specific in prompts","Off-peak hours stretch further","Instructions in files, not chat"].map((t,i)=>(
                  <p key={i} style={{margin:"0 0 6px",fontSize:13,color:N.ts,lineHeight:1.5}}>{i+1}. {t}</p>
                ))}
              </div>
              <div style={{border:`1px solid ${N.bd}`,borderRadius:8,padding:"18px 20px"}}>
                <h3 style={{fontSize:15,fontWeight:600,color:N.tx,margin:"0 0 14px"}}>V1 vs Iteration Cost</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[{l:"V1 full build",v:"4–6 hrs"},{l:"V2+ iteration",v:"30–60 min"},{l:"V1 on Pro",v:"2–3 days"},{l:"V2+ on Pro",v:"1 session"}].map(s=>(
                    <div key={s.l} style={{background:N.sbg,borderRadius:6,padding:"10px 14px"}}>
                      <div style={{fontSize:11,color:N.ts,marginBottom:3}}>{s.l}</div>
                      <div style={{fontSize:18,fontWeight:700,color:N.tx}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <p style={{margin:"12px 0 0",fontSize:12,color:N.ts}}>Iterations use the change brief — much less tokens than a full rebuild.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
