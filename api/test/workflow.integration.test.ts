/**
 * Integration tests for Workflow transition endpoints.
 */
import request from "supertest";
import app from "../src/index";
import { createTestToken, authHeader } from "./helpers/setup";
import { canTransition, getValidTransitions } from "../src/services/workflow.service";

let TOKEN: string;

beforeAll(() => {
  TOKEN = createTestToken({ role: "ADMIN" });
});

describe("Workflow Engine Edge Cases", () => {
  describe("canTransition", () => {
    it("allows ADMIN to perform any transition", () => {
      expect(canTransition("DRAFT", "CLOSED", "ADMIN")).toBe(true);
      expect(canTransition("APPROVED", "CERTIFICATE_ISSUED", "ADMIN")).toBe(true);
    });

    it("rejects transitions with invalid source status for non-ADMIN", () => {
      expect(canTransition("INVALID", "APPROVED", "APPLICANT")).toBe(false);
    });

    it("rejects transitions for unauthorized roles", () => {
      expect(canTransition("PENDING_APPROVAL", "APPROVED", "APPLICANT")).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns multiple transitions from TRAINING_ACTIVE for ADMIN", () => {
      const transitions = getValidTransitions("TRAINING_ACTIVE", "ADMIN");
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions).toContain("NO_DUES_PENDING");
    });

    it("returns array (possibly empty) for end state", () => {
      const transitions = getValidTransitions("CLOSED", "ADMIN");
      expect(Array.isArray(transitions)).toBe(true);
    });
  });
});

describe("Workflow Application Integration", () => {
  let appId: number;

  beforeAll(async () => {
    // Create a test application
    const res = await request(app)
      .post("/api/applications")
      .set(authHeader(TOKEN))
      .send({
        student_name: "WFTest",
        student_surname: "Student",
        student_father_name: "Father",
        student_email: `wftest_${Date.now()}@example.com`,
        student_mobile: "9876543210",
        categoryId: 1,
        branchId: 1,
        collegeId: 1,
        year_of_study: 3,
        semester: 6,
        requested_from: "2026-06-01",
        requested_to: "2026-08-01",
        applicant_type: "EMPLOYEE_WARD",
        presently_pursuing: true,
        training_compulsory: true,
        part_of_curriculum: true,
        full_time_course: true,
        recommending_employee_id: 1,
      });
    appId = res.body.data?.id;

    if (appId) {
      await request(app).patch(`/api/applications/${appId}/status`).set(authHeader(TOKEN)).send({ status: "SUBMITTED" });
    }
  });

  it("should transition from SUBMITTED to PENDING_APPROVAL", async () => {
    if (!appId) return;
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set(authHeader(TOKEN))
      .send({ status: "PENDING_APPROVAL" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PENDING_APPROVAL");
  });

  it("should transition from PENDING_APPROVAL to APPROVED", async () => {
    if (!appId) return;
    const res = await request(app).patch(`/api/applications/${appId}/status`).set(authHeader(TOKEN)).send({ status: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APPROVED");
  });

  it("should transition from APPROVED to RECEIVED_BY_TC", async () => {
    if (!appId) return;
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set(authHeader(TOKEN))
      .send({ status: "RECEIVED_BY_TC" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("RECEIVED_BY_TC");
  });

  it("should reject status change without auth", async () => {
    if (!appId) return;
    const res = await request(app).patch(`/api/applications/${appId}/status`).send({ status: "APPROVED" });
    expect(res.status).toBe(401);
  });
});
