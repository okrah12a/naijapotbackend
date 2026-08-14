require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@naijapot.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME || "Naija Pot Admin";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: { name: adminName, email: adminEmail, password: hashed, role: "ADMIN" },
    });
    console.log(`Admin account created: ${adminEmail} / ${adminPassword} (change this password!)`);
  } else {
    console.log("Admin account already exists, skipping.");
  }

  // A small starter menu so the frontend has something to render immediately.
  // Add the rest of your real menu through the admin dashboard once it's live.
  const starterItems = [
    { name: "Fried Rice", price: 3000, category: "rice", description: "Nigerian-style party fried rice" },
    { name: "Jollof Rice", price: 3000, category: "rice", description: "Smoky, classic jollof" },
    { name: "Ofada Rice & Sauce", price: 3500, category: "rice", description: "Local rice with ofada sauce" },
    { name: "Pounded Yam & Egusi", price: 4000, category: "swallow", description: "Egusi soup with assorted meat" },
    { name: "Amala & Ewedu", price: 3500, category: "swallow", description: "Served with gbegiri" },
    { name: "Grilled Chicken", price: 2500, category: "protein", description: "Half chicken, grilled and spiced" },
    { name: "Peppered Beef", price: 2000, category: "protein", description: "Spicy diced beef" },
    { name: "Chapman", price: 1500, category: "drinks", description: "Classic Nigerian mocktail" },
    { name: "Zobo", price: 1000, category: "drinks", description: "Chilled hibiscus drink" },
  ];

  for (const item of starterItems) {
    const exists = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.menuItem.create({ data: item });
    }
  }
  console.log("Starter menu items seeded (existing items left untouched).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
