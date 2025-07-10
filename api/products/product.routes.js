const express = require("express");
const router = express.Router();
const productController = require("./product.controller");
const { body } = require("express-validator"); // For validation
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.array("images"), productController.createProduct);
router.get("/", productController.getProducts);
router.get("/fetch/trending/product", productController.fetchTrendingProducts);
router.get("/detail/:id", productController.getProById);
router.put(
  "/update/:id",
  upload.array("images"),
  productController.updateProduct
);
router.delete("/delete/:id", productController.deleteProduct);
router.delete(
  "/tags/index/based/:id",
  productController.deleteProductTagsIndexBased
);

module.exports = router;
