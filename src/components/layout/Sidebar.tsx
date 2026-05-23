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
  Bot, ChevronDown, ChevronRight, Users, LogOut, KanbanSquare,
  BarChart2, Layers, ImageIcon, TrendingUp, Target, Zap, KeyRound,
} from "lucide-react";
import { SiGoogleads, SiMeta, SiSnapchat, SiTiktok } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";

type UserRole = "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" | "SOCIAL_MANAGER";

const OIA_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/setup",     icon: Settings,        label: "Setup & Credentials" },
];

const ADS_PLATFORMS: {
  id: string; label: string; icon: React.ElementType; color: string;
  sub: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    id: "meta", label: "Meta Ads", icon: SiMeta, color: "#1877F2",
    sub: [
      { href: "/meta/campaigns", label: "Campaigns",  icon: Layers },
      { href: "/meta/adsets",    label: "Ad Sets",    icon: Target },
      { href: "/meta/ads",       label: "Ads",        icon: ImageIcon },
      { href: "/meta/insights",  label: "Insights",   icon: BarChart2 },
    ],
  },
  {
    id: "google", label: "Google Ads", icon: SiGoogleads, color: "#4285F4",
    sub: [
      { href: "/google/campaigns",   label: "Campaigns",   icon: Layers },
      { href: "/google/adgroups",    label: "Ad Groups",   icon: Target },
      { href: "/google/ads",         label: "Ads",         icon: ImageIcon },
      { href: "/google/keywords",    label: "Keywords",    icon: KeyRound },
      { href: "/google/performance", label: "Performance", icon: TrendingUp },
      { href: "/google/optimize",    label: "Optimize",    icon: Zap },
    ],
  },
  {
    id: "snapchat", label: "Snapchat Ads", icon: SiSnapchat, color: "#FFFC00",
    sub: [
      { href: "/ads/snapchat/campaigns", label: "Campaigns", icon: Layers },
      { href: "/ads/snapchat/adsets",    label: "Ad Sets",   icon: Target },
      { href: "/ads/snapchat/ads",       label: "Ads",       icon: ImageIcon },
    ],
  },
  {
    id: "tiktok", label: "TikTok Ads", icon: SiTiktok, color: "#EE1D52",
    sub: [
      { href: "/ads/tiktok/campaigns", label: "Campaigns", icon: Layers },
      { href: "/ads/tiktok/adgroups",  label: "Ad Groups", icon: Target },
      { href: "/ads/tiktok/ads",       label: "Ads",       icon: ImageIcon },
    ],
  },
  {
    id: "linkedin", label: "LinkedIn Ads", icon: FaLinkedinIn, color: "#0A66C2",
    sub: [
      { href: "/ads/linkedin/campaigns",  label: "Campaigns",  icon: Layers },
      { href: "/ads/linkedin/creatives",  label: "Creatives",  icon: ImageIcon },
      { href: "/ads/linkedin/analytics",  label: "Analytics",  icon: BarChart2 },
    ],
  },
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
  SEO_SPECIALIST: "#10B981",
  SOCIAL_MANAGER: "#3B82F6",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUiStore();
  const { isGoogleConnected, isMetaConnected } = useCredentialsStore();
  const { snapchat, tiktok, linkedin } = useAdsAccountStore();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role as UserRole) || "ADMIN";

  const [expandedPlatform, setExpandedPlatform] = useState<string | null>("meta");

  function connDot(connected: boolean) {
    return (
      <span style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: connected ? "#10B981" : "rgba(255,255,255,0.2)",
        marginLeft: 4,
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

        {/* OIA ADS — Dashboard + Setup + all ad platforms */}
        {isAdmin && (
          <div>
            <div className="db-nav-label">OIA ADS</div>

            {/* Top nav links */}
            {OIA_NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`db-nav-link${pathname === href ? " active" : ""}`}>
                <Icon className="nav-icon" size={16} />
                {label}
              </Link>
            ))}

            {/* Ad Platforms — accordion, directly inside OIA ADS */}
            <div style={{ marginTop: 4 }}>
              {ADS_PLATFORMS.map(({ id, label, icon: Icon, color, sub }) => {
                const connected = platformConnected[id];
                const isAnySubActive = id === "meta"
                  ? pathname.startsWith("/meta")
                  : id === "google"
                    ? pathname.startsWith("/google")
                    : sub.some(s => pathname.startsWith(s.href));
                const isExpanded = expandedPlatform === id;

                return (
                  <div key={id}>
                    {/* Platform row */}
                    <button
                      onClick={() => setExpandedPlatform(isExpanded ? null : id)}
                      className={`db-nav-link${isAnySubActive ? " active" : ""}`}
                      style={{
                        width: "100%", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <Icon size={14} className="nav-icon"
                        style={{ color: isAnySubActive ? color : undefined, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: isAnySubActive ? color : undefined }}>{label}</span>
                      {connDot(connected)}
                      {isExpanded
                        ? <ChevronDown size={11} style={{ color: "var(--text-muted)", marginLeft: 2, flexShrink: 0 }} />
                        : <ChevronRight size={11} style={{ color: "var(--text-muted)", marginLeft: 2, flexShrink: 0 }} />}
                    </button>

                    {/* Sub-links */}
                    {isExpanded && (
                      <div style={{ paddingLeft: 20 }}>
                        {sub.map((item, idx) => {
                          const subActive = pathname.startsWith(item.href);
                          const SubIcon = item.icon;
                          return (
                            <Link
                              key={`${item.href}-${idx}`}
                              href={item.href}
                              className={`db-nav-link${subActive ? " active" : ""}`}
                              style={{ fontSize: 12, paddingTop: 4, paddingBottom: 4 }}
                            >
                              <SubIcon size={11} className="nav-icon"
                                style={{ color: subActive ? color : undefined, flexShrink: 0 }} />
                              <span style={{ color: subActive ? color : undefined }}>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI */}
        <div>
          <div className="db-nav-label">AI</div>
          <Link href="/ai" className={`db-nav-link${pathname === "/ai" ? " active" : ""}`}>
            <Bot className="nav-icon" size={16} />
            AI Assistant
          </Link>
        </div>

        {/* TASKS */}
        <div>
          <div className="db-nav-label">TASKS</div>
          <Link href="/tasks" className={`db-nav-link${pathname === "/tasks" ? " active" : ""}`}>
            <KanbanSquare className="nav-icon" size={16} />
            Task Board
          </Link>
        </div>

        {/* ADMIN */}
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
              <div style={{ fontSize: 10, color: ROLE_COLORS[role], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {ROLE_LABELS[role]}
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)" }}>
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
