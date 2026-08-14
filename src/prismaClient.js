const { PrismaClient } = require("@prisma/client");

// A single Prisma instance is reused across the app (recommended pattern
// to avoid exhausting DB connections in dev with hot-reloading).
const prisma = new PrismaClient();

module.exports = prisma;
