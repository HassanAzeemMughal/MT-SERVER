const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// Routes
router.post("/upload", upload.single("file"), fileController.upload);
router.post("/remove", fileController.remove);
router.post("/update", upload.single("file"), fileController.update);
router.get("/get-url", fileController.getTransformedUrl);
router.get("/convert-webp", fileController.convertToWebp);

module.exports = router;
