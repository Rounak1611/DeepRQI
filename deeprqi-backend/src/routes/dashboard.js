const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats
// Total roads, average RQI, and critical-road count -- all computed off
// each road's *latest* score, not every score ever recorded.
router.get("/stats", requireAuth, async (req, res) => {
	const totalRoads = await prisma.road.count();

	const latest = await prisma.$queryRaw`
    SELECT DISTINCT ON (road_id) road_id AS "roadId", score, category
    FROM rqi_scores
    ORDER BY road_id, generated_at DESC
  `;

	const scoredRoads = latest.length;
	const avgScore = scoredRoads ? latest.reduce((sum, r) => sum + r.score, 0) / scoredRoads : null;
	const criticalCount = latest.filter((r) => r.category === "Critical").length;

	res.json({
		totalRoads,
		scoredRoads,
		avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
		criticalCount,
	});
});

module.exports = router;
