"use client";
import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, RefreshCw, Plus, Eye, EyeOff, ExternalLink } from "lucide-react";
import { SiGoogleads, SiMeta, SiSnapchat, SiTiktok } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useAdsAccountStore } from "@/store/adsAccountStore";
import { useMetaCampaigns, useMetaAdSets, useMetaInsights } from "@/hooks/useMetaAds";
import { useGoogleCampaigns, useGoogleAdGroups, useGoogleKeywords } from "@/hooks/useGoogleAds";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";

/* ─── platform config ──────────────────────────────────────────── */
type PlatformId = "meta" | "google" | "snapchat" | "tiktok" | "linkedin";

const PLATFORMS: Record<PlatformId, {
  name: string; color: string; textDark?: boolean;
  icon: React.ReactNode; description: string;
  connectType: "existing" | "api_key";
  fields?: { label: string; key: string; placeholder: string; secret?: boolean }[];
  tabs: string[];
}> = {
  meta: {
    name: "Meta Ads", color: "#1877F2", icon: <SiMeta size={20} color="#fff" />,
    description: "Facebook & Instagram advertising — campaigns, ad sets, ads, and insights.",
    connectType: "existing", tabs: ["Overview", "Campaigns", "Ad Sets", "Insights"],
  },
  google: {
    name: "Google Ads", color: "#4285F4", icon: <SiGoogleads size={20} color="#fff" />,
    description: "Search, Display, and YouTube advertising — campaigns, ad groups, and keywords.",
    connectType: "existing", tabs: ["Overview", "Campaigns", "Ad Groups", "Keywords"],
  },
  snapchat: {
    name: "Snapchat Ads", color: "#FFFC00", textDark: true, icon: <SiSnapchat size={20} color="#111" />,
    description: "Reach UAE youth and Gen Z with Snap Ads, Story Ads, and Collection Ads.",
    connectType: "api_key",
    fields: [
      { label: "Access Token", key: "accessToken", placeholder: "snap_xxxxx", secret: true },
      { label: "Advertiser ID", key: "advertiserId", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { label: "Account Name (optional)", key: "accountName", placeholder: "My Snapchat Account" },
    ],
    tabs: ["Overview", "Campaigns", "Ad Sets", "Ads"],
  },
  tiktok: {
    name: "TikTok Ads", color: "#010101", icon: <SiTiktok size={20} color="#fff" />,
    description: "Short-form video ads reaching UAE millennials and Gen Z on TikTok for Business.",
    connectType: "api_key",
    fields: [
      { label: "Access Token", key: "accessToken", placeholder: "xxxxxxxxxx", secret: true },
      { label: "Advertiser ID", key: "advertiserId", placeholder: "7000000000000000000" },
      { label: "Account Name (optional)", key: "accountName", placeholder: "My TikTok Ads Account" },
    ],
    tabs: ["Overview", "Campaigns", "Ad Groups", "Ads"],
  },
  linkedin: {
    name: "LinkedIn Ads", color: "#0A66C2", icon: <FaLinkedinIn size={18} color="#fff" />,
    description: "B2B and HNW professional advertising — sponsored content, message ads, and lead gen forms.",
    connectType: "api_key",
    fields: [
      { label: "Access Token", key: "accessToken", placeholder: "AQV...", secret: true },
      { label: "Ad Account ID", key: "advertiserId", placeholder: "123456789" },
      { label: "Account Name (optional)", key: "accountName", placeholder: "My LinkedIn Ad Account" },
    ],
    tabs: ["Overview", "Campaigns", "Creatives", "Analytics"],
  },
};

/* ─── stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="db-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─── campaign table ────────────────────────────────────────────── */
function CampaignTable({ campaigns, color }: { campaigns: { id: string; name: string; status: string; budget?: string; objective?: string }[]; color: string }) {
  if (campaigns.length === 0) return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No campaigns found</div>
      <div style={{ fontSize: 13 }}>Create your first campaign to get started.</div>
    </div>
  );
  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr><th>Campaign</th><th>Status</th><th>Objective</th><th>Budget</th></tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td>
                <span className={`badge ${c.status === "ACTIVE" || c.status === "ENABLED" ? "badge-enabled" : "badge-paused"}`}>
                  {c.status}
                </span>
              </td>
              <td><span className="badge" style={{ background: color + "20", color }}>{c.objective ?? "—"}</span></td>
              <td>{c.budget ? `AED ${c.budget}/day` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── connect form for api-key platforms ───────────────────────── */
function ConnectForm({
  platform, config, onSave,
}: {
  platform: PlatformId;
  config: typeof PLATFORMS[PlatformId];
  onSave: (vals: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});

  return (
    <div className="db-card" style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: config.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {config.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Connect {config.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Enter your API credentials to connect</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(config.fields ?? []).map(f => (
          <div key={f.key}>
            <label className="db-label">{f.label}</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="db-input"
                type={f.secret && !show[f.key] ? "password" : "text"}
                placeholder={f.placeholder}
                value={vals[f.key] ?? ""}
                onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                style={{ paddingRight: f.secret ? 36 : undefined }}
              />
              {f.secret && (
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                  style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  {show[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: 16, width: "100%" }}
        onClick={() => onSave(vals)}
        disabled={!(config.fields ?? []).filter(f => !f.label.includes("optional")).every(f => vals[f.key]?.trim())}
      >
        Connect Account
      </button>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
        Credentials are stored locally in your browser and never sent to our servers.
      </p>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────── */
export default function PlatformAdsPage({ params }: { params: { platform: string } }) {
  const platformId = params.platform as PlatformId;
  const config = PLATFORMS[platformId];
  if (!config) notFound();

  const [tab, setTab] = useState(config.tabs[0]);

  const { meta, google, isMetaConnected, isGoogleConnected } = useCredentialsStore();
  const { snapchat, tiktok, linkedin, setSnapchat, setTiktok, setLinkedin, clearSnapchat, clearTiktok, clearLinkedin } = useAdsAccountStore();

  /* derived connection state */
  const isConnected =
    platformId === "meta" ? isMetaConnected :
    platformId === "google" ? isGoogleConnected :
    platformId === "snapchat" ? !!snapchat :
    platformId === "tiktok" ? !!tiktok :
    platformId === "linkedin" ? !!linkedin : false;

  const accountInfo =
    platformId === "meta" ? { id: meta?.ad_account_id ?? "—", name: "Meta Ad Account" } :
    platformId === "google" ? { id: google?.customer_id ?? "—", name: "Google Ads Account" } :
    platformId === "snapchat" ? { id: snapchat?.advertiserId ?? "—", name: snapchat?.accountName ?? "Snapchat Account" } :
    platformId === "tiktok" ? { id: tiktok?.advertiserId ?? "—", name: tiktok?.accountName ?? "TikTok Account" } :
    platformId === "linkedin" ? { id: linkedin?.advertiserId ?? "—", name: linkedin?.accountName ?? "LinkedIn Account" } :
    { id: "—", name: "Account" };

  function handleConnect(vals: Record<string, string>) {
    if (platformId === "snapchat") setSnapchat({ accessToken: vals.accessToken, advertiserId: vals.advertiserId, accountName: vals.accountName });
    if (platformId === "tiktok") setTiktok({ accessToken: vals.accessToken, advertiserId: vals.advertiserId, accountName: vals.accountName });
    if (platformId === "linkedin") setLinkedin({ accessToken: vals.accessToken, advertiserId: vals.advertiserId, accountName: vals.accountName });
  }

  function handleDisconnect() {
    if (platformId === "snapchat") clearSnapchat();
    if (platformId === "tiktok") clearTiktok();
    if (platformId === "linkedin") clearLinkedin();
  }

  /* ─── Meta data hooks ──── */
  const metaCampaigns = useMetaCampaigns();
  const metaAdSets    = useMetaAdSets();
  const metaInsights  = useMetaInsights();

  /* ─── Google data hooks ── */
  const googleCampaigns = useGoogleCampaigns();
  const googleAdGroups  = useGoogleAdGroups();
  const googleKeywords  = useGoogleKeywords();

  /* auto-fetch on connect */
  useEffect(() => {
    if (platformId === "meta" && isMetaConnected) {
      metaCampaigns.refetch();
      metaInsights.refetch();
    }
    if (platformId === "google" && isGoogleConnected) {
      googleCampaigns.refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformId, isMetaConnected, isGoogleConnected]);

  const metaCampaignRows = ((metaCampaigns.data as any)?.campaigns ?? []).map((c: any) => ({
    id: c.id, name: c.name, status: c.status, objective: c.objective,
    budget: c.daily_budget ? (parseInt(c.daily_budget) / 100).toFixed(0) : undefined,
  }));
  const metaInsightData = (metaInsights.data as any)?.insights?.[0] ?? null;
  const googleCampaignRows = ((googleCampaigns.data as any)?.campaigns ?? []).map((c: any) => ({
    id: c.id, name: c.name, status: c.status, objective: c.campaign_type,
    budget: c.budget_micros ? (parseInt(c.budget_micros) / 1_000_000).toFixed(0) : undefined,
  }));
  const googleAdGroupRows = ((googleAdGroups.data as any)?.ad_groups ?? []).map((g: any) => ({
    id: g.id, name: g.name, status: g.status, objective: g.type, budget: undefined,
  }));
  const googleKeywordRows = ((googleKeywords.data as any)?.keywords ?? []).map((k: any) => ({
    id: k.criterion_id, name: k.keyword_text, status: k.status, objective: k.match_type, budget: undefined,
  }));

  return (
    <div>
      {/* Page header */}
      <div className="db-page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: config.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {config.icon}
          </div>
          <div>
            <h1 className="db-page-title">{config.name}</h1>
            <p className="db-page-sub">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Account selector */}
      <div className="db-card" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          {isConnected
            ? <CheckCircle size={16} style={{ color: "#10B981", flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
              {isConnected ? accountInfo.name : `${config.name} not connected`}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {isConnected ? `Account ID: ${accountInfo.id}` : "Connect an account to view campaigns and performance data"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isConnected && (platformId === "meta" || platformId === "google") && (
            <Link href="/setup" className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
              <ExternalLink size={12} /> Change Account
            </Link>
          )}
          {isConnected && platformId !== "meta" && platformId !== "google" && (
            <button className="btn-ghost" style={{ fontSize: 12, color: "#EF4444" }} onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
          {!isConnected && (platformId === "meta" || platformId === "google") && (
            <Link href="/setup" className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
              <Plus size={12} /> Connect Account
            </Link>
          )}
        </div>
      </div>

      {/* Not connected — show connect form for api-key platforms */}
      {!isConnected && config.connectType === "api_key" && (
        <ConnectForm platform={platformId} config={config} onSave={handleConnect} />
      )}

      {/* Not connected — existing platforms → redirect to setup */}
      {!isConnected && config.connectType === "existing" && (
        <div className="db-card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: config.color + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ color: config.color }}>{config.icon}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Connect {config.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Enter your {config.name} credentials in Setup & Credentials to view your campaigns and performance data.
          </div>
          <Link href="/setup" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Go to Setup
          </Link>
        </div>
      )}

      {/* Connected — tabs + content */}
      {isConnected && (
        <>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
            {config.tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 13, fontWeight: tab === t ? 700 : 500,
                  padding: "8px 14px", background: "none", border: "none",
                  borderBottom: tab === t ? `2px solid ${config.color}` : "2px solid transparent",
                  color: tab === t ? config.color : "var(--text-muted)",
                  cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 6, paddingBottom: 6 }}>
              <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                onClick={() => {
                  if (platformId === "meta") { metaCampaigns.refetch(); metaInsights.refetch(); }
                  if (platformId === "google") { googleCampaigns.refetch(); googleAdGroups.refetch(); googleKeywords.refetch(); }
                }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {/* ── META TABS ── */}
          {platformId === "meta" && (
            <>
              {tab === "Overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    <StatCard color={config.color} label="Campaigns" value={String(metaCampaignRows.length)} sub="Total in account" />
                    <StatCard color={config.color} label="Active" value={String(metaCampaignRows.filter((c: any) => c.status === "ACTIVE").length)} sub="Running now" />
                    {metaInsightData && <>
                      <StatCard color={config.color} label="Impressions" value={Number(metaInsightData.impressions ?? 0).toLocaleString()} sub="Last 30 days" />
                      <StatCard color={config.color} label="Clicks" value={Number(metaInsightData.clicks ?? 0).toLocaleString()} sub="Last 30 days" />
                      <StatCard color={config.color} label="Spend" value={`AED ${Number(metaInsightData.spend ?? 0).toFixed(0)}`} sub="Last 30 days" />
                    </>}
                  </div>
                  {metaCampaigns.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {metaCampaigns.error && <Alert type="err" message={metaCampaigns.error} />}
                  {!metaCampaigns.loading && !metaCampaigns.error && metaCampaignRows.length > 0 && (
                    <div className="db-card">
                      <div className="db-card-title">Recent Campaigns</div>
                      <CampaignTable campaigns={metaCampaignRows.slice(0, 5)} color={config.color} />
                    </div>
                  )}
                </div>
              )}
              {tab === "Campaigns" && (
                <div className="db-card" style={{ padding: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                    <div className="db-card-title" style={{ margin: 0 }}>All Campaigns</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }} onClick={metaCampaigns.refetch} disabled={metaCampaigns.loading}>
                        <RefreshCw size={12} />
                      </button>
                      <Link href="/meta/campaigns" className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <Plus size={12} /> New Campaign
                      </Link>
                    </div>
                  </div>
                  {metaCampaigns.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {metaCampaigns.error && <div style={{ padding: 16 }}><Alert type="err" message={metaCampaigns.error} /></div>}
                  <CampaignTable campaigns={metaCampaignRows} color={config.color} />
                </div>
              )}
              {tab === "Ad Sets" && (
                <div className="db-card" style={{ padding: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px" }}>
                    <div className="db-card-title" style={{ margin: 0 }}>Ad Sets</div>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={metaAdSets.refetch} disabled={metaAdSets.loading}><RefreshCw size={12} /></button>
                  </div>
                  {metaAdSets.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {metaAdSets.error && <div style={{ padding: 16 }}><Alert type="err" message={metaAdSets.error} /></div>}
                  <CampaignTable campaigns={((metaAdSets.data as any)?.adsets ?? []).map((s: any) => ({ id: s.id, name: s.name, status: s.status, objective: s.optimization_goal, budget: s.daily_budget ? (parseInt(s.daily_budget) / 100).toFixed(0) : undefined }))} color={config.color} />
                </div>
              )}
              {tab === "Insights" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {metaInsights.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {metaInsights.error && <Alert type="err" message={metaInsights.error} />}
                  {metaInsightData && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      <StatCard color={config.color} label="Impressions" value={Number(metaInsightData.impressions ?? 0).toLocaleString()} sub="Last 30 days" />
                      <StatCard color={config.color} label="Clicks" value={Number(metaInsightData.clicks ?? 0).toLocaleString()} sub="Last 30 days" />
                      <StatCard color={config.color} label="Spend" value={`AED ${Number(metaInsightData.spend ?? 0).toFixed(0)}`} sub="Last 30 days" />
                      <StatCard color={config.color} label="CTR" value={`${Number(metaInsightData.ctr ?? 0).toFixed(2)}%`} sub="Click-through rate" />
                      <StatCard color={config.color} label="CPM" value={`AED ${Number(metaInsightData.cpm ?? 0).toFixed(2)}`} sub="Cost per 1,000 imp." />
                      <StatCard color={config.color} label="Reach" value={Number(metaInsightData.reach ?? 0).toLocaleString()} sub="Unique accounts" />
                    </div>
                  )}
                  {!metaInsights.loading && !metaInsightData && (
                    <div className="db-card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                      No insight data available for this period.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── GOOGLE TABS ── */}
          {platformId === "google" && (
            <>
              {tab === "Overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    <StatCard color={config.color} label="Campaigns" value={String(googleCampaignRows.length)} sub="Total in account" />
                    <StatCard color={config.color} label="Active" value={String(googleCampaignRows.filter((c: any) => c.status === "ENABLED").length)} sub="Running now" />
                    <StatCard color={config.color} label="Ad Groups" value={String(googleAdGroupRows.length)} sub="Across all campaigns" />
                    <StatCard color={config.color} label="Keywords" value={String(googleKeywordRows.length)} sub="Active keywords" />
                  </div>
                  {googleCampaigns.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {googleCampaigns.error && <Alert type="err" message={googleCampaigns.error} />}
                  {!googleCampaigns.loading && googleCampaignRows.length > 0 && (
                    <div className="db-card">
                      <div className="db-card-title">Recent Campaigns</div>
                      <CampaignTable campaigns={googleCampaignRows.slice(0, 5)} color={config.color} />
                    </div>
                  )}
                </div>
              )}
              {tab === "Campaigns" && (
                <div className="db-card" style={{ padding: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                    <div className="db-card-title" style={{ margin: 0 }}>All Campaigns</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={googleCampaigns.refetch} disabled={googleCampaigns.loading}><RefreshCw size={12} /></button>
                      <Link href="/google/campaigns" className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Plus size={12} /> New Campaign</Link>
                    </div>
                  </div>
                  {googleCampaigns.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {googleCampaigns.error && <div style={{ padding: 16 }}><Alert type="err" message={googleCampaigns.error} /></div>}
                  <CampaignTable campaigns={googleCampaignRows} color={config.color} />
                </div>
              )}
              {tab === "Ad Groups" && (
                <div className="db-card" style={{ padding: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px" }}>
                    <div className="db-card-title" style={{ margin: 0 }}>Ad Groups</div>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={googleAdGroups.refetch} disabled={googleAdGroups.loading}><RefreshCw size={12} /></button>
                  </div>
                  {googleAdGroups.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {googleAdGroups.error && <div style={{ padding: 16 }}><Alert type="err" message={googleAdGroups.error} /></div>}
                  <CampaignTable campaigns={googleAdGroupRows} color={config.color} />
                </div>
              )}
              {tab === "Keywords" && (
                <div className="db-card" style={{ padding: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px" }}>
                    <div className="db-card-title" style={{ margin: 0 }}>Keywords</div>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={googleKeywords.refetch} disabled={googleKeywords.loading}><RefreshCw size={12} /></button>
                  </div>
                  {googleKeywords.loading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                  {googleKeywords.error && <div style={{ padding: 16 }}><Alert type="err" message={googleKeywords.error} /></div>}
                  <CampaignTable campaigns={googleKeywordRows} color={config.color} />
                </div>
              )}
            </>
          )}

          {/* ── SNAPCHAT / TIKTOK / LINKEDIN TABS ── */}
          {(platformId === "snapchat" || platformId === "tiktok" || platformId === "linkedin") && (
            <div className="db-card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: config.color + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <span style={{ color: config.color }}>{config.icon}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Account Connected</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                {accountInfo.name} · ID: {accountInfo.id}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 380, margin: "0 auto 20px" }}>
                Full {config.name} campaign management (create, pause, analytics) is available via the <strong>Media Buyer</strong> agent.
              </div>
              <Link href="/agents/media-buyer" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                Open Media Buyer Agent
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
