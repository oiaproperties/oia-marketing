"use client";
import { useEffect, useState } from "react";
import { useGoogleKeywords, useGoogleCampaigns, googleAction } from "@/hooks/useGoogleAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { fmtMicros, fmtPct } from "@/lib/format";
import { MATCH_TYPE } from "@/types/google";

export default function GoogleKeywordsPage() {
  const { google, isGoogleConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data, loading, error, refetch } = useGoogleKeywords(campaignId);
  const { data: campData, refetch: refetchCamps } = useGoogleCampaigns();
  const [showPos, setShowPos] = useState(false);
  const [showNeg, setShowNeg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [posForm, setPosForm] = useState({ ad_group_id: "", keywords: "", match_type: "PHRASE" });
  const [negForm, setNegForm] = useState({ campaign_id: "", keywords: "" });

  useEffect(() => { if (isGoogleConnected) { refetch(); refetchCamps(); } }, [isGoogleConnected]);

  const keywords: any[] = (data as any)?.keywords ?? [];
  const campaigns: any[] = (campData as any)?.campaigns ?? [];

  async function addPositive() {
    if (!google) return;
    setSaving(true);
    const kwList = posForm.keywords.split("\n").map(s => s.trim()).filter(Boolean).map(text => ({ text, match_type: posForm.match_type as any }));
    const res = await googleAction("/api/google/keywords/create", google, { ad_group_id: posForm.ad_group_id, keywords: kwList });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: `${kwList.length} keyword(s) added!` }); setShowPos(false); refetch(); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  async function addNegative() {
    if (!google) return;
    setSaving(true);
    const kwList = negForm.keywords.split("\n").map(s => s.trim()).filter(Boolean).map(text => ({ text }));
    const res = await googleAction("/api/google/negative-keywords/create", google, { campaign_id: negForm.campaign_id, keywords: kwList });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: `${kwList.length} negative keyword(s) added!` }); setShowNeg(false); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Keywords</h1>
          <p className="db-page-sub">Keyword performance — Last 30 days</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={campaignId ?? ""} onChange={e => setCampaignId(e.target.value || undefined)}>
            <option value="">All Campaigns</option>
            {campaigns.map((r: any) => <option key={r.campaign?.id} value={r.campaign?.id}>{r.campaign?.name}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
          <button className="btn-ghost" onClick={() => setShowNeg(true)}>+ Negative</button>
          <button className="btn-primary" onClick={() => setShowPos(true)}>+ Keywords</button>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr><th>Keyword</th><th>Match Type</th><th>Quality Score</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Cost</th></tr>
          </thead>
          <tbody>
            {keywords.map((row: any, i: number) => {
              const kw = row.ad_group_criterion?.keyword;
              const qi = row.ad_group_criterion?.quality_info;
              const m = row.metrics;
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{kw?.text}</td>
                  <td><span className="badge badge-draft">{MATCH_TYPE[kw?.match_type] ?? kw?.match_type}</span></td>
                  <td>{qi?.quality_score ?? "—"}/10</td>
                  <td>{(m?.impressions ?? 0).toLocaleString()}</td>
                  <td>{(m?.clicks ?? 0).toLocaleString()}</td>
                  <td>{fmtPct(m?.ctr ?? 0)}</td>
                  <td>{fmtMicros(m?.cost_micros ?? 0)}</td>
                </tr>
              );
            })}
            {keywords.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No keywords loaded. Select a campaign and refresh.</td></tr>}
          </tbody>
        </table>
      </div>

      {showPos && (
        <Modal title="Add Keywords" onClose={() => setShowPos(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowPos(false)}>Cancel</button><button className="btn-primary" onClick={addPositive} disabled={saving}>{saving ? <Spinner size={14} /> : null} Add</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field">
              <label className="db-label">Ad Group ID</label>
              <input className="db-input" value={posForm.ad_group_id} onChange={e => setPosForm({ ...posForm, ad_group_id: e.target.value })} placeholder="Ad Group ID from table" />
            </div>
            <div className="form-field">
              <label className="db-label">Match Type</label>
              <select className="db-input" value={posForm.match_type} onChange={e => setPosForm({ ...posForm, match_type: e.target.value })}>
                <option value="EXACT">Exact</option>
                <option value="PHRASE">Phrase</option>
                <option value="BROAD">Broad</option>
              </select>
            </div>
            <div className="form-field">
              <label className="db-label">Keywords (one per line)</label>
              <textarea className="db-input" rows={6} value={posForm.keywords} onChange={e => setPosForm({ ...posForm, keywords: e.target.value })} placeholder="luxury villa dubai&#10;buy apartment yas island&#10;aldar properties" />
            </div>
          </div>
        </Modal>
      )}

      {showNeg && (
        <Modal title="Add Negative Keywords" onClose={() => setShowNeg(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowNeg(false)}>Cancel</button><button className="btn-primary" onClick={addNegative} disabled={saving}>{saving ? <Spinner size={14} /> : null} Add</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field">
              <label className="db-label">Campaign</label>
              <select className="db-input" value={negForm.campaign_id} onChange={e => setNegForm({ ...negForm, campaign_id: e.target.value })}>
                <option value="">Select campaign…</option>
                {campaigns.map((r: any) => <option key={r.campaign?.id} value={r.campaign?.id}>{r.campaign?.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="db-label">Negative Keywords (one per line)</label>
              <textarea className="db-input" rows={6} value={negForm.keywords} onChange={e => setNegForm({ ...negForm, keywords: e.target.value })} placeholder="free&#10;cheap&#10;jobs" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
