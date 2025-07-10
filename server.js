require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db.config");
const apiRoutes = require("./routes");

const app = express();

// normalize .env frontend url (remove trailing slash if present)
const frontendUrl = (
  process.env.FRONTEND_URL || "https://mt-frontend-puce.vercel.app"
).replace(/\/$/, "");
console.log("✅ FRONTEND_URL from .env:", frontendUrl);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  frontendUrl,
];

console.log("✅ Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🔷 Request Origin:", origin);
    const normalizedOrigins = allowedOrigins.map((o) => o.replace(/\/$/, ""));
    if (!origin || normalizedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Default route for "/"
app.get("/", (req, res) => {
  res.send("✅ Server is running on Vercel 🚀");
});

// API Routes
app.use("/api/v1", apiRoutes);

// Export for Vercel
module.exports = app;

// Only listen locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
}
