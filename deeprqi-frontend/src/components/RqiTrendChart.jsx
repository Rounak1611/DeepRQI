import { bandForScore } from "../utils/rqiBands";

const WIDTH = 560;
const HEIGHT = 90;
const PAD_X = 12;
const PAD_Y = 14;

export default function RqiTrendChart({ points }) {
  // points: [{ score, generatedAt }], expected oldest -> newest
  if (!points || points.length === 0) return null;

  const usableWidth = WIDTH - PAD_X * 2;
  const usableHeight = HEIGHT - PAD_Y * 2;

  const xFor = (i) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (i / (points.length - 1)) * usableWidth;
  const yFor = (score) => PAD_Y + usableHeight - (Math.max(0, Math.min(100, score)) / 100) * usableHeight;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.score)}`)
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
      {/* reference lines at band boundaries, faint */}
      {[25, 40, 60, 85].map((tick) => (
        <line
          key={tick}
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={yFor(tick)}
          y2={yFor(tick)}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      <path d={linePath} fill="none" stroke="var(--accent-dim)" strokeWidth="2" />

      {points.map((p, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(p.score)} r="4" fill={bandForScore(p.score).color} />
      ))}
    </svg>
  );
}
