import prisma from "../prisma";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// VTMS.md eligibility rules:
// - employee_ward → years 1-4, other_reference → years 2-4
// - category must be Master/Bachelor/Diploma
// - presently_pursuing, training_compulsory, part_of_curriculum, full_time_course must all be true
// - course + branch must be from master list

const VALID_CATEGORIES = ["Master", "Bachelor", "Diploma"];

export const validateApplicationSubmission = async (payload: any): Promise<ValidationResult> => {
  const errors: string[] = [];

  // ─── Required fields ───
  if (!payload.student_name) errors.push("Student name is required");
  if (!payload.student_surname) errors.push("Student surname is required");
  if (!payload.student_email) errors.push("Student email is required");
  if (!payload.student_mobile) errors.push("Student mobile is required");
  if (!payload.categoryId) errors.push("Category is required");
  if (!payload.branchId) errors.push("Branch is required");
  if (!payload.collegeId) errors.push("College is required");
  if (!payload.requested_from) errors.push("Requested from date is required");
  if (!payload.requested_to) errors.push("Requested to date is required");

  // ─── Applicant-type-specific year range ───
  if (payload.applicant_type === "EMPLOYEE_WARD") {
    if (payload.year_of_study != null && (payload.year_of_study < 1 || payload.year_of_study > 4)) {
      errors.push("Employee ward: year of study must be between 1 and 4");
    }
  } else if (payload.applicant_type === "OTHER_REFERENCE") {
    if (payload.year_of_study != null && (payload.year_of_study < 2 || payload.year_of_study > 4)) {
      errors.push("Other reference: year of study must be between 2 and 4");
    }
  } else {
    if (payload.year_of_study && (payload.year_of_study < 1 || payload.year_of_study > 4)) {
      errors.push("Year of study must be between 1 and 4");
    }
  }

  // ─── Semester validation ───
  if (payload.semester != null && (payload.semester < 1 || payload.semester > 8)) {
    errors.push("Semester must be between 1 and 8");
  }

  // ─── Compulsory checkboxes must be true ───
  if (payload.presently_pursuing !== true) {
    errors.push("'Presently pursuing' must be checked");
  }
  if (payload.training_compulsory !== true) {
    errors.push("'Training compulsory' must be checked");
  }
  if (payload.part_of_curriculum !== true) {
    errors.push("'Part of curriculum' must be checked");
  }
  if (payload.full_time_course !== true) {
    errors.push("'Full time course' must be checked");
  }

  // ─── Category must be Master / Bachelor / Diploma ───
  if (payload.categoryId) {
    try {
      const category = await prisma.category.findUnique({ where: { id: Number(payload.categoryId) } });
      if (category && !VALID_CATEGORIES.includes(category.name)) {
        errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")} (selected: ${category.name})`);
      }
    } catch {
      errors.push("Invalid category selected");
    }
  }

  // ─── Branch must exist in master list ───
  if (payload.branchId) {
    try {
      const branch = await prisma.branch.findUnique({ where: { id: Number(payload.branchId) } });
      if (!branch) {
        errors.push("Selected branch does not exist in master list");
      }
    } catch {
      errors.push("Invalid branch selected");
    }
  }

  // ─── College must exist in master list ───
  if (payload.collegeId) {
    try {
      const college = await prisma.college.findUnique({ where: { id: Number(payload.collegeId) } });
      if (!college) {
        errors.push("Selected college does not exist in master list");
      }
    } catch {
      errors.push("Invalid college selected");
    }
  }

  // ─── Date validations ───
  if (payload.requested_from && payload.requested_to) {
    const from = new Date(payload.requested_from);
    const to = new Date(payload.requested_to);
    if (from >= to) {
      errors.push("Requested from date must be before requested to date");
    }
    const diffMs = to.getTime() - from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 180) {
      errors.push("Training period cannot exceed 180 days");
    }
  }

  // ─── Email format ───
  if (payload.student_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.student_email)) {
    errors.push("Invalid email format");
  }

  // ─── Mobile validation (10 digits) ───
  if (payload.student_mobile && !/^\d{10}$/.test(payload.student_mobile.replace(/[^\d]/g, ""))) {
    errors.push("Mobile number must be 10 digits");
  }

  // ─── For EMPLOYEE_WARD, recommending_employee_id is required ───
  if (payload.applicant_type === "EMPLOYEE_WARD" && !payload.recommending_employee_id) {
    errors.push("Recommending employee is required for employee ward applications");
  }

  // ─── For OTHER_REFERENCE, reference_details is required ───
  if (payload.applicant_type === "OTHER_REFERENCE" && !payload.reference_details) {
    errors.push("Reference details are required for other reference applications");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default { validateApplicationSubmission };
