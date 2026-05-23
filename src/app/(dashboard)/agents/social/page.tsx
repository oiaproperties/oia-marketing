"use client";
import { useState, useEffect } from "react";
import {
  Share2, Clock, Image, Video, FileText, Hash, Zap, Wrench,
} from "lucide-react";
import { SiInstagram, SiFacebook, SiSnapchat, SiTiktok } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";
import AgentChat from "@/components/agents/AgentChat";

// ─── Types ─────────────────────────────────────────────────────────────────
type MainTab = "Dashboard" | "Chat" | "Tools" | "Tasks" | "Kanban" | "Calendar" | "Todo" | "Reports";
type PlatformTab = "General" | "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "Snapchat";
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type EventType = "task" | "deadline" | "meeting" | "publish";

interface Task {
  id: string; title: string; description: string; priority: Priority; status: TaskStatus;
  dueDate: string; assignedBy: string; tags: string[]; createdAt: number;
}
interface CalEvent { id: string; title: string; date: string; type: EventType; }
interface TodoItem { id: string; text: string; done: boolean; }

interface PlatformSpec {
  color: string;
  textColor?: string;
  icon: React.ReactNode;
  audience: string;
  bestTimes: string[];
  specs: { label: string; value: string; icon: React.ReactNode }[];
  quickActions: string[];
  contentTypes: { label: string; icon: React.ReactNode; desc: string }[];
}

