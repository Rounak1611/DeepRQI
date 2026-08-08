// A real gauge, not a progress bar with a number on it — matches the RQI
// bands returned by the backend exactly: 0-25 Critical ... 85-100 Good.
// Score maps left (0, critical, red) to right (100, good, green), like a
// fuel gauge read as "how much road quality is left."

const BANDS = [
  { min: 0, max: 25, color: "var(--critical)", label: "Critical" },
  { min: 25, max: 40, color: "var(--very-poor)", label: "Very Poor" },
  { min: 40, max: 60, color: "var(--poor)", label: "Poor" },
  { min: 60, max: 85, color: "var(--fair)", label: "Fair" },
  { min: 85, max: 100, color: "var(--good)", label: "Good" },
];

const CX = 120;
const CY = 120;
const R = 96;
const START_ANGLE = 180; // left
const END_ANGLE = 0; // right

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function scoreToAngle(score) {
  const clamped = Math.max(0, Math.min(100, score));
  return START_ANGLE - (clamped / 100) * (START_ANGLE - END_ANGLE);
}

function arcPath(startScore, endScore, radius) {
  const a1 = scoreToAngle(startScore);
  const a2 = scoreToAngle(endScore);
  const p1 = polarToCartesian(CX, CY, radius, a1);
  const p2 = polarToCartesian(CX, CY, radius, a2);
  const largeArc = Math.abs(a1 - a2) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 0 ${p2.x} ${p2.y}`;
}

export default function RqiGauge({ score, category }) {
  const needleAngle = scoreToAngle(score);
  const needleTip = polarToCartesian(CX, CY, R - 14, needleAngle);
  const activeBand = BANDS.find((b) => score >= b.min && score <= b.max) || BANDS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="240" height="150" viewBox="0 0 240 150">
        {BANDS.map((band) => (
          <path
            key={band.label}
            d={arcPath(band.min, band.max, R)}
            fill="none"
            stroke={band.color}
            strokeWidth="14"
            strokeLinecap="butt"
            opacity={band.label === activeBand.label ? 1 : 0.35}
          />
        ))}

        {/* tick marks at 0/25/40/60/85/100 */}
        {[0, 25, 40, 60, 85, 100].map((tick) => {
          const p1 = polarToCartesian(CX, CY, R + 10, scoreToAngle(tick));
          const p2 = polarToCartesian(CX, CY, R + 2, scoreToAngle(tick));
          return (
            <line
              key={tick}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="var(--text-muted)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--text-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="6" fill="var(--text-primary)" />
      </svg>

      <div style={{ textAlign: "center", marginTop: "-8px" }}>
        <div
          className="mono"
          style={{ fontSize: "42px", fontWeight: 600, lineHeight: 1, color: activeBand.color }}
        >
          {Math.round(score)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "13px",
            color: activeBand.color,
            marginTop: "4px",
          }}
        >
          {category}
        </div>
      </div>
    </div>
  );
}
