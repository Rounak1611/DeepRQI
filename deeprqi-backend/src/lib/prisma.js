const { PrismaClient } = require("@prisma/client");

// Reuse a single client across the app instead of creating one per request.
const prisma = new PrismaClient();

module.exports = prisma;
