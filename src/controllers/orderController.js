const prisma = require("../prismaClient");

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

// POST /api/orders — authenticated customer
// Body: { items: [{ menuItemId, quantity }], fulfilment, deliveryAddress, notes }
// Prices are looked up server-side from the current MenuItem records —
// never trust a price sent from the client.
async function createOrder(req, res, next) {
  try {
    const { items, fulfilment, deliveryAddress, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must include at least one item" });
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: "One or more menu items were not found" });
    }

    const unavailable = menuItems.find((m) => !m.available);
    if (unavailable) {
      return res.status(400).json({ message: `${unavailable.name} is currently unavailable` });
    }

    const orderItemsData = items.map((i) => {
      const menuItem = menuItems.find((m) => m.id === i.menuItemId);
      const quantity = Math.max(1, Number(i.quantity) || 1);
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      };
    });

    const subtotal = orderItemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        subtotal,
        fulfilment: fulfilment === "PICKUP" ? "PICKUP" : "DELIVERY",
        deliveryAddress,
        notes,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/me — authenticated customer's own order history
async function myOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// GET /api/orders — admin only, all orders (optionally filtered by ?status=)
async function allOrders(req, res, next) {
  try {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status — admin only
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true },
    });
    res.json(order);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Order not found" });
    next(err);
  }
}

module.exports = { createOrder, myOrders, allOrders, updateOrderStatus };
