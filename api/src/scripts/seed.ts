import prisma from "../prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. States ──
  const gujarat = await prisma.state.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Gujarat" },
  });
  const rajasthan = await prisma.state.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: "Rajasthan" },
  });

  // ── 2. Districts ──
  const bharuch = await prisma.district.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Bharuch", stateId: gujarat.id },
  });
  const vadodara = await prisma.district.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: "Vadodara", stateId: gujarat.id },
  });
  const surat = await prisma.district.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: "Surat", stateId: gujarat.id },
  });

  // ── 3. Talukas ──
  await prisma.taluka.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Ankleshwar", districtId: bharuch.id } });
  await prisma.taluka.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "Bharuch", districtId: bharuch.id } });
  await prisma.taluka.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "Vadodara City", districtId: vadodara.id } });
  await prisma.taluka.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "Surat City", districtId: surat.id } });

  // ── 4. Cities ──
  await prisma.city.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Ankleshwar", talukaId: 1 } });
  await prisma.city.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "Bharuch", talukaId: 2 } });
  await prisma.city.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "Vadodara", talukaId: 3 } });
  await prisma.city.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "Surat", talukaId: 4 } });

  // ── 5. Categories ──
  await prisma.category.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "General" } });
  await prisma.category.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "OBC" } });
  await prisma.category.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "SC" } });
  await prisma.category.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "ST" } });

  // ── 6. Branches ──
  await prisma.branch.upsert({ where: { id: 1 }, update: {}, create: { id: 1, branch_name: "Chemical Engineering" } });
  await prisma.branch.upsert({ where: { id: 2 }, update: {}, create: { id: 2, branch_name: "Mechanical Engineering" } });
  await prisma.branch.upsert({ where: { id: 3 }, update: {}, create: { id: 3, branch_name: "Electrical Engineering" } });
  await prisma.branch.upsert({ where: { id: 4 }, update: {}, create: { id: 4, branch_name: "Instrumentation" } });
  await prisma.branch.upsert({ where: { id: 5 }, update: {}, create: { id: 5, branch_name: "Civil Engineering" } });
  await prisma.branch.upsert({ where: { id: 6 }, update: {}, create: { id: 6, branch_name: "Computer Engineering" } });

  // ── 7. Colleges ──
  const colleges = [
    { id: 1, name: "Sardar Vallabhbhai Patel Institute of Technology (SVPIT)", place: "Vasad" },
    { id: 2, name: "Narmada College of Engineering", place: "Bharuch" },
    { id: 3, name: "Government Engineering College", place: "Bharuch" },
    { id: 4, name: "A D Patel Institute of Technology", place: "Vallabh Vidyanagar" },
    { id: 5, name: "Parul Institute of Engineering & Technology", place: "Vadodara" },
    { id: 6, name: "C K Pithawala College of Engineering", place: "Surat" },
  ];
  for (const c of colleges) {
    await prisma.college.upsert({ where: { id: c.id }, update: {}, create: { id: c.id, college_name: c.name, place: c.place } });
  }

  // ── 8. Departments ──
  const depts = [
    { id: 1, name: "Ammonia-I" },
    { id: 2, name: "Ammonia-II" },
    { id: 3, name: "Urea" },
    { id: 4, name: "Methanol" },
    { id: 5, name: "Formic Acid" },
    { id: 6, name: "Nitric Acid" },
    { id: 7, name: "Maintenance (Mechanical)" },
    { id: 8, name: "Maintenance (Electrical)" },
    { id: 9, name: "Maintenance (Instrumentation)" },
    { id: 10, name: "TDI" },
    { id: 11, name: "HR & Training" },
  ];
  for (const d of depts) {
    await prisma.department.upsert({ where: { id: d.id }, update: {}, create: { id: d.id, department_name: d.name } });
  }

  // ── 9. Financial Year ──
  await prisma.financialYear.upsert({ where: { id: 1 }, update: {}, create: { id: 1, year_string: "2026-27", active: true } });

  // ── 10. Employees ──
  const password = await bcrypt.hash("password123", 10);
  const employees = [
    {
      id: 1,
      employee_no: "EMP001",
      name: "Tanmay Joshi",
      department: "HR & Training",
      email: "tanmay@gnfc.in",
      designation: "Training Manager",
    },
    {
      id: 2,
      employee_no: "EMP002",
      name: "Rahul Sharma",
      department: "Ammonia-I",
      email: "rahul.sharma@gnfc.in",
      designation: "Plant Engineer",
    },
    {
      id: 3,
      employee_no: "EMP003",
      name: "Priya Patel",
      department: "Urea",
      email: "priya.patel@gnfc.in",
      designation: "Senior Engineer",
    },
    {
      id: 4,
      employee_no: "EMP004",
      name: "Amit Desai",
      department: "Maintenance (Mechanical)",
      email: "amit.desai@gnfc.in",
      designation: "Maintenance Head",
    },
    {
      id: 5,
      employee_no: "EMP005",
      name: "Sneha Mehta",
      department: "HR & Training",
      email: "sneha.mehta@gnfc.in",
      designation: "HR Executive",
    },
  ];
  for (const emp of employees) {
    await prisma.employee.upsert({ where: { id: emp.id }, update: {}, create: emp });
  }

  // ── 11. Users ──
  const users = [
    { id: 1, username: "admin", email: "admin@gnfc.in", password, role: "ADMIN" as const, employeeId: 5 },
    { id: 2, username: "hod_training", email: "hod@gnfc.in", password, role: "TRAINING_CENTER_SECTION_HEAD" as const, employeeId: 1 },
    {
      id: 3,
      username: "recommender1",
      email: "recommender1@gnfc.in",
      password,
      role: "RECOMMENDING_EMPLOYEE" as const,
      employeeId: 2,
    },
    {
      id: 4,
      username: "recommender2",
      email: "recommender2@gnfc.in",
      password,
      role: "RECOMMENDING_EMPLOYEE" as const,
      employeeId: 3,
    },
    { id: 5, username: "incharge", email: "incharge@gnfc.in", password, role: "TRAINING_IN_CHARGE" as const, employeeId: 4 },
    { id: 6, username: "ed_approver", email: "ed@gnfc.in", password, role: "ED_GM_APPROVER" as const, employeeId: null },
    { id: 7, username: "applicant1", email: "student1@test.in", password, role: "APPLICANT" as const, employeeId: null },
    { id: 8, username: "applicant2", email: "student2@test.in", password, role: "APPLICANT" as const, employeeId: null },
  ];
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { id: u.id } });
    if (!existing) {
      await prisma.user.create({ data: u });
    }
  }

  // ── 12. Sample Applications ──
  const apps = [
    {
      id: 1,
      application_no: "VTMS/2026/0001",
      applicant_type: "EMPLOYEE_WARD" as const,
      status: "DRAFT" as const,
      student_surname: "Shah",
      student_name: "Rohan",
      student_father_name: "Rahul Shah",
      student_email: "rohan.shah@test.in",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      year_of_study: 3,
      semester: 6,
      collegeId: 1,
      requested_from: new Date("2026-07-01"),
      requested_to: new Date("2026-09-30"),
      recommending_employee_id: 2,
    },
    {
      id: 2,
      application_no: "VTMS/2026/0002",
      applicant_type: "EMPLOYEE_WARD" as const,
      status: "SUBMITTED" as const,
      student_surname: "Patel",
      student_name: "Kavya",
      student_father_name: "Amit Patel",
      student_email: "kavya.patel@test.in",
      student_mobile: "9876543211",
      categoryId: 2,
      branchId: 3,
      year_of_study: 4,
      semester: 8,
      collegeId: 2,
      requested_from: new Date("2026-07-15"),
      requested_to: new Date("2026-10-15"),
      recommending_employee_id: 3,
    },
    {
      id: 3,
      application_no: "VTMS/2026/0003",
      applicant_type: "OTHER_REFERENCE" as const,
      status: "APPROVED" as const,
      student_surname: "Desai",
      student_name: "Neel",
      student_father_name: "Suresh Desai",
      student_email: "neel.desai@test.in",
      student_mobile: "9876543212",
      categoryId: 1,
      branchId: 2,
      year_of_study: 3,
      semester: 6,
      collegeId: 3,
      requested_from: new Date("2026-06-01"),
      requested_to: new Date("2026-08-30"),
      recommending_employee_id: 2,
      reference_details: "VVIP reference - MD Office",
    },
    {
      id: 4,
      application_no: "VTMS/2026/0004",
      applicant_type: "EMPLOYEE_WARD" as const,
      status: "TRAINING_ACTIVE" as const,
      student_surname: "Mehta",
      student_name: "Isha",
      student_father_name: "Rajan Mehta",
      student_email: "isha.mehta@test.in",
      student_mobile: "9876543213",
      categoryId: 3,
      branchId: 4,
      year_of_study: 3,
      semester: 6,
      collegeId: 4,
      requested_from: new Date("2026-01-10"),
      requested_to: new Date("2026-04-10"),
      approved_from: new Date("2026-01-15"),
      approved_to: new Date("2026-04-15"),
      recommending_employee_id: 3,
      permission_letter_ref: "GNFC/TRG/2026/001",
      permission_letter_date: new Date("2026-01-05"),
      posting_department_id: 7,
      joining_date: new Date("2026-01-20"),
      gate_pass_no: "GP/2026/001",
      gate_pass_valid_up_to: new Date("2026-04-15"),
    },
    {
      id: 5,
      application_no: "VTMS/2026/0005",
      applicant_type: "EMPLOYEE_WARD" as const,
      status: "TRAINING_COMPLETED" as const,
      student_surname: "Joshi",
      student_name: "Arjun",
      student_father_name: "Tanmay Joshi",
      student_email: "arjun.joshi@test.in",
      student_mobile: "9876543214",
      categoryId: 1,
      branchId: 6,
      year_of_study: 4,
      semester: 8,
      collegeId: 5,
      requested_from: new Date("2025-10-01"),
      requested_to: new Date("2025-12-31"),
      approved_from: new Date("2025-10-05"),
      approved_to: new Date("2025-12-31"),
      recommending_employee_id: 2,
      permission_letter_ref: "GNFC/TRG/2025/015",
      permission_letter_date: new Date("2025-09-28"),
      posting_department_id: 11,
      joining_date: new Date("2025-10-10"),
      gate_pass_no: "GP/2025/015",
      gate_pass_valid_up_to: new Date("2025-12-31"),
      behavioral_rating: "Excellent",
      progress_rating: "Good",
      actual_completion_date: new Date("2025-12-20"),
      report_submission_date: new Date("2025-12-25"),
      certificate_ref: "CERT/2025/001",
      certificate_issue_date: new Date("2025-12-28"),
      no_due_ref: "ND/2025/001",
    },
  ];
  for (const app of apps) {
    const existing = await prisma.application.findUnique({ where: { id: app.id } });
    if (!existing) {
      await prisma.application.create({ data: app });
    }
  }

  // ── 13. Email Config presets ──
  const emailTypes = ["GLOBAL", "APPROVAL", "PERMISSION", "CERTIFICATE", "NODUE", "REMINDER"];
  for (const type of emailTypes) {
    await prisma.emailConfig.upsert({ where: { type }, update: {}, create: { type, enabled: true } });
  }

  // ── 14. Role Mappings ──
  const roleMappings = [
    { designation: "Training Manager", role: "TRAINING_CENTER_SECTION_HEAD" as const, description: "Head of training section" },
    { designation: "Plant Engineer", role: "RECOMMENDING_EMPLOYEE" as const, description: "Can recommend applicants" },
    { designation: "Senior Engineer", role: "RECOMMENDING_EMPLOYEE" as const, description: "Can recommend applicants" },
    { designation: "Maintenance Head", role: "TRAINING_IN_CHARGE" as const, description: "Training in-charge for department" },
    { designation: "HR Executive", role: "ADMIN" as const, description: "HR admin" },
  ];
  for (const rm of roleMappings) {
    await prisma.roleMapping.upsert({ where: { designation: rm.designation }, update: {}, create: rm });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Test Users (password: password123):");
  console.log("  admin         → ADMIN (admin@gnfc.in)");
  console.log("  hod_training  → Section Head (hod@gnfc.in)");
  console.log("  recommender1  → Recommending Employee (recommender1@gnfc.in)");
  console.log("  recommender2  → Recommending Employee (recommender2@gnfc.in)");
  console.log("  incharge      → Training In-Charge (incharge@gnfc.in)");
  console.log("  ed_approver   → ED/GM Approver (ed@gnfc.in)");
  console.log("  applicant1    → Applicant (student1@test.in)");
  console.log("  applicant2    → Applicant (student2@test.in)");

  console.log("\n📋 Sample Applications:");
  console.log("  #1 DRAFT                - Rohan Shah");
  console.log("  #2 SUBMITTED            - Kavya Patel");
  console.log("  #3 APPROVED             - Neel Desai");
  console.log("  #4 TRAINING_ACTIVE      - Isha Mehta");
  console.log("  #5 TRAINING_COMPLETED   - Arjun Joshi");
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
