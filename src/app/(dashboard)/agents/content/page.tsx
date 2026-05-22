"use client";
import { useState, useEffect } from "react";
import {
  PenTool, BookOpen, Lightbulb, Plus, Trash2, Copy, Tag,
  Globe, Camera, AtSign, Briefcase, MessageCircle,
  ExternalLink, RefreshCw, CheckCircle, XCircle, Link2,
  Wrench,
} from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

// ─── Types ─────────────────────────────────────────────────────────────────
type Tab = "Dashboard" | "Chat" | "Articles" | "New Ideas" | "Tools" | "Tasks" | "Kanban" | "Calendar" | "Todo" | "Reports";
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type EventType = "task" | "deadline" | "meeting" | "publish";

interface Article {
  id: string; title: string; excerpt: string; platform: string; tags: string[]; date: string; content: string;
}
interface Idea {
  id: string; title: string; description: string;
  category: "Blog" | "Social" | "Campaign" | "Video"; priority: "High" | "Medium" | "Low";
}
interface Task {
  id: string; title: string; description: string; priority: Priority; status: TaskStatus;
  dueDate: string; assignedBy: string; tags: string[]; createdAt: number;
}
interface CalEvent { id: string; title: string; date: string; type: EventType; }
interface TodoItem { id: string; text: string; done: boolean; }

// ─── Constants ─────────────────────────────────────────────────────────────
const COLOR = "#8B5CF6";
const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const PRIORITY_COLORS: Record<Priority, string> = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };
const EVENT_COLORS: Record<EventType, string> = { task: "#8B5CF6", deadline: "#EF4444", meeting: "#F59E0B", publish: "#3B82F6" };
const STATUS_COLS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "📋 To Do" },
  { id: "in_progress", label: "⚙️ In Progress" },
  { id: "review", label: "👀 Review" },
  { id: "done", label: "✅ Done" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TODAY = new Date();

const DEFAULT_ARTICLES: Article[] = [
  { id: "1", title: "Why OIA Dubai is the #1 Choice for Luxury Real Estate in 2025", excerpt: "Discover why savvy investors and homebuyers are choosing OIA Dubai projects for unmatched ROI and lifestyle value in the UAE's most exclusive communities.", platform: "Blog", tags: ["luxury", "Dubai", "real estate", "investment"], date: "2025-05-01", content: "" },
  { id: "2", title: "Aldar Yas Acres: A Complete Guide for UAE Expat Buyers", excerpt: "Everything expats need to know about buying at Aldar Yas Acres — financing options, community amenities, and expected rental yields.", platform: "Blog", tags: ["Aldar", "Yas Acres", "expats", "guide"], date: "2025-04-15", content: "" },
];

const DEFAULT_IDEAS: Idea[] = [
  { id: "1", title: "Dubai Property Investment Guide 2025", description: "Comprehensive blog post covering ROI, visa benefits, and top areas for expat buyers.", category: "Blog", priority: "High" },
  { id: "2", title: "OIA Project Launch Instagram Reel Script", description: "Short-form vertical video script showcasing latest project renders with Arabic + English captions.", category: "Video", priority: "High" },
  { id: "3", title: "Aldar Yas Acres — Virtual Tour LinkedIn Post", description: "Professional LinkedIn article for HNW expat audience with 3D tour embed link.", category: "Social", priority: "Medium" },
  { id: "4", title: "Ramadan Property Deals Campaign", description: "Seasonal ad campaign targeting UAE nationals with exclusive Ramadan payment plans.", category: "Campaign", priority: "High" },
  { id: "5", title: "Dubai vs Abu Dhabi Investment Comparison", description: "Educational blog series — data-driven comparison to capture top-of-funnel search traffic.", category: "Blog", priority: "Medium" },
  { id: "6", title: "OIA Client Testimonials Carousel", description: "Instagram carousel featuring 5 buyer success stories with before/after lifestyle photography.", category: "Social", priority: "Low" },
];

const DEMO_TASKS: Task[] = [
  { id: "ct-d1", title: "Write blog post for Q3 Dubai property campaign", description: "2,000+ word SEO-optimised article targeting 'luxury apartments Dubai 2026'", priority: "High", status: "in_progress", dueDate: "2026-05-30", assignedBy: "Admin", tags: ["blog", "SEO"], createdAt: Date.now() - 86400000 },
  { id: "ct-d2", title: "Create social captions for Aldar Yas Acres launch", description: "5 Instagram + 3 Facebook + 2 LinkedIn captions", priority: "High", status: "todo", dueDate: "2026-06-04", assignedBy: "Admin", tags: ["social", "captions"], createdAt: Date.now() - 43200000 },
  { id: "ct-d3", title: "Repurpose Q2 blog post for LinkedIn newsletter", description: "Condense top 5 tips post into 1,200-word LinkedIn article format", priority: "Medium", status: "review", dueDate: "2026-05-27", assignedBy: "Admin", tags: ["repurpose", "LinkedIn"], createdAt: Date.now() - 172800000 },
];

const DEMO_TODOS: TodoItem[] = [
  { id: "ct-t1", text: "Research Dubai real estate content trends for Q3", done: false },
  { id: "ct-t2", text: "Create content calendar for June", done: true },
  { id: "ct-t3", text: "Write 5 Instagram captions for Aldar launch", done: false },
  { id: "ct-t4", text: "Update email newsletter template", done: false },
  { id: "ct-t5", text: "Verify all platform character limits are current", done: false },
];

const CATEGORY_COLORS: Record<string, string> = { Blog: "#8B5CF6", Social: "#3B82F6", Campaign: "#EF4444", Video: "#F59E0B" };
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Blog: <Globe size={12} />, Instagram: <Camera size={12} />,
  Facebook: <MessageCircle size={12} />, Twitter: <AtSign size={12} />, LinkedIn: <Briefcase size={12} />,
};
const PRIORITY_IDEA_COLORS = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };

