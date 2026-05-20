"use client";
import { useEffect } from "react";
import { useGoogleCampaigns, useGoogleReport } from "@/hooks/useGoogleAds";
import { useMetaInsights } from "@/hooks/useMetaAds";
import { useCredentialsStore } from "@/store/credentialsStore";
import KpiCard from "@/components/ui/KpiCard";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { fmtMicros, fmtNum, fmtPct } from "@/lib/format";
import { CAMPAIGN_STATUS } from "@/types/google";

export default function DashboardPage() {
  const { isGoogleConnected, isMetaConnected } = useCredentialsStore();

  const gCampaigns = useGoogleCampaigns();
  const gReport = useGoogleReport();
  const metaInsights = useMetaInsights();

  useEffect(() => {
    if (isGoogleConnected) {
      gCampaigns.refetch();
      gReport.refetch();
    }
    if (isMetaConnected) {
      metaInsights.refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleConnected, isMetaConnected]);

  const campaigns: any[] = (gCampaigns.data as any)?.campaigns ?? [];

  const totals = campaigns.reduce(
    (acc: any, row: any) => {
      acc.spend += row.metrics?.cost_micros ?? 0;
      acc.impressions += row.metrics?.impressions ?? 0;
      acc.clicks += row.metrics?.clicks ?? 0;
      acc.conversions += row.metrics?.conversions ?? 0;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const mi: any = (metaInsights.data as any)?.insights?.[0];

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Dashboard</h1>
          <p className="db-page-sub">Combined view — Google Ads + Meta Ads — Last 30 days</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isGoogleConnected && (
            <button className="btn-ghost" onClick={() => { gCampaigns.refetch(); gReport.refetch(); }}>
              Refresh Google
            </button>
          )}
          {isMetaConnected && (
            <button className="btn-ghost" onClick={() => metaInsights.refetch()}>
              Refresh Meta
            </button>
          )}
        </div>
      </div>

      {!isGoogleConnected && !isMetaConnected && (
        <Alert type="warn" message="No accounts connected. Go to Setup & Credentials to connect Google Ads and/or Meta Ads." />
      )}

      {/* Google KPIs */}
      {isGoogleConnected && (
        <>
          <div className="db-section-head">
            <h4>Google Ads — Last 30 Days</h4>
            {gCampaigns.loading && <Spinner />}
          </div>
          {gCampaigns.error && <Alert type="err" message={gCampaigns.error} />}
          <div className="kpi-grid">
            <KpiCard label="Total Spend" value={fmtMicros(totals.spend)} sub="AED" color="var(--google-blue)" />
            <KpiCard label="Impressions" value={fmtNum(totals.impressions)} />
            <KpiCard label="Clicks" value={fmtNum(totals.clicks)} sub={`CTR ${totals.impressions ? fmtPct(totals.clicks / totals.impressions) : "—"}`} />
            <KpiCard label="Conversions" value={fmtNum(totals.conversions)} sub={totals.conversions > 0 ? `CPA ${fmtMicros(totals.spend / totals.conversions)}` : ""} />
          </div>
        </>
      )}

      {/* Meta KPIs */}
      {isMetaConnected && (
        <>
          <div className="db-section-head">
            <h4>Meta Ads — Last 30 Days</h4>
            {metaInsights.loading && <Spinner />}
          </div>
          {metaInsights.error && <Alert type="err" message={metaInsights.error} />}
          {mi && (
            <div className="kpi-grid">
              <KpiCard label="Total Spend" value={`AED ${parseFloat(mi.spend ?? "0").toFixed(0)}`} color="var(--meta-blue)" />
              <KpiCard label="Impressions" value={fmtNum(parseInt(mi.impressions ?? "0"))} />
              <KpiCard label="Clicks" value={fmtNum(parseInt(mi.clicks ?? "0"))} sub={`CTR ${mi.ctr ?? "—"}%`} />
              <KpiCard label="Reach" value={fmtNum(parseInt(mi.reach ?? "0"))} sub={`CPM ${mi.cpm ?? "—"}`} />
            </div>
          )}
        </>
      )}

      {/* Google Campaigns Table */}
      {isGoogleConnected && campaigns.length > 0 && (
        <>
          <div className="db-section-head" style={{ marginTop: 24 }}>
            <h4>Active Campaigns</h4>
          </div>
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
                  <th>Conversions</th>
                  <th>CTR</th>
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
                      <td>
                        <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                      </td>
                      <td>{fmtMicros(b?.amount_micros ?? 0)}</td>
                      <td>{fmtMicros(m?.cost_micros ?? 0)}</td>
                      <td>{fmtNum(m?.impressions ?? 0)}</td>
                      <td>{fmtNum(m?.clicks ?? 0)}</td>
                      <td>{(m?.conversions ?? 0).toFixed(1)}</td>
                      <td>{fmtPct(m?.ctr ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
