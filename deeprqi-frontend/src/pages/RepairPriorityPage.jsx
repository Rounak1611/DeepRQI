import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRepairPriorityList } from "../api/client";
import { bandForScore } from "../utils/rqiBands";

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function forecastNote(forecast) {
  if (!forecast) return null;
  if (forecast.alreadyCritical) return { text: "Already Critical", tone: "critical" };
  if (forecast.predictable && forecast.recommendedRepairByDate) {
    return { text: `Repair by ${formatDate(forecast.recommendedRepairByDate)}`, tone: "warning" };
  }
  return null;
}

export default function RepairPriorityPage() {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRepairPriorityList();
        if (!cancelled) setRoads(data.roads);
      } catch (err) {
        if (!cancelled) setError("Could not load the repair-priority list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCost = roads.reduce((sum, r) => sum + r.estimatedRepairCostINR, 0);

  return (
    <div className="main">
      <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Repair priority</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>
        Every road ranked by urgency -- current RQI plus how soon the repair-deadline forecast says it'll
        reach Critical. Cost figures are rough, illustrative estimates for prioritization discussions, not
        real quotes.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}

      {!loading && !error && (
        roads.length === 0 ? (
          <div className="panel" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>No inspected roads yet.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Estimated total repair cost across all {roads.length} roads:{" "}
              <span className="mono" style={{ color: "var(--text-primary)" }}>{formatINR(totalCost)}</span>
            </p>
            <div className="panel">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>Road</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>RQI</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500, textAlign: "right" }}>
                      Est. cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roads.map((r) => {
                    const band = bandForScore(r.latestScore.score);
                    const note = forecastNote(r.degradationForecast);
                    return (
                      <tr key={r.roadId} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "8px 6px" }}>
                          <Link to={`/roads/${r.roadId}`}>{r.roadName}</Link>
                          {r.city && <span style={{ color: "var(--text-muted)" }}> · {r.city}</span>}
                        </td>
                        <td style={{ padding: "8px 6px" }}>
                          <span className="mono" style={{ color: band.color }}>
                            {Math.round(r.latestScore.score)}
                          </span>{" "}
                          <span style={{ color: "var(--text-muted)" }}>{r.latestScore.category}</span>
                        </td>
                        <td style={{ padding: "8px 6px" }}>
                          {note ? (
                            <span style={{ color: note.tone === "critical" ? "var(--critical, #c0392b)" : "var(--poor)" }}>
                              {note.text}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td className="mono" style={{ padding: "8px 6px", textAlign: "right" }}>
                          {formatINR(r.estimatedRepairCostINR)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
