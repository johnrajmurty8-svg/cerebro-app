# Change Brief: Claude API Proxy Route
## CEREBRO — Auto-Document Generation

**Purpose:** Enable CEREBRO to call the Claude API server-side so that documents generate and populate automatically inside the app — no copy-paste required.

**Scope:** 2 changes only. No other files touched.
1. Create a new API route file: `app/api/generate/route.ts`
2. Update one function in `Cerebro_Master_Code.jsx`: `handleGen`

---

## Why This Is Needed

The app currently calls `https://api.anthropic.com/v1/messages` directly from the browser. Browsers block this (CORS policy). The fix is a Next.js API route — a small server-side function that receives the request from the browser, calls Anthropic with the secret API key, and returns the result. The API key is stored as an environment variable and never exposed to the browser.

---

## Change 1 — Create API Route

**Create this new file:** `app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error?.error?.message || `API error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## Change 2 — Update handleGen in Cerebro_Master_Code.jsx

**Find this line** (around line 345) inside the `handleGen` function:

```javascript
const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:16000,system:SYS,messages:[{role:"user",content:intake}]})});
```

**Replace it with:**

```javascript
const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:SYS,messages:[{role:"user",content:intake}]})});
```

That is the only change to `Cerebro_Master_Code.jsx`. The URL changes from the external Anthropic URL to the local `/api/generate` route. The model and max_tokens are now set inside the route file.

---

## Change 3 — Create .env.local file

**Create this file** in the project root: `.env.local`

```
ANTHROPIC_API_KEY=your_api_key_here
```

> **Note to Claude Code:** Do NOT replace `your_api_key_here` with anything. Leave this placeholder. The user will fill in their real API key manually. Just create the file with the placeholder text.

---

## Verification Steps

After implementing, run `npm run build` to confirm there are no TypeScript errors.

Then tell the user:
1. The `.env.local` file has been created — they need to replace `your_api_key_here` with their real Anthropic API key
2. For local testing: restart the dev server after adding the key (`npm run dev`)
3. For Vercel: they need to add `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard

---

## What Does NOT Change

- The UI, tabs, intake form, versioning, diff engine — nothing changes visually
- The document structure and system prompt (SYS) — unchanged
- The results tab rendering — unchanged
- localStorage / window.storage — unchanged
- All other functions — unchanged

---

## Claude Code Prompt (paste this in)

```
Read the file CEREBRO_Change_Brief_APIProxy.md in this project folder.

This adds a server-side API proxy route so CEREBRO can call the Claude API 
without CORS errors. It is a 2-file change.

Create an update plan first — list every file you will create or modify and 
exactly what you will do to each one.

Do NOT write any code yet. Show me the plan and wait for my approval.
```
