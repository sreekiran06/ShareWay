// src/server.js

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Your modules
const connectDB = require("./config/database");
const { initializeSocket } = require("./socket/socketHandler");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const driverRoutes = require("./routes/drivers");
const rideRoutes = require("./routes/rides");
const deliveryRoutes = require("./routes/deliveries");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");

const app = express();
const server = http.createServer(app);

/**
 * IMPORTANT for deployments behind a proxy (like Render)
 * Fixes express-rate-limit + X-Forwarded-For issues
 */
app.set("trust proxy", 1);

/**
 * Socket.io
 */
const io = initializeSocket(server);
app.set("io", io);

/**
 * Connect DB
 */
connectDB();

/**
 * Security headers
 * allow Google popup login
 */
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

/**
 * CORS configuration
 * Allows Vercel frontend + local dev
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://share-way.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/**
 * Rate limiter
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", limiter);

/**
 * Body parser
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * Logger
 */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/**
 * Static files
 */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/**
 * Health check route
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShareWay API is running",
    time: new Date()
  });
});

/**
 * API Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ShareWay backend running on port ${PORT}`);
});

module.exports = { app, server };