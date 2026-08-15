const express = require("express");
const router = express.Router();
const { listUsers, dashboardSummary, todayStats } = require("../controllers/adminController");
const { allOrders, updateOrderStatus } = require("../controllers/orderController");
const { listMenu, createMenuItem, updateMenuItem, deleteMenuItem } = require("../controllers/menuController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("ADMIN"));

router.get("/users", listUsers);
router.get("/customers", listUsers); // alias — same data the dashboard's "Customers" page needs

router.get("/dashboard/summary", dashboardSummary);
router.get("/stats", todayStats); // powers the Overview page cards

router.get("/orders", allOrders);
router.patch("/orders/:id/status", updateOrderStatus);

// Admin should see unavailable items too, so force the "all" flag
router.get("/menu", (req, res, next) => {
  req.query.all = "true";
  return listMenu(req, res, next);
});
router.post("/menu", createMenuItem);
router.put("/menu/:id", updateMenuItem);
router.delete("/menu/:id", deleteMenuItem);

module.exports = router;
