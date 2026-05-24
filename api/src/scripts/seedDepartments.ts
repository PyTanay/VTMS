import prisma from "../prisma";

/**
 * Seed script to extract unique departments from users
 * and create Department records for any that don't exist.
 */
async function main() {
  console.log("🌱 Seeding Departments from Users...\n");

  // Get all unique departments from employees
  const employees = await prisma.employee.findMany({
    select: {
      department: true,
    },
  });

  // Extract unique department names (filter out null/undefined)
  const departmentValues: string[] = [];
  for (const e of employees) {
    if (e.department) {
      departmentValues.push(e.department);
    }
  }
  const uniqueDepartments = [...new Set(departmentValues)];

  console.log(`Found ${uniqueDepartments.length} unique departments from employees:`);
  uniqueDepartments.forEach((d) => console.log(`  - ${d}`));

  // Get existing departments
  const existingDepts = await prisma.department.findMany({
    select: {
      department_name: true,
    },
  });
  const existingDeptNames = new Set<string>();
  for (const d of existingDepts) {
    existingDeptNames.add(d.department_name);
  }

  // Create departments that don't exist
  let createdCount = 0;
  for (const deptName of uniqueDepartments) {
    if (!existingDeptNames.has(deptName)) {
      await prisma.department.create({
        data: {
          department_name: deptName,
        },
      });
      console.log(`  ✅ Created: ${deptName}`);
      createdCount++;
    } else {
      console.log(`  ⏭️  Already exists: ${deptName}`);
    }
  }

  console.log(`\n✅ Department seeding complete! Created ${createdCount} new departments.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
