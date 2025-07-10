const express = require("express");
const categoryRoutes = require("../api/categories/category.routes");
const productRoutes = require("../api/products/product.routes");
const brandRoutes = require("../api/brands/brand.routes");
const authRoutes = require("../api/users/auth.routes");
const mailService = require("../util/MailService");
const rolesRoutes = require("../api/roles/roles.routes");
const orderRoutes = require("../api/orders/order.routes");

const router = express.Router();

// Attach routes
router.use("/roles", rolesRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/brands", brandRoutes);
router.use("/auth", authRoutes);

module.exports = router;
