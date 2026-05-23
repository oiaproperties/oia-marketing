"use client";
import React, { useState, useEffect } from "react";
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

interface ReportHistoryItem {
  id: string;
  type: string;
  date: string;
  status: "completed" | "generating" | "failed";
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
const G = "#10B981"; // brand green

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

const DEMO_REPORT_HISTORY: ReportHistoryItem[] = [
  { id: "r1", type: "Monthly Organic Traffic Report", date: "2026-05-01", status: "completed" },
  { id: "r2", type: "Keyword Ranking Report", date: "2026-04-28", status: "completed" },
  { id: "r3", type: "Technical Audit Report", date: "2026-04-15", status: "completed" },
  { id: "r4", type: "Weekly SEO Report", date: "2026-04-07", status: "completed" },
  { id: "r5", type: "Backlink Report", date: "2026-04-01", status: "completed" },
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

// ─── SEO Dashboard Panel ──────────────────────────────────────────────────────
function SEODashboard({ onGoToTab }: { onGoToTab: (t: Tab) => void }) {
  const [tasks] = useLocalState<Task[]>("oia_seo_tasks", DEMO_TASKS);
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const kpis = [
    { label: "Organic Traffic", value: "12,450", sub: "/mo", change: "+18%", changeUp: true, icon: "📈", color: G },
    { label: "Keywords Top 10", value: "34", sub: " kw", change: "+8 this month", changeUp: true, icon: "🎯", color: "#3B82F6" },
    { label: "Domain Authority", value: "DA 38", sub: "", change: "+2 pts", changeUp: true, icon: "🏆", color: "#8B5CF6" },
    { label: "Avg Position", value: "14.2", sub: "", change: "-3.1 improved", changeUp: true, icon: "📊", color: "#F59E0B" },
    { label: "Page Speed Score", value: "91", sub: "/100", change: "Excellent ✅", changeUp: true, icon: "⚡", color: "#06B6D4" },
    { label: "Backlinks", value: "1,840", sub: "", change: "+120 this month", changeUp: true, icon: "🔗", color: "#EC4899" },
  ];

  const keywords = [
    { keyword: "luxury apartments Dubai", pos: 8, vol: "8,100", diff: 72, change: "+3", serp: "PAA", priority: "High" },
    { keyword: "buy apartment Dubai", pos: 12, vol: "6,600", diff: 68, change: "+2", serp: "None", priority: "High" },
    { keyword: "Aldar Yas Acres", pos: 3, vol: "2,400", diff: 31, change: "+1", serp: "Featured Snippet", priority: "Medium" },
    { keyword: "Dubai real estate investment 2025", pos: 18, vol: "3,600", diff: 58, change: "-2", serp: "PAA", priority: "High" },
    { keyword: "OIA properties Dubai", pos: 2, vol: "480", diff: 18, change: "0", serp: "None", priority: "Low" },
    { keyword: "off-plan apartments Dubai", pos: 24, vol: "4,400", diff: 65, change: "+5", serp: "None", priority: "High" },
    { keyword: "Dubai Marina apartments for sale", pos: 9, vol: "3,200", diff: 61, change: "+4", serp: "PAA", priority: "Medium" },
    { keyword: "buy villa in Dubai", pos: 15, vol: "2,900", diff: 55, change: "-1", serp: "None", priority: "Medium" },
    { keyword: "UAE property investment guide", pos: 11, vol: "1,800", diff: 44, change: "+6", serp: "Featured Snippet", priority: "Medium" },
    { keyword: "Dubai real estate ROI 2025", pos: 22, vol: "2,100", diff: 50, change: "+3", serp: "PAA", priority: "High" },
  ];

  const technicalChecks = [
    { label: "LCP", value: "2.1s", status: "ok", icon: "✅" },
    { label: "FID", value: "45ms", status: "ok", icon: "✅" },
    { label: "CLS", value: "0.08", status: "ok", icon: "✅" },
    { label: "Mobile-Friendly", value: "Yes", status: "ok", icon: "✅" },
    { label: "HTTPS", value: "Enabled", status: "ok", icon: "✅" },
    { label: "Sitemap", value: "Submitted", status: "ok", icon: "✅" },
    { label: "Robots.txt", value: "Valid", status: "ok", icon: "✅" },
    { label: "Schema Markup", value: "Partial", status: "warn", icon: "⚠️" },
    { label: "Broken Links", value: "3 found", status: "warn", icon: "⚠️" },
    { label: "Duplicate Meta", value: "5 pages", status: "error", icon: "❌" },
  ];

  const contentOpportunities = [
    { topic: "Dubai off-plan property ROI calculator", compRank: "propertyfinder.ae #2", volume: "1,900/mo", gap: "Not ranking" },
    { topic: "RERA regulations UAE 2025", compRank: "bayut.com #4", volume: "2,400/mo", gap: "Not ranking" },
    { topic: "Best areas to invest in Dubai 2025", compRank: "propertyfinder.ae #1", volume: "5,400/mo", gap: "Page 3 (pos 28)" },
    { topic: "Dubai property visa golden visa guide", compRank: "dubaiproperties.ae #3", volume: "3,100/mo", gap: "Not ranking" },
    { topic: "Furnished vs unfurnished apartments Dubai", compRank: "bayut.com #5", volume: "890/mo", gap: "Not ranking" },
  ];

  const topReferringDomains = [
    { domain: "gulf.news", da: 71, links: 18, type: "Editorial" },
    { domain: "propertywire.com", da: 58, links: 12, type: "Industry" },
    { domain: "arabianbusiness.com", da: 66, links: 9, type: "News" },
    { domain: "zawya.com", da: 55, links: 7, type: "News" },
    { domain: "dubaipropertymarket.com", da: 38, links: 14, type: "Directory" },
  ];

  const STATUS_COLOR: Record<string, string> = { ok: G, warn: "#F59E0B", error: "#EF4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 6 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} className="db-card" style={{ borderTop: `3px solid ${k.color}`, padding: "14px 14px 12px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: k.color, lineHeight: 1 }}>
              {k.value}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>{k.sub}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: k.changeUp ? G : "#EF4444", marginTop: 3, fontWeight: 600 }}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* Keyword Tracker Table */}
      <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 12px" }}>
          <div>
            <div className="db-card-title" style={{ margin: 0 }}>Keyword Tracker</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Tracking 10 target keywords for OIA Properties — Dubai real estate</div>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => onGoToTab("Tools")}>+ Add Keywords →</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border)" }}>
                {["Keyword", "Position", "Vol/mo", "Difficulty", "Change", "SERP Feature", "Priority"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 14px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keywords.map((r, i) => {
                const posColor = r.pos <= 3 ? G : r.pos <= 10 ? "#F59E0B" : "#EF4444";
                const changeColor = r.change.startsWith("+") ? G : r.change.startsWith("-") ? "#EF4444" : "var(--text-muted)";
                const changeIcon = r.change.startsWith("+") ? "↑" : r.change.startsWith("-") ? "↓" : "→";
                const diffColor = r.diff >= 70 ? "#EF4444" : r.diff >= 50 ? "#F59E0B" : G;
                const serpBg = r.serp === "Featured Snippet" ? "#10B98115" : r.serp === "PAA" ? "#3B82F615" : "var(--surface-2)";
                const serpColor = r.serp === "Featured Snippet" ? G : r.serp === "PAA" ? "#3B82F6" : "var(--text-muted)";
                const prioColor = r.priority === "High" ? "#EF4444" : r.priority === "Medium" ? "#F59E0B" : G;
                return (
                  <tr key={r.keyword} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-2)" }}>
                    <td style={{ padding: "9px 14px", color: "var(--text)", fontWeight: 600 }}>{r.keyword}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: posColor }}>#{r.pos}</span>
                    </td>
                    <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontWeight: 500 }}>{r.vol}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 99, maxWidth: 60, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${r.diff}%`, background: diffColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ color: diffColor, fontWeight: 700, fontSize: 11 }}>{r.diff}</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ color: changeColor, fontWeight: 700 }}>{changeIcon} {r.change.replace(/[+\-]/, "")}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: serpColor, background: serpBg, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>{r.serp}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: prioColor, background: prioColor + "18", padding: "2px 8px", borderRadius: 99 }}>{r.priority}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical SEO Health + Content Opportunities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Technical SEO Health */}
        <div className="db-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Technical SEO Health</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Tools")}>Run Audit →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {technicalChecks.map(c => (
              <div key={c.label} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
                background: c.status === "ok" ? G + "10" : c.status === "warn" ? "#F59E0B10" : "#EF444410",
                border: `1px solid ${STATUS_COLOR[c.status]}25`,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{c.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: STATUS_COLOR[c.status], fontWeight: 600 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Opportunities */}
        <div className="db-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Content Opportunities</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Chat")}>Analyse →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contentOpportunities.map((op, i) => (
              <div key={i} style={{ padding: "9px 12px", background: "var(--surface-2)", borderRadius: 8, borderLeft: `3px solid ${G}` }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", marginBottom: 4 }}>{op.topic}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Competitor: <strong style={{ color: "#3B82F6" }}>{op.compRank}</strong></span>
                  <span style={{ fontSize: 10, color: G, fontWeight: 600 }}>{op.volume}</span>
                  <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>You: {op.gap}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backlink Profile + Task Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Backlink Profile */}
        <div className="db-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Backlink Profile</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, background: "#EF444415", padding: "2px 8px", borderRadius: 99 }}>⚠️ 4 toxic links</span>
              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Tools")}>Details →</button>
            </div>
          </div>
          {/* DA Distribution bars */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>DA Distribution</div>
            {[
              { range: "DA 60+", count: 8, pct: 16 },
              { range: "DA 40–59", count: 22, pct: 44 },
              { range: "DA 20–39", count: 15, pct: 30 },
              { range: "DA 1–19", count: 5, pct: 10 },
            ].map(d => (
              <div key={d.range} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{d.range}</span>
                  <span style={{ color: "var(--text-muted)" }}>{d.count} domains ({d.pct}%)</span>
                </div>
                <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: G, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Referring Domains</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {topReferringDomains.map(d => (
              <div key={d.domain} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: G, background: G + "15", padding: "1px 7px", borderRadius: 99, flexShrink: 0 }}>DA {d.da}</span>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{d.domain}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.links} links</span>
                <span style={{ fontSize: 10, color: "#3B82F6", background: "#3B82F615", padding: "1px 6px", borderRadius: 99 }}>{d.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Overview + Quick Actions stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="db-card">
            <div className="db-card-title">Task Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Open", value: openTasks, color: "#F59E0B" },
                { label: "Done", value: doneTasks, color: G },
                { label: "Total", value: tasks.length, color: "#3B82F6" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", background: "var(--surface-2)", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => onGoToTab("Tasks")}>View all tasks →</button>
          </div>

          <div className="db-card">
            <div className="db-card-title">Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[
                { label: "🔎 Keyword Research", tab: "Tools" as Tab },
                { label: "🏷️ SERP Optimizer", tab: "Tools" as Tab },
                { label: "🌐 Site Audit", tab: "Tools" as Tab },
                { label: "📊 Content Cluster", tab: "Tools" as Tab },
                { label: "📅 Schedule Audit", tab: "Calendar" as Tab },
                { label: "💬 Ask SEO Agent", tab: "Chat" as Tab },
                { label: "📋 New Task", tab: "Tasks" as Tab },
                { label: "📈 View Reports", tab: "Reports" as Tab },
              ].map(a => (
                <button key={a.label} className="btn-ghost"
                  style={{ textAlign: "left", fontSize: 12, padding: "8px 12px", fontWeight: 500 }}
                  onClick={() => onGoToTab(a.tab)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SEO Tools Panel ─────────────────────────────────────────────────────────
function SEOToolsPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // New tool states
  const [bulkKw, setBulkKw] = useState({ keywords: "", intent: "commercial" });
  const [siteAudit, setSiteAudit] = useState({ url: "", type: "Full" });
  const [serpOpt, setSerpOpt] = useState({ url: "", title: "", meta: "", targetKw: "" });
  const [compGap, setCompGap] = useState({ myDomain: "", comp1: "", comp2: "" });
  const [cluster, setCluster] = useState({ pillar: "", pages: "10" });
  const [schemaAI, setSchemaAI] = useState({ pageType: "Property Listing", content: "" });

  // Existing tool states
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

  const newTools = [
    {
      id: "bulk-kw", icon: "🔎", title: "Bulk Keyword Research", desc: "Paste up to 50 keywords — get volume, difficulty & intent analysis",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Paste up to 50 keywords (one per line)</div>
          <textarea className="db-input" rows={6} placeholder={"luxury apartments Dubai\nbuy villa Dubai\noff-plan property UAE\nDubai real estate investment 2025\n..."} value={bulkKw.keywords} onChange={e => setBulkKw(p => ({ ...p, keywords: e.target.value }))} style={{ resize: "vertical", fontFamily: "inherit" }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Select primary intent</div>
            <select className="db-input" value={bulkKw.intent} onChange={e => setBulkKw(p => ({ ...p, intent: e.target.value }))}>
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="navigational">Navigational</option>
              <option value="transactional">Transactional</option>
            </select>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!bulkKw.keywords.trim()} onClick={() => onSendToChat(
            `You are a senior SEO strategist for OIA Properties — a luxury UAE real estate company.\n\nPerform bulk keyword research for these keywords:\n${bulkKw.keywords}\n\nFor each keyword provide:\n1. Estimated monthly search volume (Dubai/UAE market)\n2. Keyword difficulty score (0–100)\n3. CPC estimate (USD)\n4. Search intent (${bulkKw.intent})\n5. SERP features present (Featured Snippet, PAA, Local Pack, etc.)\n6. Recommended page type to target it\n7. Opportunity score (1–10) for OIA Properties\n\nFormat as a detailed markdown table. After the table, provide your top 5 keyword recommendations with rationale.`
          )}>Run Bulk Research with AI →</button>
        </div>
      )
    },
    {
      id: "site-audit-runner", icon: "🔬", title: "Site Audit Runner", desc: "Full technical, content or speed audit — structured AI findings",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="URL to audit (e.g. https://oiaproperties.com)" value={siteAudit.url} onChange={e => setSiteAudit(p => ({ ...p, url: e.target.value }))} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Audit type</div>
            <select className="db-input" value={siteAudit.type} onChange={e => setSiteAudit(p => ({ ...p, type: e.target.value }))}>
              <option value="Technical">Technical SEO</option>
              <option value="Content">Content Quality</option>
              <option value="Speed">Page Speed & CWV</option>
              <option value="Full">Full Audit (All)</option>
            </select>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!siteAudit.url.trim()} onClick={() => onSendToChat(
            `You are a senior technical SEO specialist auditing a UAE luxury real estate website.\n\nPerform a comprehensive ${siteAudit.type} SEO audit for: ${siteAudit.url}\n\nThis is OIA Properties — a premium Dubai real estate agency. Focus on:\n\n${siteAudit.type === "Technical" || siteAudit.type === "Full" ? `TECHNICAL:\n- Crawlability & indexation (robots.txt, sitemap, canonicals)\n- Redirect chains & broken links\n- Schema markup coverage (Real estate schema, LocalBusiness, FAQPage)\n- Mobile usability\n- HTTPS & security\n- Hreflang (Arabic/English for UAE market)\n- Internal linking structure\n` : ""}${siteAudit.type === "Content" || siteAudit.type === "Full" ? `CONTENT:\n- Title tags & meta descriptions (all listing pages)\n- Heading structure (H1, H2 hierarchy)\n- Thin or duplicate content\n- Keyword usage & density\n- Content gaps vs competitors (bayut.com, propertyfinder.ae)\n` : ""}${siteAudit.type === "Speed" || siteAudit.type === "Full" ? `SPEED & CORE WEB VITALS:\n- LCP optimisation (target < 2.5s)\n- FID / INP optimisation\n- CLS score improvements\n- Image compression\n- JavaScript & CSS blocking\n- CDN recommendations for UAE/GCC region\n` : ""}\nReturn a structured report with:\n1. Executive Summary (3 bullet points)\n2. Critical Issues (P0 — fix this week)\n3. Important Issues (P1 — fix this month)\n4. Optimisation Opportunities (P2 — quick wins)\n5. Recommended action plan with time estimates`
          )}>Run Audit with AI →</button>
        </div>
      )
    },
    {
      id: "serp-optimizer", icon: "🖥️", title: "SERP Snippet Optimizer", desc: "Generate 3 title + meta variations with char counts",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="Page URL (e.g. /luxury-apartments-dubai)" value={serpOpt.url} onChange={e => setSerpOpt(p => ({ ...p, url: e.target.value }))} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Current title ({serpOpt.title.length}/60 chars)</div>
            <input className="db-input" placeholder="Current page title" value={serpOpt.title} onChange={e => setSerpOpt(p => ({ ...p, title: e.target.value }))} maxLength={70} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Current meta description ({serpOpt.meta.length}/160 chars)</div>
            <textarea className="db-input" rows={2} placeholder="Current meta description" value={serpOpt.meta} onChange={e => setSerpOpt(p => ({ ...p, meta: e.target.value }))} maxLength={200} style={{ resize: "none", fontFamily: "inherit" }} />
          </div>
          <input className="db-input" placeholder="Target keyword (e.g. luxury apartments Dubai)" value={serpOpt.targetKw} onChange={e => setSerpOpt(p => ({ ...p, targetKw: e.target.value }))} />
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!serpOpt.targetKw.trim()} onClick={() => onSendToChat(
            `You are a conversion-focused SEO copywriter for OIA Properties, a luxury Dubai real estate company.\n\nOptimise the SERP snippet for this page:\nURL: ${serpOpt.url || "Not provided"}\nCurrent title: "${serpOpt.title || "Not provided"}"\nCurrent meta description: "${serpOpt.meta || "Not provided"}"\nTarget keyword: "${serpOpt.targetKw}"\n\nGenerate 3 variations of optimised title + meta description pairs. For each:\n- Title: max 60 characters (include character count)\n- Meta: max 160 characters (include character count)\n- Variation rationale (emotional appeal vs. feature-led vs. CTA-led)\n- Estimated CTR impact\n\nEnsure:\n1. Target keyword appears in title (ideally first 3 words)\n2. Unique value proposition for UAE luxury buyers\n3. Numbers or specifics where possible\n4. Compelling CTA in meta description\n5. No clickbait — must match page content\n\nAlso flag any issues with the current title/meta.`
          )}>Generate 3 Variations with AI →</button>
        </div>
      )
    },
    {
      id: "comp-gap", icon: "🎯", title: "Competitor Gap Analysis", desc: "Keyword gaps, content gaps, backlink opportunities vs competitors",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="Your domain (e.g. oiaproperties.com)" value={compGap.myDomain} onChange={e => setCompGap(p => ({ ...p, myDomain: e.target.value }))} />
          <input className="db-input" placeholder="Competitor 1 (e.g. propertyfinder.ae)" value={compGap.comp1} onChange={e => setCompGap(p => ({ ...p, comp1: e.target.value }))} />
          <input className="db-input" placeholder="Competitor 2 (e.g. bayut.com)" value={compGap.comp2} onChange={e => setCompGap(p => ({ ...p, comp2: e.target.value }))} />
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!compGap.comp1.trim()} onClick={() => onSendToChat(
            `You are a senior SEO strategist performing competitive gap analysis for OIA Properties in the UAE luxury real estate market.\n\nMy domain: ${compGap.myDomain || "oiaproperties.com"}\nCompetitor 1: ${compGap.comp1}\nCompetitor 2: ${compGap.comp2 || "N/A"}\n\nProvide a comprehensive competitive gap analysis covering:\n\n1. KEYWORD GAPS\n   - High-value keywords competitors rank for in top 10 that OIA does not\n   - Segment by: brand, service, location, informational, transactional\n   - Prioritise by estimated traffic opportunity\n\n2. CONTENT GAPS\n   - Content types/formats competitors have that OIA lacks\n   - Topic clusters competitors dominate\n   - Blog/guide topics with high ranking potential\n\n3. BACKLINK OPPORTUNITIES\n   - Link sources competitors have that OIA doesn't\n   - Outreach targets in UAE real estate space\n   - Guest post and PR opportunities\n\n4. TECHNICAL ADVANTAGES\n   - Structured data competitors use that OIA should add\n   - UX or site architecture advantages\n\n5. QUICK WINS (30-day action plan)\n   - Top 5 specific actions to close the gap\n   - Estimated traffic impact for each\n\nFormat as a strategic report with specific keyword examples and estimated volumes.`
          )}>Run Gap Analysis with AI →</button>
        </div>
      )
    },
    {
      id: "content-cluster", icon: "🗂️", title: "Content Cluster Builder", desc: "Build full topic clusters with pillar + cluster pages",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="Pillar topic (e.g. Buying Property in Dubai)" value={cluster.pillar} onChange={e => setCluster(p => ({ ...p, pillar: e.target.value }))} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Number of cluster pages</div>
            <select className="db-input" value={cluster.pages} onChange={e => setCluster(p => ({ ...p, pages: e.target.value }))}>
              <option value="5">5 pages</option>
              <option value="10">10 pages</option>
              <option value="15">15 pages</option>
              <option value="20">20 pages</option>
            </select>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!cluster.pillar.trim()} onClick={() => onSendToChat(
            `You are a senior content strategist for OIA Properties — a UAE luxury real estate company targeting English and Arabic-speaking property buyers and investors in Dubai.\n\nBuild a comprehensive content cluster for the pillar topic: "${cluster.pillar}"\n\nCreate a cluster of ${cluster.pages} supporting pages. For each page provide:\n\n1. Page title (SEO-optimised)\n2. Target keyword (primary)\n3. Secondary keywords (3–5)\n4. Estimated monthly search volume\n5. Keyword difficulty (0–100)\n6. Search intent\n7. Content angle / unique hook\n8. Recommended word count\n9. Internal link anchor text (how to link from pillar to this page)\n10. Content type (guide, comparison, listicle, FAQ, tool)\n\nAlso provide:\n- Pillar page structure (H1, H2 sections, target word count)\n- Internal linking strategy (hub-and-spoke model)\n- Priority order for publishing\n- Estimated time to rank for pillar keyword\n\nFormat as a complete content cluster map with a visual hierarchy.`
          )}>Build Cluster with AI →</button>
        </div>
      )
    },
    {
      id: "schema-ai", icon: "🧩", title: "Schema Markup Generator (AI)", desc: "Paste page content — get ready-to-use JSON-LD schema",
      badge: "New",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Page type</div>
            <select className="db-input" value={schemaAI.pageType} onChange={e => setSchemaAI(p => ({ ...p, pageType: e.target.value }))}>
              <option value="Property Listing">Property Listing</option>
              <option value="Article">Article / Blog Post</option>
              <option value="FAQ">FAQ Page</option>
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="Review">Review</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Paste page content (or key details)</div>
            <textarea className="db-input" rows={5} placeholder="Paste the page content, property details, or FAQ text here..." value={schemaAI.content} onChange={e => setSchemaAI(p => ({ ...p, content: e.target.value }))} style={{ resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!schemaAI.content.trim()} onClick={() => onSendToChat(
            `You are a technical SEO expert. Generate complete, valid JSON-LD schema markup for a "${schemaAI.pageType}" page.\n\nPage content / details:\n${schemaAI.content}\n\nThis is for OIA Properties — a luxury Dubai real estate company (website: oiaproperties.com, UAE market).\n\nRequirements:\n1. Generate complete, valid JSON-LD that passes Google's Rich Results Test\n2. Use the most appropriate schema.org types for ${schemaAI.pageType}\n3. Include all required and recommended properties\n4. For Property Listing: use RealEstateListing, add priceRange, geo, address, floorSize, numberOfRooms\n5. For LocalBusiness: include areaServed (Dubai), openingHours, geo, hasMap\n6. For FAQ: include all Q&A pairs from the content\n7. Add breadcrumbs schema if applicable\n\nOutput ONLY the JSON-LD code block ready to paste into the <head> section, followed by:\n- Validation checklist\n- Any additional schema types recommended for this page type\n- Instructions for implementation`
          )}>Generate Schema with AI →</button>
        </div>
      )
    },
  ];

  const existingTools = [
    { id: "kw", icon: "🔍", title: "Keyword Research (Single)", desc: "Find high-volume, low-competition keywords", content: (
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
            <div style={{ fontFamily: "monospace", fontSize: 12, color: G, marginBottom: 8 }}>{`<title>${metaResult.title}</title>`}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Description ({metaResult.desc.length}/160)</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: G, marginBottom: 8 }}>{`<meta name="description" content="${metaResult.desc}" />`}</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => navigator.clipboard.writeText(`<title>${metaResult.title}</title>\n<meta name="description" content="${metaResult.desc}" />`)}>📋 Copy all</button>
          </div>
        )}
      </div>
    )},
    { id: "serp-preview", icon: "🖥️", title: "SERP Preview", desc: "See how your page looks in Google", content: (
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
                border: `3px solid ${score.score >= 70 ? G : score.score >= 40 ? "#F59E0B" : "#EF4444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: score.score >= 70 ? G : score.score >= 40 ? "#F59E0B" : "#EF4444",
              }}>{score.score}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{score.score >= 70 ? "Good" : score.score >= 40 ? "Needs Work" : "Poor"} SEO Score</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{score.words} words · {score.density}% keyword density</div>
              </div>
            </div>
            {score.issues.map((issue, i) => (
              <div key={i} style={{ fontSize: 12, color: "#F59E0B", background: "#F59E0B10", padding: "5px 10px", borderRadius: 6, marginBottom: 4 }}>⚠️ {issue}</div>
            ))}
            {score.issues.length === 0 && <div style={{ fontSize: 12, color: G }}>✅ All basic checks passed!</div>}
          </div>
        )}
      </div>
    )},
    { id: "schema-manual", icon: "🧩", title: "Schema Generator (Manual)", desc: "Generate JSON-LD structured data manually", content: (
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
    { id: "audit", icon: "🔍", title: "Quick Site Audit (AI)", desc: "Technical SEO audit — errors, speed, structured data", content: (
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
    { id: "competitor", icon: "🎯", title: "Competitor Analysis (Quick)", desc: "Keyword gaps, backlinks, content strategy gaps", content: (
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

  type ToolItem = { id: string; icon: string; title: string; desc: string; content: React.ReactNode; badge?: string };
  const renderToolGrid = (toolList: ToolItem[], sectionLabel: string, sectionColor?: string) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: sectionColor || "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        {sectionColor && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: sectionColor }} />}
        {sectionLabel}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 12 }}>
        {toolList.map(tool => (
          <div key={tool.id} className="db-card" style={{ padding: 0, overflow: "hidden" }}>
            <button onClick={() => toggle(tool.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>{tool.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{tool.title}</div>
                  {"badge" in tool && tool.badge && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: G, background: G + "20", padding: "1px 6px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tool.badge}</span>
                  )}
                </div>
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

  return (
    <div>
      <div className="db-page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="db-card-title">SEO Tools</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click any tool to expand. AI tools send directly to the SEO Agent chat.</div>
        </div>
      </div>
      {renderToolGrid(newTools, "Advanced Tools", G)}
      {renderToolGrid(existingTools, "Standard Tools")}
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
                  {task.tags.map(tag => <span key={tag} style={{ fontSize: 11, color: G, background: G + "15", padding: "2px 8px", borderRadius: 99 }}>{tag}</span>)}
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
                    {task.tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{task.tags.map(tag => <span key={tag} style={{ fontSize: 10, color: G, background: G + "15", padding: "1px 6px", borderRadius: 99 }}>{tag}</span>)}</div>}
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
                  background: isToday ? G : "none",
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
          <div style={{ height: "100%", background: G, width: `${(done / todos.length) * 100}%`, borderRadius: 99, transition: "width 0.3s" }} />
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
              <button onClick={() => toggle(todo.id)} style={{ width: 18, height: 18, borderRadius: 5, background: G, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
function ReportsPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [reportHistory, setReportHistory] = useLocalState<ReportHistoryItem[]>("oia_seo_report_history", DEMO_REPORT_HISTORY);
  const [generating, setGenerating] = useState<string | null>(null);

  const monthlyTrafficData = [
    { month: "Dec", traffic: 8200 },
    { month: "Jan", traffic: 9100 },
    { month: "Feb", traffic: 10400 },
    { month: "Mar", traffic: 11200 },
    { month: "Apr", traffic: 11850 },
    { month: "May", traffic: 12450 },
  ];
  const maxTraffic = Math.max(...monthlyTrafficData.map(d => d.traffic));

  const topLandingPages = [
    { page: "/luxury-apartments-dubai", sessions: 2840, pct: 22.8 },
    { page: "/buy-property-dubai", sessions: 1920, pct: 15.4 },
    { page: "/aldar-yas-acres", sessions: 1540, pct: 12.4 },
    { page: "/off-plan-apartments-uae", sessions: 1230, pct: 9.9 },
    { page: "/dubai-real-estate-investment", sessions: 980, pct: 7.9 },
    { page: "/dubai-marina-apartments", sessions: 870, pct: 7.0 },
    { page: "/blog/dubai-property-guide-2025", sessions: 740, pct: 5.9 },
    { page: "/golden-visa-dubai-property", sessions: 620, pct: 5.0 },
    { page: "/oia-properties-about", sessions: 490, pct: 3.9 },
    { page: "/contact", sessions: 380, pct: 3.1 },
  ];

  const reportTypes = [
    {
      id: "weekly",
      icon: "📅",
      label: "Weekly SEO Report",
      desc: "Rankings, traffic, tasks completed this week",
      prompt: `Generate a comprehensive Weekly SEO Report for OIA Properties (UAE luxury real estate) for the week ending ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\n\nInclude:\n1. EXECUTIVE SUMMARY (3 key highlights this week)\n2. ORGANIC TRAFFIC\n   - Estimated sessions this week vs last week\n   - Top traffic sources breakdown\n   - Mobile vs Desktop split\n3. KEYWORD RANKINGS\n   - Top movers (↑ gains this week)\n   - Drops to watch (↓ losses this week)\n   - New keywords entering top 20\n4. TECHNICAL SEO STATUS\n   - Core Web Vitals: LCP 2.1s ✅, FID 45ms ✅, CLS 0.08 ✅\n   - Issues resolved this week\n   - New issues detected\n5. CONTENT PUBLISHED THIS WEEK\n   - Pages optimised\n   - New content created\n6. BACKLINKS\n   - New links acquired this week\n   - Lost links\n7. ACTION ITEMS FOR NEXT WEEK (prioritised list)\n\nFormat as a professional report with clear sections, bullet points, and actionable recommendations.`,
    },
    {
      id: "monthly-traffic",
      icon: "📈",
      label: "Monthly Organic Traffic Report",
      desc: "Full organic traffic analysis with trends and insights",
      prompt: `Generate a comprehensive Monthly Organic Traffic Report for OIA Properties (UAE luxury real estate) for ${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}.\n\nData context:\n- Current organic traffic: 12,450 sessions/month (+18% MoM)\n- Previous month: ~10,550 sessions\n- Target: 15,000 sessions/month by Q3 2026\n\nInclude:\n1. TRAFFIC OVERVIEW\n   - Total sessions, users, pageviews\n   - Month-over-month change\n   - Year-over-year comparison\n   - Traffic trend chart description (6-month view)\n2. TOP LANDING PAGES BY ORGANIC TRAFFIC\n   - Top 10 pages with sessions and bounce rate\n   - Pages with highest growth\n   - Pages declining — action needed\n3. GEO BREAKDOWN\n   - UAE (local) vs international traffic\n   - Top countries: UK, India, Russia, KSA\n4. DEVICE BREAKDOWN\n   - Mobile vs Desktop vs Tablet\n5. KEYWORD PERFORMANCE\n   - Keywords driving most traffic\n   - Featured snippets captured\n6. CONVERSION ANALYSIS\n   - Contact form submissions from organic\n   - WhatsApp clicks from organic\n   - Property enquiry rate\n7. RECOMMENDATIONS FOR NEXT MONTH\n   - 3 priority actions to grow traffic\n   - Content opportunities\n\nFormat as a detailed professional report suitable for sharing with management.`,
    },
    {
      id: "keyword-ranking",
      icon: "🎯",
      label: "Keyword Ranking Report",
      desc: "Full ranking analysis for all tracked keywords",
      prompt: `Generate a comprehensive Keyword Ranking Report for OIA Properties (UAE luxury real estate) as of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\n\nTracked keywords to analyse:\n- "luxury apartments Dubai" — current pos #8, target top 5\n- "buy apartment Dubai" — current pos #12, target top 10\n- "Aldar Yas Acres" — current pos #3, target #1\n- "Dubai real estate investment 2025" — current pos #18, target top 10\n- "OIA properties Dubai" — current pos #2, target #1\n- "off-plan apartments Dubai" — current pos #24, target top 15\n- "Dubai Marina apartments for sale" — current pos #9, target top 5\n- "buy villa in Dubai" — current pos #15, target top 10\n- "UAE property investment guide" — current pos #11, target top 5\n- "Dubai real estate ROI 2025" — current pos #22, target top 15\n\nFor each keyword provide:\n1. Current position vs last month vs 3 months ago\n2. Search volume and trend\n3. SERP features present (Featured Snippet, PAA, etc.)\n4. Top 3 competing pages\n5. Specific actions to improve ranking\n6. Estimated timeline to reach target position\n\nAlso include:\n- Overall ranking trend summary\n- Quick wins (keywords closest to next page breakthrough)\n- At-risk keywords (declining)\n- New keyword opportunities to add to tracking\n\nFormat as a structured report with a summary table.`,
    },
    {
      id: "technical-audit",
      icon: "🔬",
      label: "Technical Audit Report",
      desc: "Full technical SEO health check with fixes",
      prompt: `Generate a comprehensive Technical SEO Audit Report for OIA Properties (oiaproperties.com — UAE luxury real estate) as of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\n\nKnown issues to assess:\n- Schema Markup: Partial (needs Property Listing schema on all listing pages)\n- Broken Links: 3 found internally\n- Duplicate Meta Descriptions: 5 pages affected\n- Core Web Vitals: LCP 2.1s ✅, FID 45ms ✅, CLS 0.08 ✅\n- HTTPS: Enabled ✅\n- Mobile-Friendly: Yes ✅\n- Sitemap: Submitted ✅\n- Robots.txt: Valid ✅\n\nAudit Report should include:\n1. TECHNICAL HEALTH SCORE (0–100 with breakdown)\n2. CRITICAL ISSUES (P0 — fix within 48 hours)\n   - Impact, fix instructions, estimated effort\n3. HIGH PRIORITY ISSUES (P1 — fix this week)\n   - Impact, fix instructions, estimated effort\n4. MEDIUM PRIORITY (P2 — fix this month)\n5. LOW PRIORITY (P3 — backlog)\n6. CORE WEB VITALS DEEP DIVE\n   - LCP: current, target, how to improve\n   - INP/FID: current, target, how to improve\n   - CLS: current, target, how to improve\n7. SCHEMA MARKUP AUDIT\n   - What's implemented vs what's missing\n   - Priority schema to add (RealEstateListing, LocalBusiness, FAQ)\n8. CRAWL & INDEXATION STATUS\n9. MOBILE USABILITY REPORT\n10. RECOMMENDED 30-DAY TECHNICAL ROADMAP\n\nFormat as a professional technical report with severity ratings.`,
    },
    {
      id: "backlink",
      icon: "🔗",
      label: "Backlink Report",
      desc: "Backlink profile analysis with acquisition strategy",
      prompt: `Generate a comprehensive Backlink Report for OIA Properties (oiaproperties.com — UAE luxury real estate) as of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\n\nCurrent backlink profile data:\n- Total backlinks: 1,840 (+120 this month)\n- Domain Authority: 38\n- Referring domains: 50 total\n- Top referring domains: gulf.news (DA71), arabianbusiness.com (DA66), propertywire.com (DA58)\n- Toxic links flagged: 4\n- DA distribution: 8 at DA60+, 22 at DA40-59, 15 at DA20-39, 5 at DA1-19\n\nReport should include:\n1. BACKLINK PROFILE SUMMARY\n   - Total links, referring domains, DA trend\n   - Link velocity (links acquired per month trend)\n2. LINK QUALITY ANALYSIS\n   - Editorial vs directory vs social breakdown\n   - DoFollow vs NoFollow ratio\n   - Anchor text diversity audit\n3. TOP REFERRING DOMAINS (detailed breakdown of top 10)\n4. TOXIC LINK AUDIT\n   - Flagged domains and why\n   - Disavow recommendations\n5. COMPETITOR BACKLINK COMPARISON\n   - vs propertyfinder.ae\n   - vs bayut.com\n   - Gap analysis\n6. LINK BUILDING OPPORTUNITIES\n   - 10 specific outreach targets in UAE real estate space\n   - Guest post opportunities\n   - PR and press opportunities\n   - Directory submissions worth pursuing\n7. 30-DAY LINK BUILDING ACTION PLAN\n   - Specific campaigns, expected DA of targets, outreach templates\n\nFormat as a professional report suitable for sharing with the marketing director.`,
    },
  ];

  const handleGenerate = (rt: typeof reportTypes[0]) => {
    setGenerating(rt.id);
    onSendToChat(rt.prompt);
    const newReport: ReportHistoryItem = {
      id: makeId(),
      type: rt.label,
      date: new Date().toISOString().slice(0, 10),
      status: "completed",
    };
    setReportHistory(p => [newReport, ...p.slice(0, 4)]);
    setTimeout(() => setGenerating(null), 1000);
  };

  const STATUS_COLORS_REPORT: Record<ReportHistoryItem["status"], string> = {
    completed: G,
    generating: "#F59E0B",
    failed: "#EF4444",
  };
  const STATUS_LABEL: Record<ReportHistoryItem["status"], string> = {
    completed: "✅ Completed",
    generating: "⏳ Generating",
    failed: "❌ Failed",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Auto-Generate Reports */}
      <div className="db-card">
        <div style={{ marginBottom: 14 }}>
          <div className="db-card-title">Auto-Generate Reports</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Generate detailed AI-powered SEO reports tailored to OIA Properties. Each report sends a comprehensive prompt to the SEO Agent.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {reportTypes.map(rt => (
            <div key={rt.id} style={{
              padding: "14px 16px",
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{rt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 3 }}>{rt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{rt.desc}</div>
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ fontSize: 12, marginTop: 4, opacity: generating === rt.id ? 0.7 : 1 }}
                disabled={generating === rt.id}
                onClick={() => handleGenerate(rt)}
              >
                {generating === rt.id ? "Generating..." : "Generate Report →"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Traffic Trend Chart */}
      <div className="db-card">
        <div style={{ marginBottom: 14 }}>
          <div className="db-card-title">Monthly Organic Traffic Trend</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Last 6 months — oiaproperties.com organic search sessions</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140, paddingBottom: 8 }}>
          {monthlyTrafficData.map((d, i) => {
            const barH = Math.round((d.traffic / maxTraffic) * 120);
            const isLast = i === monthlyTrafficData.length - 1;
            return (
              <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isLast ? G : "var(--text-muted)" }}>
                  {d.traffic >= 1000 ? (d.traffic / 1000).toFixed(1) + "k" : d.traffic}
                </div>
                <div style={{
                  width: "100%",
                  height: barH,
                  background: isLast ? G : G + "50",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.4s ease",
                  position: "relative",
                }} />
                <div style={{ fontSize: 11, color: isLast ? G : "var(--text-muted)", fontWeight: isLast ? 700 : 400 }}>{d.month}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: G, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Current month</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: G + "50", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Previous months</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: G, fontWeight: 700 }}>+18% MoM growth</div>
        </div>
      </div>

      {/* Top Landing Pages + Report History side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Top Landing Pages */}
        <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px" }}>
            <div className="db-card-title" style={{ margin: 0 }}>Top 10 Landing Pages by Organic Traffic</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>May 2026 — organic sessions</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "7px 18px", fontWeight: 700, fontSize: 11, color: "var(--text-muted)" }}>#</th>
                <th style={{ textAlign: "left", padding: "7px 8px", fontWeight: 700, fontSize: 11, color: "var(--text-muted)" }}>Page</th>
                <th style={{ textAlign: "right", padding: "7px 18px", fontWeight: 700, fontSize: 11, color: "var(--text-muted)" }}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {topLandingPages.map((p, i) => (
                <tr key={p.page} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "7px 18px", color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "7px 8px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 12, marginBottom: 3 }}>{p.page}</div>
                    <div style={{ height: 3, background: "var(--border)", borderRadius: 99, overflow: "hidden", maxWidth: 180 }}>
                      <div style={{ height: "100%", width: `${p.pct}%`, background: G, borderRadius: 99 }} />
                    </div>
                  </td>
                  <td style={{ padding: "7px 18px", textAlign: "right", fontWeight: 700, color: G }}>{p.sessions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Report History */}
        <div className="db-card">
          <div style={{ marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Report History</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Last 5 generated reports</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reportHistory.slice(0, 5).map(r => (
              <div key={r.id} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{r.type}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Generated: {r.date}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS_REPORT[r.status], background: STATUS_COLORS_REPORT[r.status] + "15", padding: "3px 10px", borderRadius: 99, flexShrink: 0, whiteSpace: "nowrap" }}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            ))}
            {reportHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>No reports generated yet. Use the buttons above to generate your first report.</div>
            )}
          </div>

          {/* SEO KPI Targets */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Monthly KPI Targets</div>
            {[
              { label: "Organic traffic", current: "12,450", target: "15,000", pct: 83 },
              { label: "Top-10 keywords", current: "34", target: "50", pct: 68 },
              { label: "Domain Authority", current: "38", target: "40", pct: 95 },
              { label: "New backlinks", current: "120", target: "200", pct: 60 },
            ].map(k => (
              <div key={k.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "var(--text)" }}>{k.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>{k.current} / {k.target}</span>
                </div>
                <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${k.pct}%`, background: k.pct >= 80 ? G : k.pct >= 60 ? "#F59E0B" : "#EF4444", borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
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
          <p className="db-page-sub">OIA Properties SEO command centre — keyword tracking, technical audits, content strategy &amp; rank growth</p>
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
          agentColor={G}
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
      {tab === "Reports" && <ReportsPanel onSendToChat={handleSendToChat} />}
    </div>
  );
}
