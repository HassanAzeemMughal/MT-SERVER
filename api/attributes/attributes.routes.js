// src/api/categories/category.routes.js
const express = require("express");
const attributeController = require("./attributes.controller");
const router = express.Router();

router.post("/add", attributeController.createAttribute);
router.get("/", attributeController.getAttributes);
router.get("/:id", attributeController.getAttributeById);
router.put("/:id", attributeController.updateAttribute);
router.delete("/delete/:id", attributeController.deleteAttribute);
router.delete("/value/delete", attributeController.deleteAttributeValue);

module.exports = router;
