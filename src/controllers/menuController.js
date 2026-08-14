const prisma = require("../prismaClient");

// GET /api/menu
// Public. Returns available items by default; admins can pass ?all=true
// to see items marked unavailable too (e.g. for editing in the dashboard).
async function listMenu(req, res, next) {
  try {
    const showAll = req.query.all === "true" && req.user?.role === "ADMIN";
    const items = await prisma.menuItem.findMany({
      where: showAll ? {} : { available: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

// GET /api/menu/:id
async function getMenuItem(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// POST /api/menu — admin only
async function createMenuItem(req, res, next) {
  try {
    const { name, description, price, category, imageUrl, available } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ message: "name, price and category are required" });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: Number(price),
        category,
        imageUrl,
        available: available ?? true,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// PUT /api/menu/:id — admin only
async function updateMenuItem(req, res, next) {
  try {
    const { name, description, price, category, imageUrl, available } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(available !== undefined && { available }),
      },
    });
    res.json(item);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Menu item not found" });
    next(err);
  }
}

// DELETE /api/menu/:id — admin only
async function deleteMenuItem(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Menu item not found" });
    next(err);
  }
}

module.exports = { listMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
