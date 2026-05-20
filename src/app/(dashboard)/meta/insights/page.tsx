"use client";
import { useEffect, useState } from "react";
import { useMetaInsights } from "@/hooks/useMetaAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import KpiCard from "@/components/ui/KpiCard";
import type { MetaInsights } from "@/types/meta";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DATE_PRESETS = [
  { label: "Today",        value: "today" },
  { label: "Yesterday",    value: "yesterday" },
  { label: "Last 7 Days",  value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "This Month",   value: "this_month" },
  { label: "Last Month",   value: "last_month" },
];

export default function MetaInsightsPage() {
  const { isMetaConnected } = useCredentialsStore();
  const [preset, setPreset] = useState("last_30_days");
  const { data, loading, error, refetch } = useMetaInsights(preset);

  useEffect(() => { if (isMetaConnected) refetch(); }, [isMetaConnected, preset]);

  const insights: MetaInsights[] = (data as any)?.insights ?? [];
  const top = insights[0];

  const chartData = insights.map((row) => ({
    period: row.date_start ?? "",
    Spend: parseFloat(row.spend ?? "0"),
    Clicks: parseInt(row.clicks ?? "0"),
    Impressions: parseInt(row.impressions ?? "0"),
  }));

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Meta Insights</h1>
          <p className="db-page-sub">Facebook & Instagram performance metrics</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={preset} onChange={e => setPreset(e.target.value)}>
            {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
        </div>
      </div>

      {!isMetaConnected && <Alert type="warn" message="Connect Meta Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}

      {top && (
        <div className="kpi-grid">
          <KpiCard label="Total Spend" value={`AED ${parseFloat(top.spend ?? "0").toFixed(0)}`} color="var(--meta-blue)" />
          <KpiCard label="Impressions" value={parseInt(top.impressions ?? "0").toLocaleString()} />
          <KpiCard label="Clicks" value={parseInt(top.clicks ?? "0").toLocaleString()} sub={`CTR ${parseFloat(top.ctr ?? "0").toFixed(2)}%`} />
          <KpiCard label="Reach" value={parseInt(top.reach ?? "0").toLocaleString()} sub={`CPM ${parseFloat(top.cpm ?? "0").toFixed(2)}`} />
        </div>
      )}

      {chartData.length > 1 && (
        <div className="db-card">
          <div className="db-card-title">Spend & Clicks by Period</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="Spend" fill="var(--meta-blue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Clicks" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {insights.length > 0 && (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead><tr><th>Period</th><th>Spend</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>CPM</th><th>Reach</th></tr></thead>
            <tbody>
              {insights.map((row, i) => (
                <tr key={i}>
                  <td>{row.date_start} – {row.date_stop}</td>
                  <td style={{ color: "var(--meta-blue)" }}>AED {parseFloat(row.spend ?? "0").toFixed(2)}</td>
                  <td>{parseInt(row.impressions ?? "0").toLocaleString()}</td>
                  <td>{parseInt(row.clicks ?? "0").toLocaleString()}</td>
                  <td>{parseFloat(row.ctr ?? "0").toFixed(2)}%</td>
                  <td>{parseFloat(row.cpm ?? "0").toFixed(2)}</td>
                  <td>{parseInt(row.reach ?? "0").toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
