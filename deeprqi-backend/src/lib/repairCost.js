// Rough, illustrative repair-cost estimate (INR) computed from a road's
// latest RQI breakdown. Unit costs below are flat placeholders per
// detection instance, NOT derived from any real costing/vendor data --
// this exists to give a relative sense of "expensive road" vs "cheap
// road" for prioritization discussions, not a quote. Label it as an
// estimate everywhere it's shown.

const COST_TABLE_INR = {
  D40_pothole: { low: 500, medium: 1500, high: 3500, critical: 6000 },
  D20_alligator_crack: { low: 800, medium: 2000, high: 4000, critical: 7000 },
  D00_longitudinal_crack: { low: 300, medium: 800, high: 1800, critical: 3000 },
  D10_transverse_crack: { low: 300, medium: 800, high: 1800, critical: 3000 },
};
const DEFAULT_COST_INR = { low: 300, medium: 800, high: 1800, critical: 3000 };

/**
 * @param {object[]} breakdown -- RqiScore.breakdown, snake_case rows as
 *   stored verbatim from the AI service (damage_type, severity, ...).
 * @returns {number} estimated total repair cost in INR.
 */
function estimateRepairCost(breakdown) {
  if (!breakdown || breakdown.length === 0) return 0;
  return breakdown.reduce((total, row) => {
    const table = COST_TABLE_INR[row.damage_type] || DEFAULT_COST_INR;
    const cost = table[row.severity] ?? 0;
    return total + cost;
  }, 0);
}

module.exports = { estimateRepairCost, COST_TABLE_INR };
