require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db.config");
const apiRoutes = require("./routes");

const app = express();

// Normalize frontend URL
const frontendUrl = (
  process.env.FRONTEND_URL || "https://mt-frontend-puce.vercel.app"
).replace(/\/$/, "");
console.log("✅ FRONTEND_URL:", frontendUrl);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  frontendUrl,
];

console.log("✅ Allowed origins:", allowedOrigins);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log("🔷 Request Origin:", origin);

    // Allow all in development
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Production: Check allowed origins
    const normalizedOrigins = allowedOrigins.map((o) => o.replace(/\/$/, ""));
    if (!origin || normalizedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply middlewares
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("✅ Backend is running on Vercel 🚀");
});

app.use("/api/v1", apiRoutes);

// Error handling middleware with CORS headers
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);

  const origin = req.headers.origin;
  if (allowedOrigins.map((o) => o.replace(/\/$/, "")).includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// Export for Vercel
module.exports = app;

// Local server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}
