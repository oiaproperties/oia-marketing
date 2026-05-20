"use client";
import { useEffect, useState } from "react";
import { useMetaAdSets, useMetaCampaigns, metaAction } from "@/hooks/useMetaAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import type { MetaAdSet, MetaCampaign } from "@/types/meta";

export default function MetaAdSetsPage() {
  const { meta, isMetaConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data, loading, error, refetch } = useMetaAdSets(campaignId);
  const { data: campData, refetch: refetchCamps } = useMetaCampaigns();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", campaign_id: "", daily_budget: "10000", optimization_goal: "LEAD_GENERATION", billing_event: "IMPRESSIONS" });

  useEffect(() => { if (isMetaConnected) { refetch(); refetchCamps(); } }, [isMetaConnected]);

  const adsets: MetaAdSet[] = (data as any)?.adsets ?? [];
  const campaigns: MetaCampaign[] = (campData as any)?.campaigns ?? [];

  async function handleCreate() {
    if (!meta) return;
    setSaving(true);
    const res = await metaAction("/api/meta/adsets", meta, { adset: form });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: "Ad Set created!" }); setShowModal(false); refetch(); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Meta Ad Sets</h1>
          <p className="db-page-sub">Ad set management</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={campaignId ?? ""} onChange={e => setCampaignId(e.target.value || undefined)}>
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Ad Set</button>
        </div>
      </div>

      {!isMetaConnected && <Alert type="warn" message="Connect Meta Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      <div className="db-table-wrap">
        <table className="db-table">
          <thead><tr><th>Name</th><th>Status</th><th>Campaign ID</th><th>Daily Budget</th><th>Optimization</th><th>Billing</th></tr></thead>
          <tbody>
            {adsets.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td><span className={`badge ${s.status === "ACTIVE" ? "badge-enabled" : s.status === "PAUSED" ? "badge-paused" : "badge-removed"}`}>{s.status}</span></td>
                <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.campaign_id}</td>
                <td>{s.daily_budget ? `AED ${(parseInt(s.daily_budget) / 100).toFixed(0)}/day` : "—"}</td>
                <td>{s.optimization_goal ?? "—"}</td>
                <td>{s.billing_event ?? "—"}</td>
              </tr>
            ))}
            {adsets.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No ad sets loaded.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Ad Set" onClose={() => setShowModal(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <Spinner size={14} /> : null} Create</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field"><label className="db-label">Name</label><input className="db-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-field">
              <label className="db-label">Campaign</label>
              <select className="db-input" value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">Select campaign…</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field"><label className="db-label">Daily Budget (fils)</label><input className="db-input" type="number" value={form.daily_budget} onChange={e => setForm({ ...form, daily_budget: e.target.value })} placeholder="10000 = AED 100" /></div>
            <div className="form-field">
              <label className="db-label">Optimization Goal</label>
              <select className="db-input" value={form.optimization_goal} onChange={e => setForm({ ...form, optimization_goal: e.target.value })}>
                <option value="LEAD_GENERATION">Lead Generation</option>
                <option value="CONVERSIONS">Conversions</option>
                <option value="REACH">Reach</option>
                <option value="LINK_CLICKS">Link Clicks</option>
                <option value="IMPRESSIONS">Impressions</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
