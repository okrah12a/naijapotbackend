const express = require("express");
const router = express.Router();
const { register, login, adminLogin, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", authenticate, me);

module.exports = router;
