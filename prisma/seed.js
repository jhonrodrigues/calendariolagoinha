const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@lagoinha.com" },
    update: {},
    create: {
      email: "admin@lagoinha.com",
      name: "Admin Master",
      password: adminPassword,
      role: "ADMIN_MASTER",
    },
  });

  console.log("Database seeded successfully with user:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
