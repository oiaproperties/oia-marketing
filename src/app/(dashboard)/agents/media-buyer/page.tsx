"use client";
import { useState, useEffect } from "react";
import { DollarSign, Lock } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR = "#F59E0B";
const AGENT_ID = "media-buyer";
const AGENT_NAME = "Media Buyer";
const AGENT_DESC =
  "I plan and execute ad campaigns, manage budgets across platforms, optimize bids, and maximize ROAS — always presenting a plan summary before making any changes.";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "Dashboard" | "Chat" | "Tools" | "Tasks" | "Kanban" | "Calendar" | "Todo" | "Reports";
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type EventType = "task" | "deadline" | "meeting" | "publish";
type Platform = "Meta" | "Google" | "TikTok" | "Snapchat" | "LinkedIn";
type CampaignStatus = "Active" | "Paused";

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

interface Campaign {
  name: string;
  platform: Platform;
  budgetPerDay: number;
  spend: number;
  roas: number;
  status: CampaignStatus;
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

const PLATFORM_COLORS: Record<Platform, string> = {
  Meta: "#1877F2",
  Google: "#4285F4",
  TikTok: "#000000",
  Snapchat: "#FFFC00",
  LinkedIn: "#0A66C2",
};

const DEMO_TASKS: Task[] = [
  { id: "mb-d1", title: "Launch Ramadan campaign on Meta", description: "Set up lead-gen ads targeting UAE Muslims, AED 500/day budget", priority: "High", status: "in_progress", dueDate: "2026-05-28", assignedBy: "Admin", tags: ["meta", "ramadan", "lead-gen"], createdAt: Date.now() - 86400000 },
  { id: "mb-d2", title: "Optimize Google Shopping bids", description: "Review ROAS per ad group, adjust bids using tROAS strategy", priority: "High", status: "todo", dueDate: "2026-06-02", assignedBy: "Admin", tags: ["google", "bids", "shopping"], createdAt: Date.now() - 43200000 },
  { id: "mb-d3", title: "A/B test new creative variants", description: "Compare video vs. static image for Dubai Marina listings", priority: "Medium", status: "review", dueDate: "2026-05-30", assignedBy: "Admin", tags: ["creative", "ab-test"], createdAt: Date.now() - 172800000 },
  { id: "mb-d4", title: "Review TikTok budget allocation", description: "TikTok underperforming vs Meta — consider reallocating 10% budget", priority: "Low", status: "todo", dueDate: "2026-06-10", assignedBy: "Admin", tags: ["tiktok", "budget"], createdAt: Date.now() - 259200000 },
];

const DEMO_TODOS: TodoItem[] = [
  { id: "mbt1", text: "Review weekly performance report", done: false },
  { id: "mbt2", text: "Update audience segments for Q2", done: true },
  { id: "mbt3", text: "Check competitor ad activity on Meta", done: false },
  { id: "mbt4", text: "Submit invoice for ad spend reimbursement", done: false },
  { id: "mbt5", text: "Set up conversion tracking on landing pages", done: false },
];

const DEMO_CAMPAIGNS: Campaign[] = [
  { name: "Dubai Marina Luxury Listings", platform: "Meta", budgetPerDay: 800, spend: 18400, roas: 4.5, status: "Active" },
  { name: "Google Branded Keywords", platform: "Google", budgetPerDay: 400, spend: 9200, roas: 6.1, status: "Active" },
  { name: "Downtown Dubai Apartments", platform: "Meta", budgetPerDay: 500, spend: 11500, roas: 3.8, status: "Active" },
  { name: "TikTok Brand Awareness", platform: "TikTok", budgetPerDay: 300, spend: 6900, roas: 2.9, status: "Paused" },
  { name: "Google Display — Retargeting", platform: "Google", budgetPerDay: 200, spend: 4600, roas: 3.2, status: "Active" },
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

// ─── Platform Badge ───────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: Platform }) {
  const bg = PLATFORM_COLORS[platform];
  const textColor = platform === "Snapchat" ? "#000" : "#fff";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      background: bg, color: textColor, whiteSpace: "nowrap",
    }}>{platform}</span>
  );
}

