"use client";
import { useState } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { googleAction } from "@/hooks/useGoogleAds";
import Alert from "@/components/ui/Alert";

const OIA_KEYWORDS = [
  "luxury villa dubai", "buy apartment yas island", "aldar properties abu dhabi",
  "waterfront property uae", "invest dubai real estate", "premium villa yas acres",
  "new launch abu dhabi", "freehold property dubai", "off-plan property uae",
  "عقارات فاخرة دبي", "شقق للبيع أبوظبي", "فلل ياس أكريس", "استثمار عقاري الإمارات",
  "مشاريع علدار", "عقارات واجهة بحرية",
];

const NEGATIVE_KEYWORDS = [
  "free", "cheap", "rent", "jobs", "careers", "salary", "إيجار", "وظائف",
  "how to", "diy", "tutorial", "course",
];

export default function GoogleOptimizePage() {
  const { google, isGoogleConnected } = useCredentialsStore();
  const [campaignId, setCampaignId] = useState("");
  const [adGroupId, setAdGroupId] = useState("");
  const [selectedKws, setSelectedKws] = useState<string[]>([]);
  const [selectedNeg, setSelectedNeg] = useState<string[]>([]);
  const [matchType, setMatchType] = useState("PHRASE");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function toggle(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  async function addPositive() {
    if (!google || !adGroupId || selectedKws.length === 0) return;
    setLoading(true);
    const res = await googleAction("/api/google/keywords/create", google, {
      ad_group_id: adGroupId,
      keywords: selectedKws.map(text => ({ text, match_type: matchType })),
    });
    setLoading(false);
    setMsg(res.success ? { type: "ok", text: `${selectedKws.length} keyword(s) added!` } : { type: "err", text: res.error ?? "Failed" });
    setSelectedKws([]);
  }

  async function addNegative() {
    if (!google || !campaignId || selectedNeg.length === 0) return;
    setLoading(true);
    const res = await googleAction("/api/google/negative-keywords/create", google, {
      campaign_id: campaignId,
      keywords: selectedNeg.map(text => ({ text })),
    });
    setLoading(false);
    setMsg(res.success ? { type: "ok", text: `${selectedNeg.length} negative keyword(s) added!` } : { type: "err", text: res.error ?? "Failed" });
    setSelectedNeg([]);
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Optimize — OIA Dubai</h1>
          <p className="db-page-sub">Pre-loaded OIA keyword library for quick campaign optimization</p>
        </div>
      </div>

      {!isGoogleConnected && <Alert type="warn" message="Connect Google Ads in Setup first." />}
      {msg && <Alert type={msg.type} message={msg.text} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Positive Keywords */}
        <div className="db-card">
          <div className="db-card-title">OIA Keyword Library</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div className="form-field">
              <label className="db-label">Ad Group ID</label>
              <input className="db-input" value={adGroupId} onChange={e => setAdGroupId(e.target.value)} placeholder="Ad Group ID" />
            </div>
            <div className="form-field">
              <label className="db-label">Match Type</label>
              <select className="db-input" value={matchType} onChange={e => setMatchType(e.target.value)}>
                <option value="EXACT">Exact</option>
                <option value="PHRASE">Phrase</option>
                <option value="BROAD">Broad</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {OIA_KEYWORDS.map(kw => (
              <button key={kw}
                onClick={() => toggle(selectedKws, kw, setSelectedKws)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "1px solid",
                  borderColor: selectedKws.includes(kw) ? "var(--gold)" : "var(--border)",
                  background: selectedKws.includes(kw) ? "var(--gold-light)" : "transparent",
                  color: selectedKws.includes(kw) ? "var(--gold)" : "var(--text-muted)",
                }}>
                {kw}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={addPositive} disabled={loading || selectedKws.length === 0 || !adGroupId}>
            Add {selectedKws.length > 0 ? selectedKws.length : ""} Keywords
          </button>
        </div>

        {/* Negative Keywords */}
        <div className="db-card">
          <div className="db-card-title">Negative Keyword Library</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div className="form-field">
              <label className="db-label">Campaign ID</label>
              <input className="db-input" value={campaignId} onChange={e => setCampaignId(e.target.value)} placeholder="Campaign ID" />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {NEGATIVE_KEYWORDS.map(kw => (
              <button key={kw}
                onClick={() => toggle(selectedNeg, kw, setSelectedNeg)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "1px solid",
                  borderColor: selectedNeg.includes(kw) ? "#DC2626" : "var(--border)",
                  background: selectedNeg.includes(kw) ? "#FEE2E2" : "transparent",
                  color: selectedNeg.includes(kw) ? "#DC2626" : "var(--text-muted)",
                }}>
                -{kw}
              </button>
            ))}
          </div>
          <button className="btn-danger" onClick={addNegative} disabled={loading || selectedNeg.length === 0 || !campaignId}>
            Add {selectedNeg.length > 0 ? selectedNeg.length : ""} Negative Keywords
          </button>
        </div>
      </div>
    </div>
  );
}
