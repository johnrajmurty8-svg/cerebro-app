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
  const addF=(id,f)=>setFiles(p=>({...p,[id]:[...(p[id]||[]),...Array.from(f)]}));
  const rmF=(id,i)=>setFiles(p=>({...p,[id]:p[id].filter((_,j)=>j!==i)}));
  const secProg=i=>{const s=SECTIONS[i];if(!s)return 0;return Math.round(s.questions.filter(q=>(ans[q.id]||"").trim()).length/s.questions.length*100);};
  const totAns=SECTIONS.flatMap(s=>s.questions).filter(q=>(ans[q.id]||"").trim()).length;
  const totProg=TOTAL_Q?Math.round(totAns/TOTAL_Q*100):0;
  const reqMiss=SECTIONS.flatMap(s=>s.questions).filter(q=>q.required&&!(ans[q.id]||"").trim());
  const buildIntake=()=>{let o="# PROJECT INTAKE\n\n";SECTIONS.forEach(s=>{o+=`## ${s.icon} ${s.title}\n\n`;s.questions.forEach(q=>{o+=`### ${q.label}\n${(ans[q.id]||"").trim()||"*[Not provided]*"}\n\n`;});});return o;};
  const cp=async(t,k)=>{try{await navigator.clipboard.writeText(t);}catch{const el=document.createElement("textarea");el.value=t;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}setCopied(p=>({...p,[k]:true}));setTimeout(()=>setCopied(p=>({...p,[k]:false})),2000);};

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
      product_name: "FlowBoard",
      one_liner: "A visual project management app for remote teams that turns conversations into task boards using AI",
      author: "Alex Rivera, Product Manager",
      stakeholders: "• Maya Chen — Engineering Lead (Approver)\n• Jordan Park — Design Lead (Contributor)\n• Sam Torres — CEO (Informed)\n• Priya Mehta — QA Lead (Consulted)",
      target_date: "Q3 2026 — August 15 target",
      version: "0.1 (Draft)",
      team_size: "1 PM (me), 1 designer, 2 engineers + Claude Code for acceleration. Using Figma for design, VS Code + Claude Code for dev.",
      problem_statement: "Remote teams waste 6+ hours per week manually converting Slack/Teams conversations into actionable tasks. 73% of action items discussed in meetings are never tracked, leading to missed deadlines and duplicated work. Project managers spend more time updating boards than actually managing projects.",
      who_affected: "Primary: Project managers and team leads at remote-first companies (10-50 employees). Secondary: Individual contributors who need clarity on what to work on next. Tertiary: Executives who need project visibility without attending every standup.",
      current_solutions: "• Jira (45%) — powerful but over-complex, 30min+ daily maintenance\n• Trello (25%) — too simple for real projects, no AI\n• Asana (15%) — good but expensive, no conversation integration\n• Spreadsheets + Slack (15%) — chaos, nothing is tracked properly",
      business_case: "Project management software market: $7.1B in 2026, growing 13% YoY. AI-native PM tools are the fastest-growing segment. No major player converts conversations to tasks automatically. Slack has 32M daily active users — massive distribution opportunity via integration.",
      cost_of_inaction: "Competitors like Linear are adding AI features in Q4 2026. Monday.com acquired an AI startup last month. The window for an AI-native conversation-to-task tool is 6-12 months before incumbents catch up.",
      primary_persona: "Name: Sarah the Team Lead\nRole: Engineering manager at a 30-person SaaS startup\nAge: 34\nGoals: Keep her 8-person team aligned without micromanaging. Wants to spend <15 min/day on project admin.\nFrustrations: Spends 45 min/day updating Jira. Tasks fall through cracks between Slack and the board. Standup notes disappear.\nTech proficiency: High — uses Slack, GitHub, Figma, Notion daily.",
      secondary_personas: "Persona 2: Dev Dan — Senior developer who hates updating task statuses. Wants the board to update itself based on his Git commits and Slack messages.\n\nPersona 3: CEO Claire — Needs a 30-second weekly view of all projects. Doesn't want to learn a complex PM tool.",
      user_journey: "1. Sarah's team finishes a Slack discussion about a new feature\n2. FlowBoard AI detects action items in the conversation\n3. Suggests task cards with assignees, priorities, and deadlines\n4. Sarah reviews and approves with one click\n5. Tasks appear on the team's visual board\n6. As devs work, status auto-updates from GitHub activity\n7. Sarah gets a daily digest instead of manual standups\n8. CEO Claire sees a real-time project health dashboard",
      jobs_to_be_done: "• When my team discusses tasks in Slack, I want them auto-captured so nothing falls through the cracks\n• When I start my day, I want a clear view of what's blocked and what's on track so I can act immediately\n• When an engineer finishes a task, I want the board to update automatically so I don't chase status updates\n• When my CEO asks for a project update, I want to share a live dashboard so I don't spend 30 min preparing slides",
      product_goals: "1. Reduce daily PM admin time from 45 min to under 10 min\n2. Capture 90%+ of discussed action items (vs 27% industry average)\n3. Achieve 70% weekly active usage within 2 months of launch\n4. Reach 500 paying teams within 6 months\n5. NPS > 50 by month 3",
      kpis: "• PM admin time: baseline 45 min/day → target <10 min/day\n• Task capture rate: baseline ~27% → target 90%+\n• Weekly active teams: target 70% of signed-up teams\n• Time from conversation to task: target <30 seconds\n• Board accuracy (auto-status): target 85%+ correct",
      leading_indicators: "Sign-up to first board creation rate, Slack integration completion rate, AI suggestion acceptance rate, daily active usage in first 2 weeks",
      in_scope: "• AI conversation-to-task extraction (Slack integration)\n• Visual Kanban board with drag-and-drop\n• Auto-status updates from GitHub\n• Team dashboard with project health metrics\n• Daily digest emails\n• Slack bot for quick task creation\n• Web app (responsive)\n• Basic role permissions (admin, member, viewer)",
      out_of_scope: "• Native mobile apps — Phase 2\n• Microsoft Teams integration — Phase 2\n• Time tracking — Phase 2\n• Gantt charts — Phase 3\n• Custom workflows/automations — Phase 3\n• On-premise deployment — not planned\n• Video call integration — not planned",
      future_phases: "Phase 2 (Q4 2026): Native iOS/Android, Teams integration, time tracking, advanced filters\nPhase 3 (Q1 2027): Gantt charts, custom automations, API for third-party integrations\nPhase 4 (Q2 2027): AI project risk prediction, resource allocation suggestions",
      core_features: "Epic 1: Conversation Intelligence\n- Connect Slack workspace\n- AI scans channels for action items\n- Suggests task cards (title, assignee, priority, deadline)\n- One-click approve/edit/dismiss\n\nEpic 2: Visual Board\n- Kanban columns (To Do, In Progress, Review, Done)\n- Drag-and-drop cards\n- Card detail view with comments, attachments, subtasks\n- Board filters and search\n\nEpic 3: Auto-Status\n- GitHub integration\n- Auto-move cards based on PR/commit activity\n- Manual override always available\n\nEpic 4: Dashboard & Digest\n- Team project health overview\n- Blocked items alert\n- Daily email digest\n- Weekly summary for executives",
      user_stories: "• As a team lead, I want AI to extract tasks from Slack so I don't manually create tickets\n• As a developer, I want my task status to update when I push code so I don't update the board manually\n• As a PM, I want a daily digest so I know what needs attention without checking the board\n• As a CEO, I want a project health dashboard so I get visibility without attending standups",
      priority_notes: "Conversation Intelligence + Visual Board = MUST HAVE (core value prop)\nAuto-Status from GitHub = SHOULD HAVE (strong differentiator)\nDashboard + Digest = SHOULD HAVE\nAdvanced permissions = COULD HAVE for MVP",
      performance: "Page load <2s, AI task extraction <5s per conversation, board renders <1s with 500+ cards, support 1K concurrent users at launch, 99.9% uptime",
      security: "OAuth 2.0 for authentication (Google + Slack SSO). AES-256 encryption at rest, TLS 1.3 in transit. SOC 2 Type I by month 6. GDPR-compliant for EU teams. Slack data processed but not permanently stored — only extracted tasks retained.",
      accessibility: "WCAG 2.1 AA compliance. Full keyboard navigation for board. Screen reader support for task management. High contrast mode.",
      platforms: "Web: Chrome, Firefox, Safari, Edge (latest 2 versions). Responsive design — usable on tablets. Min screen: 375px width. Progressive Web App for mobile access.",
      tech_stack: "Frontend: Next.js 14 + Tailwind CSS + Framer Motion\nBackend: Node.js + tRPC (type-safe API)\nDatabase: Supabase (PostgreSQL + Realtime)\nAuth: Clerk (supports Slack SSO + Google)\nAI: Claude API (Haiku for extraction, Sonnet for complex tasks)\nRealtime: Supabase Realtime for board updates\nEmail: Resend for digests",
      integrations: "• Slack — OAuth app, event subscriptions, bot\n• GitHub — webhooks for PR/commit events\n• Google OAuth — social login\n• Resend — transactional emails\n• Sentry — error tracking\n• PostHog — product analytics\n• Stripe — billing (Phase 1.5)",
      data_model: "Users, Teams, TeamMembers, Projects, Boards, Columns, Tasks, TaskComments, SlackConnections, GitHubConnections, Conversations, AIExtractions, Digests.\n\nA Team has many Projects, each with one Board. Board has ordered Columns. Column has ordered Tasks. Task has assignee (User), comments, and linked Conversation.",
      ai_instructions: "Use Claude Code for all backend logic, API routes, and AI integration. Use Google Stitch for initial UI exploration, then Claude Code to implement. All components must be atomic and typed (TypeScript). Write E2E tests for critical flows (Slack → extraction → task creation). Use Supabase row-level security for multi-tenancy.",
      design_direction: "Modern, clean SaaS aesthetic inspired by Linear (speed + density) and Notion (flexibility). Dark mode primary — most dev/PM teams prefer it. Brand colors: Electric indigo (#6366F1) + Slate (#0F172A). Cards should feel lightweight and scannable. Board should feel fast — no loading spinners for drag-and-drop.",
      key_screens: "1. Board View — Kanban columns with task cards, filters, search\n2. Inbox — AI-suggested tasks from Slack conversations, approve/edit/dismiss\n3. Task Detail — Full card with description, comments, subtasks, activity log\n4. Dashboard — Project health, blocked items, team velocity\n5. Settings — Team management, integrations, notifications\n6. Onboarding — Connect Slack + GitHub wizard",
      navigation: "Left sidebar: Projects list + Board/Inbox/Dashboard toggle. Top bar: search, filters, notification bell, user menu. Command palette (Cmd+K) for quick navigation. Mobile: bottom tab bar (Board, Inbox, Dashboard).",
      interactions: "Drag-and-drop task cards between columns. Inline editing for task titles. Command palette (Cmd+K) for everything. Keyboard shortcuts for power users. Smooth 60fps drag animations. Toast notifications for real-time updates. Skeleton loading states.",
      phases: "Phase 0 — Discovery & Design (2 weeks): User interviews, wireframes, Slack API spike, Stitch prototypes\nPhase 1 — MVP Build (6 weeks): Core board + Slack integration + AI extraction\nPhase 2 — Beta (2 weeks): 30 teams, feedback loop, bug fixes\nPhase 3 — Public Launch (1 week): Marketing, onboarding polish, pricing go-live",
      milestones: "• Design complete: May 1\n• Slack integration working: May 15\n• AI extraction pipeline: May 30\n• Board UI complete: June 15\n• GitHub integration: June 30\n• Beta launch: July 1\n• Public launch: August 15",
      launch_criteria: "GO: All P0 bugs resolved, Slack integration verified with 5+ workspaces, AI extraction accuracy >85%, load test passed (500 concurrent), security audit complete.\nNO-GO: Any P0 open, Slack API approval pending, extraction accuracy <80%, no legal sign-off on data handling.",
      known_risks: "1. Slack API rate limits may bottleneck extraction for large workspaces\n2. AI extraction accuracy may vary by conversation style\n3. GitHub webhook reliability outside our control\n4. Small team — key person dependency\n5. Slack app approval process may take 2-4 weeks\n6. Competitor launches during our build phase",
      mitigations: "1. Implement queue-based processing with backoff\n2. Human-in-the-loop: always show suggestions, never auto-create without approval\n3. Build retry logic + manual sync fallback\n4. Document everything, use Claude Code to reduce bus factor\n5. Submit Slack app early in Phase 0\n6. Focus on speed-to-market, unique AI angle",
      dependencies: "Slack app directory approval (2-4 weeks), GitHub OAuth app registration (1-2 days), Clerk account setup, Supabase project provisioning, Resend domain verification",
      existing_research: "Conducted 15 user interviews with PMs at remote companies (March 2026). Key findings:\n• 93% say task capture from conversations is their #1 pain\n• 87% would pay $8-15/user/month for auto-capture\n• 67% currently use Slack + Jira combo and hate the context switching\n• Average PM spends 42 min/day on board maintenance\n• Top requested feature: 'just make the board update itself'",
      competitors: "• Linear: Best UX but no conversation integration. $8/user/mo.\n• Jira: Market leader but over-complex. No AI. $7.75/user/mo.\n• Asana: Good for non-technical teams. Adding AI features. $10.99/user/mo.\n• Monday.com: Visual but bloated. Acquired AI startup. $9/user/mo.\n• Shortcut (fka Clubhouse): Developer-focused. No Slack-to-task AI.",
      budget: "Infrastructure: $0-100/month (Supabase free tier, Vercel free tier, Claude API ~$50/mo for extraction). No design contractor — using Stitch + Figma ourselves. Must launch before September for YC W27 application.",
      anything_else: "We're applying to YC Winter 2027 batch — the MVP needs to be live with real users and revenue traction by October 2026. The product should feel premium and fast from day one. Our thesis: the next generation of PM tools won't be boards you update — they'll be AI systems that observe your team and keep the board accurate automatically.",
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
      setGenProg("Claude is writing 5 documents...");
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:16000,system:SYS,messages:[{role:"user",content:intake}]})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`);}
      const data=await r.json();const full=data.content.filter(i=>i.type==="text").map(i=>i.text).join("\n");
      const parts=full.split("---DOC_SEPARATOR---").map(p=>p.trim()).filter(Boolean);
      const dm={prd:"",appFlow:"",design:"",backend:"",security:""};const ks=["prd","appFlow","design","backend","security"];
      if(parts.length>=5)ks.forEach((k,i)=>{dm[k]=parts[i];});else{dm.prd=full;ks.slice(1).forEach(k=>{dm[k]="[⚠️] Use Copy to Clipboard.";});}
      setDocs({...dm,claudeMd:cMd,projectBrief:pB,prompts:pr,changeBrief:changeBrief||"No previous version to compare."});setGenProg("");
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
          <button onClick={()=>{setMode("avatar");setTimeout(loadTestData,100);}} style={{padding:"6px 16px",borderRadius:8,border:"1px dashed #f59e0b44",background:"transparent",color:"#f59e0b",cursor:"pointer",fontSize:12}}>🧪 Load test project (FlowBoard) to try it out</button>
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
        <button onClick={loadTestData} style={{padding:"3px 7px",borderRadius:4,border:"1px solid #334155",background:"#1e293b",color:"#f59e0b",cursor:"pointer",fontSize:10,fontWeight:500}} title="Fill form with sample FlowBoard project">🧪 Test</button>
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
          <div style={{display:"flex",gap:1,padding:"7px 14px",borderBottom:"1px solid #334155",overflowX:"auto",flexShrink:0}}>{DT.filter(d=>d.key!=="changeBrief"||changeBrief).map(d=><button key={d.key} onClick={()=>setActiveDoc(d.key)} style={{padding:"3px 7px",borderRadius:3,border:"none",fontSize:10,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?"#334155":"transparent",color:activeDoc===d.key?"#e2e8f0":d.key==="changeBrief"?"#f59e0b":"#94a3b8",cursor:"pointer"}}>{d.label}</button>)}</div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px 32px"}}><div style={{maxWidth:760,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div><h3 style={{fontSize:15,fontWeight:700,margin:0}}>{DT.find(d=>d.key===activeDoc)?.label}</h3><span style={{fontSize:10,color:"#64748b"}}>{DT.find(d=>d.key===activeDoc)?.file}</span></div>
              <button onClick={()=>cp(docs[activeDoc]||changeBrief||"",activeDoc)} style={{padding:"3px 10px",borderRadius:3,border:"1px solid #334155",background:copied[activeDoc]?"#22c55e22":"#1e293b",color:copied[activeDoc]?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:10}}>{copied[activeDoc]?"✓":"📋"}</button>
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
