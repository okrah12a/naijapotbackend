require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Allow the live Netlify site plus local dev/testing origins.
// Add more local ports here if you test from a different one.
const allowedOrigins = [
  process.env.CLIENT_URL,       // e.g. https://naijapot.netlify.app (set in Render env vars)
  "http://localhost:5173",      // Vite dev server default
  "http://localhost:3000",      // Common React/other dev server default
  "http://localhost:8000",      // e.g. `python -m http.server` / `npx serve`
  "http://127.0.0.1:8000",
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// Basic rate limiting on auth endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many attempts, please try again later" },
});
app.use("/api/auth", authLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Naija Pot API running on port ${PORT}`));
