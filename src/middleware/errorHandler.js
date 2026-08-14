// Catches anything thrown/passed to next(err) and returns a consistent JSON shape.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    return res.status(409).json({ message: "A record with that value already exists" });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong on the server",
  });
}

module.exports = errorHandler;
