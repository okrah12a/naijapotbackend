const express = require("express");
const router = express.Router();
const {
  createOrder,
  myOrders,
  allOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { authenticate, authorize } = require("../middleware/auth");

router.post("/", authenticate, createOrder);
router.get("/me", authenticate, myOrders);

router.get("/", authenticate, authorize("ADMIN"), allOrders);
router.patch("/:id/status", authenticate, authorize("ADMIN"), updateOrderStatus);

module.exports = router;