// ─── Constants ─────────────────────────────────────────────────────────────
const COLOR = "#3B82F6";
const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const PRIORITY_COLORS: Record<Priority, string> = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };
const EVENT_COLORS: Record<EventType, string> = { task: "#3B82F6", deadline: "#EF4444", meeting: "#8B5CF6", publish: "#10B981" };
const STATUS_COLS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "📋 To Do" },
  { id: "in_progress", label: "⚙️ In Progress" },
  { id: "review", label: "👀 Review" },
  { id: "done", label: "✅ Done" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TODAY = new Date();

const DEMO_TASKS: Task[] = [
  { id: "sm-d1", title: "Build July content calendar across all platforms", description: "30-day calendar: Instagram, Facebook, LinkedIn, TikTok, Snapchat", priority: "High", status: "in_progress", dueDate: "2026-06-01", assignedBy: "Admin", tags: ["calendar", "strategy"], createdAt: Date.now() - 86400000 },
  { id: "sm-d2", title: "Plan Instagram campaign for Aldar Yas Acres launch", description: "Stories, feed posts, Reels — 2-week campaign sequence", priority: "High", status: "todo", dueDate: "2026-06-05", assignedBy: "Admin", tags: ["Instagram", "campaign"], createdAt: Date.now() - 43200000 },
  { id: "sm-d3", title: "Analyse competitor Instagram performance Q2", description: "PropertyFinder.ae vs Bayut.com — follower growth, engagement, content themes", priority: "Medium", status: "review", dueDate: "2026-05-27", assignedBy: "Admin", tags: ["analytics", "competitor"], createdAt: Date.now() - 172800000 },
];

const DEMO_TODOS: TodoItem[] = [
  { id: "sm-t1", text: "Update all platform bios with new OIA tagline", done: false },
  { id: "sm-t2", text: "Schedule week 1 posts across all platforms", done: true },
  { id: "sm-t3", text: "Reply to all pending Instagram comments", done: false },
  { id: "sm-t4", text: "Set up TikTok business account for OIA", done: false },
  { id: "sm-t5", text: "Create Snapchat geofilter for open day event", done: false },
];

const PLATFORMS: Record<Exclude<PlatformTab, "General">, PlatformSpec> = {
  Instagram: {
    color: "#E1306C", icon: <SiInstagram size={15} />,
    audience: "Visual-first — UAE expats, HNW millennials, lifestyle buyers",
    bestTimes: ["6:00–8:00 AM GST", "12:00–2:00 PM GST", "8:00–10:00 PM GST"],
    specs: [
      { label: "Feed Caption", value: "2,200 chars", icon: <FileText size={12} /> },
      { label: "Story Text", value: "250 chars", icon: <FileText size={12} /> },
      { label: "Hashtags", value: "Max 30", icon: <Hash size={12} /> },
      { label: "Feed Image", value: "1080×1080 px", icon: <Image size={12} /> },
      { label: "Story/Reel", value: "1080×1920 px", icon: <Video size={12} /> },
      { label: "Reel Length", value: "Up to 90 sec", icon: <Clock size={12} /> },
    ],
    quickActions: [
      "Write 5 Instagram captions for Aldar Yas Acres launch",
      "Create an Instagram Reel script for OIA luxury property tour",
      "Generate 30 relevant hashtags for Dubai real estate",
      "Plan a week of Instagram feed posts for OIA Dubai",
      "Write an Instagram Story sequence for a property open day",
      "Create a carousel post script about buying property in Dubai",
    ],
    contentTypes: [
      { label: "Feed Post", icon: <Image size={14} />, desc: "Square or portrait, up to 10 images" },
      { label: "Reel", icon: <Video size={14} />, desc: "Short-form vertical video up to 90s" },
      { label: "Story", icon: <Zap size={14} />, desc: "Full-screen 24-hour content" },
      { label: "Carousel", icon: <FileText size={14} />, desc: "Swipeable multi-image post" },
    ],
  },
  Facebook: {
    color: "#1877F2", icon: <SiFacebook size={15} />,
    audience: "Broad reach — UAE nationals, expats 35+, family buyers",
    bestTimes: ["9:00–11:00 AM GST", "1:00–3:00 PM GST", "7:00–9:00 PM GST"],
    specs: [
      { label: "Post Text", value: "63,206 chars", icon: <FileText size={12} /> },
      { label: "Ad Headline", value: "40 chars", icon: <FileText size={12} /> },
      { label: "Ad Body", value: "125 chars", icon: <FileText size={12} /> },
      { label: "Feed Image", value: "1200×630 px", icon: <Image size={12} /> },
      { label: "Cover Photo", value: "820×312 px", icon: <Image size={12} /> },
      { label: "Video Length", value: "Up to 240 min", icon: <Video size={12} /> },
    ],
    quickActions: [
      "Write a Facebook property listing post for Aldar Yas Acres",
      "Create a Facebook Lead Ad copy for luxury Dubai apartments",
      "Draft a Facebook event description for property open day",
      "Write a Facebook Group post about UAE real estate investment",
      "Create a Facebook video script for property walkthrough",
      "Plan a week of Facebook content for OIA Dubai page",
    ],
    contentTypes: [
      { label: "Feed Post", icon: <FileText size={14} />, desc: "Text, photo, or link post" },
      { label: "Lead Ad", icon: <Zap size={14} />, desc: "In-platform lead capture form" },
      { label: "Video", icon: <Video size={14} />, desc: "Native video up to 4 hours" },
      { label: "Event", icon: <Clock size={14} />, desc: "Property open days and launches" },
    ],
  },
  LinkedIn: {
    color: "#0A66C2", icon: <FaLinkedinIn size={15} />,
    audience: "Professional — HNW executives, investors, expat decision-makers",
    bestTimes: ["7:00–9:00 AM GST", "12:00–1:00 PM GST", "5:00–6:00 PM GST"],
    specs: [
      { label: "Post Text", value: "3,000 chars", icon: <FileText size={12} /> },
      { label: "Article", value: "125,000 chars", icon: <FileText size={12} /> },
      { label: "Hashtags", value: "3–5 recommended", icon: <Hash size={12} /> },
      { label: "Image", value: "1200×627 px", icon: <Image size={12} /> },
      { label: "Video", value: "Up to 10 min", icon: <Video size={12} /> },
      { label: "Carousel", value: "Up to 300 pages", icon: <FileText size={12} /> },
    ],
    quickActions: [
      "Write a LinkedIn article about UAE real estate investment ROI",
      "Create a LinkedIn post announcing OIA Dubai project launch",
      "Draft thought leadership content on Dubai luxury market trends",
      "Write a LinkedIn carousel about top 5 reasons to invest in UAE",
      "Create a LinkedIn company page update for OIA Dubai",
      "Draft an outreach message for HNW investor connections",
    ],
    contentTypes: [
      { label: "Post", icon: <FileText size={14} />, desc: "Short-form professional update" },
      { label: "Article", icon: <FileText size={14} />, desc: "Long-form thought leadership" },
      { label: "Carousel", icon: <Image size={14} />, desc: "Document-style swipeable slides" },
      { label: "Video", icon: <Video size={14} />, desc: "Native video up to 10 minutes" },
    ],
  },
  TikTok: {
    color: "#010101", icon: <SiTiktok size={15} />,
    audience: "Gen Z & millennials — young UAE residents, viral discovery",
    bestTimes: ["6:00–10:00 AM GST", "7:00–9:00 PM GST", "10:00 PM–12:00 AM GST"],
    specs: [
      { label: "Caption", value: "2,200 chars", icon: <FileText size={12} /> },
      { label: "Hashtags", value: "Unlimited, 3–8 recommended", icon: <Hash size={12} /> },
      { label: "Video Format", value: "1080×1920 px (9:16)", icon: <Video size={12} /> },
      { label: "Video Length", value: "15s – 10 min", icon: <Clock size={12} /> },
      { label: "Profile Pic", value: "200×200 px", icon: <Image size={12} /> },
      { label: "Ad Video", value: "9–60 sec optimal", icon: <Video size={12} /> },
    ],
    quickActions: [
      "Write a TikTok script for an OIA luxury apartment tour (60 sec)",
      "Create a viral TikTok hook for Dubai real estate content",
      "Generate trending hashtags for Dubai property TikTok",
      "Write a TikTok 'Day in the Life at Aldar Yas Acres' script",
      "Create a TikTok series plan for OIA property showcases",
      "Draft a TikTok ad script targeting young UAE residents",
    ],
    contentTypes: [
      { label: "Short Video", icon: <Video size={14} />, desc: "15–60 second viral content" },
      { label: "Long Video", icon: <Video size={14} />, desc: "Up to 10 minutes for walkthroughs" },
      { label: "Duet/Stitch", icon: <Share2 size={14} />, desc: "Collaborative reactive content" },
      { label: "Spark Ad", icon: <Zap size={14} />, desc: "Boost organic TikTok posts as ads" },
    ],
  },
  Snapchat: {
    color: "#FFFC00", textColor: "#7A6E00", icon: <SiSnapchat size={15} />,
    audience: "UAE youth & young adults — under 35, discovery-driven",
    bestTimes: ["8:00–10:00 AM GST", "3:00–5:00 PM GST", "9:00–11:00 PM GST"],
    specs: [
      { label: "Snap Caption", value: "250 chars", icon: <FileText size={12} /> },
      { label: "Story Length", value: "Up to 60 sec per snap", icon: <Clock size={12} /> },
      { label: "Video Format", value: "1080×1920 px (9:16)", icon: <Video size={12} /> },
      { label: "Ad Headline", value: "34 chars", icon: <FileText size={12} /> },
      { label: "Ad Body", value: "90 chars", icon: <FileText size={12} /> },
      { label: "Collection Ad", value: "Up to 4 tiles", icon: <Image size={12} /> },
    ],
    quickActions: [
      "Write a Snapchat Story sequence for OIA property launch",
      "Create a Snapchat ad script targeting UAE youth (18–34)",
      "Draft Snapchat Discover content for Dubai lifestyle property",
      "Write snappy captions for a Snapchat property tour",
      "Plan a Snapchat geofilter campaign for OIA open day",
      "Create a Collection Ad copy for Aldar Yas Acres on Snapchat",
    ],
    contentTypes: [
      { label: "Snap Story", icon: <Zap size={14} />, desc: "Sequential 24-hour snaps" },
      { label: "Snap Ad", icon: <Video size={14} />, desc: "Full-screen vertical video ad" },
      { label: "Collection Ad", icon: <Image size={14} />, desc: "Product tile showcase" },
      { label: "Geofilter", icon: <Share2 size={14} />, desc: "Location-based branded overlay" },
    ],
  },
};

const CHAT_QUICK_ACTIONS = [
  "Build a 30-day content calendar across Instagram, Facebook, LinkedIn, TikTok & Snapchat",
  "What are the best posting times for each platform in UAE timezone?",
  "Create a unified content strategy for OIA Dubai across all platforms",
  "Analyse which platform performs best for luxury real estate in Dubai",
  "Repurpose one blog post into content for all 5 platforms",
  "Plan a campaign launch sequence across all social platforms",
];

// ─── Hook: localStorage persistence ─────────────────────────────────────────
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

// ─── Platform Panel ───────────────────────────────────────────────────────────
function PlatformPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [platform, setPlatform] = useState<PlatformTab>("General");
  const spec = platform !== "General" ? PLATFORMS[platform] : null;

  return (
    <div>
      {/* Platform sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {(["General","Instagram","Facebook","LinkedIn","TikTok","Snapchat"] as PlatformTab[]).map(p => {
          const s = p !== "General" ? PLATFORMS[p] : null;
          const active = platform === p;
          return (
            <button key={p} onClick={() => setPlatform(p)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: active ? 700 : 500, background: active ? (s?.color ?? COLOR) : "var(--surface-2)", color: active ? (p === "Snapchat" ? "#111" : "#fff") : "var(--text-muted)", transition: "all 0.15s" }}>
              {s ? s.icon : <Share2 size={15} />}{p}
            </button>
          );
        })}
      </div>

      {platform === "General" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {(Object.entries(PLATFORMS) as [string, PlatformSpec][]).map(([name, s]) => (
            <div key={name} className="db-card" style={{ cursor: "pointer", borderLeft: `3px solid ${s.color}`, transition: "border-color 0.15s" }} onClick={() => setPlatform(name as PlatformTab)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: s.color + "20", color: s.textColor ?? s.color, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.audience}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {s.bestTimes.map(t => <span key={t} style={{ fontSize: 10, color: s.textColor ?? s.color, background: s.color + "15", padding: "2px 7px", borderRadius: 99 }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {spec && platform !== "General" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="db-card" style={{ borderLeft: `3px solid ${spec.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: spec.color + "20", color: spec.textColor ?? spec.color, flexShrink: 0 }}>{spec.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{platform}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{spec.audience}</div>
                </div>
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-title">Platform Specs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {spec.specs.map(s => (
                  <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>{s.icon} {s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: spec.textColor ?? spec.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-title">Content Types</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {spec.contentTypes.map(ct => (
                  <div key={ct.label} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: spec.color + "15", color: spec.textColor ?? spec.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{ct.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 2 }}>{ct.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{ct.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-title">Best Posting Times (GST / UAE)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {spec.bestTimes.map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, background: spec.color + "15", color: spec.textColor ?? spec.color, padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}><Clock size={11} /> {t}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="db-card">
              <div className="db-card-title">{platform} Quick Actions</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Click any action to send it to the Social Media agent.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {spec.quickActions.map(action => (
                  <button key={action} style={{ textAlign: "left", whiteSpace: "normal", lineHeight: 1.4, fontSize: 12, padding: "9px 12px", borderRadius: 7, background: "var(--surface-2)", border: `1px solid ${spec.color}30`, cursor: "pointer", color: "var(--text)", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = spec.color)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = spec.color + "30")}
                    onClick={() => onSendToChat(action)}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Social Tools Panel ───────────────────────────────────────────────────────
function SocialToolsPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cal, setCal] = useState({ platforms: "Instagram, Facebook, LinkedIn", duration: "30", goal: "brand awareness" });
  const [campaign, setCampaign] = useState({ name: "", goal: "brand awareness", budget: "", duration: "", platforms: "" });
  const [growthGoal, setGrowthGoal] = useState({ platform: "Instagram", currentFollowers: "", targetFollowers: "", timeline: "3 months" });
  const [crisis, setCrisis] = useState({ type: "negative review", platform: "Instagram", summary: "" });
  const [profile, setProfile] = useState({ platform: "Instagram", handle: "" });
  const [competitor, setCompetitor] = useState({ mine: "", theirs: "", platform: "Instagram" });
  const [engCalc, setEngCalc] = useState({ followers: "", likes: "", comments: "", shares: "" });
  const [engResult, setEngResult] = useState<{ rate: number; benchmark: number; rating: string } | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const calcEngagement = () => {
    const f = parseFloat(engCalc.followers) || 0;
    const interactions = (parseFloat(engCalc.likes) || 0) + (parseFloat(engCalc.comments) || 0) + (parseFloat(engCalc.shares) || 0);
    const rate = f > 0 ? (interactions / f) * 100 : 0;
    const benchmark = 3.5;
    const rating = rate >= benchmark * 1.5 ? "Excellent 🚀" : rate >= benchmark ? "Good ✅" : "Needs improvement ⚠️";
    setEngResult({ rate: parseFloat(rate.toFixed(2)), benchmark, rating });
  };

  const tools = [
    { id: "calendar", icon: "📅", title: "Content Calendar Builder", desc: "AI-built multi-platform content calendar", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Platforms (e.g. Instagram, Facebook, LinkedIn)" value={cal.platforms} onChange={e => setCal(p => ({ ...p, platforms: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Duration (days)" value={cal.duration} onChange={e => setCal(p => ({ ...p, duration: e.target.value }))} type="number" />
          <select className="db-input" value={cal.goal} onChange={e => setCal(p => ({ ...p, goal: e.target.value }))}>
            <option value="brand awareness">Brand awareness</option><option value="lead generation">Lead generation</option><option value="engagement">Engagement</option><option value="sales">Sales / conversions</option>
          </select>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => onSendToChat(`Build a ${cal.duration}-day social media content calendar for: ${cal.platforms}. Goal: ${cal.goal}. Include: post type, caption topic, hashtag strategy, best posting time (UAE GST), and visual description for each post. Format as a clear day-by-day schedule for a UAE luxury real estate brand.`)}>Build with AI →</button>
      </div>
    )},
    { id: "posting-times", icon: "⏰", title: "Best Posting Times", desc: "Optimal UAE posting times by platform", content: (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Platform","Morning (GST)","Afternoon (GST)","Evening (GST)","Peak Day"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["Instagram","6:00–8:00 AM","12:00–2:00 PM","8:00–10:00 PM","Wednesday"],
              ["Facebook","9:00–11:00 AM","1:00–3:00 PM","7:00–9:00 PM","Thursday"],
              ["LinkedIn","7:00–9:00 AM","12:00–1:00 PM","5:00–6:00 PM","Tuesday"],
              ["TikTok","6:00–10:00 AM","—","7:00–9:00 PM","Friday"],
              ["Snapchat","8:00–10:00 AM","3:00–5:00 PM","9:00–11:00 PM","Saturday"],
              ["Twitter/X","8:00–10:00 AM","12:00–1:00 PM","5:00–7:00 PM","Monday"],
            ].map(([p,...vals], i) => (
              <tr key={p} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-2)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: COLOR }}>{p}</td>
                {vals.map((v, j) => <td key={j} style={{ padding: "8px 10px", color: "var(--text)" }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>* Times optimised for UAE (GST) audiences. Adjust based on your specific audience analytics.</div>
      </div>
    )},
    { id: "campaign", icon: "🚀", title: "Campaign Planner", desc: "Full social media campaign strategy", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Campaign name" value={campaign.name} onChange={e => setCampaign(p => ({ ...p, name: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={campaign.goal} onChange={e => setCampaign(p => ({ ...p, goal: e.target.value }))}>
            <option value="brand awareness">Brand awareness</option><option value="lead generation">Lead generation</option><option value="property launch">Property launch</option><option value="engagement">Community engagement</option>
          </select>
          <input className="db-input" placeholder="Budget (AED)" value={campaign.budget} onChange={e => setCampaign(p => ({ ...p, budget: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Duration (e.g. 2 weeks)" value={campaign.duration} onChange={e => setCampaign(p => ({ ...p, duration: e.target.value }))} />
          <input className="db-input" placeholder="Platforms" value={campaign.platforms} onChange={e => setCampaign(p => ({ ...p, platforms: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!campaign.name} onClick={() => onSendToChat(`Create a full social media campaign plan for: "${campaign.name}". Goal: ${campaign.goal}. Budget: ${campaign.budget || "flexible"} AED. Duration: ${campaign.duration || "4 weeks"}. Platforms: ${campaign.platforms || "Instagram, Facebook, LinkedIn"}. Include: campaign overview, week-by-week content plan, KPIs to track, audience targeting suggestions, hashtag strategy, and budget allocation per platform. Context: UAE luxury real estate brand (OIA Dubai).`)}>Plan with AI →</button>
      </div>
    )},
    { id: "engagement", icon: "📊", title: "Engagement Rate Calculator", desc: "Calculate and benchmark your engagement", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Followers" value={engCalc.followers} onChange={e => setEngCalc(p => ({ ...p, followers: e.target.value }))} type="number" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Likes" value={engCalc.likes} onChange={e => setEngCalc(p => ({ ...p, likes: e.target.value }))} type="number" />
          <input className="db-input" placeholder="Comments" value={engCalc.comments} onChange={e => setEngCalc(p => ({ ...p, comments: e.target.value }))} type="number" />
          <input className="db-input" placeholder="Shares/Saves" value={engCalc.shares} onChange={e => setEngCalc(p => ({ ...p, shares: e.target.value }))} type="number" />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!engCalc.followers} onClick={calcEngagement}>Calculate</button>
        {engResult && (
          <div className="db-card" style={{ background: "var(--surface-2)", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, border: `3px solid ${engResult.rate >= engResult.benchmark ? "#10B981" : "#F59E0B"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: engResult.rate >= engResult.benchmark ? "#10B981" : "#F59E0B" }}>{engResult.rate}%</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{engResult.rating}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Instagram benchmark: {engResult.benchmark}%</div>
              </div>
            </div>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => onSendToChat(`My engagement rate is ${engResult.rate}% compared to the industry benchmark of ${engResult.benchmark}%. Give me 5 specific tactics to improve social media engagement for a UAE luxury real estate brand. Focus on content types, CTAs, and community management strategies.`)}>Get improvement tips →</button>
          </div>
        )}
      </div>
    )},
    { id: "competitor", icon: "🎯", title: "Competitor Monitor", desc: "Analyse competitor social media strategy", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Your handle / brand" value={competitor.mine} onChange={e => setCompetitor(p => ({ ...p, mine: e.target.value }))} />
        <input className="db-input" placeholder="Competitor handle / brand" value={competitor.theirs} onChange={e => setCompetitor(p => ({ ...p, theirs: e.target.value }))} />
        <select className="db-input" value={competitor.platform} onChange={e => setCompetitor(p => ({ ...p, platform: e.target.value }))}>
          <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>TikTok</option>
        </select>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!competitor.theirs} onClick={() => onSendToChat(`Analyse the ${competitor.platform} social media strategy of "${competitor.theirs}" vs "${competitor.mine || "OIA Dubai"}". Include: 1) Content themes and formats they use 2) Estimated posting frequency 3) Engagement patterns 4) What's working for them 5) Gaps we can exploit 6) 3 specific content ideas to outperform them this month in the UAE real estate market.`)}>Analyse with AI →</button>
      </div>
    )},
    { id: "profile", icon: "👤", title: "Profile Audit", desc: "Audit and optimise your social profile", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={profile.platform} onChange={e => setProfile(p => ({ ...p, platform: e.target.value }))}>
            <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>TikTok</option><option>Snapchat</option>
          </select>
          <input className="db-input" placeholder="Your handle (e.g. @oiadubai)" value={profile.handle} onChange={e => setProfile(p => ({ ...p, handle: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => onSendToChat(`Audit the ${profile.platform} profile for ${profile.handle || "OIA Dubai, a luxury UAE real estate brand"}. Give me a complete profile optimisation checklist covering: bio, profile picture, link in bio, highlight covers (Instagram), featured posts, content grid aesthetic, CTA placement, and keyword usage. Rate each element 1–10 and give specific improvement actions.`)}>Audit with AI →</button>
      </div>
    )},
    { id: "growth", icon: "📈", title: "Growth Strategy Planner", desc: "Build a follower growth strategy", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={growthGoal.platform} onChange={e => setGrowthGoal(p => ({ ...p, platform: e.target.value }))}>
            <option>Instagram</option><option>LinkedIn</option><option>TikTok</option><option>Facebook</option>
          </select>
          <select className="db-input" value={growthGoal.timeline} onChange={e => setGrowthGoal(p => ({ ...p, timeline: e.target.value }))}>
            <option value="1 month">1 month</option><option value="3 months">3 months</option><option value="6 months">6 months</option><option value="12 months">12 months</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Current followers" value={growthGoal.currentFollowers} onChange={e => setGrowthGoal(p => ({ ...p, currentFollowers: e.target.value }))} type="number" />
          <input className="db-input" placeholder="Target followers" value={growthGoal.targetFollowers} onChange={e => setGrowthGoal(p => ({ ...p, targetFollowers: e.target.value }))} type="number" />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => onSendToChat(`Create a ${growthGoal.platform} growth strategy for OIA Dubai to go from ${growthGoal.currentFollowers || "current"} to ${growthGoal.targetFollowers || "target"} followers in ${growthGoal.timeline}. Include: daily and weekly content volume, engagement tactics, collaboration/influencer opportunities, hashtag strategy, ads budget recommendation, community management approach, and monthly milestones to track progress.`)}>Plan with AI →</button>
      </div>
    )},
    { id: "crisis", icon: "🚨", title: "Crisis Response Guide", desc: "Handle negative comments and PR issues", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <select className="db-input" value={crisis.type} onChange={e => setCrisis(p => ({ ...p, type: e.target.value }))}>
          <option value="negative review">Negative review</option><option value="complaint">Customer complaint</option><option value="PR crisis">PR crisis / media issue</option><option value="fake news">Fake news / misinformation</option><option value="trolling">Trolling / hate comments</option>
        </select>
        <select className="db-input" value={crisis.platform} onChange={e => setCrisis(p => ({ ...p, platform: e.target.value }))}>
          <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>Google Reviews</option><option>Twitter/X</option>
        </select>
        <textarea className="db-input" rows={3} placeholder="Briefly describe the situation..." value={crisis.summary} onChange={e => setCrisis(p => ({ ...p, summary: e.target.value }))} style={{ resize: "none", fontFamily: "inherit" }} />
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => onSendToChat(`We have a ${crisis.type} on ${crisis.platform} for OIA Dubai, a UAE luxury real estate brand. Situation: ${crisis.summary || "A customer posted a negative review/comment"}. Give me: 1) A professional response template (Arabic + English if needed) 2) Escalation process if the issue grows 3) 3 de-escalation tactics 4) What NOT to say 5) Follow-up actions to turn this into a positive outcome.`)}>Get Response Strategy →</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="db-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="db-card-title">Social Media Tools</div>
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_social_tasks", DEMO_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" as Priority, dueDate: "", tags: "" });

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks(p => [...p, { id: makeId(), ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), status: "todo", assignedBy: "Admin", createdAt: Date.now() }]);
    setForm({ title: "", description: "", priority: "Medium", dueDate: "", tags: "" }); setShowForm(false);
  };
  const updateStatus = (id: string, status: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><div className="db-card-title">Tasks</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Assign tasks to the Social Media team</div></div>
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
            <input className="db-input" placeholder="Tags (calendar, campaign, analytics...)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_social_tasks", DEMO_TASKS);
  const moveTask = (id: string, status: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Kanban Board</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track social media tasks from To Do → Done</div>
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
  const [events, setEvents] = useLocalState<CalEvent[]>("oia_social_events", []);
  const [cur, setCur] = useState({ year: TODAY.getFullYear(), month: TODAY.getMonth() });
  const [newEv, setNewEv] = useState({ title: "", date: "", type: "publish" as EventType });
  const [showAdd, setShowAdd] = useState(false);

  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
  const firstDay = new Date(cur.year, cur.month, 1).getDay();
  const eventsForDay = (day: number) => {
    const d = `${cur.year}-${String(cur.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === d);
  };
  const addEvent = () => {
    if (newEv.title && newEv.date) { setEvents(p => [...p, { id: makeId(), ...newEv }]); setNewEv({ title: "", date: "", type: "publish" }); setShowAdd(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><div className="db-card-title">Social Calendar</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track posts, campaigns, and deadlines</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {(["task","deadline","meeting","publish"] as EventType[]).map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: EVENT_COLORS[t], display: "inline-block" }} />{t}
            </span>
          ))}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(v => !v)}>{showAdd ? "Cancel" : "+ Add Event"}</button>
        </div>
      </div>
      {showAdd && (
        <div className="db-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <input className="db-input" placeholder="Event title" value={newEv.title} onChange={e => setNewEv(p => ({ ...p, title: e.target.value }))} />
            <input type="date" className="db-input" value={newEv.date} onChange={e => setNewEv(p => ({ ...p, date: e.target.value }))} />
            <select className="db-input" value={newEv.type} onChange={e => setNewEv(p => ({ ...p, type: e.target.value as EventType }))}>
              <option value="publish">Publish</option><option value="task">Task</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option>
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
                <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: isToday ? 800 : 500, marginBottom: 4, background: isToday ? COLOR : "none", color: isToday ? "#fff" : "var(--text)" }}>{day}</div>
                {dayEvs.map(ev => (
                  <div key={ev.id} onClick={() => setEvents(p => p.filter(e => e.id !== ev.id))} style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, marginBottom: 2, cursor: "pointer", background: EVENT_COLORS[ev.type], color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Click to remove">{ev.title}</div>
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
  const [todos, setTodos] = useLocalState<TodoItem[]>("oia_social_todos", DEMO_TODOS);
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
  const [tasks] = useLocalState<Task[]>("oia_social_tasks", DEMO_TASKS);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Reports & Analytics</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Social Media performance overview</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Tasks", value: total, icon: "📋", color: "#3B82F6" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: "✅", color: "#10B981" },
          { label: "In Progress", value: inProgress, icon: "⚙️", color: "#F59E0B" },
          { label: "Completed", value: done, icon: "🏆", color: COLOR },
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
                  <span style={{ color: "var(--text)" }}>{col.label}</span><span style={{ fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: col.id === "done" ? "#10B981" : col.id === "in_progress" ? "#3B82F6" : col.id === "review" ? "#F59E0B" : "#9CA3AF", width: `${pct}%`, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="db-card">
          <div className="db-card-title">Social Media KPI Targets</div>
          {[
            { label: "Posts per week (all platforms)", target: "25+ posts", icon: "📱" },
            { label: "Instagram engagement rate", target: "> 3.5%", icon: "❤️" },
            { label: "LinkedIn engagement rate", target: "> 2%", icon: "💼" },
            { label: "Follower growth / month", target: "5%+ growth", icon: "📈" },
            { label: "Content calendar lead time", target: "2 weeks ahead", icon: "📅" },
          ].map(kpi => (
            <div key={kpi.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 16 }}>{kpi.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{kpi.label}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color: COLOR }}>{kpi.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Social Dashboard Panel ───────────────────────────────────────────────────
function SocialDashboard({ onGoToTab }: { onGoToTab: (t: MainTab) => void }) {
  const [tasks] = useLocalState<Task[]>("oia_social_tasks", DEMO_TASKS);
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const kpis = [
    { label: "Total Followers", value: "24.5K", change: "+3.2% this month", icon: "👥", color: COLOR },
    { label: "Avg Engagement", value: "4.8%", change: "Above benchmark ✅", icon: "❤️", color: "#10B981" },
    { label: "Scheduled Posts", value: "12", change: "Next 7 days", icon: "📅", color: "#8B5CF6" },
    { label: "Active Campaigns", value: "2", change: "Instagram + LinkedIn", icon: "🚀", color: "#F59E0B" },
  ];

  const platformStats = [
    { platform: "Instagram", followers: "15,200", growth: "+3.2%", engagement: "5.1%", color: "#E1306C", icon: "📸" },
    { platform: "LinkedIn",  followers: "5,800",  growth: "+1.8%", engagement: "2.8%", color: "#0A66C2", icon: "💼" },
    { platform: "Facebook",  followers: "2,100",  growth: "+0.5%", engagement: "1.9%", color: "#1877F2", icon: "👥" },
    { platform: "TikTok",    followers: "1,400",  growth: "New",   engagement: "8.2%", color: "#EE1D52", icon: "🎵" },
  ];

  const upcomingPosts = [
    { title: "OIA Yas Acres — aerial property tour", platform: "Instagram", date: "Today 8PM" },
    { title: "Why HNW investors choose Dubai over Singapore", platform: "LinkedIn", date: "Tomorrow 9AM" },
    { title: "Weekend open day announcement", platform: "Facebook", date: "Fri 10AM" },
    { title: "Dubai skyline property reel", platform: "TikTok", date: "Sat 7PM" },
  ];

  const PLAT_COLORS: Record<string, string> = { Instagram: "#E1306C", LinkedIn: "#0A66C2", Facebook: "#1877F2", TikTok: "#EE1D52" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI cards */}
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
        {/* Platform breakdown */}
        <div className="db-card">
          <div className="db-card-title">Platform Overview</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platformStats.map(p => (
              <div key={p.platform} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: p.color + "10", borderRadius: 8, border: `1px solid ${p.color}25` }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.platform}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.followers} followers</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                    <span style={{ color: "#10B981", fontWeight: 600 }}>↑ {p.growth}</span>
                    <span style={{ color: "var(--text-muted)" }}>Engagement: <b style={{ color: p.color }}>{p.engagement}</b></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Upcoming posts */}
          <div className="db-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="db-card-title" style={{ margin: 0 }}>Upcoming Posts</div>
              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Calendar")}>Calendar →</button>
            </div>
            {upcomingPosts.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLAT_COLORS[p.platform] ?? COLOR, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.platform} · {p.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Task summary */}
          <div className="db-card">
            <div className="db-card-title">Task Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Open", value: openTasks, color: "#F59E0B" },
                { label: "Done", value: doneTasks, color: "#10B981" },
                { label: "Total", value: tasks.length, color: COLOR },
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

      {/* Engagement rate bars */}
      <div className="db-card">
        <div className="db-card-title">Engagement Rate by Platform</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {platformStats.map(p => (
            <div key={p.platform}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: p.color }}>{p.platform}</span>
                <span style={{ fontWeight: 700 }}>{p.engagement}</span>
              </div>
              <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", background: p.color, width: `${Math.min(100, parseFloat(p.engagement) * 12)}%`, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Benchmark: 3.5%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="db-card">
        <div className="db-card-title">Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "📅 Build Content Calendar", tab: "Tools" as MainTab },
            { label: "🚀 Plan Campaign", tab: "Tools" as MainTab },
            { label: "📊 Engagement Calculator", tab: "Tools" as MainTab },
            { label: "📋 Add New Task", tab: "Tasks" as MainTab },
            { label: "🗓️ Add to Calendar", tab: "Calendar" as MainTab },
            { label: "💬 Ask Social Agent", tab: "Chat" as MainTab },
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
const MAIN_TABS: MainTab[] = ["Dashboard", "Chat", "Tools", "Tasks", "Kanban", "Calendar", "Todo", "Reports"];

