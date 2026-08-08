const express = require("express");
const prisma = require("../lib/prisma");
const { findRoadsNear } = require("../lib/geo");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/roads
// Every road plus its most recent RQI score -- exactly what the map
// dashboard needs to plot color-coded markers in one request.
router.get("/", requireAuth, async (req, res) => {
	const roads = await prisma.road.findMany({
		orderBy: { roadName: "asc" },
	});

	// DISTINCT ON gets the latest score per road in a single query instead
	// of N+1 lookups.
	const latestScores = await prisma.$queryRaw`
    SELECT DISTINCT ON ("roadId") "roadId", score, category, "generatedAt"
    FROM rqi_scores
    ORDER BY "roadId", "generatedAt" DESC
  `;
	const scoreByRoad = Object.fromEntries(latestScores.map((s) => [s.roadId, s]));

	const withScores = roads.map((r) => ({
		...r,
		latestScore: scoreByRoad[r.id]
			? {
					score: scoreByRoad[r.id].score,
					category: scoreByRoad[r.id].category,
					generatedAt: scoreByRoad[r.id].generatedAt,
				}
			: null,
	}));

	res.json(withScores);
});

// GET /api/roads/near?lat=..&lng=..&radiusKm=5
router.get("/near", requireAuth, async (req, res) => {
	const { lat, lng, radiusKm } = req.query;
	if (!lat || !lng) {
		return res.status(400).json({ error: "lat and lng query params are required." });
	}

	const roads = await findRoadsNear(
		parseFloat(lat),
		parseFloat(lng),
		radiusKm ? parseFloat(radiusKm) : 5,
	);

	// BigInt/Decimal from raw SQL don't serialize to JSON directly.
	const safe = roads.map((r) => ({ ...r, distance_m: Number(r.distance_m) }));
	res.json(safe);
});

// GET /api/roads/:id -- full inspection history for the road detail page
router.get("/:id", requireAuth, async (req, res) => {
	const road = await prisma.road.findUnique({
		where: { id: req.params.id },
		include: {
			images: {
				orderBy: { uploadedAt: "desc" },
				include: { detections: true, scores: true, uploadedBy: { select: { name: true } } },
			},
		},
	});

	if (!road) return res.status(404).json({ error: "Road not found." });
	res.json(road);
});

module.exports = router;
