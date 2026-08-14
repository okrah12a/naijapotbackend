const express = require("express");
const router = express.Router();
const { listUsers, dashboardSummary } = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("ADMIN"));

router.get("/users", listUsers);
router.get("/dashboard/summary", dashboardSummary);

module.exports = router;
