const prisma = require("../prismaClient");

// GET /api/admin/users — admin only
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/dashboard/summary — admin only
// Quick stats for the dashboard landing page.
async function dashboardSummary(req, res, next) {
  try {
    const [userCount, orderCount, menuItemCount, pendingOrders, revenueAgg] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count(),
      prisma.menuItem.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { subtotal: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

    res.json({
      totalUsers: userCount,
      totalOrders: orderCount,
      totalMenuItems: menuItemCount,
      pendingOrders,
      totalRevenue: revenueAgg._sum.subtotal || 0,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats — admin only
// Powers the Overview page cards: orders today, revenue today,
// pending orders, and total customers, plus a short recent-orders list.
async function todayStats(req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [ordersToday, revenueTodayAgg, pendingOrders, customerCount, recentOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        _sum: { subtotal: true },
        where: {
          createdAt: { gte: startOfToday },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    res.json({
      ordersToday,
      revenueToday: revenueTodayAgg._sum.subtotal || 0,
      pendingOrders,
      customers: customerCount,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, dashboardSummary, todayStats };
