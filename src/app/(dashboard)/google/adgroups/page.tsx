"use client";
import { useEffect, useState } from "react";
import { useGoogleAdGroups, useGoogleCampaigns, googleAction } from "@/hooks/useGoogleAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { fmtMicros, fmtNum } from "@/lib/format";
import { CAMPAIGN_STATUS } from "@/types/google";

export default function GoogleAdGroupsPage() {
  const { google, isGoogleConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data: adGroupData, loading, error, refetch } = useGoogleAdGroups(campaignId);
  const { data: campData, refetch: refetchCamps } = useGoogleCampaigns();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", campaign_id: "", cpc_bid: "1" });

  useEffect(() => { if (isGoogleConnected) { refetch(); refetchCamps(); } }, [isGoogleConnected]);

  const adGroups: any[] = (adGroupData as any)?.adGroups ?? [];
  const campaigns: any[] = (campData as any)?.campaigns ?? [];

  async function handleCreate() {
    if (!google) return;
    setSaving(true);
    setMsg(null);
    const res = await googleAction("/api/google/adgroups/create", google, {
      adGroup: { name: form.name, campaign_id: form.campaign_id, cpc_bid: parseFloat(form.cpc_bid) },
    });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: "Ad Group created!" }); setShowModal(false); refetch(); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Ad Groups</h1>
          <p className="db-page-sub">Manage your Google Ads ad groups</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="db-input" style={{ width: "auto" }} value={campaignId ?? ""} onChange={e => { setCampaignId(e.target.value || undefined); }}>
            <option value="">All Campaigns</option>
            {campaigns.map((r: any) => <option key={r.campaign?.id} value={r.campaign?.id}>{r.campaign?.name}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Ad Group</button>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr><th>Name</th><th>Status</th><th>CPC Bid</th><th>Impressions</th><th>Clicks</th><th>Cost</th><th>Conversions</th></tr>
          </thead>
          <tbody>
            {adGroups.map((row: any) => {
              const ag = row.ad_group;
              const m = row.metrics;
              const status = CAMPAIGN_STATUS[ag?.status] ?? "UNKNOWN";
              return (
                <tr key={ag?.id}>
                  <td style={{ fontWeight: 600 }}>{ag?.name}</td>
                  <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                  <td>{fmtMicros(ag?.cpc_bid_micros ?? 0)}</td>
                  <td>{fmtNum(m?.impressions ?? 0)}</td>
                  <td>{fmtNum(m?.clicks ?? 0)}</td>
                  <td>{fmtMicros(m?.cost_micros ?? 0)}</td>
                  <td>{(m?.conversions ?? 0).toFixed(1)}</td>
                </tr>
              );
            })}
            {adGroups.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No ad groups found. Select a campaign or load all.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Ad Group" onClose={() => setShowModal(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <Spinner size={14} /> : null} Create</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field">
              <label className="db-label">Ad Group Name</label>
              <input className="db-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="db-label">Campaign</label>
              <select className="db-input" value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">Select campaign…</option>
                {campaigns.map((r: any) => <option key={r.campaign?.id} value={r.campaign?.id}>{r.campaign?.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="db-label">CPC Bid (AED)</label>
              <input className="db-input" type="number" step="0.5" value={form.cpc_bid} onChange={e => setForm({ ...form, cpc_bid: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
