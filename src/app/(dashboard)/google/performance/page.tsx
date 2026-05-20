"use client";
import { useEffect, useState } from "react";
import { useGoogleReport } from "@/hooks/useGoogleAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import KpiCard from "@/components/ui/KpiCard";
import { fmtMicros, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATE_RANGES = [
  { label: "Last 7 Days",  value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
  { label: "This Month",   value: "THIS_MONTH" },
  { label: "Last Month",   value: "LAST_MONTH" },
];

export default function GooglePerformancePage() {
  const { isGoogleConnected } = useCredentialsStore();
  const [dateRange, setDateRange] = useState("LAST_30_DAYS");
  const { data, loading, error, refetch } = useGoogleReport(dateRange);

  useEffect(() => { if (isGoogleConnected) refetch(); }, [isGoogleConnected, dateRange]);

  const report: any[] = (data as any)?.report ?? [];

  const totals = report.reduce(
    (acc: any, row: any) => {
      const m = row.metrics;
      acc.spend += m?.cost_micros ?? 0;
      acc.impressions += m?.impressions ?? 0;
      acc.clicks += m?.clicks ?? 0;
      acc.conversions += m?.conversions ?? 0;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const chartData = report.map((row: any) => ({
    date:        fmtDate(row.segments?.date),
    Impressions: row.metrics?.impressions ?? 0,
    Clicks:      row.metrics?.clicks ?? 0,
    Cost:        parseFloat(((row.metrics?.cost_micros ?? 0) / 1_000_000).toFixed(2)),
    Conversions: parseFloat((row.metrics?.conversions ?? 0).toFixed(2)),
  }));

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Performance Report</h1>
          <p className="db-page-sub">Daily trend analysis</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="db-input" style={{ width: "auto" }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
            {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button className="btn-ghost" onClick={refetch} disabled={loading}>{loading ? <Spinner size={14} /> : null} Refresh</button>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup first." />}
      {error && <Alert type="err" message={error} />}

      <div className="kpi-grid">
        <KpiCard label="Total Spend" value={fmtMicros(totals.spend)} color="var(--google-blue)" />
        <KpiCard label="Impressions" value={fmtNum(totals.impressions)} />
        <KpiCard label="Clicks" value={fmtNum(totals.clicks)} sub={`CTR ${totals.impressions ? fmtPct(totals.clicks / totals.impressions) : "—"}`} />
        <KpiCard label="Conversions" value={fmtNum(totals.conversions)} sub={totals.conversions > 0 ? `CPA ${fmtMicros(totals.spend / totals.conversions)}` : ""} />
      </div>

      {chartData.length > 0 && (
        <>
          <div className="db-card">
            <div className="db-card-title">Clicks & Impressions</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Clicks" stroke="var(--gold)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Impressions" stroke="var(--google-blue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="db-card">
            <div className="db-card-title">Cost (AED) & Conversions</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Cost" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Conversions" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
