// src/api/categories/category.routes.js
const express = require("express");
const brandController = require("./brand.controller");
const router = express.Router();

//
router.post("/add", brandController.createBrand);
router.get("/", brandController.getBrands);
router.get("/:id", brandController.getBrandById);
router.put("/update/:id", brandController.updateBrand);
router.delete("/delete/:id", brandController.deleteBrand);

module.exports = router;
