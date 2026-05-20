"use client";
import { useEffect, useState } from "react";
import { useMetaCampaigns, metaAction } from "@/hooks/useMetaAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { META_OBJECTIVES } from "@/types/meta";
import type { MetaCampaign } from "@/types/meta";

export default function MetaCampaignsPage() {
  const { meta, isMetaConnected } = useCredentialsStore();
  const { data, loading, error, refetch } = useMetaCampaigns();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", objective: "LEAD_GENERATION", daily_budget: "20000", status: "PAUSED" });

  useEffect(() => { if (isMetaConnected) refetch(); }, [isMetaConnected]);

  const campaigns: MetaCampaign[] = (data as any)?.campaigns ?? [];

  async function handleCreate() {
    if (!meta) return;
    setSaving(true);
    const res = await metaAction("/api/meta/campaigns", meta, {
      campaign: { name: form.name, objective: form.objective, daily_budget: form.daily_budget, status: form.status },
    });
    setSaving(false);
    if (res.success) { setMsg({ type: "ok", text: "Campaign created!" }); setShowModal(false); refetch(); }
    else setMsg({ type: "err", text: res.error ?? "Failed" });
  }

  async function toggleStatus(campaign: MetaCampaign) {
    if (!meta) return;
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch(`/api/meta/campaigns/${campaign.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentials: meta, status: newStatus }),
    });
    refetch();
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Meta Campaigns</h1>
          <p className="db-page-sub">Facebook & Instagram campaigns</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
        </div>
      </div>

      {!isMetaConnected && <Alert type="warn" message="Connect Meta Ads in Setup to view campaigns." />}
      {error && <Alert type="err" message={error} />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      {campaigns.length === 0 && !loading ? (
        <EmptyState title="No Meta campaigns" sub="Create a campaign or check your credentials." action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>} />
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr><th>Campaign</th><th>Status</th><th>Objective</th><th>Daily Budget</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <span className={`badge ${c.status === "ACTIVE" ? "badge-enabled" : c.status === "PAUSED" ? "badge-paused" : "badge-removed"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td><span className="badge badge-meta">{c.objective}</span></td>
                  <td>{c.daily_budget ? `AED ${(parseInt(c.daily_budget) / 100).toFixed(0)}/day` : "—"}</td>
                  <td>
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => toggleStatus(c)}>
                      {c.status === "ACTIVE" ? "Pause" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Meta Campaign" onClose={() => setShowModal(false)}
          footer={<><button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? <Spinner size={14} /> : null} Create</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-field">
              <label className="db-label">Campaign Name</label>
              <input className="db-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="db-label">Objective</label>
              <select className="db-input" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}>
                {META_OBJECTIVES.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="db-label">Daily Budget (in smallest currency unit — fils for AED)</label>
              <input className="db-input" type="number" value={form.daily_budget} onChange={e => setForm({ ...form, daily_budget: e.target.value })} placeholder="20000 = AED 200" />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Campaign will be created as PAUSED for safety.</p>
        </Modal>
      )}
    </div>
  );
}
