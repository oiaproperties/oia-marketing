"use client";
import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, BarChart2,
  FileText, Target, AlertTriangle, CheckCircle, Info,
  ChevronRight, Plus, Calendar, Clock, Zap, ArrowUpRight,
  Layout, PieChart, Layers, Send, Settings,
} from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

// ─── Types ──────────────────────────────────────────────────────────────────
type Tab = "Overview" | "Reports" | "Team" | "Strategy" | "Budget" | "Chat";

interface TeamTask {
  id: string;
  title: string;
  assignee: string;
  assigneeColor: string;
  priority: "High" | "Medium" | "Low";
  status: "Backlog" | "In Progress" | "Review" | "Done";
}

interface AssignTask {
  title: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const COLOR = "#B8860B";
const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const DEMO_TASKS: TeamTask[] = [
  { id: "t1", title: "Write Yas Acres landing page copy", assignee: "S", assigneeColor: "#8B5CF6", priority: "High", status: "Backlog" },
  { id: "t2", title: "Q3 content calendar — Instagram", assignee: "S", assigneeColor: "#8B5CF6", priority: "Medium", status: "Backlog" },
  { id: "t3", title: "Google Shopping campaign setup", assignee: "A", assigneeColor: "#F59E0B", priority: "High", status: "In Progress" },
  { id: "t4", title: "TikTok Yas Acres campaign resume", assignee: "A", assigneeColor: "#F59E0B", priority: "High", status: "In Progress" },
  { id: "t5", title: "LinkedIn audience refinement report", assignee: "A", assigneeColor: "#F59E0B", priority: "Medium", status: "In Progress" },
  { id: "t6", title: "Competitor Instagram Q2 analysis", assignee: "M", assigneeColor: "#3B82F6", priority: "Medium", status: "Review" },
  { id: "t7", title: "Arabic content series brief", assignee: "L", assigneeColor: "#10B981", priority: "Low", status: "Review" },
  { id: "t8", title: "SEO keyword cluster — Dubai apartments", assignee: "L", assigneeColor: "#10B981", priority: "High", status: "Done" },
  { id: "t9", title: "OIA brand guidelines update", assignee: "S", assigneeColor: "#8B5CF6", priority: "Low", status: "Done" },
];

// ─── Hook: localStorage persistence ─────────────────────────────────────────
function useLocalState<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(init);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) { try { setVal(JSON.parse(saved)); } catch { /* ignore */ } }
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

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, trendUp }: { label: string; value: string; sub: string; trend: string; trendUp: boolean }) {
  return (
    <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: trendUp ? "#10B981" : "#EF4444" }}>
          {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Active:  { bg: "#10B98120", text: "#10B981" },
    Paused:  { bg: "#F59E0B20", text: "#F59E0B" },
    Draft:   { bg: "#6B728020", text: "#6B7280" },
  };
  const c = colors[status] ?? colors.Draft;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text }}>{status}</span>
  );
}

