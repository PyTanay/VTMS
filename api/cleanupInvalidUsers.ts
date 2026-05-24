import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting cleanup of invalid users...");

  // Find users with "Phone" as employee name
  const usersWithPhoneName = await prisma.user.findMany({
    where: {
      employee: {
        name: "Phone",
      },
    },
    include: { employee: true },
  });

  console.log(`Found ${usersWithPhoneName.length} users with "Phone" as employee name`);

  // Delete users with "Phone" as employee name
  for (const user of usersWithPhoneName) {
    console.log(`Deleting user ${user.username} (id: ${user.id}) - employee name: ${user.employee?.name}`);
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Find users with invalid email format (X@gnfc.in where X is a number)
  // We need to filter in code since Prisma doesn't support regex in where clause
  const allUsers = await prisma.user.findMany({
    include: { employee: true },
  });

  const usersWithInvalidEmail = allUsers.filter((u) => /^\d+@gnfc\.in$/.test(u.email));
  console.log(`Found ${usersWithInvalidEmail.length} users with invalid email format`);

  // Delete users with invalid email format
  for (const user of usersWithInvalidEmail) {
    console.log(`Deleting user ${user.username} (id: ${user.id}) - email: ${user.email}`);
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Also delete orphaned employees (employees without users)
  const orphanedEmployees = await prisma.employee.findMany({
    where: {
      user: null,
    },
  });

  console.log(`Found ${orphanedEmployees.length} orphaned employees`);

  for (const emp of orphanedEmployees) {
    // Only delete if the employee name is "Phone" or invalid
    if (emp.name === "Phone" || /^\d+$/.test(emp.name) || emp.name.length < 3) {
      console.log(`Deleting orphaned employee ${emp.employee_no} - name: ${emp.name}`);
      await prisma.employee.delete({ where: { id: emp.id } });
    }
  }

  console.log("Cleanup completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