const QUICK_ACTIONS = [
  "Extract Content & images for Oia website and create a content strategy",
  "Generate content for All platforms: Instagram, Facebook, Twitter, LinkedIn",
  "Write a luxury property blog post for OIA Dubai",
  "Create 5 Instagram captions for Aldar Yas Acres launch",
  "Write Google Ads copy targeting UAE expats",
  "Generate hashtags for a Dubai real estate LinkedIn post",
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

// ─── Content Tools Panel ─────────────────────────────────────────────────────
function ContentToolsPanel({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [blog, setBlog] = useState({ topic: "", audience: "UAE expats", tone: "professional", wordCount: "1500" });
  const [caption, setCaption] = useState({ topic: "", platform: "Instagram", cta: "" });
  const [adCopy, setAdCopy] = useState({ product: "", audience: "", objective: "conversions", platform: "Facebook" });
  const [hashtag, setHashtag] = useState({ topic: "", platform: "Instagram", count: "20" });
  const [brief, setBrief] = useState({ title: "", keyword: "", audience: "", wordCount: "1500" });
  const [briefResult, setBriefResult] = useState("");
  const [repurpose, setRepurpose] = useState({ content: "", targetPlatform: "LinkedIn" });
  const [email, setEmail] = useState({ subject: "", audience: "", goal: "leads", tone: "professional" });
  const [engCalc, setEngCalc] = useState({ followers: "", likes: "", comments: "", shares: "" });
  const [engResult, setEngResult] = useState<{ rate: number; benchmark: number; rating: string } | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const generateBrief = () => {
    if (!brief.title) return;
    const result = `# Content Brief: ${brief.title}\n\n**Target Keyword:** ${brief.keyword || "N/A"}\n**Target Audience:** ${brief.audience || "UAE property buyers"}\n**Word Count:** ${brief.wordCount}\n\n## Suggested Structure\n1. Introduction (Hook + problem statement)\n2. Main points with subheadings\n3. Data/statistics section\n4. Case study or example\n5. CTA and conclusion\n\n## Key Messages\n- Highlight UAE market opportunity\n- Address buyer concerns\n- Include social proof\n\n## SEO Notes\n- Include target keyword in H1, first 100 words, and conclusion\n- Add internal links to related OIA pages\n- Aim for 2-3 external authoritative sources`;
    setBriefResult(result);
  };

  const calcEngagement = () => {
    const f = parseFloat(engCalc.followers) || 0;
    const interactions = (parseFloat(engCalc.likes) || 0) + (parseFloat(engCalc.comments) || 0) + (parseFloat(engCalc.shares) || 0);
    const rate = f > 0 ? (interactions / f) * 100 : 0;
    const benchmark = 3.5; // Instagram avg
    const rating = rate >= benchmark * 1.5 ? "Excellent 🚀" : rate >= benchmark ? "Good ✅" : "Needs improvement ⚠️";
    setEngResult({ rate: parseFloat(rate.toFixed(2)), benchmark, rating });
  };

  const tools = [
    { id: "blog", icon: "📝", title: "Blog Post Generator", desc: "AI-written SEO blog posts for any topic", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Blog topic (e.g. Dubai luxury real estate investment 2026)" value={blog.topic} onChange={e => setBlog(p => ({ ...p, topic: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Target audience" value={blog.audience} onChange={e => setBlog(p => ({ ...p, audience: e.target.value }))} />
          <input className="db-input" placeholder="Word count" value={blog.wordCount} onChange={e => setBlog(p => ({ ...p, wordCount: e.target.value }))} />
        </div>
        <select className="db-input" value={blog.tone} onChange={e => setBlog(p => ({ ...p, tone: e.target.value }))}>
          <option value="professional">Professional</option><option value="conversational">Conversational</option><option value="luxury">Luxury / aspirational</option><option value="educational">Educational</option>
        </select>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!blog.topic} onClick={() => onSendToChat(`Write a ${blog.wordCount}-word ${blog.tone} blog post titled: "${blog.topic}". Target audience: ${blog.audience}. Include: engaging introduction with a hook, 4-5 H2 sections with H3 sub-points, real estate data and statistics for UAE, internal link suggestions, and a compelling CTA. Format with markdown headings.`)}>Generate with AI →</button>
      </div>
    )},
    { id: "caption", icon: "📸", title: "Social Caption Generator", desc: "Platform-optimised captions with CTA", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Caption topic / property name" value={caption.topic} onChange={e => setCaption(p => ({ ...p, topic: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={caption.platform} onChange={e => setCaption(p => ({ ...p, platform: e.target.value }))}>
            <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>TikTok</option><option>Snapchat</option><option>Twitter/X</option>
          </select>
          <input className="db-input" placeholder="CTA (e.g. DM us now)" value={caption.cta} onChange={e => setCaption(p => ({ ...p, cta: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!caption.topic} onClick={() => onSendToChat(`Write 5 ${caption.platform} captions for: "${caption.topic}". Respect ${caption.platform} character limits. Include emojis, hashtags appropriate for ${caption.platform}, and the CTA: "${caption.cta || "Contact us today"}". Use a luxury real estate brand voice targeting UAE buyers.`)}>Generate with AI →</button>
      </div>
    )},
    { id: "adcopy", icon: "📣", title: "Ad Copy Generator", desc: "High-converting ad copy for any platform", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Property / product to advertise" value={adCopy.product} onChange={e => setAdCopy(p => ({ ...p, product: e.target.value }))} />
        <input className="db-input" placeholder="Target audience" value={adCopy.audience} onChange={e => setAdCopy(p => ({ ...p, audience: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={adCopy.platform} onChange={e => setAdCopy(p => ({ ...p, platform: e.target.value }))}>
            <option>Facebook</option><option>Google Ads</option><option>Instagram</option><option>LinkedIn</option><option>TikTok</option>
          </select>
          <select className="db-input" value={adCopy.objective} onChange={e => setAdCopy(p => ({ ...p, objective: e.target.value }))}>
            <option value="conversions">Conversions</option><option value="leads">Lead gen</option><option value="awareness">Brand awareness</option><option value="traffic">Website traffic</option>
          </select>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!adCopy.product} onClick={() => onSendToChat(`Write ${adCopy.platform} ad copy for: "${adCopy.product}". Target: ${adCopy.audience || "UAE property buyers"}. Objective: ${adCopy.objective}. Include: 3 headline variations (max 30 chars each for Google, or 40 for Facebook), 2 primary text variations, and a description. Follow ${adCopy.platform} ad copy best practices.`)}>Generate with AI →</button>
      </div>
    )},
    { id: "hashtag", icon: "#️⃣", title: "Hashtag Research", desc: "Trending, niche and brand hashtags", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Topic (e.g. Dubai luxury apartments)" value={hashtag.topic} onChange={e => setHashtag(p => ({ ...p, topic: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={hashtag.platform} onChange={e => setHashtag(p => ({ ...p, platform: e.target.value }))}>
            <option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>Twitter/X</option>
          </select>
          <input className="db-input" placeholder="Count" value={hashtag.count} onChange={e => setHashtag(p => ({ ...p, count: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!hashtag.topic} onClick={() => onSendToChat(`Research ${hashtag.count} hashtags for "${hashtag.topic}" on ${hashtag.platform}. Group into: 5 high-volume (1M+), 8 mid-volume (100K–1M), 5 niche (10K–100K), 2 branded. Include estimated reach and competition level for each. Format as a ready-to-copy hashtag block.`)}>Research with AI →</button>
      </div>
    )},
    { id: "brief", icon: "📋", title: "Content Brief Builder", desc: "Generate a detailed content brief", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Article title" value={brief.title} onChange={e => setBrief(p => ({ ...p, title: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Target keyword" value={brief.keyword} onChange={e => setBrief(p => ({ ...p, keyword: e.target.value }))} />
          <input className="db-input" placeholder="Target audience" value={brief.audience} onChange={e => setBrief(p => ({ ...p, audience: e.target.value }))} />
        </div>
        <input className="db-input" placeholder="Word count target" value={brief.wordCount} onChange={e => setBrief(p => ({ ...p, wordCount: e.target.value }))} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, fontSize: 13 }} disabled={!brief.title} onClick={generateBrief}>Generate Brief</button>
          <button className="btn-ghost" style={{ flex: 1, fontSize: 13 }} disabled={!brief.title} onClick={() => onSendToChat(`Create a detailed content brief for: "${brief.title}". Target keyword: ${brief.keyword}. Audience: ${brief.audience}. Length: ${brief.wordCount} words. Include: search intent analysis, competitor content gaps, suggested H2/H3 structure, key messages, internal link opportunities, and content differentiation angle for OIA Dubai.`)}>Full AI Brief →</button>
        </div>
        {briefResult && (
          <div style={{ position: "relative" }}>
            <pre style={{ fontFamily: "inherit", fontSize: 12, background: "var(--surface-2)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", color: "var(--text)", maxHeight: 280, overflow: "auto" }}>{briefResult}</pre>
            <button className="btn-ghost" style={{ fontSize: 11, position: "absolute", top: 8, right: 8 }} onClick={() => navigator.clipboard.writeText(briefResult)}>📋 Copy</button>
          </div>
        )}
      </div>
    )},
    { id: "repurpose", icon: "♻️", title: "Content Repurposer", desc: "Transform existing content for new platforms", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea className="db-input" rows={4} placeholder="Paste your existing content here (blog post, caption, etc.)" value={repurpose.content} onChange={e => setRepurpose(p => ({ ...p, content: e.target.value }))} style={{ resize: "vertical", fontFamily: "inherit" }} />
        <select className="db-input" value={repurpose.targetPlatform} onChange={e => setRepurpose(p => ({ ...p, targetPlatform: e.target.value }))}>
          <option>LinkedIn</option><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>Twitter/X</option><option>Email newsletter</option><option>WhatsApp broadcast</option>
        </select>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!repurpose.content} onClick={() => onSendToChat(`Repurpose this content for ${repurpose.targetPlatform}. Adapt tone, format, and length for ${repurpose.targetPlatform}'s audience and best practices. Maintain brand voice (luxury real estate, professional, Dubai-focused).\n\nOriginal content:\n${repurpose.content}`)}>Repurpose with AI →</button>
      </div>
    )},
    { id: "email", icon: "✉️", title: "Email Copy Writer", desc: "Engaging email sequences and newsletters", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Email subject / goal (e.g. Yas Acres launch announcement)" value={email.subject} onChange={e => setEmail(p => ({ ...p, subject: e.target.value }))} />
        <input className="db-input" placeholder="Target audience" value={email.audience} onChange={e => setEmail(p => ({ ...p, audience: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="db-input" value={email.goal} onChange={e => setEmail(p => ({ ...p, goal: e.target.value }))}>
            <option value="leads">Lead generation</option><option value="nurture">Lead nurture</option><option value="announcement">Announcement</option><option value="newsletter">Newsletter</option>
          </select>
          <select className="db-input" value={email.tone} onChange={e => setEmail(p => ({ ...p, tone: e.target.value }))}>
            <option value="professional">Professional</option><option value="luxury">Luxury</option><option value="urgent">Urgent</option><option value="friendly">Friendly</option>
          </select>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={!email.subject} onClick={() => onSendToChat(`Write a ${email.tone} email for: "${email.subject}". Audience: ${email.audience || "UAE property buyers"}. Goal: ${email.goal}. Include: compelling subject line (A/B test 2 options), preview text, personalised opening, main body with clear value proposition, property highlights if relevant, and a strong CTA button text. Word count: 200-350 words.`)}>Write with AI →</button>
      </div>
    )},
    { id: "engagement", icon: "📊", title: "Engagement Calculator", desc: "Calculate and benchmark post engagement rate", content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="db-input" placeholder="Followers / Page likes" value={engCalc.followers} onChange={e => setEngCalc(p => ({ ...p, followers: e.target.value }))} type="number" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <input className="db-input" placeholder="Likes" value={engCalc.likes} onChange={e => setEngCalc(p => ({ ...p, likes: e.target.value }))} type="number" />
          <input className="db-input" placeholder="Comments" value={engCalc.comments} onChange={e => setEngCalc(p => ({ ...p, comments: e.target.value }))} type="number" />
          <input className="db-input" placeholder="Shares" value={engCalc.shares} onChange={e => setEngCalc(p => ({ ...p, shares: e.target.value }))} type="number" />
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
            {engResult.rate < engResult.benchmark && (
              <div style={{ fontSize: 12, color: "#F59E0B", background: "#F59E0B10", padding: "5px 10px", borderRadius: 6 }}>💡 Try posting at peak UAE times and adding a question CTA to boost comments</div>
            )}
          </div>
        )}
      </div>
    )},
    { id: "platform", icon: "📐", title: "Platform Specs Reference", desc: "Character limits and image specs for all platforms", content: (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Platform","Caption","Headline","Image","Video"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["Instagram","2,200 chars","—","1080×1080px","Up to 90s Reel"],
              ["Facebook","63,206 chars","40 chars (ad)","1200×630px","Up to 240min"],
              ["LinkedIn","3,000 chars","200 chars","1200×627px","Up to 10min"],
              ["TikTok","2,200 chars","—","1080×1920px","15s–10min"],
              ["Snapchat","250 chars","34 chars (ad)","1080×1920px","Up to 60s/snap"],
              ["Twitter/X","280 chars","—","1600×900px","Up to 2min 20s"],
              ["Google Ads","—","30 chars","1200×628px","Up to 30s"],
            ].map(([p,...vals], i) => (
              <tr key={p} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-2)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: COLOR }}>{p}</td>
                {vals.map((v, j) => <td key={j} style={{ padding: "8px 10px", color: "var(--text)" }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )},
  ];

  return (
    <div>
      <div className="db-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="db-card-title">Content Tools</div>
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_content_tasks", DEMO_TASKS);
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
        <div><div className="db-card-title">Tasks</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Assign tasks to the Content Creator</div></div>
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
            <input className="db-input" placeholder="Tags (blog, captions, email...)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
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
  const [tasks, setTasks] = useLocalState<Task[]>("oia_content_tasks", DEMO_TASKS);
  const moveTask = (id: string, status: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Kanban Board</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track content tasks from To Do → Done</div>
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
  const [events, setEvents] = useLocalState<CalEvent[]>("oia_content_events", []);
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
        <div><div className="db-card-title">Content Calendar</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Track publish dates, deadlines, and meetings</div></div>
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
  const [todos, setTodos] = useLocalState<TodoItem[]>("oia_content_todos", DEMO_TODOS);
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
  const [tasks] = useLocalState<Task[]>("oia_content_tasks", DEMO_TASKS);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="db-card-title">Reports & Analytics</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Content Creator performance overview</div>
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
          <div className="db-card-title">Content KPI Targets</div>
          {[
            { label: "Blog posts / month", target: "8+ posts", icon: "📝" },
            { label: "Social captions / week", target: "20+ captions", icon: "📸" },
            { label: "Email newsletters / month", target: "4 emails", icon: "✉️" },
            { label: "Avg. blog word count", target: "1,500+ words", icon: "📊" },
            { label: "Content repurpose rate", target: "60% repurposed", icon: "♻️" },
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

// ─── Articles Panel ───────────────────────────────────────────────────────────
function ArticlesPanel() {
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", excerpt: "", platform: "Blog", tags: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [autoSeoConnected, setAutoSeoConnected] = useState(false);
  const [autoSeoLastSync, setAutoSeoLastSync] = useState<string | null>(null);
  const [autoSeoKeyInput, setAutoSeoKeyInput] = useState("");
  const [showAutoSeoConnect, setShowAutoSeoConnect] = useState(false);
  const [autoSeoSyncing, setAutoSeoSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("oia_content_articles");
    if (saved) setArticles(JSON.parse(saved));
    const seoKey = localStorage.getItem("oia_autoseo_key");
    if (seoKey) setAutoSeoConnected(true);
    const seoSync = localStorage.getItem("oia_autoseo_last_sync");
    if (seoSync) setAutoSeoLastSync(seoSync);
  }, []);

  const saveArticles = (updated: Article[]) => { setArticles(updated); localStorage.setItem("oia_content_articles", JSON.stringify(updated)); };
  const connectAutoSeo = () => {
    if (!autoSeoKeyInput.trim()) return;
    localStorage.setItem("oia_autoseo_key", autoSeoKeyInput.trim());
    setAutoSeoConnected(true); setShowAutoSeoConnect(false); setAutoSeoKeyInput("");
    const now = new Date().toISOString(); localStorage.setItem("oia_autoseo_last_sync", now); setAutoSeoLastSync(now);
  };
  const disconnectAutoSeo = () => { localStorage.removeItem("oia_autoseo_key"); localStorage.removeItem("oia_autoseo_last_sync"); setAutoSeoConnected(false); setAutoSeoLastSync(null); };
  const syncAutoSeo = () => { setAutoSeoSyncing(true); setTimeout(() => { const now = new Date().toISOString(); localStorage.setItem("oia_autoseo_last_sync", now); setAutoSeoLastSync(now); setAutoSeoSyncing(false); }, 1800); };

  const addArticle = () => {
    if (!newArticle.title.trim()) return;
    const article: Article = { id: Date.now().toString(), title: newArticle.title, excerpt: newArticle.excerpt, platform: newArticle.platform, tags: newArticle.tags.split(",").map(t => t.trim()).filter(Boolean), date: new Date().toISOString().split("T")[0], content: "" };
    saveArticles([article, ...articles]);
    setNewArticle({ title: "", excerpt: "", platform: "Blog", tags: "" }); setShowNewArticle(false);
  };

  return (
    <div>
      <div className="db-card" style={{ marginBottom: 16, borderColor: autoSeoConnected ? "#10B981" : "var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: autoSeoConnected ? "#10B98120" : "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={18} color={autoSeoConnected ? "#10B981" : "var(--text-muted)"} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>AutoSEO</div>
              {autoSeoConnected
                ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10B981", background: "#10B98120", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}><CheckCircle size={10} /> Connected</span>
                : <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 99 }}><XCircle size={10} /> Not connected</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {autoSeoConnected ? `Daily SEO articles enabled · Last sync: ${autoSeoLastSync ? new Date(autoSeoLastSync).toLocaleString() : "Never"}` : "Connect AutoSEO to automatically generate a new SEO article every day"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {autoSeoConnected ? (
              <>
                <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }} onClick={syncAutoSeo} disabled={autoSeoSyncing}>
                  <RefreshCw size={12} style={{ animation: autoSeoSyncing ? "spin 1s linear infinite" : "none" }} />{autoSeoSyncing ? "Syncing…" : "Sync Now"}
                </button>
                <a href="https://getautoseo.com/dashboard" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><ExternalLink size={12} /> Open Dashboard</a>
                <button className="btn-ghost" style={{ fontSize: 12, color: "#EF4444" }} onClick={disconnectAutoSeo}>Disconnect</button>
              </>
            ) : (
              <>
                <a href="https://getautoseo.com/dashboard" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><ExternalLink size={12} /> Get API Key</a>
                <button className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setShowAutoSeoConnect(v => !v)}><Link2 size={12} /> Connect</button>
              </>
            )}
          </div>
        </div>
        {showAutoSeoConnect && !autoSeoConnected && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input className="db-input" placeholder="Paste your AutoSEO API key" value={autoSeoKeyInput} onChange={e => setAutoSeoKeyInput(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && connectAutoSeo()} />
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={connectAutoSeo}>Save</button>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowAutoSeoConnect(false)}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => setShowNewArticle(v => !v)}><Plus size={13} /> New Article</button>
      </div>

      {showNewArticle && (
        <div className="db-card" style={{ marginBottom: 14 }}>
          <div className="db-card-title">Add Article</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="db-input" placeholder="Title" value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} />
            <textarea className="db-input" placeholder="Excerpt / description" rows={2} value={newArticle.excerpt} onChange={e => setNewArticle(p => ({ ...p, excerpt: e.target.value }))} style={{ resize: "vertical", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <select className="db-input" value={newArticle.platform} onChange={e => setNewArticle(p => ({ ...p, platform: e.target.value }))}>
                {["Blog","Instagram","Facebook","Twitter","LinkedIn"].map(p => <option key={p}>{p}</option>)}
              </select>
              <input className="db-input" placeholder="Tags (comma separated)" value={newArticle.tags} onChange={e => setNewArticle(p => ({ ...p, tags: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={addArticle}>Save</button>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowNewArticle(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="db-card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <BookOpen size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No articles yet</div>
          <div style={{ fontSize: 13 }}>Ask the Content Creator to write articles, or add them manually.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articles.map(article => (
            <div key={article.id} className="db-card" style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: COLOR, background: COLOR + "20", padding: "2px 8px", borderRadius: 99 }}>
                    {PLATFORM_ICONS[article.platform] ?? <Globe size={12} />}{article.platform}
                  </div>
                  {article.tags.map(tag => (
                    <div key={tag} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 7px", borderRadius: 99 }}><Tag size={10} /> {tag}</div>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{article.date}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{article.title}</div>
                {article.excerpt && <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{article.excerpt}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }} onClick={() => { navigator.clipboard.writeText(article.title + "\n\n" + article.excerpt); setCopied(article.id); setTimeout(() => setCopied(null), 1500); }}>
                  {copied === article.id ? "Copied!" : <><Copy size={12} /> Copy</>}
                </button>
                <button className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#EF4444" }} onClick={() => saveArticles(articles.filter(a => a.id !== article.id))}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ideas Panel ──────────────────────────────────────────────────────────────
function IdeasPanel({ onSwitchTab }: { onSwitchTab: (tab: Tab) => void }) {
  const [ideas, setIdeas] = useState<Idea[]>(DEFAULT_IDEAS);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: "", description: "", category: "Blog" as Idea["category"], priority: "Medium" as Idea["priority"] });

  useEffect(() => { const s = localStorage.getItem("oia_content_ideas"); if (s) { try { setIdeas(JSON.parse(s)); } catch {} } }, []);
  const saveIdeas = (updated: Idea[]) => { setIdeas(updated); localStorage.setItem("oia_content_ideas", JSON.stringify(updated)); };
  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    saveIdeas([{ id: Date.now().toString(), ...newIdea }, ...ideas]);
    setNewIdea({ title: "", description: "", category: "Blog", priority: "Medium" }); setShowNewIdea(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{ideas.length} idea{ideas.length !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={() => onSwitchTab("Chat")}><PenTool size={13} /> Ask Agent for Ideas</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => setShowNewIdea(v => !v)}><Plus size={13} /> New Idea</button>
        </div>
      </div>

      {showNewIdea && (
        <div className="db-card" style={{ marginBottom: 14 }}>
          <div className="db-card-title">Add Idea</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="db-input" placeholder="Idea title" value={newIdea.title} onChange={e => setNewIdea(p => ({ ...p, title: e.target.value }))} />
            <textarea className="db-input" placeholder="Description" rows={2} value={newIdea.description} onChange={e => setNewIdea(p => ({ ...p, description: e.target.value }))} style={{ resize: "vertical", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <select className="db-input" value={newIdea.category} onChange={e => setNewIdea(p => ({ ...p, category: e.target.value as Idea["category"] }))}>
                {["Blog","Social","Campaign","Video"].map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="db-input" value={newIdea.priority} onChange={e => setNewIdea(p => ({ ...p, priority: e.target.value as Idea["priority"] }))}>
                {["High","Medium","Low"].map(pr => <option key={pr}>{pr}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={addIdea}>Save</button>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowNewIdea(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {(["Blog","Social","Campaign","Video"] as const).map(category => {
        const categoryIdeas = ideas.filter(i => i.category === category);
        if (categoryIdeas.length === 0) return null;
        return (
          <div key={category} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[category], flexShrink: 0 }} />
              <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{category} Ideas</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "1px 7px", borderRadius: 99 }}>{categoryIdeas.length}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {categoryIdeas.map(idea => (
                <div key={idea.id} className="db-card" style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, color: PRIORITY_IDEA_COLORS[idea.priority], background: PRIORITY_IDEA_COLORS[idea.priority] + "20" }}>{idea.priority}</div>
                    <button style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }} onClick={() => saveIdeas(ideas.filter(i => i.id !== idea.id))}><Trash2 size={12} /></button>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{idea.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{idea.description}</div>
                  <button className="btn-ghost" style={{ marginTop: 10, fontSize: 11, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px" }} onClick={() => onSwitchTab("Chat")}>
                    <ExternalLink size={10} /> Create Content
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {ideas.length === 0 && (
        <div className="db-card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Lightbulb size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No ideas yet</div>
          <div style={{ fontSize: 13 }}>Add ideas manually or ask the agent to brainstorm for you.</div>
        </div>
      )}
    </div>
  );
}

// ─── Content Dashboard Panel ──────────────────────────────────────────────────
function ContentDashboard({ onGoToTab }: { onGoToTab: (t: Tab) => void }) {
  const [tasks] = useLocalState<Task[]>("oia_content_tasks", DEMO_TASKS);
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const kpis = [
    { label: "Articles Published", value: "8", change: "This month", icon: "📝", color: COLOR },
    { label: "Active Ideas", value: "6", change: "In pipeline", icon: "💡", color: "#F59E0B" },
    { label: "Avg Word Count", value: "1,680", change: "Target: 1,500+", icon: "📊", color: "#10B981" },
    { label: "Platforms Active", value: "5", change: "IG · FB · LI · TT · SC", icon: "📱", color: "#3B82F6" },
  ];

  const recentContent = [
    { title: "Why OIA Dubai is the #1 Choice for Luxury Real Estate", platform: "Blog", date: "May 20", status: "Published" },
    { title: "Aldar Yas Acres: Complete Guide for UAE Expat Buyers", platform: "Blog", date: "May 15", status: "Published" },
    { title: "5 Instagram captions — Yas Acres launch", platform: "Instagram", date: "May 18", status: "Draft" },
    { title: "Q3 Email Newsletter — Dubai Market Update", platform: "Email", date: "May 25", status: "Scheduled" },
  ];

  const platformPerf = [
    { platform: "Blog", posts: 8, engagement: "4.2%", color: COLOR },
    { platform: "Instagram", posts: 24, engagement: "5.1%", color: "#E1306C" },
    { platform: "LinkedIn", posts: 10, engagement: "2.8%", color: "#0A66C2" },
    { platform: "Facebook", posts: 16, engagement: "1.9%", color: "#1877F2" },
  ];

  const STATUS_COLORS: Record<string, string> = { Published: "#10B981", Draft: "#F59E0B", Scheduled: "#3B82F6" };

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
        {/* Recent content */}
        <div className="db-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="db-card-title" style={{ margin: 0 }}>Recent Content</div>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("Articles")}>All articles →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentContent.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3, lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{c.platform}</span><span>·</span><span>{c.date}</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, color: STATUS_COLORS[c.status], background: STATUS_COLORS[c.status] + "20", flexShrink: 0 }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Platform performance */}
          <div className="db-card">
            <div className="db-card-title">Platform Performance</div>
            {platformPerf.map(p => (
              <div key={p.platform} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.platform}</span>
                  <span style={{ color: "var(--text-muted)" }}>{p.posts} posts · <span style={{ color: p.color, fontWeight: 700 }}>{p.engagement}</span></span>
                </div>
                <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: p.color, width: `${Math.min(100, parseFloat(p.engagement) * 15)}%`, borderRadius: 99 }} />
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

      {/* Content pipeline */}
      <div className="db-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="db-card-title" style={{ margin: 0 }}>Content Pipeline</div>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => onGoToTab("New Ideas")}>All ideas →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {["Blog","Social","Campaign","Video"].map((cat, i) => {
            const counts = [3, 2, 1, 2];
            return (
              <div key={cat} style={{ textAlign: "center", padding: "14px 10px", background: CATEGORY_COLORS[cat] + "15", borderRadius: 10, border: `1px solid ${CATEGORY_COLORS[cat]}30` }}>
                <div style={{ fontWeight: 800, fontSize: 24, color: CATEGORY_COLORS[cat] }}>{counts[i]}</div>
                <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, marginTop: 4 }}>{cat}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ideas</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="db-card">
        <div className="db-card-title">Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "📝 Write Blog Post", tab: "Tools" as Tab },
            { label: "📸 Generate Captions", tab: "Tools" as Tab },
            { label: "📣 Create Ad Copy", tab: "Tools" as Tab },
            { label: "📋 Add New Task", tab: "Tasks" as Tab },
            { label: "📅 Schedule Content", tab: "Calendar" as Tab },
            { label: "💬 Ask Content Agent", tab: "Chat" as Tab },
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
const ALL_TABS: Tab[] = ["Dashboard", "Chat", "Articles", "New Ideas", "Tools", "Tasks", "Kanban", "Calendar", "Todo", "Reports"];

const TAB_ICONS: Partial<Record<Tab, React.ReactNode>> = {
  Chat: <PenTool size={13} />,
  Articles: <BookOpen size={13} />,
  "New Ideas": <Lightbulb size={13} />,
  Tools: <Wrench size={13} />,
};

export default function ContentCreatorPage() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [autoSend, setAutoSend] = useState<string | undefined>();

  const handleSendToChat = (msg: string) => { setAutoSend(msg); setTab("Chat"); };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Content Creator</h1>
          <p className="db-page-sub">AI-powered content for all platforms — blog posts, captions, ad copy, tasks, and calendar</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {ALL_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : "btn-ghost"} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            {TAB_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && <ContentDashboard onGoToTab={setTab} />}
      {tab === "Chat" && (
        <AgentChat
          agentId="content"
          agentName="Content Creator"
          agentColor={COLOR}
          description="I write blog posts, social captions, ad copy, and hashtags — always within platform character limits."
          quickActions={QUICK_ACTIONS}
          icon={<PenTool size={18} color="#fff" />}
          autoSend={autoSend}
          onAutoSendDone={() => setAutoSend(undefined)}
        />
      )}
      {tab === "Articles" && <ArticlesPanel />}
      {tab === "New Ideas" && <IdeasPanel onSwitchTab={setTab} />}
      {tab === "Tools" && <ContentToolsPanel onSendToChat={handleSendToChat} />}
      {tab === "Tasks" && <TasksPanel />}
      {tab === "Kanban" && <KanbanPanel />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Todo" && <TodoPanel />}
      {tab === "Reports" && <ReportsPanel />}
    </div>
  );
}
