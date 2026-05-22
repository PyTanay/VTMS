// ── Validation Helpers ──

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export const required = (value: any, field: string, label: string): ValidationError | null => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { field, message: `${label} is required` };
  }
  return null;
};

export const email = (value: string, field: string, label: string): ValidationError | null => {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) {
    return { field, message: `${label} must be a valid email address` };
  }
  return null;
};

export const mobile = (value: string, field: string, label: string): ValidationError | null => {
  if (!value) return null;
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length < 10) {
    return { field, message: `${label} must be at least 10 digits` };
  }
  return null;
};

export const minLength = (value: string, field: string, label: string, min: number): ValidationError | null => {
  if (!value) return null;
  if (value.length < min) {
    return { field, message: `${label} must be at least ${min} characters` };
  }
  return null;
};

export const maxLength = (value: string, field: string, label: string, max: number): ValidationError | null => {
  if (!value) return null;
  if (value.length > max) {
    return { field, message: `${label} must not exceed ${max} characters` };
  }
  return null;
};

export const isNumber = (value: any, field: string, label: string): ValidationError | null => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (isNaN(num)) {
    return { field, message: `${label} must be a number` };
  }
  return null;
};

export const min = (value: number, field: string, label: string, minVal: number): ValidationError | null => {
  if (value === undefined || value === null) return null;
  if (value < minVal) {
    return { field, message: `${label} must be at least ${minVal}` };
  }
  return null;
};

export const max = (value: number, field: string, label: string, maxVal: number): ValidationError | null => {
  if (value === undefined || value === null) return null;
  if (value > maxVal) {
    return { field, message: `${label} must not exceed ${maxVal}` };
  }
  return null;
};

export const dateRange = (
  from: string | Date | undefined | null,
  to: string | Date | undefined | null,
  fromLabel: string,
  toLabel: string,
): ValidationError | null => {
  if (!from || !to) return null;
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(f.getTime()) || isNaN(t.getTime())) return null;
  if (f >= t) {
    return { field: "requested_to", message: `${toLabel} must be after ${fromLabel}` };
  }
  return null;
};

// ── Application Eligibility Rules ──

export const validateEligibility = (data: {
  presently_pursuing?: boolean;
  training_compulsory?: boolean;
  part_of_curriculum?: boolean;
  full_time_course?: boolean;
  past_training?: boolean;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (data.past_training === true) {
    errors.push({ field: "past_training", message: "Candidate has already undergone training previously" });
  }

  return { valid: errors.length === 0, errors };
};

// ── Application Form Validation ──

export const validateApplicationForm = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  const fields: Array<[string, string, (v: any) => ValidationError | null]> = [
    ["student_surname", "Surname", (v) => required(v, "student_surname", "Surname")],
    ["student_name", "Student Name", (v) => required(v, "student_name", "Student Name")],
    ["student_father_name", "Father's Name", (v) => required(v, "student_father_name", "Father's Name")],
    ["student_email", "Email", (v) => required(v, "student_email", "Email") || email(v, "student_email", "Email")],
    ["student_mobile", "Mobile", (v) => required(v, "student_mobile", "Mobile") || mobile(v, "student_mobile", "Mobile")],
    ["categoryId", "Category", (v) => required(v, "categoryId", "Category")],
    ["branchId", "Branch", (v) => required(v, "branchId", "Branch")],
    ["year_of_study", "Year of Study", (v) => required(v, "year_of_study", "Year of Study")],
    ["semester", "Semester", (v) => required(v, "semester", "Semester")],
    ["collegeId", "College", (v) => required(v, "collegeId", "College")],
    ["requested_from", "Requested From Date", (v) => required(v, "requested_from", "Requested From Date")],
    ["requested_to", "Requested To Date", (v) => required(v, "requested_to", "Requested To Date")],
  ];

  for (const [field, label, fn] of fields) {
    const err = fn(data[field]);
    if (err) errors.push(err);
  }

  // Date range validation
  const dateErr = dateRange(data.requested_from, data.requested_to, "Requested From Date", "Requested To Date");
  if (dateErr) errors.push(dateErr);

  // Eligibility rules
  const eligibilityErrors = validateEligibility(data);
  errors.push(...eligibilityErrors.errors);

  return { valid: errors.length === 0, errors };
};

// ── Biodata Form Validation ──

export const validateBiodataForm = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  type BiodataField = [string, string, boolean, ((v: any) => ValidationError | null) | null];
  const fields: BiodataField[] = [
    ["local_address", "Local Address", true, (v) => required(v, "local_address", "Local Address")],
    ["permanent_address", "Permanent Address", true, (v) => required(v, "permanent_address", "Permanent Address")],
    ["caste", "Caste", false, null],
    ["height_cm", "Height (cm)", false, (v) => isNumber(v, "height_cm", "Height")],
    ["weight_kg", "Weight (kg)", false, (v) => isNumber(v, "weight_kg", "Weight")],
    ["blood_group", "Blood Group", false, null],
  ];

  for (const [field, label, requiredField, validator] of fields) {
    if (requiredField) {
      const err = required(data[field], field, label);
      if (err) errors.push(err);
    }
    if (validator && data[field] !== undefined && data[field] !== null && data[field] !== "") {
      const err = validator(data[field]);
      if (err) errors.push(err);
    }
  }

  return { valid: errors.length === 0, errors };
};

// ── Permission Letter Validation ──

export const validatePermissionLetter = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  const fields: Array<[string, string]> = [
    ["permission_letter_ref", "Permission Letter Ref"],
    ["permission_letter_date", "Permission Letter Date"],
    ["posting_department_id", "Posting Department"],
  ];

  for (const [field, label] of fields) {
    const err = required(data[field], field, label);
    if (err) errors.push(err);
  }

  return { valid: errors.length === 0, errors };
};

// ── Form field error helper ──
// Get error message for a specific field from an errors array
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

// Get a display-friendly error summary
export const getErrorSummary = (errors: ValidationError[]): string | null => {
  if (errors.length === 0) return null;
  if (errors.length === 1) return errors[0].message;
  return `${errors.length} errors found. Please check the form fields highlighted in red.`;
};

// Check if a field has an error
export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some((e) => e.field === field);
};
