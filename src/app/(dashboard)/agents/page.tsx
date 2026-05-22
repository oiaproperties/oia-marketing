"use client";
import Link from "next/link";
import { Search, PenTool, Share2, ArrowRight } from "lucide-react";

const AGENTS = [
  {
    id: "seo",
    name: "SEO Specialist",
    icon: Search,
    color: "#10B981",
    description: "Keyword research, meta tags, SERP preview, content scoring, site audit, rank tracking, and competitor gap analysis.",
    quickStat: "9 tools",
  },
  {
    id: "content",
    name: "Content Creator",
    icon: PenTool,
    color: "#8B5CF6",
    description: "Blog posts, social captions, ad copy, hashtags, email copy, and content briefs — platform-aware with full specs.",
    quickStat: "8 tools",
  },
  {
    id: "social",
    name: "Social Media",
    icon: Share2,
    color: "#3B82F6",
    description: "Content calendars, campaign planning, engagement analytics, best posting times, and competitor monitoring.",
    quickStat: "8 tools",
  },
];

export default function AgentsPage() {
  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Marketing Agents</h1>
          <p className="db-page-sub">3 specialized Claude AI agents — each with full dashboard, tools, tasks, kanban, calendar & todo</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {AGENTS.map(({ id, name, icon: Icon, color, description, quickStat }) => (
          <Link key={id} href={`/agents/${id}`} style={{ textDecoration: "none" }}>
            <div className="db-card" style={{ cursor: "pointer", transition: "border-color 0.15s", height: "100%" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: color + "20",
                  border: `1px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color, fontWeight: 600 }}>{quickStat}</div>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="db-card" style={{ marginTop: 20 }}>
        <div className="db-card-title">Backend Status</div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px" }}>
          Agents require the marketing-agents Python backend running on port 8001.
        </p>
        <pre style={{ fontSize: 12, background: "var(--surface-2)", padding: "10px 14px", borderRadius: 6, margin: 0, color: "var(--text)" }}>
{`cd marketing-agents/backend
pip install -r requirements.txt
# Add ANTHROPIC_API_KEY to .env
python3 -m uvicorn main:app --port 8001`}
        </pre>
      </div>
    </div>
  );
}
