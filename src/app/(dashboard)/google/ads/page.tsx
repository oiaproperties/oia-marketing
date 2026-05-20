"use client";
import { useEffect, useState } from "react";
import { useGoogleAds, useGoogleCampaigns, useGoogleAdGroups, googleAction } from "@/hooks/useGoogleAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { fmtNum, fmtPct } from "@/lib/format";
import { CAMPAIGN_STATUS } from "@/types/google";

export default function GoogleAdsPage() {
  const { google, isGoogleConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data, loading, error, refetch } = useGoogleAds(campaignId);
  const { data: campData, refetch: refetchCamps } = useGoogleCampaigns();
  const { data: agData, refetch: refetchAgs } = useGoogleAdGroups(campaignId);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ ad_group_id: "", final_url: "https://", headlines: "Luxury Villas in Dubai\nBuy Property in Yas Island\nAldar Yas Acres | Invest Now", descriptions: "Discover premium waterfront living in Abu Dhabi.\nRegister your interest today. Limited units available." });

  useEffect(() => { if (isGoogleConnected) { refetch(); refetchCamps(); } }, [isGoogleConnected]);
  useEffect(() => { if (campaignId) refetchAgs(); }, [campaignId]);

  const ads: any[] = (data as any)?.ads ?? [];
  const campaigns: any[] = (campData as any)?.campaigns ?? [];
  const adGroups: any[] = (agData as any)?.adGroups ?? [];

  async function handleCreate() {
    if (!google) return;
    setSaving(true);
    const res = await googleAction("/api/google/ads/create", google, {
      ad_group_id: form.ad_group_id,
      ad: {
        final_url: form.final_url,
        headlines:    form.headlines.split("\n").map(s => s.trim()).filter(Boolean),
        descriptions: form.descriptions.split("\n").map(s => s.trim()).filter(Boolean),
      },
    });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: "RSA Ad created!" }); setShowModal(false); refetch(); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Responsive Search Ads</h1>
          <p className="db-page-sub">Manage RSA ads</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={campaignId ?? ""} onChange={e => setCampaignId(e.target.value || undefined)}>
            <option value="">All Campaigns</option>
            {campaigns.map((r: any) => <option key={r.campaign?.id} value={r.campaign?.id}>{r.campaign?.name}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Ad</button>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr><th>Ad</th><th>Campaign</th><th>Status</th><th>Final URL</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Conv.</th></tr>
          </thead>
          <tbody>
            {ads.map((row: any) => {
              const ad = row.ad_group_ad?.ad;
              const m = row.metrics;
              const status = CAMPAIGN_STATUS[row.ad_group_ad?.status] ?? "UNKNOWN";
              const headlines = ad?.responsive_search_ad?.headlines?.slice(0, 2).map((h: any) => h.text).join(" | ") ?? ad?.name ?? "—";
              return (
                <tr key={ad?.id}>
                  <td style={{ fontWeight: 500, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{headlines}</td>
                  <td>{row.campaign?.name}</td>
                  <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad?.final_urls?.[0]}</td>
                  <td>{fmtNum(m?.impressions ?? 0)}</td>
                  <td>{fmtNum(m?.clicks ?? 0)}</td>
                  <td>{fmtPct(m?.ctr ?? 0)}</td>
                  <td>{(m?.conversions ?? 0).toFixed(1)}</td>
                </tr>
              );
            })}
            {ads.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No ads loaded. Select a campaign and refresh.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Responsive Search Ad" onClose={() => setShowModal(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <Spinner size={14} /> : null} Create Ad</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field">
              <label className="db-label">Ad Group</label>
              <select className="db-input" value={form.ad_group_id} onChange={e => setForm({ ...form, ad_group_id: e.target.value })}>
                <option value="">Select ad group…</option>
                {adGroups.map((r: any) => <option key={r.ad_group?.id} value={r.ad_group?.id}>{r.ad_group?.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="db-label">Final URL</label>
              <input className="db-input" value={form.final_url} onChange={e => setForm({ ...form, final_url: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="db-label">Headlines (one per line, 3–15)</label>
              <textarea className="db-input" rows={5} value={form.headlines} onChange={e => setForm({ ...form, headlines: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="db-label">Descriptions (one per line, 2–4)</label>
              <textarea className="db-input" rows={3} value={form.descriptions} onChange={e => setForm({ ...form, descriptions: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
