// Explainable AI summary: turns the RQI breakdown (already fully auditable
// -- see ai-service/app/rqi_engine.py, which records exactly which
// detections produced which penalty) into a plain-English paragraph.
// Deliberately template-based, not an LLM call -- free to run, and every
// sentence traces directly back to a number already in `breakdown`, so
// there's nothing in the explanation the underlying data doesn't support.

function readableDamageType(type) {
  return type.replace(/^D\d+_/i, "").replace(/_/g, " ");
}

function pluralize(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * @param {{score: number, category: string, breakdown: object[]}} rqi
 * @returns {string}
 */
function generateExplanation(rqi) {
  const { score, category, breakdown } = rqi || {};
  if (score == null) return "";

  if (!breakdown || breakdown.length === 0) {
    return `This inspection scored ${Math.round(score)}/100 (${category}) -- no road damage was detected in this photo.`;
  }

  // Group by damage type + severity so repeated detections collapse into
  // "3 potholes at medium severity" instead of one sentence per box.
  const groups = {};
  for (const row of breakdown) {
    const key = `${row.damage_type}|${row.severity}`;
    if (!groups[key]) {
      groups[key] = { damageType: row.damage_type, severity: row.severity, count: 0, penalty: 0 };
    }
    groups[key].count += 1;
    groups[key].penalty += row.penalty;
  }

  const sorted = Object.values(groups).sort((a, b) => b.penalty - a.penalty);
  const totalPenalty = sorted.reduce((s, g) => s + g.penalty, 0);

  const clauses = sorted.map((g) => {
    const share = totalPenalty > 0 ? Math.round((g.penalty / totalPenalty) * 100) : 0;
    return `${pluralize(g.count, readableDamageType(g.damageType))} at ${g.severity} severity (${share}% of the penalty)`;
  });

  const leading =
    clauses.length > 1 ? `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}` : clauses[0];

  return (
    `This inspection scored ${Math.round(score)}/100 (${category}). The score reflects ${leading}. ` +
    `Higher-severity, larger-area damage is weighted more heavily in the Road Quality Index formula, ` +
    `and the attention heatmap shows which regions of the photo most influenced these detections.`
  );
}

module.exports = { generateExplanation, readableDamageType };
