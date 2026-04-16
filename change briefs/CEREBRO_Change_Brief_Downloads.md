# Change Brief: Document Download Feature
## CEREBRO — .md and .docx Export

**Purpose:** Add the ability to download each generated document in both `.md` (Markdown) and `.docx` (Word) format. Includes per-document download buttons and a "Download All" option.

**Scope:** 2 changes only.
1. Add a `downloadDoc` helper function and a `downloadAll` function to `Cerebro_Master_Code.jsx`
2. Update the Results tab header row and doc tab bar in `Cerebro_Master_Code.jsx` to include download buttons

No new files. No other sections touched.

---

## Background: How Downloads Work in the Browser

**.md files** — trivial. Create a Blob from the text string, generate a temporary URL, click it programmatically. No libraries needed.

**.docx files** — requires a library to build the Word XML format. Use `docx` (npm package). Load it via CDN using a dynamic import so it doesn't bloat the initial bundle. The docx will be branded: dark slate header bar with CEREBRO branding, product name, document title, and generation date — then clean body content.

---

## Change 1 — Install docx package

In the terminal, run:
```
npm install docx
```

Then commit the updated `package.json` and `package-lock.json`.

---

## Change 2 — Add download functions to Cerebro_Master_Code.jsx

Add these two functions inside the `Cerebro` component, placed just after the `cp` function (around line 220). Do not modify `cp` itself.

### 2a — downloadMd function

```javascript
const downloadMd = (key) => {
  const content = key === "changeBrief" ? changeBrief : docs?.[key];
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
```

### 2b — downloadDocx function

```javascript
const downloadDocx = async (key) => {
  const content = key === "changeBrief" ? changeBrief : docs?.[key];
  if (!content) return;
  const dtEntry = DT.find(d => d.key === key);
  const fileName = dtEntry?.file?.replace(".md", ".docx") || `${key}.docx`;
  const docTitle = dtEntry?.label?.replace(/^[^\w]+/, "").trim() || key;
  const productName = ans?.product_name || "CEREBRO Project";

  try {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle
    } = await import("docx");

    // Parse markdown content into docx paragraphs
    const lines = content.split("\n");
    const bodyChildren = [];

    for (const line of lines) {
      if (line.startsWith("### ")) {
        bodyChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: line.slice(4), bold: true, color: "4A90D9", size: 24 })]
        }));
      } else if (line.startsWith("## ")) {
        bodyChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line.slice(3), bold: true, color: "60A5FA", size: 28 })]
        }));
      } else if (line.startsWith("# ")) {
        bodyChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: line.slice(2), bold: true, color: "93C5FD", size: 32 })]
        }));
      } else if (line.match(/^[-*]\s/)) {
        bodyChildren.push(new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: line.slice(2), size: 22, color: "CBD5E1" })]
        }));
      } else if (line.match(/^---+$/)) {
        bodyChildren.push(new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "334155", space: 1 } },
          children: [new TextRun("")]
        }));
      } else if (!line.trim()) {
        bodyChildren.push(new Paragraph({ children: [new TextRun("")] }));
      } else {
        // Handle inline bold (**text**)
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const runs = parts.map(p =>
          p.startsWith("**") && p.endsWith("**")
            ? new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: "E2E8F0" })
            : new TextRun({ text: p, size: 22, color: "CBD5E1" })
        );
        bodyChildren.push(new Paragraph({ children: runs }));
      }
    }

    // Branded header table
    const headerTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 9360, type: WidthType.DXA },
              shading: { fill: "0F172A", type: ShadingType.CLEAR },
              margins: { top: 200, bottom: 200, left: 300, right: 300 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "3B82F6" },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ text: "🧠 CEREBRO", bold: true, size: 28, color: "3B82F6", font: "Arial" }),
                    new TextRun({ text: "  ·  Master Build Package Generator", size: 20, color: "64748B", font: "Arial" }),
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ text: productName, bold: true, size: 24, color: "E2E8F0", font: "Arial" }),
                    new TextRun({ text: `  ·  ${docTitle}`, size: 20, color: "94A3B8", font: "Arial" }),
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                      size: 18, color: "475569", font: "Arial", italics: true
                    })
                  ]
                }),
              ]
            })
          ]
        })
      ]
    });

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Arial", size: 22, color: "CBD5E1" } }
        }
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: [
          headerTable,
          new Paragraph({ children: [new TextRun("")] }),
          ...bodyChildren
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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
```

