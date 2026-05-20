interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export default function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
