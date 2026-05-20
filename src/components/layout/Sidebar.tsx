"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUiStore } from "@/store/uiStore";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useAdsAccountStore } from "@/store/adsAccountStore";
import {
  LayoutDashboard, Settings, Moon, Sun,
  Bot, Search, PenTool, Share2, Shield, LayoutGrid,
  TrendingUp, ChevronDown, ChevronRight, Users, LogOut, KanbanSquare,
} from "lucide-react";
import { SiGoogleads, SiMeta, SiSnapchat, SiTiktok } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";

type UserRole = "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" | "SOCIAL_MANAGER";

const OIA_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/setup",     icon: Settings,        label: "Setup & Credentials" },
];

const ADS_PLATFORMS = [
  { id: "meta",     label: "Meta Ads",      icon: SiMeta,       color: "#1877F2" },
  { id: "google",   label: "Google Ads",    icon: SiGoogleads,  color: "#4285F4" },
  { id: "snapchat", label: "Snapchat Ads",  icon: SiSnapchat,   color: "#FFFC00" },
  { id: "tiktok",   label: "TikTok Ads",    icon: SiTiktok,     color: "#EE1D52" },
  { id: "linkedin", label: "LinkedIn Ads",  icon: FaLinkedinIn, color: "#0A66C2" },
];

