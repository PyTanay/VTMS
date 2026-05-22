import prisma from "./src/prisma";
import bcrypt from "bcryptjs";

async function main() {
  try {
    // Check if employee 8979 exists
    let emp = await prisma.employee.findUnique({ where: { employee_no: "8979" } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: { employee_no: "8979", name: "Admin User", department: "IT", email: "admin@gnfc.in", designation: "System Admin" },
      });
      console.log("Created employee 8979");
    } else {
      console.log("Employee 8979 already exists:", emp.name);
    }

    // Check if user linked to this employee exists
    let user = await prisma.user.findUnique({ where: { employeeId: emp.id } });
    if (!user) {
      const password = await bcrypt.hash("gnfc123", 10);
      user = await prisma.user.create({
        data: { username: "8979", email: "admin8979@gnfc.in", password, role: "ADMIN", employeeId: emp.id },
      });
      console.log("Created user for 8979 with password gnfc123");
    } else {
      console.log("User for 8979 already exists:", user.username, user.role);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
