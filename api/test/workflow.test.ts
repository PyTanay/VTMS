import { canTransition, getValidTransitions } from "../src/services/workflow.service";

describe("canTransition", () => {
  // Valid transitions
  it("allows DRAFT -> SUBMITTED for APPLICANT", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "APPLICANT")).toBe(true);
  });

  it("allows DRAFT -> SUBMITTED for RECOMMENDING_EMPLOYEE", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "RECOMMENDING_EMPLOYEE")).toBe(true);
  });

  it("allows SUBMITTED -> PENDING_APPROVAL for ADMIN", () => {
    expect(canTransition("SUBMITTED", "PENDING_APPROVAL", "ADMIN")).toBe(true);
  });

  it("allows PENDING_APPROVAL -> APPROVED for ED_GM_APPROVER", () => {
    expect(canTransition("PENDING_APPROVAL", "APPROVED", "ED_GM_APPROVER")).toBe(true);
  });

  it("allows PENDING_APPROVAL -> REJECTED for ED_GM_APPROVER", () => {
    expect(canTransition("PENDING_APPROVAL", "REJECTED", "ED_GM_APPROVER")).toBe(true);
  });

  // Invalid transitions (wrong role)
  it("allows DRAFT -> SUBMITTED for ADMIN (admin override)", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "ADMIN")).toBe(true);
  });

  it("rejects SUBMITTED -> APPROVED for APPLICANT (not a direct step)", () => {
    expect(canTransition("SUBMITTED", "APPROVED", "APPLICANT")).toBe(false);
  });

  it("rejects APPROVED -> SUBMITTED (backwards transition) for non-ADMIN", () => {
    expect(canTransition("APPROVED", "SUBMITTED", "APPLICANT")).toBe(false);
  });

  it("rejects DRAFT -> APPROVED (skipping SUBMITTED) for APPLICANT", () => {
    expect(canTransition("DRAFT", "APPROVED", "APPLICANT")).toBe(false);
  });

  it("rejects SUBMITTED -> APPROVED for TRAINING_CENTER_SECTION_HEAD", () => {
    expect(canTransition("SUBMITTED", "APPROVED", "TRAINING_CENTER_SECTION_HEAD")).toBe(false);
  });

  // ADMIN always overrides
  it("allows any transition for ADMIN role (override)", () => {
    expect(canTransition("NO_DUES_PENDING", "CERTIFICATE_READY", "ADMIN")).toBe(true);
    expect(canTransition("REPORT_SUBMITTED", "TRAINING_COMPLETED", "ADMIN")).toBe(true);
    expect(canTransition("DRAFT", "CLOSED", "ADMIN")).toBe(true);
  });

  // Training Center flow transitions
  it("allows APPROVED -> RECEIVED_BY_TC for TRAINING_CENTER_SECTION_HEAD", () => {
    expect(canTransition("APPROVED", "RECEIVED_BY_TC", "TRAINING_CENTER_SECTION_HEAD")).toBe(true);
  });

  it("allows JOINING_PENDING -> DOCUMENTS_VERIFIED for TRAINING_CENTER_SECTION_HEAD", () => {
    expect(canTransition("JOINING_PENDING", "DOCUMENTS_VERIFIED", "TRAINING_CENTER_SECTION_HEAD")).toBe(true);
  });

  it("allows JOINING_PENDING -> BIODATA_COMPLETED for TRAINING_CENTER_SECTION_HEAD", () => {
    expect(canTransition("JOINING_PENDING", "BIODATA_COMPLETED", "TRAINING_CENTER_SECTION_HEAD")).toBe(true);
  });

  it("allows TRAINING_ACTIVE -> NO_DUES_PENDING for ADMIN", () => {
    expect(canTransition("TRAINING_ACTIVE", "NO_DUES_PENDING", "ADMIN")).toBe(true);
  });

  // Rejected transitions for ineligible roles
  it("rejects JOINING_PENDING -> DOCUMENTS_VERIFIED for TRAINING_IN_CHARGE", () => {
    expect(canTransition("JOINING_PENDING", "DOCUMENTS_VERIFIED", "TRAINING_IN_CHARGE")).toBe(false);
  });

  it("rejects JOINING_PENDING -> BIODATA_COMPLETED for TRAINING_IN_CHARGE", () => {
    expect(canTransition("JOINING_PENDING", "BIODATA_COMPLETED", "TRAINING_IN_CHARGE")).toBe(false);
  });
});

describe("getValidTransitions", () => {
  it("returns SUBMITTED as valid transition from DRAFT for APPLICANT", () => {
    const transitions = getValidTransitions("DRAFT", "APPLICANT");
    expect(transitions).toContain("SUBMITTED");
    expect(transitions).not.toContain("APPROVED");
  });

  it("returns multiple valid transitions from PENDING_APPROVAL for ED_GM_APPROVER", () => {
    const transitions = getValidTransitions("PENDING_APPROVAL", "ED_GM_APPROVER");
    expect(transitions).toContain("APPROVED");
    expect(transitions).toContain("REJECTED");
  });

  it("returns all possible transitions from a status for ADMIN", () => {
    const transitions = getValidTransitions("APPROVED", "ADMIN");
    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions).toContain("REJECTED");
    expect(transitions).toContain("RECEIVED_BY_TC");
  });

  it("returns empty array for invalid starting status", () => {
    const transitions = getValidTransitions("INVALID_STATUS", "APPLICANT");
    expect(transitions).toEqual([]);
  });

  it("returns empty array when role has no valid transitions from a status", () => {
    const transitions = getValidTransitions("PENDING_APPROVAL", "APPLICANT");
    expect(transitions).toEqual([]);
  });

  it("returns RECEIVED_BY_TC from APPROVED for TRAINING_CENTER_SECTION_HEAD", () => {
    const transitions = getValidTransitions("APPROVED", "TRAINING_CENTER_SECTION_HEAD");
    expect(transitions).toContain("RECEIVED_BY_TC");
  });
});
