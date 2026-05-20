"use client";
import { useState } from "react";
import { Share2, Clock, Image, Video, FileText, Hash, Zap } from "lucide-react";
import { SiInstagram, SiFacebook, SiSnapchat, SiTiktok } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";
import AgentChat from "@/components/agents/AgentChat";

type Platform = "Chat" | "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "Snapchat";

interface PlatformSpec {
  color: string;
  textColor?: string; // readable text color for light-bg platform colors (e.g. Snapchat yellow)
  icon: React.ReactNode;
  audience: string;
  bestTimes: string[];
  specs: { label: string; value: string; icon: React.ReactNode }[];
  quickActions: string[];
  contentTypes: { label: string; icon: React.ReactNode; desc: string }[];
}

const PLATFORMS: Record<Exclude<Platform, "Chat">, PlatformSpec> = {
  Instagram: {
    color: "#E1306C",
    icon: <SiInstagram size={15} />,
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
    color: "#1877F2",
    icon: <SiFacebook size={15} />,
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
    color: "#0A66C2",
    icon: <FaLinkedinIn size={15} />,
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
    color: "#010101",
    icon: <SiTiktok size={15} />,
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
    color: "#FFFC00",
    textColor: "#7A6E00",
    icon: <SiSnapchat size={15} />,
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

export default function SocialMediaPage() {
  const [platform, setPlatform] = useState<Platform>("Chat");

  const spec = platform !== "Chat" ? PLATFORMS[platform] : null;

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Social Media Manager</h1>
          <p className="db-page-sub">Content strategy and scheduling across Instagram, Facebook, LinkedIn, TikTok & Snapchat</p>
        </div>
      </div>

      {/* Platform tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {(["Chat", "Instagram", "Facebook", "LinkedIn", "TikTok", "Snapchat"] as Platform[]).map((p) => {
          const s = p !== "Chat" ? PLATFORMS[p] : null;
          const active = platform === p;
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: active ? 700 : 500,
                background: active ? (s?.color ?? "var(--gold)") : "var(--surface-2)",
                color: active
                  ? p === "Snapchat" ? "#111" : "#fff"
                  : "var(--text-muted)",
                transition: "all 0.15s",
              }}
            >
              {s ? s.icon : <Share2 size={15} />}
              {p}
            </button>
          );
        })}
      </div>

      {/* CHAT TAB */}
      {platform === "Chat" && (
        <AgentChat
          agentId="social"
          agentName="Social Media Manager"
          agentColor="#3B82F6"
          description="I build content calendars, analyse platform performance, and find the best times to post across all major social networks."
          quickActions={CHAT_QUICK_ACTIONS}
          icon={<Share2 size={18} color="#fff" />}
        />
      )}

      {/* PLATFORM TABS */}
      {spec && platform !== "Chat" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          {/* Left: specs + content types */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Platform header */}
            <div className="db-card" style={{ borderLeft: `3px solid ${spec.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: spec.color + "20", color: spec.textColor ?? spec.color, flexShrink: 0,
                }}>
                  {spec.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{platform}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{spec.audience}</div>
                </div>
              </div>
            </div>

            {/* Specs grid */}
            <div className="db-card">
              <div className="db-card-title">Platform Specs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {spec.specs.map((s) => (
                  <div key={s.label} style={{
                    background: "var(--surface-2)", borderRadius: 8,
                    padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: spec.textColor ?? spec.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content types */}
            <div className="db-card">
              <div className="db-card-title">Content Types</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {spec.contentTypes.map((ct) => (
                  <div key={ct.label} style={{
                    border: "1px solid var(--border)", borderRadius: 8,
                    padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: spec.color + "15", color: spec.textColor ?? spec.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {ct.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 2 }}>{ct.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{ct.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best times */}
            <div className="db-card">
              <div className="db-card-title">Best Posting Times (GST / UAE)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {spec.bestTimes.map((t) => (
                  <div key={t} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: spec.color + "15", color: spec.textColor ?? spec.color,
                    padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                  }}>
                    <Clock size={11} /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: platform quick actions via agent chat */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="db-card">
              <div className="db-card-title">{platform} Quick Actions</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                Click any action to send it to the Social Media Manager agent.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {spec.quickActions.map((action) => (
                  <button
                    key={action}
                    style={{
                      textAlign: "left", whiteSpace: "normal", lineHeight: 1.4,
                      fontSize: 12, padding: "9px 12px", borderRadius: 7,
                      background: "var(--surface-2)", border: `1px solid ${spec.color}30`,
                      cursor: "pointer", color: "var(--text)",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = spec.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = spec.color + "30")}
                    onClick={() => {
                      setPlatform("Chat");
                      setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>('input[placeholder*="Social"]');
                        if (input) {
                          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                          nativeSetter?.call(input, action);
                          input.dispatchEvent(new Event("input", { bubbles: true }));
                          input.focus();
                        }
                      }, 80);
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-title">Open Agent Chat</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
                Ask the Social Media Manager anything about {platform} strategy, scheduling, or analytics.
              </p>
              <button
                className="btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}
                onClick={() => setPlatform("Chat")}
              >
                <Share2 size={13} /> Chat with Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