// ─── Alert Card ──────────────────────────────────────────────────────────────
function AlertCard({ type, title, body }: { type: "critical" | "warning" | "opportunity" | "win"; title: string; body: string }) {
  const cfg = {
    critical:    { icon: "🔴", bg: "#EF444410", border: "#EF4444", label: "Critical" },
    warning:     { icon: "🟡", bg: "#F59E0B10", border: "#F59E0B", label: "Warning" },
    opportunity: { icon: "🟢", bg: "#10B98110", border: "#10B981", label: "Opportunity" },
    win:         { icon: "🟢", bg: "#10B98110", border: "#10B981", label: "Win" },
  }[type];
  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, background: cfg.bg, borderLeft: `3px solid ${cfg.border}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{cfg.label}: {title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab() {
  const campaigns = [
    { name: "Meta – Aldar Yas Acres Lead Gen", platform: "Meta", type: "Lead Gen", status: "Active", budget: "AED 800/day", spend: "AED 12,400", leads: 42, roas: "4.2x" },
    { name: "Google – Dubai Luxury Apartments Search", platform: "Google", type: "Search", status: "Active", budget: "AED 600/day", spend: "AED 9,300", leads: 28, roas: "3.8x" },
    { name: "Instagram – OIA Brand Awareness", platform: "Instagram", type: "Awareness", status: "Active", budget: "AED 300/day", spend: "AED 4,650", leads: 8, roas: "2.1x" },
    { name: "TikTok – Yas Acres Reel Boost", platform: "TikTok", type: "Video", status: "Paused", budget: "AED 200/day", spend: "AED 1,800", leads: 12, roas: "5.1x" },
    { name: "LinkedIn – HNW Investor Targeting", platform: "LinkedIn", type: "Lead Gen", status: "Active", budget: "AED 400/day", spend: "AED 6,200", leads: 18, roas: "3.3x" },
    { name: "Snapchat – UAE Youth Awareness", platform: "Snapchat", type: "Awareness", status: "Draft", budget: "AED 150/day", spend: "—", leads: 0, roas: "—" },
  ];

  const channels = [
    { name: "Meta", leads: 89, color: "#1877F2" },
    { name: "Google", leads: 71, color: "#EA4335" },
    { name: "Instagram", leads: 34, color: "#E1306C" },
    { name: "TikTok", leads: 28, color: "#010101" },
    { name: "LinkedIn", leads: 18, color: "#0A66C2" },
    { name: "Organic", leads: 7, color: "#10B981" },
  ];
  const maxLeads = Math.max(...channels.map(c => c.leads));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiCard label="Total Ad Spend" value="AED 48,500" sub="this month" trend="+12%" trendUp={true} />
        <KpiCard label="Combined ROAS" value="3.8x" sub="blended all channels" trend="+0.4x" trendUp={true} />
        <KpiCard label="Organic Reach" value="89,200" sub="this month" trend="+18%" trendUp={true} />
        <KpiCard label="Total Leads Generated" value="247" sub="this month" trend="+31%" trendUp={true} />
        <KpiCard label="Content Published" value="38 pieces" sub="this month" trend="5 in review" trendUp={true} />
        <KpiCard label="Social Followers" value="24.5K" sub="combined total" trend="+3.2%" trendUp={true} />
      </div>

      {/* Campaign Status Board */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="db-card-title" style={{ margin: 0 }}>Campaign Status Board</div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>6 active campaigns</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Campaign Name", "Platform", "Type", "Status", "Budget/Day", "Spend", "Leads", "ROAS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)", maxWidth: 260 }}>{c.name}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{c.platform}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{c.type}</td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "10px 12px", color: "var(--text)", fontWeight: 600 }}>{c.budget}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text)" }}>{c.spend}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: c.leads > 0 ? COLOR : "var(--text-muted)" }}>{c.leads > 0 ? c.leads : "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: c.roas !== "—" ? (parseFloat(c.roas) >= 4 ? "#10B981" : parseFloat(c.roas) >= 3 ? COLOR : "#EF4444") : "var(--text-muted)" }}>{c.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Performance Grid */}
      <div>
        <div className="db-card-title" style={{ marginBottom: 12 }}>Team Performance</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { name: "Content Creator", icon: "✍️", color: "#8B5CF6", stats: [{ label: "Pieces published", value: "38" }, { label: "On-time rate", value: "94%" }, { label: "Pending tasks", value: "12" }, { label: "Avg SEO score", value: "78/100" }] },
            { name: "Social Media", icon: "📱", color: "#3B82F6", stats: [{ label: "Platforms active", value: "5" }, { label: "Avg engagement", value: "4.8%" }, { label: "Posts scheduled", value: "12" }, { label: "Total followers", value: "24.5K" }] },
            { name: "Media Buyer", icon: "💰", color: "#F59E0B", stats: [{ label: "Budget managed", value: "AED 48.5K" }, { label: "Blended ROAS", value: "3.8x" }, { label: "Leads generated", value: "247" }, { label: "Cost per lead", value: "AED 196" }] },
          ].map(team => (
            <div key={team.name} className="db-card" style={{ borderTop: `3px solid ${team.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{team.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{team.name}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {team.stats.map(s => (
                  <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "9px 11px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: team.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Performance Bar Chart */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 14 }}>Channel Performance — Leads This Month</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {channels.map(ch => (
            <div key={ch.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 72, fontSize: 12, fontWeight: 600, color: "var(--text)", textAlign: "right", flexShrink: 0 }}>{ch.name}</div>
              <div style={{ flex: 1, height: 26, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(ch.leads / maxLeads) * 100}%`, background: ch.color, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8, transition: "width 0.4s" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ch.name === "TikTok" ? "#fff" : "#fff", whiteSpace: "nowrap" }}>{ch.leads > 12 ? `${ch.leads} leads` : ""}</span>
                </div>
              </div>
              <div style={{ width: 54, fontSize: 12, fontWeight: 700, color: "var(--text)", textAlign: "right", flexShrink: 0 }}>{ch.leads}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Strategic Alerts */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>AI Strategic Alerts</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AlertCard type="critical" title="Facebook engagement dropped 40%" body="Organic reach has declined sharply this week. Content refresh needed immediately — switch to video-first formats and increase posting frequency to 2x daily." />
          <AlertCard type="warning" title="TikTok campaign paused" body="Yas Acres Reel Boost is paused but showed 5.1x ROAS before pause. Resume now to capture Q3 momentum — competitor activity on TikTok is increasing." />
          <AlertCard type="opportunity" title="Google Shopping not yet activated" body="Estimated +35 leads/month at current CPL. High buyer-intent channel with zero current spend. Recommend AED 5K/month allocation for immediate launch." />
          <AlertCard type="win" title="LinkedIn ROAS improved 22% this month" body="After audience refinement targeting C-suite expats, ROAS rose from 2.7x to 3.3x. Budget increase of AED 2K recommended to scale this performance." />
        </div>
      </div>

    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────
function ReportsTab({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const reportCards = [
    {
      title: "Weekly Performance Report",
      desc: "Auto-generated executive summary with KPIs, wins, issues, and next-week actions.",
      icon: <BarChart2 size={18} color={COLOR} />,
      prompt: "Generate a comprehensive weekly marketing performance report for OIA Properties. Include: total spend AED 48,500, leads 247, ROAS 3.8x, top performing campaign (Meta Aldar Yas Acres 4.2x ROAS), worst performer (Instagram Brand Awareness 2.1x), organic reach 89,200, social followers 24,500. Provide executive summary, key wins, issues, and 3 recommendations for next week.",
    },
    {
      title: "Monthly ROI Analysis",
      desc: "Full ROI breakdown by channel with spend efficiency, CPL benchmarks, and reallocation recommendations.",
      icon: <PieChart size={18} color="#3B82F6" />,
      prompt: "Generate a comprehensive monthly ROI analysis for OIA Properties marketing. Break down ROI by channel: Meta (AED 12,400 spend, 42 leads, 4.2x ROAS), Google (AED 9,300, 28 leads, 3.8x), Instagram (AED 4,650, 8 leads, 2.1x), TikTok (AED 1,800, 12 leads, 5.1x — paused), LinkedIn (AED 6,200, 18 leads, 3.3x). Include CPL per channel, blended ROAS of 3.8x, total 247 leads, AED 48,500 spend. Identify most and least efficient channels and provide budget reallocation recommendations for next month.",
    },
    {
      title: "Competitor Benchmarking",
      desc: "OIA vs PropertyFinder, Bayut, and Emaar — social, content, SEO, and paid media analysis.",
      icon: <Layers size={18} color="#8B5CF6" />,
      prompt: "Analyse OIA Properties vs top competitors (PropertyFinder.ae, Bayut.com, Emaar Properties) across digital marketing channels. Compare: Instagram followers and engagement rates, Facebook organic vs paid strategy, content publishing frequency, LinkedIn presence for HNW investor targeting, estimated paid media spend and strategy, SEO positioning for key UAE real estate keywords. Identify OIA's competitive gaps and top 3 quick wins to outperform these competitors in the next 90 days.",
    },
  ];

  const reportHistory = [
    { date: "20 May 2026", type: "Weekly Performance Report", status: "Generated", prompt: "Regenerate the weekly performance report from 20 May 2026 for OIA Properties: AED 46,200 spend, 231 leads, 3.6x ROAS." },
    { date: "13 May 2026", type: "Weekly Performance Report", status: "Generated", prompt: "Regenerate the weekly performance report from 13 May 2026 for OIA Properties: AED 44,800 spend, 218 leads, 3.5x ROAS." },
    { date: "1 May 2026", type: "Monthly ROI Analysis", status: "Generated", prompt: "Regenerate the monthly ROI analysis for April 2026 for OIA Properties." },
    { date: "6 May 2026", type: "Weekly Performance Report", status: "Generated", prompt: "Regenerate the weekly performance report from 6 May 2026 for OIA Properties." },
    { date: "1 Apr 2026", type: "Competitor Benchmarking", status: "Generated", prompt: "Regenerate the competitor benchmarking report from April 2026 for OIA Properties vs PropertyFinder, Bayut, and Emaar." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Auto-generated report cards */}
      <div>
        <div className="db-card-title" style={{ marginBottom: 14 }}>Auto-Generated Reports</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {reportCards.map(r => (
            <div key={r.title} className="db-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{r.title}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, flex: 1 }}>{r.desc}</div>
              <button className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
                onClick={() => onSendToChat(r.prompt)}>
                <Send size={12} /> Generate Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Schedule */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Calendar size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>Automated Report Schedule</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${COLOR}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>Weekly Performance Report</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><Clock size={12} /> Every Monday at 9:00 AM GST</div>
            <div style={{ marginTop: 8, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#10B98120", color: "#10B981", display: "inline-block", fontWeight: 700 }}>Active</div>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid #3B82F6` }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>Monthly ROI Analysis</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><Clock size={12} /> 1st of every month at 9:00 AM GST</div>
            <div style={{ marginTop: 8, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#10B98120", color: "#10B981", display: "inline-block", fontWeight: 700 }}>Active</div>
          </div>
        </div>
      </div>

      {/* Report History */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 14 }}>Report History</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Date", "Report Type", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportHistory.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 12 }}>{r.date}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)" }}>{r.type}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#10B98120", color: "#10B981" }}>{r.status}</span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onSendToChat(r.prompt)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab() {
  const [tasks, setTasks] = useLocalState<TeamTask[]>("oia_director_team_tasks", DEMO_TASKS);
  const [newTask, setNewTask] = useState<AssignTask>({ title: "", assignee: "Sarah Al-Rashidi", priority: "Medium", dueDate: "" });
  const STATUS_COLS: Array<{ id: TeamTask["status"]; label: string }> = [
    { id: "Backlog", label: "📋 Backlog" },
    { id: "In Progress", label: "⚙️ In Progress" },
    { id: "Review", label: "👀 Review" },
    { id: "Done", label: "✅ Done" },
  ];
  const ASSIGNEE_INITIALS: Record<string, { initial: string; color: string }> = {
    "Sarah Al-Rashidi": { initial: "S", color: "#8B5CF6" },
    "Mohammed Hassan": { initial: "M", color: "#3B82F6" },
    "Layla Khouri": { initial: "L", color: "#10B981" },
    "Ahmed Mansour": { initial: "A", color: "#F59E0B" },
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const ai = ASSIGNEE_INITIALS[newTask.assignee];
    setTasks(p => [...p, { id: makeId(), title: newTask.title, assignee: ai.initial, assigneeColor: ai.color, priority: newTask.priority, status: "Backlog" }]);
    setNewTask(p => ({ ...p, title: "", dueDate: "" }));
  };

  const PRIORITY_COLORS: Record<string, string> = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };
  const KPI_ROWS = [
    { role: "Content Creator", kpi: "Articles/month", target: "40", actual: "38", pct: 95, ok: "warning" },
    { role: "Social Media", kpi: "Engagement rate", target: "5%", actual: "4.8%", pct: 96, ok: "warning" },
    { role: "Media Buyer", kpi: "ROAS", target: "4.0x", actual: "3.8x", pct: 95, ok: "warning" },
    { role: "SEO", kpi: "Organic traffic/mo", target: "15K", actual: "12.4K", pct: 83, ok: "critical" },
  ];

  const members = [
    { name: "Sarah Al-Rashidi", role: "Content Creator", tasks: 12, onTime: "94%", sub: "Last active: 2 hours ago", status: "Online", color: "#8B5CF6", initial: "S" },
    { name: "Mohammed Hassan", role: "Social Media Manager", tasks: 8, onTime: "5 platforms", sub: "Last active: 30 min ago", status: "Online", color: "#3B82F6", initial: "M" },
    { name: "Layla Khouri", role: "SEO Specialist", tasks: 6, onTime: "84 keywords", sub: "Last active: 1 day ago", status: "Away", color: "#10B981", initial: "L" },
    { name: "Ahmed Mansour", role: "Media Buyer", tasks: 6, onTime: "AED 48.5K", sub: "Last active: 4 hours ago", status: "Online", color: "#F59E0B", initial: "A" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Member Cards */}
      <div>
        <div className="db-card-title" style={{ marginBottom: 14 }}>Team Members</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {members.map(m => (
            <div key={m.name} className="db-card" style={{ borderTop: `3px solid ${m.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.color + "25", color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{m.initial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", lineHeight: 1.2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Active tasks</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{m.tasks}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>On-time / KPI</span>
                  <span style={{ fontWeight: 700, color: m.color }}>{m.onTime}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.sub}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.status === "Online" ? "#10B981" : "#F59E0B" }}>{m.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 14 }}>Cross-Team Task Board</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>{col.label}</span>
                  <span style={{ background: "var(--surface-2)", borderRadius: 99, padding: "1px 8px", fontSize: 11 }}>{colTasks.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {colTasks.map(task => (
                    <div key={task.id} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "10px 11px", borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`, cursor: "default" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, marginBottom: 7 }}>{task.title}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: task.assigneeColor + "25", color: task.assigneeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{task.assignee}</div>
                        <span style={{ fontSize: 10, color: PRIORITY_COLORS[task.priority], fontWeight: 700 }}>{task.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Table */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 14 }}>Team KPI — Target vs Actual</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Role", "KPI", "Target", "Actual", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KPI_ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)" }}>{r.role}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{r.kpi}</td>
                <td style={{ padding: "10px 12px", color: "var(--text)" }}>{r.target}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: r.ok === "critical" ? "#EF4444" : COLOR }}>{r.actual}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, maxWidth: 80, height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${r.pct}%`, background: r.ok === "critical" ? "#EF4444" : COLOR, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.ok === "critical" ? "#EF4444" : COLOR }}>{r.pct}%</span>
                    <span style={{ fontSize: 14 }}>{r.ok === "critical" ? "🔴" : "🟡"}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Assign Task */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Plus size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>Quick Assign Task</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Task Title</div>
            <input className="db-input" placeholder="Task description..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTask()} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Assign To</div>
            <select className="db-input" value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}>
              {Object.keys(ASSIGNEE_INITIALS).map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Priority</div>
            <select className="db-input" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as "High" | "Medium" | "Low" }))}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Due Date</div>
            <input className="db-input" type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={addTask}>Add Task</button>
        </div>
      </div>

    </div>
  );
}

// ─── Strategy Tab ─────────────────────────────────────────────────────────────
function StrategyTab({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [challenge, setChallenge] = useState("");

  const pillars = [
    { icon: "🏆", title: "Brand Authority", color: COLOR, border: COLOR, desc: "Build OIA as the #1 luxury real estate brand in UAE digital space — owned media, earned press, and premium content positioning." },
    { icon: "📈", title: "Lead Generation", color: "#EF4444", border: "#EF4444", desc: "300+ qualified leads/month across all channels by Q4 2025. Focus on high-intent keywords, lead magnets, and conversion-optimised landing pages." },
    { icon: "🌍", title: "Organic Growth", color: "#10B981", border: "#10B981", desc: "100K combined social followers + 20K/month organic traffic by end of year. SEO, content clusters, and community-led growth." },
    { icon: "🤝", title: "Community Building", color: "#3B82F6", border: "#3B82F6", desc: "10K engaged community members across platforms. WhatsApp groups, exclusive investor events, and VIP property tours." },
  ];

  const priorities = [
    { n: 1, title: "Launch YouTube channel", status: "In Progress", owner: "Social Media", statusColor: COLOR },
    { n: 2, title: "Start Arabic content series", status: "Planned", owner: "Content Creator", statusColor: "#6B7280" },
    { n: 3, title: "Influencer partnership program", status: "Planned", owner: "Social Media", statusColor: "#6B7280" },
    { n: 4, title: "Google Shopping activation", status: "Planned", owner: "Media Buyer", statusColor: "#6B7280" },
    { n: 5, title: 'SEO content cluster for "Dubai apartments"', status: "In Progress", owner: "SEO", statusColor: COLOR },
    { n: 6, title: "WhatsApp Business integration for lead follow-up", status: "Planned", owner: "All", statusColor: "#6B7280" },
  ];

  // Competitive Position: content quality (Y) vs social reach (X) — 0..100
  const competitors = [
    { name: "OIA", x: 62, y: 74, color: COLOR, size: 16 },
    { name: "PropertyFinder", x: 85, y: 58, color: "#EF4444", size: 13 },
    { name: "Bayut", x: 80, y: 52, color: "#3B82F6", size: 13 },
    { name: "Emaar", x: 70, y: 82, color: "#8B5CF6", size: 13 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Strategic Pillars */}
      <div>
        <div className="db-card-title" style={{ marginBottom: 14 }}>Strategic Pillars</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {pillars.map(p => (
            <div key={p.title} className="db-card" style={{ borderLeft: `4px solid ${p.border}`, display: "flex", gap: 14 }}>
              <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: p.color, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Q3 Priority Actions */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Target size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>Q3 Priority Actions</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {priorities.map(pr => (
            <div key={pr.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--surface-2)", borderRadius: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: pr.statusColor + "20", color: pr.statusColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{pr.n}</div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{pr.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>Owner: <strong style={{ color: "var(--text)" }}>{pr.owner}</strong></div>
              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: pr.statusColor + "20", color: pr.statusColor, flexShrink: 0 }}>{pr.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Position Matrix */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 4 }}>Competitive Position Matrix</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Content Quality (Y-axis) vs Social Reach (X-axis)</div>
        <div style={{ position: "relative", width: "100%", height: 220, background: "var(--surface-2)", borderRadius: 10, overflow: "hidden" }}>
          {/* Quadrant lines */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border)" }} />
          {/* Quadrant labels */}
          <div style={{ position: "absolute", left: 8, top: 8, fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>High Quality / Low Reach</div>
          <div style={{ position: "absolute", right: 8, top: 8, fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>High Quality / High Reach</div>
          <div style={{ position: "absolute", left: 8, bottom: 8, fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Low Quality / Low Reach</div>
          <div style={{ position: "absolute", right: 8, bottom: 8, fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>Low Quality / High Reach</div>
          {/* Dots */}
          {competitors.map(c => (
            <div key={c.name} style={{ position: "absolute", left: `${c.x}%`, top: `${100 - c.y}%`, transform: "translate(-50%, -50%)" }}>
              <div style={{ width: c.size * 2, height: c.size * 2, borderRadius: "50%", background: c.color, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 3px ${c.color}30` }} />
              <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 4, fontSize: 11, fontWeight: 800, color: c.color, whiteSpace: "nowrap", background: "var(--surface)", padding: "1px 5px", borderRadius: 4 }}>{c.name}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
          {competitors.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
              <span style={{ color: "var(--text-muted)" }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Strategy Generator */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Zap size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>AI Strategy Generator</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Describe a strategic challenge or question and let the Marketing Director AI build a plan.</div>
        <textarea className="db-input" placeholder="e.g. We need to increase organic traffic by 50% in 60 days without increasing ad spend. What should our content and SEO team focus on?" rows={4} value={challenge} onChange={e => setChallenge(e.target.value)} style={{ width: "100%", resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={() => {
              if (!challenge.trim()) return;
              onSendToChat(`As OIA Properties' Marketing Director, I need a detailed strategic plan to address this challenge: ${challenge}\n\nPlease provide: 1) Executive summary of the strategic approach, 2) Specific action plan with timelines and owners, 3) KPIs to track success, 4) Budget considerations, 5) Key risks and mitigations.`);
              setChallenge("");
            }}>
            <Send size={13} /> Generate Strategy
          </button>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setChallenge("")}>Clear</button>
        </div>
      </div>

    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
function BudgetTab({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const budgetItems = [
    { category: "Paid Social", budget: 30000, spent: 24500, color: "#3B82F6", pct: 40, channels: "Meta, TikTok, Snapchat, LinkedIn" },
    { category: "Search Ads", budget: 20000, spent: 16800, color: "#EA4335", pct: 27, channels: "Google, Bing" },
    { category: "Content Creation", budget: 12000, spent: 9200, color: "#8B5CF6", pct: 16, channels: "Writing, design, video" },
    { category: "Influencer / PR", budget: 8000, spent: 4800, color: "#F59E0B", pct: 11, channels: "Partnerships, events" },
    { category: "Tools & Software", budget: 5000, spent: 3800, color: "#10B981", pct: 7, channels: "CRM, scheduling, analytics" },
  ];
  const totalBudget = 75000;
  const totalSpent = budgetItems.reduce((s, i) => s + i.spent, 0);

  const roiRows = [
    { channel: "Meta", spend: "AED 12,400", leads: 42, cpl: "AED 295", roas: "4.2x", rec: "Increase budget", recColor: "#10B981" },
    { channel: "Google", spend: "AED 9,300", leads: 28, cpl: "AED 332", roas: "3.8x", rec: "Maintain", recColor: COLOR },
    { channel: "TikTok", spend: "AED 1,800", leads: 12, cpl: "AED 150", roas: "5.1x", rec: "Increase budget", recColor: "#10B981" },
    { channel: "LinkedIn", spend: "AED 6,200", leads: 18, cpl: "AED 344", roas: "3.3x", rec: "Increase budget", recColor: "#10B981" },
    { channel: "Instagram", spend: "AED 4,650", leads: 8, cpl: "AED 581", roas: "2.1x", rec: "Review", recColor: "#F59E0B" },
    { channel: "Snapchat", spend: "AED 1,800", leads: 3, cpl: "AED 600", roas: "1.8x", rec: "Pause", recColor: "#EF4444" },
  ];

  const suggestions = [
    { icon: "↔️", title: "Reallocate AED 3K from Snapchat to TikTok", desc: "Snapchat CPL is AED 600 with 1.8x ROAS. TikTok shows 5.1x ROAS and is currently paused. Immediate reallocation to resume TikTok could yield +20 leads/month.", impact: "+20 leads/mo", color: COLOR },
    { icon: "🚀", title: "Add AED 5K to Google Shopping", desc: "Google Shopping is untapped — zero current spend on a high buyer-intent channel. Based on current Google Search ROAS of 3.8x, estimated +35 leads/month at AED 143 CPL.", impact: "+35 leads/mo", color: "#10B981" },
    { icon: "📈", title: "Increase LinkedIn by AED 2K/month", desc: "HNW investor targeting on LinkedIn improved ROAS from 2.7x to 3.3x (+22%) after audience refinement. Scale now while performance is improving.", impact: "+12 leads/mo", color: "#3B82F6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Budget Overview */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="db-card-title" style={{ margin: 0 }}>Monthly Budget Overview</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>AED {totalBudget.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AED {totalSpent.toLocaleString()} spent · {Math.round((totalSpent / totalBudget) * 100)}% used</div>
          </div>
        </div>
        {/* Stacked bar */}
        <div style={{ height: 32, borderRadius: 8, overflow: "hidden", display: "flex", marginBottom: 16 }}>
          {budgetItems.map(item => (
            <div key={item.category} style={{ width: `${item.pct}%`, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, overflow: "hidden" }} title={`${item.category}: ${item.pct}%`}>
              {item.pct >= 12 ? `${item.pct}%` : ""}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          {budgetItems.map(item => (
            <div key={item.category} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ color: "var(--text-muted)" }}>{item.category} ({item.pct}%)</span>
            </div>
          ))}
        </div>
        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Category", "Channels", "Budget", "Spent", "Remaining", "% Used"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetItems.map(item => {
              const remaining = item.budget - item.spent;
              const usedPct = Math.round((item.spent / item.budget) * 100);
              return (
                <tr key={item.category} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{item.category}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 10px", fontSize: 12, color: "var(--text-muted)" }}>{item.channels}</td>
                  <td style={{ padding: "10px 10px", fontWeight: 700, color: "var(--text)" }}>AED {item.budget.toLocaleString()}</td>
                  <td style={{ padding: "10px 10px", color: "var(--text)" }}>AED {item.spent.toLocaleString()}</td>
                  <td style={{ padding: "10px 10px", color: remaining > 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>AED {remaining.toLocaleString()}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${usedPct}%`, background: usedPct > 90 ? "#EF4444" : item.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: usedPct > 90 ? "#EF4444" : "var(--text)" }}>{usedPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ROI by Channel */}
      <div className="db-card">
        <div className="db-card-title" style={{ marginBottom: 14 }}>ROI by Channel</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Channel", "Spend", "Leads", "CPL", "ROAS", "Recommendation"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roiRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text)" }}>{r.channel}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{r.spend}</td>
                <td style={{ padding: "10px 12px", color: "var(--text)" }}>{r.leads}</td>
                <td style={{ padding: "10px 12px", color: "var(--text)" }}>{r.cpl}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: parseFloat(r.roas) >= 4 ? "#10B981" : parseFloat(r.roas) >= 3 ? COLOR : "#EF4444" }}>{r.roas}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: r.recColor + "20", color: r.recColor }}>{r.rec}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Budget Recommendations */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={16} color={COLOR} />
          <div className="db-card-title" style={{ margin: 0 }}>Budget Reallocation Suggestions</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 10, background: "var(--surface-2)", borderLeft: `3px solid ${s.color}` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Estimated impact</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: s.color }}>{s.impact}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          onClick={() => onSendToChat("Generate a detailed budget optimization plan for OIA Properties marketing. Current allocation: Paid Social AED 30,000 (40%), Search Ads AED 20,000 (27%), Content Creation AED 12,000 (16%), Influencer/PR AED 8,000 (11%), Tools AED 5,000 (7%). Total budget: AED 75,000/month. Current performance: 247 leads, 3.8x blended ROAS, AED 196 CPL. Snapchat underperforming (1.8x ROAS, AED 600 CPL). TikTok paused but showed 5.1x ROAS. Google Shopping not activated. LinkedIn improving (+22% ROAS this month). Recommend optimal budget reallocation to maximise leads and ROAS for next month. Include specific channel budgets, rationale, and expected outcomes.")}>
          <Send size={13} /> Get AI Budget Plan
          <ArrowUpRight size={13} />
        </button>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DirectorPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  const chatRef = useRef<{ sendMessage?: (msg: string) => void }>({});

  // Read ?tab= param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && ["Overview", "Reports", "Team", "Strategy", "Budget", "Chat"].includes(t)) {
      setTab(t as Tab);
    }
  }, []);

  // When a tab action sends to chat, switch to Chat tab
  const sendToChat = (msg: string) => {
    setChatMessage(msg);
    setTab("Chat");
  };

  const TABS: Tab[] = ["Overview", "Reports", "Team", "Strategy", "Budget", "Chat"];
  const TAB_ICONS: Record<Tab, React.ReactNode> = {
    Overview: <Layout size={14} />,
    Reports: <FileText size={14} />,
    Team: <Users size={14} />,
    Strategy: <Target size={14} />,
    Budget: <DollarSign size={14} />,
    Chat: <Zap size={14} />,
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div className="db-page-head" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: COLOR + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={18} color={COLOR} />
            </div>
            <h1 className="db-page-title" style={{ margin: 0 }}>Marketing Director</h1>
          </div>
          <p className="db-page-sub" style={{ margin: 0 }}>OIA Properties command centre — full visibility across campaigns, team, strategy, and budget.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface-2)", padding: "6px 12px", borderRadius: 8 }}>
            May 2026 · AED 75K budget
          </div>
          <button className="btn-primary" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => sendToChat("Generate this week's executive performance report for OIA Properties. Include total spend AED 48,500, 247 leads, 3.8x ROAS, top campaign Meta Aldar Yas Acres at 4.2x, organic reach 89,200, followers 24.5K. Provide board-ready executive summary with key wins, risks, and strategic recommendations.")}>
            <FileText size={13} /> Weekly Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontWeight: tab === t ? 700 : 500, color: tab === t ? COLOR : "var(--text-muted)", borderBottom: tab === t ? `2px solid ${COLOR}` : "2px solid transparent", marginBottom: -1, transition: "all 0.15s" }}>
            {TAB_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "Overview" && <OverviewTab />}
      {tab === "Reports" && <ReportsTab onSendToChat={sendToChat} />}
      {tab === "Team" && <TeamTab />}
      {tab === "Strategy" && <StrategyTab onSendToChat={sendToChat} />}
      {tab === "Budget" && <BudgetTab onSendToChat={sendToChat} />}
      {tab === "Chat" && (
        <AgentChat
          agentId="director"
          agentName="Marketing Director AI"
          agentColor={COLOR}
          description="Senior marketing intelligence for OIA Properties — executive reports, budget optimisation, cross-channel strategy, and competitive analysis."
          icon={<Settings size={18} color="#fff" />}
          quickActions={[
            "Generate this week's executive performance report",
            "Analyse our Q3 marketing ROI and recommend budget changes",
            "Compare OIA social performance vs PropertyFinder and Bayut",
            "Build a 90-day content and paid media strategy for OIA",
            "What's our best performing channel and why? What should we scale?",
            "Generate a board presentation on OIA marketing performance",
          ]}
          autoSend={chatMessage ?? undefined}
          onAutoSendDone={() => setChatMessage(null)}
        />
      )}
    </div>
  );
}
