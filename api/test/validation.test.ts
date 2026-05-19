import { validateApplicationSubmission } from "../src/services/validation.service";

describe("validateApplicationSubmission", () => {
  // Basic required fields
  it("returns errors for empty payload", async () => {
    const result = await validateApplicationSubmission({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns no field-level errors for valid employee ward payload", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      semester: 4,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    // May have errors from prisma lookups (category/branch/college not found in test DB)
    // But should not have field-level validation errors
    const fieldErrors = result.errors.filter(
      (e: string) =>
        !e.includes("category") &&
        !e.includes("branch") &&
        !e.includes("college") &&
        !e.includes("Category") &&
        !e.includes("Branch") &&
        !e.includes("College"),
    );
    expect(fieldErrors.length).toBe(0);
  });

  // Year range rules
  it("rejects OTHER_REFERENCE with year_of_study = 1", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "OTHER_REFERENCE",
      year_of_study: 1,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("year of study"))).toBe(true);
  });

  // Compulsory checkboxes
  it("rejects when presently_pursuing is false", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: false,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("presently pursuing"))).toBe(true);
  });

  // Applicant-type-specific required fields
  it("rejects EMPLOYEE_WARD without recommending_employee_id", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("recommending employee"))).toBe(true);
  });

  // Date validation
  it("rejects when requested_from is after requested_to", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-09-01",
      requested_to: "2025-06-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("before"))).toBe(true);
  });

  // Email format
  it("rejects invalid email", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "not-an-email",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("email"))).toBe(true);
  });

  // Mobile format
  it("rejects invalid mobile", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "12345",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("mobile"))).toBe(true);
  });

  // Training period > 180 days
  it("rejects training period longer than 180 days", async () => {
    const payload = {
      student_name: "Test",
      student_surname: "Student",
      student_email: "test@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      collegeId: 1,
      requested_from: "2025-01-01",
      requested_to: "2025-12-01",
      applicant_type: "EMPLOYEE_WARD",
      year_of_study: 3,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      recommending_employee_id: 1,
    };
    const result = await validateApplicationSubmission(payload);
    expect(result.errors.some((e: string) => e.toLowerCase().includes("180") || e.toLowerCase().includes("exceed"))).toBe(true);
  });
});
