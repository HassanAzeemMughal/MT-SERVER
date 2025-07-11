require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db.config");
const apiRoutes = require("./routes");

const app = express();

const allowedOrigins = [
  // "http://localhost:5173",
  // "http://localhost:3000",
  "https://mt-dashboard-ten.vercel.app",
  "https://mt-frontend-puce.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// Handle preflight everywhere
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.get("/", (req, res) => {
  res.send("✅ Backend is running on Vercel 🚀");
});

app.use("/api/v1", apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}
