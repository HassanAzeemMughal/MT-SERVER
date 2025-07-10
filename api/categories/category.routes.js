// src/api/categories/category.routes.js
const express = require("express");
const categoryController = require("./category.controller");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/parent", categoryController.getParentCategories); // This is now safe

// Ensure `:categorySlug` only matches valid slugs (e.g., letters, numbers, hyphens)
router.get("/fetch", categoryController.fetchCategoriesWithHierarchy);
router.get(
  "/:categorySlug([a-zA-Z0-9-]+)",
  categoryController.getCategoryWithProducts
);
// router.get(
//   "/:categorySlug([a-zA-Z0-9-]+)/:subCategorySlug([a-zA-Z0-9-]+)",
//   categoryController.getSubCategoryWithProducts
// );

router.post(
  "/add",
  upload.array("image", 10),
  categoryController.createCategory
);
router.get("/", categoryController.getCategories);
router.get("/:id([0-9a-fA-F]{24})", categoryController.getCategoryById); // Ensures only MongoDB ObjectIds match
router.put(
  "/:id([0-9a-fA-F]{24})",
  upload.single("image"),
  categoryController.updateCategory
);
router.delete(
  "/delete/:id([0-9a-fA-F]{24})",
  categoryController.deleteCategory
);

module.exports = router;
