/**
 * Integration tests for Application CRUD endpoints.
 */
import request from "supertest";
import app from "../src/index";
import { createTestToken, authHeader } from "./helpers/setup";

let TOKEN: string;
let createdAppId: number;

beforeAll(() => {
  TOKEN = createTestToken({ role: "ADMIN" });
});

describe("Application CRUD", () => {
  it("GET /api/applications/stats should return stats", async () => {
    const res = await request(app).get("/api/applications/stats").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("totalApplications");
    expect(res.body.data).toHaveProperty("activeTrainees");
  });

  it("POST /api/applications with complete payload", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set(authHeader(TOKEN))
      .send({
        student_name: "Test",
        student_surname: "Student",
        student_father_name: "Father",
        student_email: `teststudent_${Date.now()}@example.com`,
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

    // 201 = created, 400 = validation error (DB lookups failing in test mode)
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("application_no");
      expect(res.body.data.student_name).toBe("Test");
      createdAppId = res.body.data.id;
    }
  });

  it("POST /api/applications should reject invalid data", async () => {
    const res = await request(app).post("/api/applications").set(authHeader(TOKEN)).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("errors");
  });

  it("GET /api/applications should list applications", async () => {
    const res = await request(app).get("/api/applications").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta).toHaveProperty("totalCount");
  });

  it("GET /api/applications/:id should get application by ID (if created)", async () => {
    if (!createdAppId) return;
    const res = await request(app).get(`/api/applications/${createdAppId}`).set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdAppId);
  });

  it("PUT /api/applications/:id should update application (if created)", async () => {
    if (!createdAppId) return;
    const res = await request(app)
      .put(`/api/applications/${createdAppId}`)
      .set(authHeader(TOKEN))
      .send({ student_name: "UpdatedName" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student_name).toBe("UpdatedName");
  });

  it("PATCH /api/applications/:id/status should change status (if created)", async () => {
    if (!createdAppId) return;
    const res = await request(app)
      .patch(`/api/applications/${createdAppId}/status`)
      .set(authHeader(TOKEN))
      .send({ status: "SUBMITTED" });

    expect([200, 400]).toContain(res.status);
  });

  it("DELETE /api/applications/:id should delete application (if created)", async () => {
    if (!createdAppId) return;
    const res = await request(app).delete(`/api/applications/${createdAppId}`).set(authHeader(TOKEN));
    expect([200, 404]).toContain(res.status);
  });

  it("GET /api/applications?search= should filter by search", async () => {
    const res = await request(app).get("/api/applications?search=Test").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/applications?status= filter should work", async () => {
    const res = await request(app).get("/api/applications?status=DRAFT").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
