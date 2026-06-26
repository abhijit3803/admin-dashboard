/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FRESCOO — Express.js API Server Entry Point                ║
 * ║  Food Manufacturing Admin Dashboard Backend                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import ingredientRoutes from "./routes/ingredient.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import csvRoutes from "./routes/csv.routes.js";

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "4000", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Express App Initialization
// ─────────────────────────────────────────────

const app = express();

// ─────────────────────────────────────────────
// Global Middleware
// ─────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — Allow frontend origin
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — relaxed in dev, strict in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: NODE_ENV === "development" ? 1000 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

app.use("/api", limiter);

// ─────────────────────────────────────────────
// Health Check (unauthenticated)
// ─────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ─────────────────────────────────────────────
// Authentication Middleware
// Applied to all /api routes below this point
// ─────────────────────────────────────────────

app.use("/api", authMiddleware);

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use("/api/ingredients", ingredientRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/csv", csvRoutes);

// ─────────────────────────────────────────────
// 404 Handler for unknown API routes
// ─────────────────────────────────────────────

app.use("/api/{*path}", (_req, res) => {
  res.status(404).json({
    success: false,
    error: "The requested API endpoint does not exist.",
  });
});

// ─────────────────────────────────────────────
// Global Error Handler (must be last)
// ─────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║  🍳 FRESCOO API Server                                      ║
  ║  ─────────────────────────────────────────────────────────── ║
  ║  Port:        ${String(PORT).padEnd(47)}║
  ║  Environment: ${NODE_ENV.padEnd(47)}║
  ║  CORS Origin: ${FRONTEND_URL.padEnd(47)}║
  ║  Auth:        ${(process.env.SKIP_AUTH === "true" ? "SKIPPED (dev mode)" : "Enabled").padEnd(47)}║
  ╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

export default app;
