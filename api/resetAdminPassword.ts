import prisma from "./src/prisma";
import bcrypt from "bcryptjs";

async function main() {
  try {
    // Find the admin user
    let user = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!user) {
      // Try finding by the username "8979"
      user = await prisma.user.findUnique({ where: { username: "8979" } });
    }
    if (!user) {
      // Find user linked to employee 8979
      const emp = await prisma.employee.findUnique({ where: { employee_no: "8979" } });
      if (emp) {
        user = await prisma.user.findUnique({ where: { employeeId: emp.id } });
      }
    }
    if (user) {
      const password = await bcrypt.hash("gnfc123", 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password },
      });
      console.log(`Password reset for user: ${user.username} (id=${user.id}, role=${user.role})`);
      console.log("You can now login with password: gnfc123");
    } else {
      console.log("Admin user not found. Creating new one...");
      let emp = await prisma.employee.findUnique({ where: { employee_no: "8979" } });
      if (!emp) {
        emp = await prisma.employee.create({
          data: { employee_no: "8979", name: "T J DESAI", department: "IT", email: "tjdesai@gnfc.in", designation: "System Admin" },
        });
      }
      const password = await bcrypt.hash("gnfc123", 10);
      user = await prisma.user.create({
        data: { username: "8979", email: "admin8979@gnfc.in", password, role: "ADMIN", employeeId: emp.id },
      });
      console.log(`Created user: ${user.username} (id=${user.id})`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
