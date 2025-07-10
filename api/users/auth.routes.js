const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // Create the upload middleware
const express = require("express");
const router = express.Router();
const userController = require("./user.controller");

// Routes for question CRUD operations
router.post("/register", userController.register);
router.post("/user/add", userController.userAdd);
router.get("/", userController.getUsers);
router.put("/user/update/:id", userController.userUpdate);
router.delete("/user/delete/:id", userController.userDelete);
router.post("/login", userController.login);
router.post("/validate/token", userController.ValidateToken);
module.exports = router;
