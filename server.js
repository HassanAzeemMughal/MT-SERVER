require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db.config");
const apiRoutes = require("./routes");

const app = express();

// Read from .env
const frontendUrl = process.env.FRONTEND_URL;

// Log for debugging
console.log("FRONTEND_URL from .env:", frontendUrl);

// If you want to allow both ports (optional):
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Not usually needed

// Body parsers
app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/v1", apiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