const AGENT_NAV = [
  { href: "/agents",              icon: LayoutGrid,  label: "All Agents" },
  { href: "/agents/seo",          icon: Search,      label: "SEO Specialist" },
  { href: "/agents/content",      icon: PenTool,     label: "Content Creator" },
  { href: "/agents/social",       icon: Share2,      label: "Social Manager" },
  { href: "/agents/moderator",    icon: Shield,      label: "Moderator" },
  { href: "/agents/media-buyer",  icon: TrendingUp,  label: "Media Buyer" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  CONTENT_CREATOR: "Content Creator",
  SEO_SPECIALIST: "SEO Specialist",
  SOCIAL_MANAGER: "Social Manager",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "#B8860B",
  CONTENT_CREATOR: "#8B5CF6",
  SEO_SPECIALIST: "#3B82F6",
  SOCIAL_MANAGER: "#10B981",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUiStore();
  const { isGoogleConnected, isMetaConnected } = useCredentialsStore();
  const { snapchat, tiktok, linkedin } = useAdsAccountStore();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role as UserRole) || "ADMIN";

  const [adsOpen, setAdsOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(true);

  function connDot(connected: boolean) {
    return (
      <span style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: connected ? "#10B981" : "var(--text-muted)",
        opacity: connected ? 1 : 0.4,
        marginLeft: "auto",
      }} />
    );
  }

  const platformConnected: Record<string, boolean> = {
    meta: isMetaConnected,
    google: isGoogleConnected,
    snapchat: !!snapchat,
    tiktok: !!tiktok,
    linkedin: !!linkedin,
  };

  const isAdmin = role === "ADMIN";
  const isContent = role === "CONTENT_CREATOR";
  const isSeo = role === "SEO_SPECIALIST";
  const isSocial = role === "SOCIAL_MANAGER";

  return (
    <aside className="db-sidebar">
      <div className="db-brand">
        <div className="db-brand-logo"><span>OIA</span></div>
        <div>
          <div className="db-brand-name">Marketing</div>
          <div className="db-brand-sub">
            <span className={isGoogleConnected ? "text-green-400" : "text-white/30"}>G</span>
            {" · "}
            <span className={isMetaConnected ? "text-blue-400" : "text-white/30"}>M</span>
          </div>
        </div>
      </div>

      <nav className="db-nav">
        {/* OIA ADS — admin only */}
        {isAdmin && (
          <div>
            <div className="db-nav-label">OIA ADS</div>
            {OIA_NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`db-nav-link${pathname === href ? " active" : ""}`}>
                <Icon className="nav-icon" size={16} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ADS — admin only, collapsible */}
        {isAdmin && (
          <div>
            <button
              onClick={() => setAdsOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <div className="db-nav-label" style={{ flex: 1, marginBottom: 0 }}>ADS</div>
              {adsOpen
                ? <ChevronDown size={11} style={{ color: "var(--text-muted)", marginRight: 4 }} />
                : <ChevronRight size={11} style={{ color: "var(--text-muted)", marginRight: 4 }} />
              }
            </button>

            {adsOpen && ADS_PLATFORMS.map(({ id, label, icon: Icon, color }) => {
              const href = `/ads/${id}`;
              const active = pathname.startsWith(href);
              const connected = platformConnected[id];
              return (
                <Link key={id} href={href} className={`db-nav-link${active ? " active" : ""}`}
                  style={{ display: "flex", alignItems: "center" }}>
                  <Icon className="nav-icon" size={16} style={{ color: active ? color : undefined }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {connDot(connected)}
                </Link>
              );
            })}
          </div>
        )}

        {/* MARKETING AGENTS — filtered by role */}
        <div>
          {isAdmin && (
            <button
              onClick={() => setAgentsOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <div className="db-nav-label" style={{ flex: 1, marginBottom: 0 }}>MARKETING AGENTS</div>
              {agentsOpen
                ? <ChevronDown size={11} style={{ color: "var(--text-muted)", marginRight: 4 }} />
                : <ChevronRight size={11} style={{ color: "var(--text-muted)", marginRight: 4 }} />
              }
            </button>
          )}
          {!isAdmin && <div className="db-nav-label">MY WORKSPACE</div>}

          {(isAdmin ? agentsOpen : true) && (
            <>
              {isAdmin && AGENT_NAV.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className={`db-nav-link${pathname === href ? " active" : ""}`}>
                  <Icon className="nav-icon" size={16} />
                  {label}
                </Link>
              ))}
              {isContent && (
                <Link href="/agents/content" className={`db-nav-link${pathname === "/agents/content" ? " active" : ""}`}>
                  <PenTool className="nav-icon" size={16} />
                  Content Creator
                </Link>
              )}
              {isSeo && (
                <Link href="/agents/seo" className={`db-nav-link${pathname === "/agents/seo" ? " active" : ""}`}>
                  <Search className="nav-icon" size={16} />
                  SEO Specialist
                </Link>
              )}
              {isSocial && (
                <Link href="/agents/social" className={`db-nav-link${pathname === "/agents/social" ? " active" : ""}`}>
                  <Share2 className="nav-icon" size={16} />
                  Social Manager
                </Link>
              )}
            </>
          )}
        </div>

        {/* AI */}
        <div>
          <div className="db-nav-label">AI</div>
          <Link href="/ai" className={`db-nav-link${pathname === "/ai" ? " active" : ""}`}>
            <Bot className="nav-icon" size={16} />
            AI Assistant
          </Link>
        </div>

        {/* TASKS — all roles */}
        <div>
          <div className="db-nav-label">TASKS</div>
          <Link href="/tasks" className={`db-nav-link${pathname === "/tasks" ? " active" : ""}`}>
            <KanbanSquare className="nav-icon" size={16} />
            Task Board
          </Link>
        </div>

        {/* TEAM — admin only */}
        {isAdmin && (
          <div>
            <div className="db-nav-label">ADMIN</div>
            <Link href="/team" className={`db-nav-link${pathname === "/team" ? " active" : ""}`}>
              <Users className="nav-icon" size={16} />
              Team
            </Link>
          </div>
        )}
      </nav>

      <div className="db-sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* User info */}
        {session?.user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: ROLE_COLORS[role] + "40",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: ROLE_COLORS[role],
            }}>
              {(session.user.name || session.user.email || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user.name || session.user.email}
              </div>
              <div style={{
                fontSize: 10, color: ROLE_COLORS[role], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {ROLE_LABELS[role]}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)" }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
