"use client";
import { useState } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import type { GoogleCredentials } from "@/types/google";
import type { MetaCredentials } from "@/types/meta";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

export default function SetupPage() {
  const { google, meta, setGoogle, setMeta, clearGoogle, clearMeta, isGoogleConnected, isMetaConnected } =
    useCredentialsStore();

  const [gForm, setGForm] = useState<GoogleCredentials>(
    google ?? {
      client_id: "", client_secret: "", developer_token: "",
      login_customer_id: "6524400486", refresh_token: "", customer_id: "7066120068",
    }
  );
  const [mForm, setMForm] = useState<MetaCredentials>(
    meta ?? { access_token: "", app_id: "", app_secret: "", ad_account_id: "" }
  );
  const [gLoading, setGLoading] = useState(false);
  const [mLoading, setMLoading] = useState(false);
  const [gMsg, setGMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [mMsg, setMMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function testGoogle() {
    setGLoading(true);
    setGMsg(null);
    try {
      const res = await fetch("/api/google/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: gForm }),
      });
      const json = await res.json();
      if (json.success) {
        setGoogle(gForm);
        setGMsg({ type: "ok", text: `Connected! Found ${json.data?.customers?.length ?? 0} accessible customer(s).` });
      } else {
        setGMsg({ type: "err", text: json.error ?? "Connection failed" });
      }
    } catch {
      setGMsg({ type: "err", text: "Network error" });
    }
    setGLoading(false);
  }

  async function testMeta() {
    setMLoading(true);
    setMMsg(null);
    try {
      const res = await fetch("/api/meta/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: mForm }),
      });
      const json = await res.json();
      if (json.success) {
        setMeta(mForm);
        setMMsg({ type: "ok", text: `Connected! Found ${json.data?.campaigns?.length ?? 0} campaign(s).` });
      } else {
        setMMsg({ type: "err", text: json.error ?? "Connection failed" });
      }
    } catch {
      setMMsg({ type: "err", text: "Network error" });
    }
    setMLoading(false);
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Setup & Credentials</h1>
          <p className="db-page-sub">Connect your Google Ads and Meta Ads accounts</p>
        </div>
      </div>

      {/* Google Ads */}
      <div className="db-card">
        <div className="db-card-title">
          <span style={{ color: "var(--google-blue)" }}>G</span>
          Google Ads Credentials
          {isGoogleConnected && <span className="badge badge-enabled" style={{ marginLeft: "auto" }}>Connected</span>}
        </div>

        {gMsg && <Alert type={gMsg.type} message={gMsg.text} />}

        <div className="form-grid">
          {(["client_id", "client_secret", "developer_token", "refresh_token"] as const).map((key) => (
            <div key={key} className="form-field">
              <label className="db-label">{key.replace(/_/g, " ")}</label>
              <input
                type="password"
                className="db-input"
                value={gForm[key]}
                onChange={(e) => setGForm({ ...gForm, [key]: e.target.value })}
                placeholder={key}
              />
            </div>
          ))}
          <div className="form-field">
            <label className="db-label">Login Customer ID</label>
            <input
              className="db-input"
              value={gForm.login_customer_id}
              onChange={(e) => setGForm({ ...gForm, login_customer_id: e.target.value })}
              placeholder="e.g. 6524400486"
            />
          </div>
          <div className="form-field">
            <label className="db-label">Customer ID (Operating Account)</label>
            <input
              className="db-input"
              value={gForm.customer_id}
              onChange={(e) => setGForm({ ...gForm, customer_id: e.target.value })}
              placeholder="e.g. 7066120068"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-primary" onClick={testGoogle} disabled={gLoading}>
            {gLoading ? <Spinner size={14} /> : null}
            {isGoogleConnected ? "Re-connect Google Ads" : "Connect Google Ads"}
          </button>
          {isGoogleConnected && (
            <button className="btn-danger" onClick={clearGoogle}>Disconnect</button>
          )}
        </div>
      </div>

      {/* Meta Ads */}
      <div className="db-card">
        <div className="db-card-title">
          <span style={{ color: "var(--meta-blue)" }}>f</span>
          Meta Ads Credentials
          {isMetaConnected && <span className="badge badge-enabled" style={{ marginLeft: "auto" }}>Connected</span>}
        </div>

        {mMsg && <Alert type={mMsg.type} message={mMsg.text} />}

        <div className="form-grid">
          <div className="form-field full">
            <label className="db-label">Access Token</label>
            <input
              type="password"
              className="db-input"
              value={mForm.access_token}
              onChange={(e) => setMForm({ ...mForm, access_token: e.target.value })}
              placeholder="EAAxxxxxx..."
            />
          </div>
          <div className="form-field">
            <label className="db-label">App ID</label>
            <input className="db-input" value={mForm.app_id} onChange={(e) => setMForm({ ...mForm, app_id: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="db-label">App Secret</label>
            <input type="password" className="db-input" value={mForm.app_secret} onChange={(e) => setMForm({ ...mForm, app_secret: e.target.value })} />
          </div>
          <div className="form-field full">
            <label className="db-label">Ad Account ID</label>
            <input
              className="db-input"
              value={mForm.ad_account_id}
              onChange={(e) => setMForm({ ...mForm, ad_account_id: e.target.value })}
              placeholder="act_XXXXXXXXX or just XXXXXXXXX"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-primary" onClick={testMeta} disabled={mLoading}>
            {mLoading ? <Spinner size={14} /> : null}
            {isMetaConnected ? "Re-connect Meta Ads" : "Connect Meta Ads"}
          </button>
          {isMetaConnected && (
            <button className="btn-danger" onClick={clearMeta}>Disconnect</button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="db-card">
        <div className="db-card-title">Pre-configured OIA Constants</div>
        <table className="db-table">
          <tbody>
            {[
              ["Google Ads Login Customer ID", "6524400486"],
              ["OIA Dubai Account ID", "706-612-0068 (7066120068)"],
              ["Facebook Page ID", "103302834765810"],
              ["Instagram Account ID", "17841448948279652"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ color: "var(--text-muted)", width: "40%" }}>{k}</td>
                <td style={{ fontFamily: "monospace" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
