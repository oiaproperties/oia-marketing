"use client";
import { useState, useEffect } from "react";
import { Search, PenTool } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "Dashboard" | "Chat" | "Tools" | "Tasks" | "Kanban" | "Calendar" | "Todo" | "Reports";
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type EventType = "task" | "deadline" | "meeting" | "publish";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  assignedBy: string;
  tags: string[];
  createdAt: number;
}

interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const PRIORITY_COLORS: Record<Priority, string> = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };
const EVENT_COLORS: Record<EventType, string> = { task: "#10B981", deadline: "#EF4444", meeting: "#8B5CF6", publish: "#3B82F6" };
const STATUS_COLS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "📋 To Do" },
  { id: "in_progress", label: "⚙️ In Progress" },
  { id: "review", label: "👀 Review" },
  { id: "done", label: "✅ Done" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TODAY = new Date();

const DEMO_TASKS: Task[] = [
  { id: "seo-d1", title: "Keyword research for Q3 campaign", description: "Target: Dubai luxury real estate, 20+ keywords", priority: "High", status: "in_progress", dueDate: "2026-05-30", assignedBy: "Admin", tags: ["keywords"], createdAt: Date.now() - 86400000 },
  { id: "seo-d2", title: "Optimise meta tags for all listing pages", description: "50+ property listing pages need updated meta", priority: "Medium", status: "todo", dueDate: "2026-06-05", assignedBy: "Admin", tags: ["meta", "on-page"], createdAt: Date.now() - 43200000 },
  { id: "seo-d3", title: "Competitor backlink gap analysis", description: "Compare vs top 3 Dubai real estate competitors", priority: "Low", status: "review", dueDate: "2026-05-28", assignedBy: "Admin", tags: ["backlinks"], createdAt: Date.now() - 172800000 },
];

const DEMO_TODOS: TodoItem[] = [
  { id: "t1", text: "Set up Google Search Console for oia.ae", done: false },
  { id: "t2", text: "Submit sitemap to Google and Bing", done: true },
  { id: "t3", text: "Add schema markup to property listing pages", done: false },
  { id: "t4", text: "Fix 404 errors found in last crawl", done: false },
  { id: "t5", text: "Review Core Web Vitals scores", done: false },
];

// ─── Hook: localStorage persistence ──────────────────────────────────────────
function useLocalState<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(init);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) { try { setVal(JSON.parse(saved)); } catch {} }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function save(v: T | ((prev: T) => T)) {
    setVal(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }
  return [val, save] as const;
}