### 2c — downloadAll function

```javascript
const downloadAll = async () => {
  if (!docs) return;
  const exportKeys = DT.filter(d => d.key !== "changeBrief").map(d => d.key);
  for (const key of exportKeys) {
    await downloadMd(key);
    await new Promise(r => setTimeout(r, 150)); // small delay between downloads
  }
};
```

---

## Change 3 — Update the Results tab UI

### 3a — Replace the per-document header row

**Find this block** (around line 491-494) inside the Results tab:

```javascript
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
  <div><h3 style={{fontSize:15,fontWeight:700,margin:0}}>{DT.find(d=>d.key===activeDoc)?.label}</h3><span style={{fontSize:10,color:"#64748b"}}>{DT.find(d=>d.key===activeDoc)?.file}</span></div>
  <button onClick={()=>cp(docs[activeDoc]||changeBrief||"",activeDoc)} style={{padding:"3px 10px",borderRadius:3,border:"1px solid #334155",background:copied[activeDoc]?"#22c55e22":"#1e293b",color:copied[activeDoc]?"#22c55e":"#94a3b8",cursor:"pointer",fontSize:10}}>{copied[activeDoc]?"✓":"📋"}</button>
</div>
```

**Replace with:**

```javascript
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
```

### 3b — Add Download All button

**Find this block** — the document tab bar line (around line 489):

```javascript
<div style={{display:"flex",gap:1,padding:"7px 14px",borderBottom:"1px solid #334155",overflowX:"auto",flexShrink:0}}>{DT.filter(d=>d.key!=="changeBrief"||changeBrief).map(d=><button key={d.key} onClick={()=>setActiveDoc(d.key)} style={{padding:"3px 7px",borderRadius:3,border:"none",fontSize:10,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?"#334155":"transparent",color:activeDoc===d.key?"#e2e8f0":d.key==="changeBrief"?"#f59e0b":"#94a3b8",cursor:"pointer"}}>{d.label}</button>)}</div>
```

**Replace with:**

```javascript
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",borderBottom:"1px solid #334155",flexShrink:0,flexWrap:"wrap",gap:4}}>
  <div style={{display:"flex",gap:1,overflowX:"auto"}}>{DT.filter(d=>d.key!=="changeBrief"||changeBrief).map(d=><button key={d.key} onClick={()=>setActiveDoc(d.key)} style={{padding:"3px 7px",borderRadius:3,border:"none",fontSize:10,fontWeight:activeDoc===d.key?600:400,whiteSpace:"nowrap",background:activeDoc===d.key?"#334155":"transparent",color:activeDoc===d.key?"#e2e8f0":d.key==="changeBrief"?"#f59e0b":"#94a3b8",cursor:"pointer"}}>{d.label}</button>)}</div>
  <button onClick={downloadAll} style={{padding:"3px 12px",borderRadius:4,border:"1px solid #22c55e44",background:"#22c55e11",color:"#4ade80",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>⬇ Download All (.md)</button>
</div>
```

---

## Verification

After implementing, run `npm run build` to confirm no TypeScript errors.

Then test locally:
1. Generate documents using the FlowBoard test data
2. Go to the Results tab — confirm the tab bar now has a "Download All" button on the right
3. Confirm each document view has Copy / ⬇ .md / ⬇ .docx buttons
4. Click ⬇ .md on a document — confirm it downloads a `.md` file
5. Click ⬇ .docx on a document — confirm it downloads a `.docx` file with the branded CEREBRO header
6. Click Download All — confirm all 8 `.md` files download in sequence

---

## What Does NOT Change

- Intake form, versioning, diff engine, workflow tab — untouched
- The Copy button — still present, just joined by two download buttons
- The API route — untouched
- localStorage / window.storage — untouched
- All other functions — untouched

---

## Claude Code Prompt (paste this in)

```
Read the file CEREBRO_Change_Brief_Downloads.md in this project folder.

This adds .md and .docx download buttons to the Results tab — per-document 
and a Download All option. It touches only Cerebro_Master_Code.jsx and 
requires installing the docx npm package.

Create an update plan first — list every file you will create or modify and 
exactly what you will do to each one.

Do NOT write any code yet. Show me the plan and wait for my approval.
```
