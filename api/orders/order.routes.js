// src/api/categories/category.routes.js
const express = require("express");
const orderController = require("./order.controller");
const router = express.Router();

router.post("/create-payment-intent", orderController.createPaymentIntent);
router.post("/create", orderController.createOrder);
router.get("/list", orderController.getOrders);
router.get("/detail/:id", orderController.getOrderById);
router.get("/by/user/:id", orderController.getOrderByUserId);

router.get("/deliverd/orders", orderController.deliveredOrderHistory);

module.exports = router;
