# CEREBRO — Setup Guide
## Getting CEREBRO running locally with Claude Code

---

## Prerequisites (one-time setup)

Before you start, make sure you have these installed. If you already have VS Code and Claude Code working, skip to Step 1.

### You need:
1. **VS Code** — Download from https://code.visualstudio.com if you don't have it
2. **Claude Code extension** — You said you already have this installed ✅
3. **Node.js** — Download from https://nodejs.org (pick the LTS version, click through the installer)

### How to check if Node.js is installed:
- Open VS Code
- Open the terminal (menu: Terminal → New Terminal, or press Ctrl+`)
- Type `node --version` and press Enter
- If you see a version number (like `v20.x.x`), you're good
- If you see an error, install Node.js from the link above

---

## Step 1: Create a project folder

1. Create a new folder on your computer called `cerebro`
   - Windows: Right-click on Desktop → New → Folder → name it `cerebro`
   - Or create it anywhere you like

2. Open VS Code

3. Open that folder in VS Code
   - File → Open Folder → select the `cerebro` folder

---

## Step 2: Save the CEREBRO file

1. Download the `PRD_Intake_Form.jsx` file from this Claude conversation
   - Click the file attachment in the chat to download it

2. Put it inside your `cerebro` folder
   - You can drag it into the VS Code file explorer panel on the left

3. Rename it to `Cerebro.jsx` (optional, but cleaner)

---

## Step 3: Open Claude Code

Open the Claude Code panel in VS Code. You can do this by:
- Clicking the Claude Code icon in the left sidebar, OR
- Opening the terminal and typing `claude`

---

## Step 4: Give Claude Code the setup prompt

Copy and paste this ENTIRE prompt into Claude Code:

```
I have a React component file called PRD_Intake_Form.jsx (or Cerebro.jsx) in this folder. 
It's a complete single-file React app for generating product build packages.

Please do the following:
1. Initialize a new Next.js 14 project in this folder with TypeScript and Tailwind CSS
2. Set up the component as the main page (app/page.tsx)
3. The component uses useState, useEffect, useRef, useCallback from React
4. It uses window.storage which won't exist — replace all window.storage calls with localStorage instead:
   - window.storage.get(key) → JSON.parse(localStorage.getItem(key))
   - window.storage.set(key, value) → localStorage.setItem(key, JSON.stringify(value))  
   - window.storage.delete(key) → localStorage.removeItem(key)
5. It calls the Anthropic API at https://api.anthropic.com/v1/messages — for now, keep this but add a note that it may fail due to CORS on localhost. The Copy to Clipboard path is the primary flow.
6. Install all dependencies
7. Start the dev server

Do NOT ask me questions — just proceed with the setup and let me know when the dev server is running.
```

---

## Step 5: Wait for Claude Code to finish

Claude Code will:
- Create a Next.js project structure
- Install dependencies (this takes 1-2 minutes)
- Convert the component for Next.js
- Start the development server

When it's done, you'll see a message like:
```
▶ Ready on http://localhost:3000
```

---

## Step 6: Open CEREBRO in your browser

1. Open your web browser (Chrome recommended)
2. Go to `http://localhost:3000`
3. You should see the CEREBRO mode selector with Avatar State and Spirit Guide

---

## Step 7: Test it

1. Click the **🧪 Load test project** button on the mode selector screen
2. It will select Avatar State and fill all fields with the FlowBoard sample project
3. Navigate through the sections to see the filled data
4. Go to the last section and click **📋 Copy** to copy the formatted prompt
5. Paste it into a Claude chat to generate your 5 documents

---

## Troubleshooting

### "command not found: claude"
→ Claude Code isn't installed or not in your PATH. Reinstall from the Claude Code docs.

### "node: command not found"
→ Node.js isn't installed. Download from https://nodejs.org

### The page is blank
→ Check the terminal for errors. Claude Code may have hit an issue. Tell it: "There's an error. Please check the terminal output and fix it."

### API generation fails
→ This is expected on localhost (CORS). Use the **📋 Copy** button instead and paste into Claude chat or Claude Code.

### Port 3000 is already in use
→ Tell Claude Code: "Port 3000 is in use. Start on a different port."

---

## Daily Usage

### Starting CEREBRO
1. Open VS Code
2. Open the `cerebro` folder
3. Open terminal (Ctrl+`)
4. Type `npm run dev`
5. Go to http://localhost:3000

### Stopping CEREBRO
- Press `Ctrl+C` in the terminal

---

## What's Next After Setup

Once CEREBRO is running:

1. **Fill the intake form** (or use test data)
2. **Copy the prompt** and paste into Claude to generate your 5 documents
3. **Save the documents** as .md files in your project folder
4. **Follow the Build Plan tab** — paste session prompts into Claude Code
5. **After V1 is built**, come back to CEREBRO, edit answers, and use the **Versions tab** for iteration

---

*This guide was generated alongside CEREBRO. Keep it as a reference.*
