"use client";
import { useEffect } from "react";
import { useMetaAds, useMetaCampaigns } from "@/hooks/useMetaAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import type { MetaAd, MetaCampaign } from "@/types/meta";

export default function MetaAdsPage() {
  const { isMetaConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data, loading, error, refetch } = useMetaAds(campaignId);
  const { data: campData, refetch: refetchCamps } = useMetaCampaigns();

  useEffect(() => { if (isMetaConnected) { refetch(); refetchCamps(); } }, [isMetaConnected]);

  const ads: MetaAd[] = (data as any)?.ads ?? [];
  const campaigns: MetaCampaign[] = (campData as any)?.campaigns ?? [];

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Meta Ads</h1>
          <p className="db-page-sub">Facebook & Instagram ad creatives</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={campaignId ?? ""} onChange={e => setCampaignId(e.target.value || undefined)}>
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
        </div>
      </div>

      {!isMetaConnected && <Alert type="warn" message="Connect Meta Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}

      <div className="db-table-wrap">
        <table className="db-table">
          <thead><tr><th>Name</th><th>Status</th><th>Ad Set ID</th><th>Creative</th></tr></thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.id}>
                <td style={{ fontWeight: 600 }}>{ad.name}</td>
                <td><span className={`badge ${ad.status === "ACTIVE" ? "badge-enabled" : ad.status === "PAUSED" ? "badge-paused" : "badge-removed"}`}>{ad.status}</span></td>
                <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{ad.adset_id ?? "—"}</td>
                <td style={{ fontSize: 11 }}>{ad.creative?.name ?? ad.creative?.id ?? "—"}</td>
              </tr>
            ))}
            {ads.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No ads loaded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
