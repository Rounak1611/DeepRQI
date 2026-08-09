// Single source of truth for RQI band colors/labels, matching the
// backend's RQI_BANDS exactly. Used by RqiGauge (the dial) and the
// dashboard map (marker colors) so they can never drift apart.

export const RQI_BANDS = [
  { min: 0, max: 25, color: "var(--critical)", label: "Critical" },
  { min: 25, max: 40, color: "var(--very-poor)", label: "Very Poor" },
  { min: 40, max: 60, color: "var(--poor)", label: "Poor" },
  { min: 60, max: 85, color: "var(--fair)", label: "Fair" },
  { min: 85, max: 100, color: "var(--good)", label: "Good" },
];

export function bandForScore(score) {
  return RQI_BANDS.find((b) => score >= b.min && score <= b.max) || RQI_BANDS[0];
}
