/**
 * ai-agent.js  (Netflixallrated ke liye tailored version)
 *
 * Kaam:
 *   1. queue.json check karta hai (jo server.ts ke /api/report-error se bharta hai)
 *   2. Har pending error ke liye sahi .tsx/.ts file dhundhta hai:
 *      - Pehle componentName field use karta hai (ErrorBoundary se aata hai) — most reliable
 *      - Nahi mile to stack trace se filename guess karta hai
 *   3. Claude se fix generate karwata hai
 *   4. SAFE fix → seedha main branch pe commit+push (auto-deploy trigger hoga)
 *      RISKY fix → alag branch pe push, khud merge nahi karta
 *
 * Install (project root mein, jahan package.json hai):
 *   npm install @anthropic-ai/sdk simple-git dotenv
 *
 * .env mein add karo:
 *   ANTHROPIC_API_KEY=xxxx
 *
 * Run:
 *   node ai-agent.js
 *   (ya pm2 se har 1-2 min mein cron karo — README mein tareeka hai)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const simpleGit = require("simple-git");

const REPO_PATH = __dirname; // isi project ke root mein rakhna, agar alag jagah rakha hai to path change karo
const QUEUE_FILE = path.join(REPO_PATH, "queue.json");
const SRC_DIR = path.join(REPO_PATH, "src");
const AUTO_DEPLOY_BRANCH = "main";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const git = simpleGit(REPO_PATH);

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// src/ ke andar sabhi .ts/.tsx files ki list (recursive)
function getAllSourceFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function findFileForError(errorItem) {
  const allFiles = getAllSourceFiles(SRC_DIR);

  // 1. Sabse reliable: componentName (ErrorBoundary se aata hai, jaise "HeroBanner")
  if (errorItem.componentName) {
    const match = allFiles.find(
      (f) => path.basename(f, path.extname(f)).toLowerCase() === errorItem.componentName.toLowerCase()
    );
    if (match) return match;
  }

  // 2. Stack trace mein file name dhundo (jaise "HeroBanner.tsx:42")
  if (errorItem.stack) {
    for (const file of allFiles) {
      const base = path.basename(file);
      if (errorItem.stack.includes(base)) return file;
    }
  }

  // 3. Error message mein kisi component/function ka naam mile to try karo
  for (const file of allFiles) {
    const base = path.basename(file, path.extname(file));
    if (errorItem.message && errorItem.message.includes(base)) return file;
  }

  return null;
}

async function askClaudeForFix(errorItem, fileContent, filePath) {
  const prompt = `
Tum ek senior React/TypeScript developer ho. Neeche ek production error diya gaya hai
aur uski file ka content. Ye ek Vite + React 19 + TypeScript + Express project hai.

Tumhara kaam:
1. Root cause batao (1-2 line mein)
2. Fix ka poora updated file content do (poori file, sirf diff nahi)
3. Batao ye fix "SAFE" hai (chhota, low-risk: typo, null-check, CSS/styling,
   missing import, undefined check) ya "RISKY" hai (auth, Supabase queries,
   payment, ya koi business logic jo data corrupt kar sakti hai)

STRICT JSON format mein jawab do, koi aur text mat likho, koi markdown fences mat lagao:
{
  "root_cause": "...",
  "risk_level": "SAFE" | "RISKY",
  "fixed_code": "... (poora file content, escaped)",
  "explanation": "..."
}

ERROR DETAILS:
Type: ${errorItem.type}
Message: ${errorItem.message}
Component: ${errorItem.componentName || "unknown"}
Stack: ${errorItem.stack || "N/A"}
Page URL: ${errorItem.url}

FILE (${path.relative(REPO_PATH, filePath)}):
\`\`\`tsx
${fileContent}
\`\`\`
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.map((b) => b.text || "").join("\n");
  const cleaned = text.replace(/```json|```tsx|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function processError(errorItem, queue) {
  console.log("🔎 Processing:", errorItem.message);
  errorItem.status = "fixing";
  saveQueue(queue);

  const filePath = findFileForError(errorItem);

  if (!filePath) {
    console.log("❌ Source file nahi mili:", errorItem.message);
    errorItem.status = "needs-review";
    errorItem.note = "Auto-detect fail hui. Manually check karo ki kaunsi file mein bug hai.";
    saveQueue(queue);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");

  let result;
  try {
    result = await askClaudeForFix(errorItem, fileContent, filePath);
  } catch (e) {
    console.error("Claude API error:", e.message);
    errorItem.status = "needs-review";
    errorItem.note = "AI fix generate nahi ho paaya: " + e.message;
    saveQueue(queue);
    return;
  }

  fs.writeFileSync(filePath, result.fixed_code, "utf-8");

  try {
    if (result.risk_level === "SAFE") {
      await git.add(filePath);
      await git.commit(`fix: auto-fix "${errorItem.message}" [agent]\n\n${result.explanation}`);
      await git.push("origin", AUTO_DEPLOY_BRANCH);
      errorItem.status = "fixed";
      errorItem.note = result.explanation;
      console.log("✅ Auto-deployed fix:", errorItem.message);
    } else {
      const branchName = `agent-fix-${errorItem.id}`;
      await git.checkoutLocalBranch(branchName);
      await git.add(filePath);
      await git.commit(`fix: proposed fix "${errorItem.message}" [needs review]`);
      await git.push("origin", branchName);
      await git.checkout(AUTO_DEPLOY_BRANCH);
      errorItem.status = "needs-review";
      errorItem.note = `Risky fix — branch "${branchName}" pe push kiya. PR bana ke review karo.`;
      console.log("⚠️  Risky fix pushed to branch:", branchName);
    }
  } catch (gitError) {
    console.error("Git error:", gitError.message);
    errorItem.status = "needs-review";
    errorItem.note = "Fix ban gaya par git push fail hua: " + gitError.message;
  }

  saveQueue(queue);
}

async function runAgentLoop() {
  const queue = loadQueue();
  const pending = queue.filter((item) => item.status === "pending");

  if (pending.length === 0) {
    console.log("✔️  No pending errors.");
    return;
  }

  for (const item of pending) {
    await processError(item, queue);
  }
}

runAgentLoop();
