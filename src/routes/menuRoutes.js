const express = require("express");
const router = express.Router();
const {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { authenticate, authorize } = require("../middleware/auth");

// Public browsing — but authenticate() is optional here so ?all=true can
// work for logged-in admins while staying open for customers.
router.get("/", (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return listMenu(req, res, next);
  return authenticate(req, res, () => listMenu(req, res, next));
});

router.get("/:id", getMenuItem);

router.post("/", authenticate, authorize("ADMIN"), createMenuItem);
router.put("/:id", authenticate, authorize("ADMIN"), updateMenuItem);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteMenuItem);

module.exports = router;
