const prisma = require("./prisma");

/**
 * Sets/updates a road's location, both the plain lat/lng columns (easy
 * reads) and the PostGIS geography column (spatial queries). Prisma can't
 * write geography columns through its normal API, hence the raw SQL.
 */
async function setRoadLocation(roadId, lat, lng) {
  if (lat == null || lng == null) return;

  await prisma.$executeRaw`
    UPDATE roads
    SET lat = ${lat},
        lng = ${lng},
        location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${roadId}::uuid
  `;
}

/**
 * Roads within radiusKm of (lat, lng), nearest first. Uses ST_DWithin
 * (radius search, meters) + ST_Distance for the ordering/label -- the
 * standard PostGIS pattern for "X near me" queries.
 */
async function findRoadsNear(lat, lng, radiusKm) {
  const radiusMeters = radiusKm * 1000;
  return prisma.$queryRaw`
    SELECT
      id, "roadName", city, district, state, lat, lng,
      ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS distance_m
    FROM roads
    WHERE location IS NOT NULL
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
    ORDER BY distance_m ASC
  `;
}

module.exports = { setRoadLocation, findRoadsNear };
