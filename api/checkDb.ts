import prisma from "./src/prisma";

async function check() {
  try {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    if (user) {
      console.log("Admin user found:", { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId });
    } else {
      console.log("Admin user not found - need to seed DB");
    }

    const emp = await prisma.employee.findUnique({ where: { employee_no: "8979" } });
    if (emp) {
      console.log("Employee 8979 found:", { id: emp.id, name: emp.name, department: emp.department });
    } else {
      console.log("Employee 8979 not found");
    }

    const userByEmp = await prisma.user.findUnique({ where: { employeeId: emp?.id ?? -1 } });
    if (userByEmp) {
      console.log("User linked to employee 8979:", { id: userByEmp.id, username: userByEmp.username, role: userByEmp.role });
    } else {
      console.log("No user linked to employee 8979");
    }
  } catch (e: any) {
    console.error("DB Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
