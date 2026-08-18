// Pure ranking function pulled out of routes/dashboard.js so it can be
// unit-tested without a database -- see routes/dashboard.js for how it's
// actually called with real Prisma data.

const { predictDegradation } = require("./degradation");
const { priorityScore } = require("./priority");
const { estimateRepairCost } = require("./repairCost");

/**
 * @param {{id: string, roadName: string, city: string|null, images: {scores: object[]}[]}[]} roads
 * @returns {object[]} ranked descending by priorityScore; roads with no scores yet are dropped
 */
function rankRoadsByPriority(roads) {
  return roads
    .map((road) => {
      const allScores = road.images.flatMap((img) => img.scores);
      if (allScores.length === 0) return null;

      const latestScore = [...allScores].sort(
        (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
      )[0];
      const forecast = predictDegradation(
        allScores.map((s) => ({ score: s.score, generatedAt: s.generatedAt }))
      );

      return {
        roadId: road.id,
        roadName: road.roadName,
        city: road.city,
        latestScore: { score: latestScore.score, category: latestScore.category, generatedAt: latestScore.generatedAt },
        priorityScore: priorityScore(latestScore, forecast),
        estimatedRepairCostINR: estimateRepairCost(latestScore.breakdown),
        degradationForecast: forecast,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

module.exports = { rankRoadsByPriority };
