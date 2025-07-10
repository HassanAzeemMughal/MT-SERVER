// src/api/categories/category.routes.js
const express = require("express");
const rolesController = require("./roles.controller");
const router = express.Router();

router.post("/", rolesController.createRoles);
router.get("/", rolesController.getRoles);
router.get("/:slug", rolesController.getRolesBySlug);
router.put("/:slug", rolesController.updateRoles);
router.delete("/delete/:id", rolesController.deleteRoles);

module.exports = router;