const TAB_ICONS: Partial<Record<MainTab, React.ReactNode>> = {
  Chat: <Share2 size={13} />,
  Tools: <Wrench size={13} />,
};

export default function SocialMediaPage() {
  const initialTab = (): MainTab => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab") as MainTab | null;
      if (p && ["Dashboard","Chat","Tools","Tasks","Kanban","Calendar","Todo","Reports"].includes(p)) return p;
    }
    return "Dashboard";
  };
  const [tab, setTab] = useState<MainTab>(initialTab);
  const [autoSend, setAutoSend] = useState<string | undefined>();

  const handleSendToChat = (msg: string) => { setAutoSend(msg); setTab("Chat"); };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Social Media</h1>
          <p className="db-page-sub">Content strategy and scheduling across Instagram, Facebook, LinkedIn, TikTok & Snapchat</p>
        </div>
      </div>

      {/* Main tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {MAIN_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : "btn-ghost"} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            {TAB_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && <SocialDashboard onGoToTab={setTab} />}
      {tab === "Chat" && (
        <>
          <AgentChat
            agentId="social"
            agentName="Social Media"
            agentColor={COLOR}
            description="I build content calendars, analyse platform performance, and find the best times to post across all major social networks."
            quickActions={CHAT_QUICK_ACTIONS}
            icon={<Share2 size={18} color="#fff" />}
            autoSend={autoSend}
            onAutoSendDone={() => setAutoSend(undefined)}
          />
          <div className="db-card" style={{ marginTop: 18 }}>
            <div className="db-card-title">Platform Quick Access</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Click a platform for specs, best times, and content types</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["Instagram","Facebook","LinkedIn","TikTok","Snapchat"] as Exclude<PlatformTab,"General">[]).map(p => {
                const s = PLATFORMS[p];
                return (
                  <button key={p} onClick={() => { setTab("Tools"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: s.color + "15", border: `1px solid ${s.color}40`, cursor: "pointer", color: s.textColor ?? s.color, fontWeight: 600, fontSize: 13 }}>
                    {s.icon} {p}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {tab === "Tools" && <SocialToolsPanel onSendToChat={handleSendToChat} />}
      {tab === "Tasks" && <TasksPanel />}
      {tab === "Kanban" && <KanbanPanel />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Todo" && <TodoPanel />}
      {tab === "Reports" && <ReportsPanel />}
    </div>
  );
}
