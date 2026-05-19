/**
 * VTMS Employee Cleanup Script
 *
 * Run: npx tsx api/src/scripts/cleanEmployees.ts
 *
 * This script:
 * 1. Finds employees with suspicious EC numbers (e.g., "1" instead of "8979")
 * 2. Deletes employees that don't have proper data
 * 3. Fixes SAMVAD sync to use the correct employee_no format
 */

import prisma from "../prisma";

async function cleanEmployees() {
  console.log("🔍 Starting employee data cleanup...\n");

  // Find employees with suspiciously short EC numbers (likely wrong)
  const allEmployees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
  });

  console.log(`Total employees in DB: ${allEmployees.length}`);

  // Employees with EC No = "1" or very short numbers are clearly wrong
  const suspiciousEmployees = allEmployees.filter(
    (emp) => emp.employee_no === "1" || emp.employee_no.length <= 1 || emp.name === "Unknown",
  );

  console.log(`\n⚠️ Found ${suspiciousEmployees.length} suspicious employees:`);
  suspiciousEmployees.forEach((emp) => {
    console.log(`  ID:${emp.id} | EC:${emp.employee_no} | Name:${emp.name} | Dept:${emp.department}`);
  });

  // Check employees that have associated applications or users
  let deletedCount = 0;
  let keptCount = 0;

  for (const emp of suspiciousEmployees) {
    // Check if this employee has any linked data
    const user = await prisma.user.findUnique({ where: { employeeId: emp.id } });
    const applicationsCount = await prisma.application.count({
      where: { recommending_employee_id: emp.id },
    });

    if (!user && applicationsCount === 0) {
      // Safe to delete
      console.log(`  🗑️ Deleting employee ID:${emp.id} (${emp.name}, EC:${emp.employee_no})`);
      await prisma.employee.delete({ where: { id: emp.id } });
      deletedCount++;
    } else {
      console.log(
        `  🔒 Keeping employee ID:${emp.id} (${emp.name}) - has linked ${user ? "user" : ""} ${applicationsCount > 0 ? `${applicationsCount} application(s)` : ""}`,
      );
      keptCount++;
    }
  }

  console.log(`\n✅ Cleanup complete:`);
  console.log(`  Deleted: ${deletedCount}`);
  console.log(`  Kept (has linked data): ${keptCount}`);
  console.log(`  Remaining employees: ${allEmployees.length - deletedCount}`);

  // Show final employee list
  const remaining = await prisma.employee.findMany({ orderBy: { id: "asc" }, take: 20 });
  console.log(`\n📋 Sample of remaining employees (first 20):`);
  remaining.forEach((emp) => {
    console.log(`  EC:${emp.employee_no} | ${emp.name} | ${emp.department}`);
  });
}

cleanEmployees()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