// ─── Media Buyer Tools Panel ──────────────────────────────────────────────────
function MediaBuyerToolsPanel({ onGoToTab }: { onGoToTab: (t: Tab) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Budget Calculator state
  const [budgetTotal, setBudgetTotal] = useState("");
  const [budgetPlatforms, setBudgetPlatforms] = useState<Record<string, boolean>>({ Meta: true, Google: true, TikTok: false, Snapchat: false, LinkedIn: false });
  const [budgetGoal, setBudgetGoal] = useState("Leads");
  const [budgetResult, setBudgetResult] = useState<{ platform: string; pct: number; aed: number; impressions: string; clicks: string; leads: string }[] | null>(null);

  // Campaign Planner state
  const [campaignForm, setCampaignForm] = useState({ name: "", objective: "Lead Generation", platform: "Meta", startDate: "", endDate: "", dailyBudget: "" });
  const [campaignPlan, setCampaignPlan] = useState<typeof campaignForm | null>(null);
  const [campaignConfirmed, setCampaignConfirmed] = useState(false);

  // Audience Builder state
  const [audience, setAudience] = useState({ ageMin: "25", ageMax: "55", gender: "All", location: "Dubai, UAE", interests: "", behaviors: "", lookalike: "" });
  const [audienceReach, setAudienceReach] = useState<string | null>(null);

  // ROI Analyzer state
  const [roi, setRoi] = useState({ spend: "", revenue: "", leads: "", cpl: "" });
  const [roiResult, setRoiResult] = useState<{ roas: string; roiPct: string; cpa: string; breakEven: string } | null>(null);

  // A/B Test Planner state
  const [abTest, setAbTest] = useState({ name: "", what: "Creative", hypothesis: "", duration: "14", budgetPerVariant: "" });
  const [abResult, setAbResult] = useState<typeof abTest | null>(null);

  // Bid Strategy state
  const [bidCampaign, setBidCampaign] = useState("Dubai Marina Luxury Listings");
  const [bidType, setBidType] = useState("Manual");
  const [bidTarget, setBidTarget] = useState("");
  const [bidResult, setBidResult] = useState<{ strategy: string; reasoning: string } | null>(null);

  // Performance Forecast state
  const [forecast, setForecast] = useState({ platform: "Meta", dailyBudget: "", objective: "Leads", ctr: "", cvr: "" });
  const [forecastResult, setForecastResult] = useState<{ impressions: number; clicks: number; conversions: number; cost: number; roas: number }[] | null>(null);

  // Creative Performance — static demo
  const creatives = [
    { name: "Marina Sunset Video", format: "Video 15s", platform: "Meta", ctr: "3.8%", conv: "4.2%", roas: "4.8x", status: "Winner" },
    { name: "Downtown Static Image", format: "Single Image", platform: "Meta", ctr: "1.9%", conv: "2.1%", roas: "2.9x", status: "Paused" },
    { name: "YAS Acres Carousel", format: "Carousel", platform: "Meta", ctr: "2.7%", conv: "3.1%", roas: "3.6x", status: "Active" },
    { name: "Google Responsive Ad", format: "Responsive Search", platform: "Google", ctr: "5.2%", conv: "6.8%", roas: "6.1x", status: "Winner" },
    { name: "TikTok Brand Reel", format: "Video 30s", platform: "TikTok", ctr: "1.1%", conv: "1.4%", roas: "2.1x", status: "Active" },
  ];

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const calculateBudget = () => {
    const total = parseFloat(budgetTotal);
    if (!total) return;
    const selected = Object.entries(budgetPlatforms).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) return;
    const splits: Record<string, number> = { Meta: 45, Google: 35, TikTok: 12, Snapchat: 5, LinkedIn: 3 };
    const totalPct = selected.reduce((s, p) => s + (splits[p] || 10), 0);
    const result = selected.map(p => {
      const pct = Math.round(((splits[p] || 10) / totalPct) * 100);
      const aed = Math.round(total * pct / 100);
      const cpm = p === "Meta" ? 45 : p === "Google" ? 60 : p === "TikTok" ? 35 : p === "Snapchat" ? 30 : 80;
      const impressions = Math.round((aed / cpm) * 1000).toLocaleString();
      const clickRate = p === "Google" ? 0.052 : 0.025;
      const clicks = Math.round((aed / cpm) * 1000 * clickRate).toLocaleString();
      const leadRate = budgetGoal === "Leads" ? 0.03 : budgetGoal === "Sales" ? 0.015 : 0;
      const leads = leadRate > 0 ? Math.round((aed / cpm) * 1000 * clickRate * leadRate).toLocaleString() : "N/A";
      return { platform: p, pct, aed, impressions, clicks, leads };
    });
    setBudgetResult(result);
  };

  const previewCampaignPlan = () => {
    if (!campaignForm.name || !campaignForm.startDate) return;
    setCampaignPlan({ ...campaignForm });
    setCampaignConfirmed(false);
  };

  const buildAudience = () => {
    const base = 1200000;
    const genderMod = audience.gender === "All" ? 1 : 0.5;
    const interestMod = audience.interests ? 0.6 : 1;
    const behaviorMod = audience.behaviors ? 0.7 : 1;
    const lookalikeMod = audience.lookalike ? 0.4 : 1;
    const ageRange = Math.min(parseInt(audience.ageMax) - parseInt(audience.ageMin), 40) / 40;
    const reach = Math.round(base * genderMod * interestMod * behaviorMod * lookalikeMod * ageRange);
    setAudienceReach(reach.toLocaleString());
  };

  const calculateROI = () => {
    const spend = parseFloat(roi.spend) || 0;
    const revenue = parseFloat(roi.revenue) || 0;
    const leads = parseFloat(roi.leads) || 0;
    const roas = spend > 0 ? (revenue / spend).toFixed(2) : "0";
    const roiPct = spend > 0 ? (((revenue - spend) / spend) * 100).toFixed(1) : "0";
    const cpa = leads > 0 ? (spend / leads).toFixed(0) : "N/A";
    const breakEven = revenue > 0 ? (spend / revenue * 100).toFixed(1) : "N/A";
    setRoiResult({ roas, roiPct, cpa: cpa !== "N/A" ? `AED ${cpa}` : "N/A", breakEven: breakEven !== "N/A" ? `${breakEven}%` : "N/A" });
  };

  const planAbTest = () => {
    if (!abTest.name) return;
    setAbResult({ ...abTest });
  };

  const recommendBidStrategy = () => {
    const strategies: Record<string, { strategy: string; reasoning: string }> = {
      "Manual": { strategy: "Switch to Target ROAS (tROAS 4.0x)", reasoning: "Manual bidding is leaving efficiency on the table. With enough conversion data (50+ conversions/month), tROAS will automatically maximize revenue at your target return." },
      "Target CPA": { strategy: "Keep Target CPA but lower by 10%", reasoning: "Your current CPA target is achievable. Tightening it by 10% will improve lead quality without significant volume loss." },
      "Target ROAS": { strategy: "Increase tROAS target from current to +0.5x", reasoning: "Campaign is hitting target consistently — you have room to push for higher ROAS by raising the target incrementally." },
      "Maximize Conversions": { strategy: "Set a Target CPA cap", reasoning: "Maximize Conversions without a cap can overspend on low-quality leads. Adding a Target CPA cap will improve efficiency." },
    };
    setInnerBidResult(strategies[bidType] || strategies["Manual"]);
  };

  const [innerBidResult, setInnerBidResult] = useState<{ strategy: string; reasoning: string } | null>(null);
  void bidResult; // suppress unused warning since we use innerBidResult instead
  void setBidResult;

  const runForecast = () => {
    const daily = parseFloat(forecast.dailyBudget) || 0;
    if (!daily) return;
    const cpm = forecast.platform === "Meta" ? 45 : forecast.platform === "Google" ? 60 : 35;
    const ctr = parseFloat(forecast.ctr) / 100 || 0.025;
    const cvr = parseFloat(forecast.cvr) / 100 || 0.03;
    const rows = Array.from({ length: 4 }, (_, i) => {
      const days = (i + 1) * 7;
      const impressions = Math.round((daily * days / cpm) * 1000);
      const clicks = Math.round(impressions * ctr);
      const conversions = Math.round(clicks * cvr);
      const cost = daily * days;
      const avgOrderValue = forecast.objective === "Sales" ? 850000 : forecast.objective === "Leads" ? 0 : 0;
      const roas = avgOrderValue > 0 && cost > 0 ? parseFloat(((conversions * avgOrderValue) / cost).toFixed(1)) : 0;
      return { impressions, clicks, conversions, cost, roas };
    });
    setForecastResult(rows);
  };

  const tools = [
    {
      id: "budget", icon: "💰", title: "Budget Calculator", desc: "Allocate budget across platforms with expected metrics",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="Total budget (AED)" type="number" value={budgetTotal} onChange={e => setBudgetTotal(e.target.value)} />
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>Platforms</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(Object.keys(budgetPlatforms) as Platform[]).map(p => (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={budgetPlatforms[p]} onChange={e => setBudgetPlatforms(prev => ({ ...prev, [p]: e.target.checked }))} />
                {p}
              </label>
            ))}
          </div>
          <select className="db-input" value={budgetGoal} onChange={e => setBudgetGoal(e.target.value)}>
            <option>Leads</option><option>Sales</option><option>Brand Awareness</option><option>Traffic</option>
          </select>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!budgetTotal} onClick={calculateBudget}>Calculate Split</button>
          {budgetResult && (
            <div className="db-card" style={{ background: "var(--surface-2)", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Recommended Budget Split</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Platform", "%", "AED", "Impressions", "Clicks", "Leads"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "3px 6px", color: "var(--text-muted)", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budgetResult.map(r => (
                    <tr key={r.platform} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "5px 6px" }}><PlatformBadge platform={r.platform as Platform} /></td>
                      <td style={{ padding: "5px 6px", fontWeight: 700, color: COLOR }}>{r.pct}%</td>
                      <td style={{ padding: "5px 6px", fontWeight: 700 }}>{r.aed.toLocaleString()}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-muted)" }}>{r.impressions}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-muted)" }}>{r.clicks}</td>
                      <td style={{ padding: "5px 6px", color: "#10B981", fontWeight: 700 }}>{r.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "campaign", icon: "🚀", title: "Campaign Planner", desc: "Plan a campaign — preview before confirming",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!campaignPlan ? (
            <>
              <input className="db-input" placeholder="Campaign name*" value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} />
              <select className="db-input" value={campaignForm.objective} onChange={e => setCampaignForm(p => ({ ...p, objective: e.target.value }))}>
                <option>Lead Generation</option><option>Traffic</option><option>Conversions</option><option>Brand Awareness</option><option>App Installs</option>
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select className="db-input" value={campaignForm.platform} onChange={e => setCampaignForm(p => ({ ...p, platform: e.target.value }))}>
                  <option>Meta</option><option>Google</option><option>TikTok</option><option>Snapchat</option><option>LinkedIn</option>
                </select>
                <input className="db-input" placeholder="Daily budget (AED)" type="number" value={campaignForm.dailyBudget} onChange={e => setCampaignForm(p => ({ ...p, dailyBudget: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Start Date</div>
                  <input type="date" className="db-input" value={campaignForm.startDate} onChange={e => setCampaignForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>End Date</div>
                  <input type="date" className="db-input" value={campaignForm.endDate} onChange={e => setCampaignForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <button className="btn-primary" style={{ fontSize: 13, background: COLOR, borderColor: COLOR }} disabled={!campaignForm.name || !campaignForm.startDate} onClick={previewCampaignPlan}>Preview Plan →</button>
            </>
          ) : campaignConfirmed ? (
            <div className="db-card" style={{ background: "#10B98110", border: "1px solid #10B981", padding: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#10B981", marginBottom: 4 }}>Campaign Queued</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Campaign queued for creation — backend will execute when connected.</div>
              <button className="btn-ghost" style={{ fontSize: 12, marginTop: 12 }} onClick={() => { setCampaignPlan(null); setCampaignConfirmed(false); }}>Plan Another Campaign</button>
            </div>
          ) : (
            <div>
              <div className="db-card" style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}40`, padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: COLOR, marginBottom: 10 }}>📋 Campaign Plan Summary</div>
                {[
                  { label: "Campaign Name", value: campaignPlan.name },
                  { label: "Objective", value: campaignPlan.objective },
                  { label: "Platform", value: campaignPlan.platform },
                  { label: "Daily Budget", value: campaignPlan.dailyBudget ? `AED ${campaignPlan.dailyBudget}` : "Not set" },
                  { label: "Start Date", value: campaignPlan.startDate || "TBD" },
                  { label: "End Date", value: campaignPlan.endDate || "Ongoing" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 10px", background: `${COLOR}20`, borderRadius: 8, fontSize: 12, color: COLOR }}>
                  <Lock size={13} />
                  <span>Review and confirm to proceed. This is your safety gate.</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: 13, background: "#10B981", borderColor: "#10B981" }} onClick={() => setCampaignConfirmed(true)}>CONFIRM — Create Campaign</button>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setCampaignPlan(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "audience", icon: "🎯", title: "Audience Builder", desc: "Build and estimate reach for custom audiences",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Age Range: {audience.ageMin} – {audience.ageMax}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="db-input" type="number" min={18} max={65} placeholder="Min age" value={audience.ageMin} onChange={e => setAudience(p => ({ ...p, ageMin: e.target.value }))} />
              <input className="db-input" type="number" min={18} max={65} placeholder="Max age" value={audience.ageMax} onChange={e => setAudience(p => ({ ...p, ageMax: e.target.value }))} />
            </div>
          </div>
          <select className="db-input" value={audience.gender} onChange={e => setAudience(p => ({ ...p, gender: e.target.value }))}>
            <option value="All">All Genders</option><option value="Male">Male</option><option value="Female">Female</option>
          </select>
          <input className="db-input" placeholder="Location (e.g. Dubai, Abu Dhabi)" value={audience.location} onChange={e => setAudience(p => ({ ...p, location: e.target.value }))} />
          <input className="db-input" placeholder="Interests (e.g. real estate, luxury, travel)" value={audience.interests} onChange={e => setAudience(p => ({ ...p, interests: e.target.value }))} />
          <input className="db-input" placeholder="Behaviors (e.g. property buyers, HNW individuals)" value={audience.behaviors} onChange={e => setAudience(p => ({ ...p, behaviors: e.target.value }))} />
          <input className="db-input" placeholder="Lookalike source (e.g. existing leads CRM)" value={audience.lookalike} onChange={e => setAudience(p => ({ ...p, lookalike: e.target.value }))} />
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={buildAudience}>Build Audience</button>
          {audienceReach && (
            <div className="db-card" style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}40`, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Estimated Reach</div>
              <div style={{ fontWeight: 800, fontSize: 28, color: COLOR }}>{audienceReach}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>people in your target audience</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "roi", icon: "📊", title: "ROI Analyzer", desc: "Calculate ROAS, ROI%, CPA, and break-even",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input className="db-input" placeholder="Ad Spend (AED)" type="number" value={roi.spend} onChange={e => setRoi(p => ({ ...p, spend: e.target.value }))} />
            <input className="db-input" placeholder="Revenue (AED)" type="number" value={roi.revenue} onChange={e => setRoi(p => ({ ...p, revenue: e.target.value }))} />
            <input className="db-input" placeholder="Leads generated" type="number" value={roi.leads} onChange={e => setRoi(p => ({ ...p, leads: e.target.value }))} />
            <input className="db-input" placeholder="Target CPL (AED)" type="number" value={roi.cpl} onChange={e => setRoi(p => ({ ...p, cpl: e.target.value }))} />
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!roi.spend} onClick={calculateROI}>Calculate ROI</button>
          {roiResult && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "ROAS", value: `${roiResult.roas}x`, color: parseFloat(roiResult.roas) >= 3 ? "#10B981" : "#EF4444" },
                { label: "ROI", value: `${roiResult.roiPct}%`, color: parseFloat(roiResult.roiPct) >= 0 ? "#10B981" : "#EF4444" },
                { label: "CPA", value: roiResult.cpa, color: COLOR },
                { label: "Break-Even", value: roiResult.breakEven, color: "var(--text)" },
              ].map(m => (
                <div key={m.label} className="db-card" style={{ textAlign: "center", padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "abtest", icon: "🧪", title: "A/B Test Planner", desc: "Plan split tests for creative, audience, or budget",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="db-input" placeholder="Test name*" value={abTest.name} onChange={e => setAbTest(p => ({ ...p, name: e.target.value }))} />
          <select className="db-input" value={abTest.what} onChange={e => setAbTest(p => ({ ...p, what: e.target.value }))}>
            <option>Creative</option><option>Audience</option><option>Placement</option><option>Budget Split</option>
          </select>
          <textarea className="db-input" rows={3} placeholder="Hypothesis (e.g. Video ads will generate 30% more leads than static images)" value={abTest.hypothesis} onChange={e => setAbTest(p => ({ ...p, hypothesis: e.target.value }))} style={{ resize: "none", fontFamily: "inherit" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Duration (days)</div>
              <input className="db-input" type="number" placeholder="14" value={abTest.duration} onChange={e => setAbTest(p => ({ ...p, duration: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Budget per Variant (AED)</div>
              <input className="db-input" type="number" placeholder="1000" value={abTest.budgetPerVariant} onChange={e => setAbTest(p => ({ ...p, budgetPerVariant: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!abTest.name} onClick={planAbTest}>Plan A/B Test</button>
          {abResult && (
            <div className="db-card" style={{ background: "var(--surface-2)", padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: COLOR, marginBottom: 8 }}>🧪 Test Setup Summary</div>
              {[
                { label: "Test Name", value: abResult.name },
                { label: "Testing", value: abResult.what },
                { label: "Duration", value: `${abResult.duration} days` },
                { label: "Budget/Variant", value: abResult.budgetPerVariant ? `AED ${abResult.budgetPerVariant}` : "Not set" },
                { label: "Total Budget", value: abResult.budgetPerVariant ? `AED ${parseInt(abResult.budgetPerVariant) * 2}` : "N/A" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{row.value}</span>
                </div>
              ))}
              {abResult.hypothesis && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, padding: "8px 10px", background: "var(--surface)", borderRadius: 7 }}><strong>Hypothesis:</strong> {abResult.hypothesis}</div>}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "bid", icon: "⚡", title: "Bid Strategy Optimizer", desc: "Get bid strategy recommendations per campaign",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select className="db-input" value={bidCampaign} onChange={e => setBidCampaign(e.target.value)}>
            {DEMO_CAMPAIGNS.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
          <select className="db-input" value={bidType} onChange={e => setBidType(e.target.value)}>
            <option>Manual</option><option>Target CPA</option><option>Target ROAS</option><option>Maximize Conversions</option>
          </select>
          <input className="db-input" placeholder="Target metric (e.g. AED 80 CPL or 4x ROAS)" value={bidTarget} onChange={e => setBidTarget(e.target.value)} />
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={recommendBidStrategy}>Recommend Strategy</button>
          {innerBidResult && (
            <div className="db-card" style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}40`, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: COLOR, marginBottom: 6 }}>💡 Recommended: {innerBidResult.strategy}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{innerBidResult.reasoning}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "forecast", icon: "📈", title: "Performance Forecast", desc: "30-day projection for your campaign",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select className="db-input" value={forecast.platform} onChange={e => setForecast(p => ({ ...p, platform: e.target.value }))}>
              <option>Meta</option><option>Google</option><option>TikTok</option>
            </select>
            <select className="db-input" value={forecast.objective} onChange={e => setForecast(p => ({ ...p, objective: e.target.value }))}>
              <option>Leads</option><option>Sales</option><option>Brand Awareness</option><option>Traffic</option>
            </select>
            <input className="db-input" placeholder="Daily budget (AED)" type="number" value={forecast.dailyBudget} onChange={e => setForecast(p => ({ ...p, dailyBudget: e.target.value }))} />
            <input className="db-input" placeholder="Historical CTR (%)" type="number" step="0.1" value={forecast.ctr} onChange={e => setForecast(p => ({ ...p, ctr: e.target.value }))} />
          </div>
          <input className="db-input" placeholder="Conversion Rate (%)" type="number" step="0.1" value={forecast.cvr} onChange={e => setForecast(p => ({ ...p, cvr: e.target.value }))} />
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={!forecast.dailyBudget} onClick={runForecast}>Generate Forecast</button>
          {forecastResult && (
            <div className="db-card" style={{ background: "var(--surface-2)", padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", marginBottom: 8 }}>30-Day Projection</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Week", "Impressions", "Clicks", "Conversions", "Cost (AED)", "ROAS"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "3px 6px", color: "var(--text-muted)", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecastResult.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "5px 6px", fontWeight: 700, color: "var(--text)" }}>Week {i + 1}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-muted)" }}>{row.impressions.toLocaleString()}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-muted)" }}>{row.clicks.toLocaleString()}</td>
                      <td style={{ padding: "5px 6px", fontWeight: 700, color: "#10B981" }}>{row.conversions.toLocaleString()}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text)" }}>AED {row.cost.toLocaleString()}</td>
                      <td style={{ padding: "5px 6px", fontWeight: 700, color: row.roas >= 3 ? "#10B981" : row.roas > 0 ? COLOR : "var(--text-muted)" }}>{row.roas > 0 ? `${row.roas}x` : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "creative", icon: "🎨", title: "Creative Performance", desc: "Analyze creative assets and surface winners",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Name", "Format", "Platform", "CTR", "Conv Rate", "ROAS", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "4px 6px", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creatives.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 6px", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{c.name}</td>
                    <td style={{ padding: "7px 6px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{c.format}</td>
                    <td style={{ padding: "7px 6px" }}><PlatformBadge platform={c.platform as Platform} /></td>
                    <td style={{ padding: "7px 6px", fontWeight: 700, color: parseFloat(c.ctr) >= 3 ? "#10B981" : COLOR }}>{c.ctr}</td>
                    <td style={{ padding: "7px 6px", color: "var(--text-muted)" }}>{c.conv}</td>
                    <td style={{ padding: "7px 6px", fontWeight: 700, color: parseFloat(c.roas) >= 4 ? "#10B981" : "var(--text)" }}>{c.roas}</td>
                    <td style={{ padding: "7px 6px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: c.status === "Winner" ? "#10B98120" : c.status === "Paused" ? "#EF444420" : `${COLOR}20`,
                        color: c.status === "Winner" ? "#10B981" : c.status === "Paused" ? "#EF4444" : COLOR,
                      }}>{c.status === "Winner" ? "🏆 Winner" : c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => {
            const underperformers = creatives.filter(c => parseFloat(c.roas) < 3).map(c => c.name).join(", ");
            alert(underperformers ? `Recommendation: Pause underperformers — ${underperformers}. Reallocate budget to winners.` : "All creatives are performing above 3x ROAS. Keep running!");
          }}>Analyze &amp; Recommend</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="db-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="db-card-title">Media Buyer Tools</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click a tool to expand. Campaign Planner has a safety gate — preview before confirming.</div>
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_mb_tasks", DEMO_TASKS);
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
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Assign tasks to the Media Buyer</div>
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
            <input className="db-input" placeholder="Tags (meta, google, budget, campaign...)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
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
                  {task.tags.map(tag => <span key={tag} style={{ fontSize: 11, color: COLOR, background: COLOR + "15", padding: "2px 8px", borderRadius: 99 }}>{tag}</span>)}
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_mb_tasks", DEMO_TASKS);
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
                    {task.tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{task.tags.map(tag => <span key={tag} style={{ fontSize: 10, color: COLOR, background: COLOR + "15", padding: "1px 6px", borderRadius: 99 }}>{tag}</span>)}</div>}
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
  const [events, setEvents] = useLocalState<CalEvent[]>("oia_mb_events", []);
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
        <div><div className="db-card-title">Calendar</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track campaign launches, deadlines, and review meetings</div></div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(v => !v)}>{showAdd ? "Cancel" : "+ Add Event"}</button>
      </div>

      {showAdd && (
        <div className="db-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <input className="db-input" placeholder="Event title" value={newEv.title} onChange={e => setNewEv(p => ({ ...p, title: e.target.value }))} />
            <input type="date" className="db-input" value={newEv.date} onChange={e => setNewEv(p => ({ ...p, date: e.target.value }))} />
            <select className="db-input" value={newEv.type} onChange={e => setNewEv(p => ({ ...p, type: e.target.value as EventType }))}>
              <option value="task">Task</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option><option value="publish">Launch</option>
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
                  background: isToday ? COLOR : "none",
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
  const [todos, setTodos] = useLocalState<TodoItem[]>("oia_mb_todos", DEMO_TODOS);
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
          <div style={{ height: "100%", background: COLOR, width: `${(done / todos.length) * 100}%`, borderRadius: 99, transition: "width 0.3s" }} />
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
              <button onClick={() => toggle(todo.id)} style={{ width: 18, height: 18, borderRadius: 5, background: COLOR, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  const [tasks] = useLocalState<Task[]>("oia_mb_tasks", DEMO_TASKS);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;

  const monthlySpend = [
    { month: "Jan", spend: 36000 }, { month: "Feb", spend: 41000 }, { month: "Mar", spend: 45000 },
    { month: "Apr", spend: 39000 }, { month: "May", spend: 48500 }, { month: "Jun", spend: 0 },
  ];
  const maxSpend = Math.max(...monthlySpend.map(m => m.spend));

  const platformRoas = [
    { platform: "Meta", roas: 4.2, color: "#1877F2" },
    { platform: "Google", roas: 3.6, color: "#4285F4" },
    { platform: "TikTok", roas: 3.1, color: "#000000" },
  ];

  const campaignPerf = [
    { name: "Dubai Marina Luxury Listings", spend: "AED 18,400", leads: 204, cpl: "AED 90", roas: "4.5x" },
    { name: "Google Branded Keywords", spend: "AED 9,200", leads: 156, cpl: "AED 59", roas: "6.1x" },
    { name: "Downtown Dubai Apartments", spend: "AED 11,500", leads: 138, cpl: "AED 83", roas: "3.8x" },
    { name: "TikTok Brand Awareness", spend: "AED 6,900", leads: 69, cpl: "AED 100", roas: "2.9x" },
    { name: "Google Display Retargeting", spend: "AED 4,600", leads: 61, cpl: "AED 75", roas: "3.2x" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Reports &amp; Analytics</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Media Buyer performance overview</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Tasks", value: total, icon: "📋", color: "#3B82F6" },
          { label: "Completed", value: done, icon: "✅", color: "#10B981" },
          { label: "In Progress", value: inProgress, icon: "⚙️", color: COLOR },
          { label: "Monthly Spend", value: "AED 48.5K", icon: "💰", color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="db-card">
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Monthly Spend Bar Chart */}
        <div className="db-card">
          <div className="db-card-title">Monthly Ad Spend (AED)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {monthlySpend.map(m => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700 }}>{m.spend > 0 ? `${(m.spend / 1000).toFixed(0)}K` : ""}</div>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: m.spend > 0 ? `${(m.spend / maxSpend) * 80}px` : "4px",
                  background: m.spend > 0 ? COLOR : "var(--border)",
                  transition: "height 0.3s",
                }} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform ROAS Comparison */}
        <div className="db-card">
          <div className="db-card-title">ROAS by Platform</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platformRoas.map(p => (
              <div key={p.platform}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{p.platform}</span>
                  <span style={{ fontWeight: 800, color: p.color }}>{p.roas}x</span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: p.color, width: `${(p.roas / 7) * 100}%`, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="db-card" style={{ marginBottom: 12 }}>
        <div className="db-card-title">Campaign Performance</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Campaign", "Spend", "Leads", "CPL", "ROAS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaignPerf.map(c => (
                <tr key={c.name} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "7px 8px", fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                  <td style={{ padding: "7px 8px", color: "var(--text-muted)" }}>{c.spend}</td>
                  <td style={{ padding: "7px 8px", fontWeight: 700, color: "#10B981" }}>{c.leads}</td>
                  <td style={{ padding: "7px 8px", color: "var(--text)" }}>{c.cpl}</td>
                  <td style={{ padding: "7px 8px", fontWeight: 800, color: parseFloat(c.roas) >= 4 ? "#10B981" : parseFloat(c.roas) >= 3 ? COLOR : "#EF4444" }}>{c.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="db-card">
        <div className="db-card-title">Budget Utilization Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { platform: "Meta", allocated: 21825, spent: 18400, color: "#1877F2" },
            { platform: "Google", allocated: 16975, spent: 13800, color: "#4285F4" },
            { platform: "TikTok", allocated: 9700, spent: 6900, color: "#888" },
          ].map(b => {
            const pct = Math.round((b.spent / b.allocated) * 100);
            return (
              <div key={b.platform} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{b.platform}</div>
                <div style={{ position: "relative", width: 70, height: 70, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--border)" strokeWidth="7" />
                    <circle cx="35" cy="35" r="28" fill="none"
                      stroke={b.color} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 175.9} 175.9`}
                      transform="rotate(-90 35 35)" />
                  </svg>
                  <span style={{ position: "absolute", fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>AED {b.spent.toLocaleString()} / {b.allocated.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Panel ──────────────────────────────────────────────────────────
function MediaBuyerDashboard({ onGoToTab }: { onGoToTab: (t: Tab) => void }) {
  const [tasks] = useLocalState<Task[]>("oia_mb_tasks", DEMO_TASKS);
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const kpis = [
    { label: "Total Ad Spend", value: "AED 48,500", change: "+12% MoM", icon: "💰", color: COLOR },
    { label: "ROAS", value: "3.8x", change: "+0.4x", icon: "📈", color: "#10B981" },
    { label: "Active Campaigns", value: "12", change: "across 3 platforms", icon: "🚀", color: "#3B82F6" },
    { label: "Cost Per Lead", value: "AED 84", change: "-AED 11", icon: "🎯", color: "#8B5CF6" },
  ];

  const platformBudget = [
    { platform: "Meta" as Platform, pct: 45, aed: 21825 },
    { platform: "Google" as Platform, pct: 35, aed: 16975 },
    { platform: "TikTok" as Platform, pct: 20, aed: 9700 },
  ];

  const platformRoas = [
    { platform: "Meta", roas: 4.2, color: "#1877F2" },
    { platform: "Google", roas: 3.6, color: "#4285F4" },
    { platform: "TikTok", roas: 3.1, color: "#000" },
  ];

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

      {/* Active Campaigns Table */}
      <div className="db-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="db-card-title" style={{ margin: 0 }}>Active Campaigns</div>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Tools")}>Plan Campaign →</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Campaign", "Platform", "Budget/Day", "Spend", "ROAS", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_CAMPAIGNS.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 8px", fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                  <td style={{ padding: "8px 8px" }}><PlatformBadge platform={c.platform} /></td>
                  <td style={{ padding: "8px 8px", color: "var(--text-muted)" }}>AED {c.budgetPerDay.toLocaleString()}</td>
                  <td style={{ padding: "8px 8px", fontWeight: 700, color: "var(--text)" }}>AED {c.spend.toLocaleString()}</td>
                  <td style={{ padding: "8px 8px", fontWeight: 800, color: c.roas >= 4 ? "#10B981" : c.roas >= 3 ? COLOR : "#EF4444" }}>{c.roas}x</td>
                  <td style={{ padding: "8px 8px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      background: c.status === "Active" ? "#10B98120" : "#EF444420",
                      color: c.status === "Active" ? "#10B981" : "#EF4444",
                    }}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Platform Budget Split */}
        <div className="db-card">
          <div className="db-card-title">Platform Budget Split</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platformBudget.map(p => (
              <div key={p.platform}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <PlatformBadge platform={p.platform} />
                    <span style={{ color: "var(--text-muted)" }}>AED {p.aed.toLocaleString()}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: COLOR }}>{p.pct}%</span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: PLATFORM_COLORS[p.platform], width: `${p.pct}%`, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROAS by Platform */}
        <div className="db-card">
          <div className="db-card-title">ROAS by Platform</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platformRoas.map(p => (
              <div key={p.platform}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{p.platform}</span>
                  <span style={{ fontWeight: 800, color: p.color }}>{p.roas}x ROAS</span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: p.color, width: `${(p.roas / 7) * 100}%`, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Gate Notice */}
      <div className="db-card" style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}50`, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Lock size={18} color={COLOR} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLOR, marginBottom: 3 }}>Safety Gate — Confirm Before Execution</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              All campaign changes require your CONFIRM before execution — Media Buyer will always show a plan summary first.
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="db-card">
          <div className="db-card-title">Task Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Open", value: openTasks, color: COLOR },
              { label: "Done", value: doneTasks, color: "#10B981" },
              { label: "Total", value: tasks.length, color: "#3B82F6" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", background: "var(--surface-2)", borderRadius: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => onGoToTab("Tasks")}>View all tasks →</button>
        </div>

        <div className="db-card">
          <div className="db-card-title">Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "💰 Calculate Budget", tab: "Tools" as Tab },
              { label: "🚀 Plan Campaign", tab: "Tools" as Tab },
              { label: "🎯 Build Audience", tab: "Tools" as Tab },
              { label: "📊 Analyze ROI", tab: "Tools" as Tab },
              { label: "🧪 Run A/B Test", tab: "Tools" as Tab },
              { label: "⚡ Optimize Bids", tab: "Tools" as Tab },
            ].map(a => (
              <button key={a.label} className="btn-ghost"
                style={{ textAlign: "left", fontSize: 12, padding: "8px 10px", fontWeight: 500 }}
                onClick={() => onGoToTab(a.tab)}>
                {a.label}
              </button>
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
  "What is my current ROAS across all platforms?",
  "Plan a new lead-gen campaign for Dubai Marina properties",
  "Analyze my TikTok ad performance and suggest improvements",
  "Split AED 50,000 budget across Meta, Google, and TikTok",
  "Which campaign should I pause to improve overall ROAS?",
  "Build an audience targeting HNW individuals in Dubai",
];

export default function MediaBuyerPage() {
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
          <h1 className="db-page-title">{AGENT_NAME}</h1>
          <p className="db-page-sub">{AGENT_DESC}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : "btn-ghost"} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            {t === "Chat" && <DollarSign size={13} />}
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && <MediaBuyerDashboard onGoToTab={setTab} />}
      {tab === "Chat" && (
        <AgentChat
          agentId={AGENT_ID}
          agentName={AGENT_NAME}
          agentColor={COLOR}
          description={AGENT_DESC}
          icon={<DollarSign size={18} color="#fff" />}
          quickActions={QUICK_ACTIONS}
          autoSend={autoSend}
          onAutoSendDone={() => setAutoSend(undefined)}
        />
      )}
      {tab === "Tools" && <MediaBuyerToolsPanel onGoToTab={setTab} />}
      {tab === "Tasks" && <TasksPanel />}
      {tab === "Kanban" && <KanbanPanel />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Todo" && <TodoPanel />}
      {tab === "Reports" && <ReportsPanel />}

    </div>
  );
}