// ─── SEO Tools Panel ─────────────────────────────────────────────────────────
function SEOToolsPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [kw, setKw] = useState({ keyword: "", location: "Dubai, UAE", intent: "all" });
  const [meta, setMeta] = useState({ pageTitle: "", targetKw: "", url: "" });
  const [metaResult, setMetaResult] = useState<{ title: string; desc: string } | null>(null);
  const [serpTool, setSerpTool] = useState({ title: "", desc: "", url: "" });
  const [analyzerContent, setAnalyzerContent] = useState("");
  const [analyzerKw, setAnalyzerKw] = useState("");
  const [score, setScore] = useState<{ score: number; words: number; density: string; issues: string[] } | null>(null);
  const [schemaType, setSchemaType] = useState("LocalBusiness");
  const [schemaFields, setSchemaFields] = useState({ name: "", url: "", address: "", phone: "" });
  const [schemaResult, setSchemaResult] = useState("");
  const [auditDomain, setAuditDomain] = useState("");
  const [rankKw, setRankKw] = useState("");
  const [rankDomain, setRankDomain] = useState("");
  const [competitor, setCompetitor] = useState({ my: "", theirs: "" });
  const [backlink, setBacklink] = useState("");

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const generateMeta = () => {
    const title = meta.pageTitle.slice(0, 60);
    const desc = `Explore ${meta.targetKw} at ${meta.url || "our website"}. Expert service, proven results. Contact us today.`.slice(0, 160);
    setMetaResult({ title, desc });
  };

  const analyzeContent = () => {
    const words = analyzerContent.trim().split(/\s+/).filter(Boolean).length;
    const kwCount = analyzerKw ? (analyzerContent.toLowerCase().match(new RegExp(analyzerKw.toLowerCase(), "g")) || []).length : 0;
    const density = words > 0 && analyzerKw ? ((kwCount / words) * 100).toFixed(1) : "0";
    const issues: string[] = [];
    if (words < 300) issues.push("Content too short (< 300 words)");
    if ((analyzerContent.match(/##/g) || []).length < 2) issues.push("Add H2 headings for structure");
    if (parseFloat(density) < 0.5 && analyzerKw) issues.push("Keyword density too low");
    if (parseFloat(density) > 3) issues.push("Keyword density too high — may seem spammy");
    const s = Math.min(100, 40 + (words > 300 ? 20 : 0) + ((analyzerContent.match(/##/g) || []).length >= 2 ? 15 : 0) + (parseFloat(density) >= 0.5 && parseFloat(density) <= 3 ? 25 : 0));
    setScore({ score: s, words, density, issues });
  };

  const generateSchema = () => {
    const obj: Record<string, unknown> = { "@context": "https://schema.org", "@type": schemaType, name: schemaFields.name, url: schemaFields.url };
    if (schemaType === "LocalBusiness") { obj.address = { "@type": "PostalAddress", streetAddress: schemaFields.address }; obj.telephone = schemaFields.phone; }
    setSchemaResult(JSON.stringify(obj, null, 2));
  };

  const tools = [
    { id: "kw", icon: "🔎", title: "Keyword Research", desc: "Find high-volume, low-competition keywords", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Seed keyword (e.g. luxury apartments Dubai)" value={kw.keyword} onChange={e => setKw(p => ({ ...p, keyword: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Location" value={kw.location} onChange={e => setKw(p => ({ ...p, location: e.target.value }))} />
          <select className="db-input" value={kw.intent} onChange={e => setKw(p => ({ ...p, intent: e.target.value }))}>
            <option value="all">All intents</option><option value="informational">Informational</option><option value="commercial">Commercial</option><option value="transactional">Transactional</option>
          </select>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!kw.keyword} onClick={() => onSendToChat(`Research keywords for "${kw.keyword}" in ${kw.location}. Include: 15 keyword variations, estimated monthly search volume, keyword difficulty (0–100 scale), CPC estimate, and search intent (${kw.intent}). Format as a table: Keyword | Volume | Difficulty | CPC | Intent.`)}>Research with AI →</button>
      </div>
    )},
    { id: "meta", icon: "🏷️", title: "Meta Tags Generator", desc: "Generate SEO-optimised title + description", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Page topic / title" value={meta.pageTitle} onChange={e => setMeta(p => ({ ...p, pageTitle: e.target.value }))} maxLength={70} />
        <input className="db-input" placeholder="Target keyword" value={meta.targetKw} onChange={e => setMeta(p => ({ ...p, targetKw: e.target.value }))} />
        <input className="db-input" placeholder="Page URL (optional)" value={meta.url} onChange={e => setMeta(p => ({ ...p, url: e.target.value }))} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, fontSize: 13 }} disabled={!meta.pageTitle} onClick={generateMeta}>Generate</button>
          <button className="btn-ghost" style={{ flex: 1, fontSize: 13 }} disabled={!meta.pageTitle} onClick={() => onSendToChat(`Generate 3 variations of SEO meta tags for page: "${meta.pageTitle}" targeting keyword "${meta.targetKw}". Each: title max 60 chars, description max 160 chars. Include target keyword naturally.`)}>3 via AI</button>
        </div>
        {metaResult && (
          <div className="db-card" style={{ background: "var(--surface-2)", padding: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Title ({metaResult.title.length}/60)</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#10B981", marginBottom: 8 }}>{`<title>${metaResult.title}</title>`}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Description ({metaResult.desc.length}/160)</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#10B981", marginBottom: 8 }}>{`<meta name="description" content="${metaResult.desc}" />`}</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => navigator.clipboard.writeText(`<title>${metaResult.title}</title>\n<meta name="description" content="${metaResult.desc}" />`)}>📋 Copy all</button>
          </div>
        )}
      </div>
    )},
    { id: "serp", icon: "🖥️", title: "SERP Preview", desc: "See how your page looks in Google", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Title ({serpTool.title.length}/60)</div>
          <input className="db-input" placeholder="Page title" value={serpTool.title} onChange={e => setSerpTool(p => ({ ...p, title: e.target.value }))} maxLength={60} />
        </div>
        <input className="db-input" placeholder="URL" value={serpTool.url} onChange={e => setSerpTool(p => ({ ...p, url: e.target.value }))} />
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Description ({serpTool.desc.length}/160)</div>
          <textarea className="db-input" rows={2} placeholder="Meta description" value={serpTool.desc} onChange={e => setSerpTool(p => ({ ...p, desc: e.target.value }))} maxLength={160} style={{ resize: "none", fontFamily: "inherit" }} />
        </div>
        {(serpTool.title || serpTool.url) && (
          <div className="db-card" style={{ background: "white", padding: 14 }}>
            <div style={{ fontSize: 12, color: "#006621", marginBottom: 2 }}>{serpTool.url || "https://oiaproperties.com/page"}</div>
            <div style={{ fontSize: 17, color: "#1a0dab", fontWeight: 500, marginBottom: 4, textDecoration: "underline" }}>{serpTool.title || "Your Page Title Here"}</div>
            <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5 }}>{serpTool.desc || "Your meta description will appear here. Make it compelling and include your target keyword within the first 160 characters."}</div>
          </div>
        )}
      </div>
    )},
    { id: "analyzer", icon: "📊", title: "Content SEO Analyser", desc: "Score content for SEO quality", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Target keyword (optional)" value={analyzerKw} onChange={e => setAnalyzerKw(e.target.value)} />
        <textarea className="db-input" rows={5} placeholder="Paste your content here..." value={analyzerContent} onChange={e => setAnalyzerContent(e.target.value)} style={{ resize: "vertical", fontFamily: "inherit" }} />
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!analyzerContent} onClick={analyzeContent}>Analyse Content</button>
        {score && (
          <div className="db-card" style={{ background: "var(--surface-2)", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: score.score >= 70 ? "#10B98120" : score.score >= 40 ? "#F59E0B20" : "#EF444420",
                border: `3px solid ${score.score >= 70 ? "#10B981" : score.score >= 40 ? "#F59E0B" : "#EF4444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: score.score >= 70 ? "#10B981" : score.score >= 40 ? "#F59E0B" : "#EF4444",
              }}>{score.score}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{score.score >= 70 ? "Good" : score.score >= 40 ? "Needs Work" : "Poor"} SEO Score</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{score.words} words · {score.density}% keyword density</div>
              </div>
            </div>
            {score.issues.map((issue, i) => (
              <div key={i} style={{ fontSize: 12, color: "#F59E0B", background: "#F59E0B10", padding: "5px 10px", borderRadius: 6, marginBottom: 4 }}>⚠️ {issue}</div>
            ))}
            {score.issues.length === 0 && <div style={{ fontSize: 12, color: "#10B981" }}>✅ All basic checks passed!</div>}
          </div>
        )}
      </div>
    )},
    { id: "schema", icon: "🧩", title: "Schema Generator", desc: "Generate JSON-LD structured data", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <select className="db-input" value={schemaType} onChange={e => setSchemaType(e.target.value)}>
          <option>LocalBusiness</option><option>RealEstateListing</option><option>Article</option><option>Organization</option><option>FAQPage</option>
        </select>
        <input className="db-input" placeholder="Name" value={schemaFields.name} onChange={e => setSchemaFields(p => ({ ...p, name: e.target.value }))} />
        <input className="db-input" placeholder="Website URL" value={schemaFields.url} onChange={e => setSchemaFields(p => ({ ...p, url: e.target.value }))} />
        {schemaType === "LocalBusiness" && <>
          <input className="db-input" placeholder="Address" value={schemaFields.address} onChange={e => setSchemaFields(p => ({ ...p, address: e.target.value }))} />
          <input className="db-input" placeholder="Phone" value={schemaFields.phone} onChange={e => setSchemaFields(p => ({ ...p, phone: e.target.value }))} />
        </>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, fontSize: 13 }} disabled={!schemaFields.name} onClick={generateSchema}>Generate JSON-LD</button>
          {schemaResult && <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => navigator.clipboard.writeText(`<script type="application/ld+json">\n${schemaResult}\n</script>`)}>📋 Copy</button>}
        </div>
        {schemaResult && <pre style={{ fontFamily: "monospace", fontSize: 11, background: "#1e1e1e", color: "#4ec9b0", padding: 12, borderRadius: 8, overflow: "auto" }}>{`<script type="application/ld+json">\n${schemaResult}\n</script>`}</pre>}
      </div>
    )},
    { id: "audit", icon: "🔬", title: "Site Audit", desc: "Technical SEO audit — errors, speed, structured data", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Domain (e.g. oiaproperties.com)" value={auditDomain} onChange={e => setAuditDomain(e.target.value)} />
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!auditDomain} onClick={() => onSendToChat(`Perform a comprehensive technical SEO audit for ${auditDomain}. Check: 1) Technical issues (broken links, redirects, canonicals, robots.txt, sitemap) 2) On-page SEO (titles, meta descriptions, heading structure, alt tags) 3) Core Web Vitals recommendations 4) Mobile usability 5) Internal linking 6) Schema markup opportunities. Prioritise all findings with severity and fix instructions.`)}>Run Audit via AI →</button>
      </div>
    )},
    { id: "rank", icon: "📈", title: "Rank Tracker", desc: "Check estimated ranking positions for keywords", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Your domain" value={rankDomain} onChange={e => setRankDomain(e.target.value)} />
        <textarea className="db-input" rows={3} placeholder="Keywords to track (one per line)" value={rankKw} onChange={e => setRankKw(e.target.value)} style={{ resize: "none", fontFamily: "inherit" }} />
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!rankDomain || !rankKw} onClick={() => onSendToChat(`For domain ${rankDomain}, estimate current ranking positions for:\n${rankKw}\n\nFor each keyword: estimated position, difficulty, search volume, and 3 specific actions to improve ranking. Format as a structured report.`)}>Analyse Rankings →</button>
      </div>
    )},
    { id: "competitor", icon: "🎯", title: "Competitor Analysis", desc: "Keyword gaps, backlinks, content strategy gaps", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Your domain" value={competitor.my} onChange={e => setCompetitor(p => ({ ...p, my: e.target.value }))} />
        <input className="db-input" placeholder="Competitor domain" value={competitor.theirs} onChange={e => setCompetitor(p => ({ ...p, theirs: e.target.value }))} />
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!competitor.theirs} onClick={() => onSendToChat(`SEO competitor analysis: ${competitor.my || "my site"} vs ${competitor.theirs}. Include: 1) Keyword gaps (competitor ranks for, I don't) 2) Content strategy differences 3) Backlink comparison 4) DA estimates 5) Their top-performing pages 6) 5 quick wins to outrank them this month.`)}>Analyse Competitor →</button>
      </div>
    )},
    { id: "backlinks", icon: "🔗", title: "Backlink Checker", desc: "Analyse backlink profile and link opportunities", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Domain to analyse" value={backlink} onChange={e => setBacklink(e.target.value)} />
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!backlink} onClick={() => onSendToChat(`Analyse backlink profile for ${backlink}. Provide: 1) Estimated DA and trust score 2) Link types (editorial, directory, social) 3) Top linking domains 4) Toxic patterns to watch 5) 10 specific link building opportunities in the UAE real estate niche 6) Anchor text diversity recommendations.`)}>Analyse Backlinks →</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="db-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="db-card-title">SEO Tools</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click a tool to expand. AI tools send directly to chat.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {tools.map(tool => (
          <div key={tool.id} className="db-card" style={{ padding: 0, overflow: "hidden" }}>
            <button onClick={() => toggle(tool.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>{tool.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{tool.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tool.desc}</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 18, flexShrink: 0 }}>{expanded === tool.id ? "−" : "+"}</span>
            </button>
            {expanded === tool.id && (
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ paddingTop: 14 }}>{tool.content}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tasks Panel ──────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useLocalState<Task[]>("oia_seo_tasks", DEMO_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" as Priority, dueDate: "", tags: "" });

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks(p => [...p, { id: makeId(), ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), status: "todo", assignedBy: "Admin", createdAt: Date.now() }]);
    setForm({ title: "", description: "", priority: "Medium", dueDate: "", tags: "" });
    setShowForm(false);
  };

  const updateStatus = (id: string, status: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="db-card-title">Tasks</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Assign tasks to the SEO Specialist</div>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ New Task"}</button>
      </div>

      {showForm && (
        <div className="db-card" style={{ marginBottom: 16 }}>
          <div className="db-card-title">Create Task</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="db-input" placeholder="Task title*" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <textarea className="db-input" rows={2} placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: "none", fontFamily: "inherit" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select className="db-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
              <input type="date" className="db-input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <input className="db-input" placeholder="Tags (keywords, on-page, technical...)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 13 }} disabled={!form.title} onClick={addTask}>Add Task</button>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.length === 0 && <div className="db-card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)", fontSize: 13 }}>No tasks yet. Create your first one above.</div>}
        {tasks.map(task => (
          <div key={task.id} className="db-card">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, color: PRIORITY_COLORS[task.priority], background: PRIORITY_COLORS[task.priority] + "20" }}>{task.priority}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 99 }}>{task.status.replace("_", " ")}</span>
                  {task.tags.map(tag => <span key={tag} style={{ fontSize: 11, color: "#10B981", background: "#10B98115", padding: "2px 8px", borderRadius: 99 }}>{tag}</span>)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{task.title}</div>
                {task.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{task.description}</div>}
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  {task.dueDate && <span>📅 {task.dueDate}</span>}
                  <span>👤 {task.assignedBy}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <select className="db-input" style={{ fontSize: 12, padding: "4px 8px" }} value={task.status} onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                </select>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, padding: 2 }} onClick={() => deleteTask(task.id)}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban Panel ─────────────────────────────────────────────────────────────
