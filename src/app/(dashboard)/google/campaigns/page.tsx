"use client";
import { useEffect, useState } from "react";
import { useGoogleCampaigns } from "@/hooks/useGoogleAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import { googleAction } from "@/hooks/useGoogleAds";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { fmtMicros, fmtNum, fmtPct } from "@/lib/format";
import { CAMPAIGN_STATUS } from "@/types/google";

export default function GoogleCampaignsPage() {
  const { google, isGoogleConnected } = useCredentialsStore();
  const { data, loading, error, refetch } = useGoogleCampaigns();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", daily_budget: "200", type: "SEARCH", bidding_strategy: "MAXIMIZE_CONVERSIONS" });

  useEffect(() => { if (isGoogleConnected) refetch(); }, [isGoogleConnected]);

  const campaigns: any[] = (data as any)?.campaigns ?? [];

  async function handleCreate() {
    if (!google) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await googleAction("/api/google/campaigns/create", google, {
      campaign: { name: form.name, daily_budget: parseFloat(form.daily_budget), type: form.type, bidding_strategy: form.bidding_strategy },
    });
    setSaving(false);
    if (res.success) {
      setSaveMsg({ type: "ok", text: (res.data as any)?.message ?? "Campaign created!" });
      setShowModal(false);
      refetch();
    } else {
      setSaveMsg({ type: "err", text: res.error ?? "Failed" });
    }
  }

  async function toggleStatus(row: any) {
    if (!google) return;
    const current = CAMPAIGN_STATUS[row.campaign?.status];
    const newStatus = current === "ENABLED" ? "PAUSED" : "ENABLED";
    await googleAction("/api/google/campaigns/update", google, {
      campaign_id: row.campaign?.id,
      updates: { status: newStatus, budget_resource_name: row.campaign_budget?.resource_name },
    });
    refetch();
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Google Campaigns</h1>
          <p className="db-page-sub">Last 30 days performance</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>
            {loading ? <Spinner size={14} /> : null} Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup to view campaigns." />}
      {error && <Alert type="err" message={error} />}
      {saveMsg && <Alert type={saveMsg.type} message={saveMsg.text} />}

      {campaigns.length === 0 && !loading ? (
        <EmptyState title="No campaigns found" sub="Create your first campaign or check your credentials." action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>} />
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Budget/day</th>
                <th>Spend</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Conversions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((row: any) => {
                const c = row.campaign;
                const m = row.metrics;
                const b = row.campaign_budget;
                const status = CAMPAIGN_STATUS[c?.status] ?? "UNKNOWN";
                return (
                  <tr key={c?.id}>
                    <td style={{ fontWeight: 600 }}>{c?.name}</td>
                    <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                    <td>{fmtMicros(b?.amount_micros ?? 0)}</td>
                    <td>{fmtMicros(m?.cost_micros ?? 0)}</td>
                    <td>{fmtNum(m?.impressions ?? 0)}</td>
                    <td>{fmtNum(m?.clicks ?? 0)}</td>
                    <td>{fmtPct(m?.ctr ?? 0)}</td>
                    <td>{(m?.conversions ?? 0).toFixed(1)}</td>
                    <td>
                      <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => toggleStatus(row)}>
                        {status === "ENABLED" ? "Pause" : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Campaign" onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Spinner size={14} /> : null} Create Campaign
              </button>
            </>
          }>
          <div className="form-grid">
            <div className="form-field full">
              <label className="db-label">Campaign Name</label>
              <input className="db-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Global Buyers" />
            </div>
            <div className="form-field">
              <label className="db-label">Daily Budget (AED)</label>
              <input className="db-input" type="number" value={form.daily_budget} onChange={e => setForm({ ...form, daily_budget: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="db-label">Campaign Type</label>
              <select className="db-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="SEARCH">Search</option>
                <option value="DISPLAY">Display</option>
              </select>
            </div>
            <div className="form-field full">
              <label className="db-label">Bidding Strategy</label>
              <select className="db-input" value={form.bidding_strategy} onChange={e => setForm({ ...form, bidding_strategy: e.target.value })}>
                <option value="MAXIMIZE_CONVERSIONS">Maximize Conversions</option>
                <option value="TARGET_CPA">Target CPA</option>
              </select>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Campaign will be created as PAUSED for safety.</p>
        </Modal>
      )}
    </div>
  );
}
