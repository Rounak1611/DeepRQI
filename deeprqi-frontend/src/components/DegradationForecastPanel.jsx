import InfoTooltip from "./InfoTooltip";

// Renders the roads.js `degradationForecast` field (see
// backend/src/lib/degradation.js). A simple linear-trend projection, not a
// validated predictive model -- framed here as an estimate, not a promise.

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DegradationForecastPanel({ forecast }) {
  if (!forecast) return null;

  return (
    <div className="panel" style={{ marginBottom: "20px" }}>
      <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center" }}>
        Repair-deadline forecast
        <InfoTooltip text="A straight-line fit through this road's past RQI scores, extended forward to when it's projected to cross into Very Poor or Critical. Needs at least 2 inspections with a genuine downward trend — it has no knowledge of traffic, climate, or prior repairs." />
      </h3>

      {forecast.alreadyCritical && (
        <p style={{ color: "var(--critical, #c0392b)", fontSize: "14px", fontWeight: 500 }}>
          This road is already in Critical condition -- repair is overdue, not just projected.
        </p>
      )}

      {!forecast.alreadyCritical && !forecast.predictable && (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{forecast.reason}</p>
      )}

      {!forecast.alreadyCritical && forecast.predictable && (
        <div>
          <p style={{ fontSize: "14px", marginBottom: "8px" }}>
            Declining at roughly{" "}
            <span className="mono">{Math.abs(forecast.trendPointsPerMonth)}</span> RQI points/month based on
            recorded inspections.
          </p>
          {forecast.projectedPoorDate && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Projected to enter Very Poor condition around{" "}
              <span className="mono">{formatDate(forecast.projectedPoorDate)}</span>.
            </p>
          )}
          {forecast.projectedCriticalDate && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Projected to become unridable (Critical) around{" "}
              <span className="mono">{formatDate(forecast.projectedCriticalDate)}</span>.
            </p>
          )}
          {forecast.recommendedRepairByDate && (
            <p style={{ fontSize: "14px", marginTop: "8px", fontWeight: 500 }}>
              Recommended repair-by date:{" "}
              <span className="mono" style={{ color: "var(--poor)" }}>
                {formatDate(forecast.recommendedRepairByDate)}
              </span>
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
        Estimate only -- a straight-line trend from recorded inspections, not a validated
        predictive model.
      </p>
    </div>
  );
}
