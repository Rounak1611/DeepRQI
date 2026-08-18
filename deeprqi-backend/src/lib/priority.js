// Repair-priority scoring: combines current RQI (how bad is it right now)
// with the degradation forecast (see lib/degradation.js -- how soon will
// it cross into Critical) into a single ranking number for the ADMIN
// dashboard's "what to fix first" list. This is a ranking heuristic for
// prioritization discussions, not a scheduling or budget tool, and
// inherits every caveat lib/degradation.js already documents about the
// forecast it's partly built from.

const MS_PER_DAY = 86400000;

/**
 * @param {{score: number, category: string}|null} latestScore
 * @param {object} forecast -- output of predictDegradation()
 * @returns {number} higher = more urgent. Not bounded to 0-100 -- it's a
 *   ranking value, only meaningful relative to other roads' scores.
 */
function priorityScore(latestScore, forecast) {
  if (!latestScore) return 0;

  let score = 100 - latestScore.score;

  if (forecast?.alreadyCritical) {
    score += 30;
  } else if (forecast?.predictable && forecast.recommendedRepairByDate) {
    const daysUntil = (new Date(forecast.recommendedRepairByDate).getTime() - Date.now()) / MS_PER_DAY;
    if (daysUntil <= 30) score += 20;
    else if (daysUntil <= 90) score += 10;
  }

  return Math.round(score);
}

module.exports = { priorityScore };
