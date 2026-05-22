import {
  required,
  email,
  mobile,
  minLength,
  maxLength,
  isNumber,
  dateRange,
  validateApplicationForm,
  validateBiodataForm,
  validatePermissionLetter,
  validateEligibility,
  getFieldError,
  getErrorSummary,
  hasFieldError,
} from "../utils/validation";

describe("required", () => {
  it("returns error for undefined", () => {
    expect(required(undefined, "name", "Name")).toEqual({ field: "name", message: "Name is required" });
  });

  it("returns error for null", () => {
    expect(required(null, "name", "Name")).toEqual({ field: "name", message: "Name is required" });
  });

  it("returns error for empty string", () => {
    expect(required("", "email", "Email")).toEqual({ field: "email", message: "Email is required" });
  });

  it("returns null for valid value", () => {
    expect(required("John", "name", "Name")).toBeNull();
  });

  it("returns null for zero", () => {
    expect(required(0, "count", "Count")).toBeNull();
  });
});

describe("email", () => {
  it("returns error for invalid email", () => {
    expect(email("invalid", "email", "Email")).toEqual({ field: "email", message: "Email must be a valid email address" });
  });

  it("returns null for valid email", () => {
    expect(email("test@example.com", "email", "Email")).toBeNull();
  });

  it("returns null for empty value", () => {
    expect(email("", "email", "Email")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(email(undefined as any, "email", "Email")).toBeNull();
  });
});

describe("mobile", () => {
  it("returns error for too few digits", () => {
    expect(mobile("12345", "mobile", "Mobile")).toEqual({ field: "mobile", message: "Mobile must be at least 10 digits" });
  });

  it("returns null for 10 digit phone", () => {
    expect(mobile("9876543210", "mobile", "Mobile")).toBeNull();
  });

  it("cleans non-digit characters", () => {
    expect(mobile("+91-9876543210", "mobile", "Mobile")).toBeNull();
  });

  it("returns null for empty value", () => {
    expect(mobile("", "mobile", "Mobile")).toBeNull();
  });
});

describe("minLength", () => {
  it("returns error for shorter than minimum", () => {
    expect(minLength("ab", "field", "Field", 3)).toEqual({ field: "field", message: "Field must be at least 3 characters" });
  });

  it("returns null for value meeting minimum", () => {
    expect(minLength("abcd", "field", "Field", 3)).toBeNull();
  });
});

describe("maxLength", () => {
  it("returns error for longer than maximum", () => {
    expect(maxLength("abcdef", "field", "Field", 3)).toEqual({ field: "field", message: "Field must not exceed 3 characters" });
  });

  it("returns null for value within max", () => {
    expect(maxLength("abc", "field", "Field", 3)).toBeNull();
  });
});

describe("isNumber", () => {
  it("returns null for actual number", () => {
    expect(isNumber(42, "age", "Age")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(isNumber("", "age", "Age")).toBeNull();
  });

  it("returns error for NaN", () => {
    expect(isNumber("not-a-number", "age", "Age")).toEqual({ field: "age", message: "Age must be a number" });
  });
});

describe("dateRange", () => {
  it("returns null if from is before to", () => {
    expect(dateRange("2025-01-01", "2025-01-10", "From", "To")).toBeNull();
  });

  it("returns error if from is after to", () => {
    expect(dateRange("2025-01-10", "2025-01-01", "From", "To")).toEqual({
      field: "requested_to",
      message: "To must be after From",
    });
  });

  it("returns null if from equals to", () => {
    expect(dateRange("2025-01-01", "2025-01-01", "From", "To")).toEqual({
      field: "requested_to",
      message: "To must be after From",
    });
  });

  it("returns null for missing values", () => {
    expect(dateRange(null, "2025-01-01", "From", "To")).toBeNull();
    expect(dateRange("2025-01-01", undefined, "From", "To")).toBeNull();
  });
});

describe("validateEligibility", () => {
  it("returns valid when no past training", () => {
    expect(validateEligibility({ past_training: false })).toEqual({ valid: true, errors: [] });
  });

  it("returns error when past training is true", () => {
    expect(validateEligibility({ past_training: true })).toEqual({
      valid: false,
      errors: [{ field: "past_training", message: "Candidate has already undergone training previously" }],
    });
  });
});

describe("validateApplicationForm", () => {
  it("returns errors for missing required fields", () => {
    const result = validateApplicationForm({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(12);
  });

  it("returns valid for properly filled application", () => {
    const data = {
      student_surname: "Doe",
      student_name: "John",
      student_father_name: "Robert",
      student_email: "john@example.com",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      year_of_study: 3,
      semester: 6,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
    };
    const result = validateApplicationForm(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns email error for invalid email", () => {
    const data = {
      student_surname: "Doe",
      student_name: "John",
      student_father_name: "Robert",
      student_email: "not-an-email",
      student_mobile: "9876543210",
      categoryId: 1,
      branchId: 1,
      year_of_study: 3,
      semester: 6,
      collegeId: 1,
      requested_from: "2025-06-01",
      requested_to: "2025-08-01",
    };
    const result = validateApplicationForm(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "student_email")).toBe(true);
  });
});

describe("validateBiodataForm", () => {
  it("returns errors for missing local and permanent address", () => {
    const result = validateBiodataForm({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("returns valid for complete biodata", () => {
    const data = {
      local_address: "123 Local St",
      permanent_address: "456 Permanent Ave",
    };
    const result = validateBiodataForm(data);
    expect(result.valid).toBe(true);
  });
});

describe("validatePermissionLetter", () => {
  it("returns errors for empty permission letter data", () => {
    const result = validatePermissionLetter({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });

  it("returns valid for complete permission letter data", () => {
    const data = {
      permission_letter_ref: "PL/2025/001",
      permission_letter_date: "2025-06-01",
      posting_department_id: 2,
    };
    const result = validatePermissionLetter(data);
    expect(result.valid).toBe(true);
  });
});

describe("getFieldError", () => {
  it("returns error message for matching field", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    expect(getFieldError(errors, "name")).toBe("Name is required");
  });

  it("returns undefined for non-matching field", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    expect(getFieldError(errors, "email")).toBeUndefined();
  });
});

describe("getErrorSummary", () => {
  it("returns null for no errors", () => {
    expect(getErrorSummary([])).toBeNull();
  });

  it("returns single error message for one error", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    expect(getErrorSummary(errors)).toBe("Name is required");
  });

  it("returns count for multiple errors", () => {
    const errors = [
      { field: "name", message: "Name is required" },
      { field: "email", message: "Email is required" },
    ];
    expect(getErrorSummary(errors)).toBe("2 errors found. Please check the form fields highlighted in red.");
  });
});

describe("hasFieldError", () => {
  it("returns true when field has error", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    expect(hasFieldError(errors, "name")).toBe(true);
  });

  it("returns false when field has no error", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    expect(hasFieldError(errors, "email")).toBe(false);
  });
});
