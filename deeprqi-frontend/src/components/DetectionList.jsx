const SEVERITY_COLOR = {
  low: "var(--fair)",
  medium: "var(--poor)",
  high: "var(--very-poor)",
  critical: "var(--critical)",
};

export default function DetectionList({ breakdown }) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        No damage detected in this image.
      </p>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
          <th style={{ padding: "8px 4px", color: "var(--text-muted)", fontWeight: 500 }}>Type</th>
          <th style={{ padding: "8px 4px", color: "var(--text-muted)", fontWeight: 500 }}>Severity</th>
          <th style={{ padding: "8px 4px", color: "var(--text-muted)", fontWeight: 500, textAlign: "right" }}>
            Penalty
          </th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
            <td className="mono" style={{ padding: "8px 4px" }}>
              {row.damage_type.replace(/_/g, " ")}
            </td>
            <td style={{ padding: "8px 4px" }}>
              <span
                style={{
                  color: SEVERITY_COLOR[row.severity] || "var(--text-muted)",
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.04em",
                }}
              >
                {row.severity}
              </span>
            </td>
            <td className="mono" style={{ padding: "8px 4px", textAlign: "right" }}>
              -{row.penalty}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