function KanbanPanel() {
  const [tasks, setTasks] = useLocalState<Task[]>("oia_seo_tasks", DEMO_TASKS);
  const moveTask = (id: string, status: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Kanban Board</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track tasks from To Do → Done</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, overflowX: "auto" }}>
        {STATUS_COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} style={{ background: "var(--surface-2)", borderRadius: 10, padding: 12, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)" }}>{col.label}</div>
                <span style={{ fontSize: 11, fontWeight: 700, background: "var(--surface)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 99 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {colTasks.map(task => (
                  <div key={task.id} className="db-card" style={{ padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLORS[task.priority], background: PRIORITY_COLORS[task.priority] + "20", padding: "1px 6px", borderRadius: 99 }}>{task.priority}</span>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, lineHeight: 1, padding: 0 }} onClick={() => deleteTask(task.id)}>×</button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>{task.title}</div>
                    {task.tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{task.tags.map(tag => <span key={tag} style={{ fontSize: 10, color: "#10B981", background: "#10B98115", padding: "1px 6px", borderRadius: 99 }}>{tag}</span>)}</div>}
                    {task.dueDate && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>📅 {task.dueDate}</div>}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {STATUS_COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} className="btn-ghost" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => moveTask(task.id, c.id)}>
                          {c.id === "done" ? "Done ✓" : c.id === "in_progress" ? "Start" : c.id === "todo" ? "← Back" : "Review"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar Panel ───────────────────────────────────────────────────────────
function CalendarPanel() {
  const [events, setEvents] = useLocalState<CalEvent[]>("oia_seo_events", []);
  const [cur, setCur] = useState({ year: TODAY.getFullYear(), month: TODAY.getMonth() });
  const [newEv, setNewEv] = useState({ title: "", date: "", type: "task" as EventType });
  const [showAdd, setShowAdd] = useState(false);

  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
  const firstDay = new Date(cur.year, cur.month, 1).getDay();

  const eventsForDay = (day: number) => {
    const d = `${cur.year}-${String(cur.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === d);
  };

  const addEvent = () => {
    if (newEv.title && newEv.date) {
      setEvents(p => [...p, { id: makeId(), ...newEv }]);
      setNewEv({ title: "", date: "", type: "task" });
      setShowAdd(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><div className="db-card-title">Calendar</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track deadlines, audits, and publishing dates</div></div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(v => !v)}>{showAdd ? "Cancel" : "+ Add Event"}</button>
      </div>

      {showAdd && (
        <div className="db-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <input className="db-input" placeholder="Event title" value={newEv.title} onChange={e => setNewEv(p => ({ ...p, title: e.target.value }))} />
            <input type="date" className="db-input" value={newEv.date} onChange={e => setNewEv(p => ({ ...p, date: e.target.value }))} />
            <select className="db-input" value={newEv.type} onChange={e => setNewEv(p => ({ ...p, type: e.target.value as EventType }))}>
              <option value="task">Task</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option><option value="publish">Publish</option>
            </select>
            <button className="btn-primary" style={{ fontSize: 13 }} disabled={!newEv.title || !newEv.date} onClick={addEvent}>Add</button>
          </div>
        </div>
      )}

      <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <button className="btn-ghost" style={{ fontSize: 18, padding: "2px 10px" }} onClick={() => setCur(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{MONTHS[cur.month]} {cur.year}</div>
          <button className="btn-ghost" style={{ fontSize: 18, padding: "2px 10px" }} onClick={() => setCur(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "8px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 80, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvs = eventsForDay(day);
            const isToday = cur.year === TODAY.getFullYear() && cur.month === TODAY.getMonth() && day === TODAY.getDate();
            return (
              <div key={day} style={{ minHeight: 80, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: 6, overflow: "hidden" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: isToday ? 800 : 500, marginBottom: 4,
                  background: isToday ? "#10B981" : "none",
                  color: isToday ? "#fff" : "var(--text)",
                }}>{day}</div>
                {dayEvs.map(ev => (
                  <div key={ev.id} onClick={() => setEvents(p => p.filter(e => e.id !== ev.id))} style={{
                    fontSize: 10, padding: "2px 5px", borderRadius: 4, marginBottom: 2, cursor: "pointer",
                    background: EVENT_COLORS[ev.type], color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} title="Click to remove">{ev.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>Click an event to remove it</div>
    </div>
  );
}

// ─── Todo Panel ───────────────────────────────────────────────────────────────
function TodoPanel() {
  const [todos, setTodos] = useLocalState<TodoItem[]>("oia_seo_todos", DEMO_TODOS);
  const [newText, setNewText] = useState("");
  const done = todos.filter(t => t.done).length;

  const addTodo = () => { if (newText.trim()) { setTodos(p => [...p, { id: makeId(), text: newText.trim(), done: false }]); setNewText(""); } };
  const toggle = (id: string) => setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id: string) => setTodos(p => p.filter(t => t.id !== id));

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div><div className="db-card-title">Todo List</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>{done}/{todos.length} completed</div></div>
      </div>
      {todos.length > 0 && (
        <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", background: "#10B981", width: `${(done / todos.length) * 100}%`, borderRadius: 99, transition: "width 0.3s" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="db-input" placeholder="Add a new todo..." value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()} />
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={addTodo}>Add</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {todos.filter(t => !t.done).map(todo => (
          <div key={todo.id} className="db-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <button onClick={() => toggle(todo.id)} style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid var(--border)", background: "none", cursor: "pointer", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{todo.text}</span>
            <button onClick={() => del(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>×</button>
          </div>
        ))}
        {todos.filter(t => t.done).length > 0 && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 0 4px" }}>Completed</div>
          {todos.filter(t => t.done).map(todo => (
            <div key={todo.id} className="db-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", opacity: 0.6 }}>
              <button onClick={() => toggle(todo.id)} style={{ width: 18, height: 18, borderRadius: 5, background: "#10B981", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>{todo.text}</span>
              <button onClick={() => del(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>×</button>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

// ─── Reports Panel ────────────────────────────────────────────────────────────
function ReportsPanel() {
  const [tasks] = useLocalState<Task[]>("oia_seo_tasks", DEMO_TASKS);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Reports & Analytics</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>SEO Specialist performance overview</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Tasks", value: total, icon: "📋", color: "#3B82F6" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: "✅", color: "#10B981" },
          { label: "In Progress", value: inProgress, icon: "⚙️", color: "#F59E0B" },
          { label: "Completed", value: done, icon: "🏆", color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="db-card">
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="db-card">
          <div className="db-card-title">Task Status Breakdown</div>
          {STATUS_COLS.map(col => {
            const count = tasks.filter(t => t.status === col.id).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={col.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text)" }}>{col.label}</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: col.id === "done" ? "#10B981" : col.id === "in_progress" ? "#3B82F6" : col.id === "review" ? "#F59E0B" : "#9CA3AF", width: `${pct}%`, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="db-card">
          <div className="db-card-title">SEO KPI Targets</div>
          {[
            { label: "Organic traffic / month", target: "10,000+", icon: "📈" },
            { label: "Keywords in top 10", target: "50 keywords", icon: "🎯" },
            { label: "Domain Authority", target: "DA 40+", icon: "🏆" },
            { label: "Page load speed (LCP)", target: "< 2.5s", icon: "⚡" },
            { label: "Backlinks built / month", target: "20+", icon: "🔗" },
          ].map(kpi => (
            <div key={kpi.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 16 }}>{kpi.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{kpi.label}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#10B981" }}>{kpi.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SEO Dashboard Panel ──────────────────────────────────────────────────────
function SEODashboard({ onGoToTab }: { onGoToTab: (t: Tab) => void }) {
  const [tasks] = useLocalState<Task[]>("oia_seo_tasks", DEMO_TASKS);
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const kpis = [
    { label: "Organic Traffic", value: "12,450", change: "+18%", icon: "📈", color: "#10B981" },
    { label: "Keywords Top 10", value: "34", change: "+6 this month", icon: "🎯", color: "#3B82F6" },
    { label: "Domain Authority", value: "DA 38", change: "Target: DA 40", icon: "🏆", color: "#8B5CF6" },
    { label: "Page Speed (LCP)", value: "2.1s", change: "Good ✅", icon: "⚡", color: "#F59E0B" },
  ];

  const rankings = [
    { keyword: "luxury apartments Dubai", pos: 4, vol: "8,100", change: "+2" },
    { keyword: "buy property Dubai expats", pos: 7, vol: "5,400", change: "+4" },
    { keyword: "Aldar Yas Acres review", pos: 2, vol: "2,900", change: "0" },
    { keyword: "Dubai real estate investment", pos: 11, vol: "12,000", change: "-1" },
    { keyword: "OIA properties Dubai", pos: 1, vol: "1,200", change: "0" },
  ];

  const auditIssues = [
    { severity: "high", issue: "14 pages missing meta descriptions", action: "Fix meta tags" },
    { severity: "medium", issue: "3 broken internal links detected", action: "Update links" },
    { severity: "medium", issue: "Image alt tags missing on 8 pages", action: "Add alt text" },
    { severity: "low", issue: "Sitemap not submitted to Bing", action: "Submit sitemap" },
  ];

  const SEV_COLORS: Record<string, string> = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} className="db-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{k.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Keyword Rankings */}
        <div className="db-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Keyword Rankings</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Tools")}>+ Research →</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Keyword","Pos","Volume","Δ"].map(h => <th key={h} style={{ textAlign: "left", padding: "4px 6px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rankings.map(r => (
                <tr key={r.keyword} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "7px 6px", color: "var(--text)", fontWeight: 500 }}>{r.keyword}</td>
                  <td style={{ padding: "7px 6px" }}>
                    <span style={{ fontWeight: 800, color: r.pos <= 3 ? "#10B981" : r.pos <= 10 ? "#F59E0B" : "#EF4444" }}>#{r.pos}</span>
                  </td>
                  <td style={{ padding: "7px 6px", color: "var(--text-muted)" }}>{r.vol}</td>
                  <td style={{ padding: "7px 6px", color: r.change.startsWith("+") ? "#10B981" : r.change.startsWith("-") ? "#EF4444" : "var(--text-muted)", fontWeight: 700 }}>{r.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Site audit */}
          <div className="db-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="db-card-title" style={{ margin: 0 }}>Site Audit Issues</div>
              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Tools")}>Run audit →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {auditIssues.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, background: SEV_COLORS[a.severity] + "10", border: `1px solid ${SEV_COLORS[a.severity]}30` }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLORS[a.severity], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{a.issue}</span>
                  <button className="btn-ghost" style={{ fontSize: 10, padding: "2px 7px", flexShrink: 0 }} onClick={() => onGoToTab("Chat")}>{a.action}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Task summary */}
          <div className="db-card">
            <div className="db-card-title">Task Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Open", value: openTasks, color: "#F59E0B" },
                { label: "Done", value: doneTasks, color: "#10B981" },
                { label: "Total", value: tasks.length, color: "#3B82F6" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", background: "var(--surface-2)", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ width: "100%", marginTop: 10, fontSize: 12 }} onClick={() => onGoToTab("Tasks")}>View all tasks →</button>
          </div>
        </div>
      </div>

      {/* SEO Health Metrics */}
      <div className="db-card">
        <div className="db-card-title">SEO Health Score</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "On-Page SEO", score: 78 },
            { label: "Technical SEO", score: 65 },
            { label: "Backlinks", score: 42 },
            { label: "Content Quality", score: 85 },
            { label: "Core Web Vitals", score: 91 },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle cx="30" cy="30" r="24" fill="none"
                    stroke={m.score >= 80 ? "#10B981" : m.score >= 60 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(m.score / 100) * 150.8} 150.8`}
                    transform="rotate(-90 30 30)" />
                </svg>
                <span style={{ position: "absolute", fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{m.score}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="db-card">
        <div className="db-card-title">Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "🔎 Keyword Research", tab: "Tools" as Tab },
            { label: "🏷️ Generate Meta Tags", tab: "Tools" as Tab },
            { label: "📊 Content Analyser", tab: "Tools" as Tab },
            { label: "📋 Add New Task", tab: "Tasks" as Tab },
            { label: "📅 Schedule Audit", tab: "Calendar" as Tab },
            { label: "💬 Ask SEO Agent", tab: "Chat" as Tab },
          ].map(a => (
            <button key={a.label} className="btn-ghost"
              style={{ textAlign: "left", fontSize: 13, padding: "10px 14px", fontWeight: 500 }}
              onClick={() => onGoToTab(a.tab)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS: Tab[] = ["Dashboard", "Chat", "Tools", "Tasks", "Kanban", "Calendar", "Todo", "Reports"];
const QUICK_ACTIONS = [
  "Research keywords for luxury real estate in Dubai",
  "Analyse oiaproperties.com homepage for SEO",
  "Generate meta tags for a property listing page",
  "Competitor SEO gap analysis vs propertyfinder.ae",
  "Score this content for SEO: [paste text]",
  "What schema markup should we add to property listing pages?",
];

export default function SEOSpecialistPage() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [autoSend, setAutoSend] = useState<string | undefined>();

  const handleSendToChat = (msg: string) => {
    setAutoSend(msg);
    setTab("Chat");
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">SEO Specialist</h1>
          <p className="db-page-sub">Search engine optimisation — keywords, meta tags, content scoring, audits & rank tracking</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : "btn-ghost"} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            {t === "Chat" && <Search size={13} />}
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && <SEODashboard onGoToTab={setTab} />}
      {tab === "Chat" && (
        <AgentChat
          agentId="seo"
          agentName="SEO Specialist"
          agentColor="#10B981"
          description="I research keywords, analyse page content, generate meta tags, score your content, audit sites, and track rankings for Dubai real estate."
          quickActions={QUICK_ACTIONS}
          icon={<Search size={18} color="#fff" />}
          autoSend={autoSend}
          onAutoSendDone={() => setAutoSend(undefined)}
        />
      )}
      {tab === "Tools" && <SEOToolsPanel onSendToChat={handleSendToChat} />}
      {tab === "Tasks" && <TasksPanel />}
      {tab === "Kanban" && <KanbanPanel />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Todo" && <TodoPanel />}
      {tab === "Reports" && <ReportsPanel />}
    </div>
  );
}
