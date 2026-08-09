import { bandForScore } from "../utils/rqiBands";

function Card({ label, value, valueColor }) {
  return (
    <div className="panel" style={{ padding: "18px 22px", flex: 1 }}>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div
        className="mono"
        style={{ fontSize: "30px", fontWeight: 600, marginTop: "6px", color: valueColor || "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const avgBand = stats.avgScore != null ? bandForScore(stats.avgScore) : null;

  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
      <Card label="Total Roads" value={stats.totalRoads} />
      <Card
        label="Avg RQI"
        value={stats.avgScore != null ? stats.avgScore : "—"}
        valueColor={avgBand?.color}
      />
      <Card
        label="Critical Roads"
        value={stats.criticalCount}
        valueColor={stats.criticalCount > 0 ? "var(--critical)" : "var(--good)"}
      />
    </div>
  );
}
