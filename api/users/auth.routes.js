const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const express = require("express");
const router = express.Router();
const userController = require("./user.controller");

router.post("/register", userController.register);
router.post("/user/add", upload.single("photo"), userController.userAdd);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put(
  "/user/update/:id",
  upload.single("photo"),
  userController.userUpdate
);
router.delete("/user/delete/:id", userController.userDelete);
router.post("/login", userController.login);
router.post("/validate/token", userController.ValidateToken);
module.exports = router;
