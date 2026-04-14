require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

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

/* IMPORTANT FOR RENDER */
app.set("trust proxy", 1);

/* SOCKET.IO */
const io = initializeSocket(server);
app.set("io", io);

/* DATABASE */
connectDB();

/* SECURITY HEADERS */
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

/* CORS CONFIGURATION */
const allowedOrigins = [
  "https://share-way.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
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
  })
);

/* HANDLE PREFLIGHT */
app.options("*", cors());

/* RATE LIMIT */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", limiter);

/* BODY PARSER */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* LOGGER */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/* STATIC FILES */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* HEALTH CHECK */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShareWay API is running",
    time: new Date()
  });
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/* START SERVER */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ShareWay backend running on port ${PORT}`);
});

module.exports = { app, server };