/**
 * Integration tests for Report endpoints.
 */
import request from "supertest";
import app from "../src/index";
import { createTestToken, authHeader } from "./helpers/setup";

let TOKEN: string;

beforeAll(() => {
  TOKEN = createTestToken({ role: "ADMIN" });
});

describe("GET /api/reports", () => {
  it("should list available reports", async () => {
    const res = await request(app).get("/api/reports").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should have at least 10 reports
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
  });
});

describe("Report Endpoints (sample)", () => {
  const reports = [
    { route: "application-register", label: "Application Register" },
    { route: "approved", label: "Approved" },
    { route: "permissions", label: "Permissions Given" },
    { route: "branch-wise", label: "Branch Wise" },
    { route: "college-wise", label: "College Wise" },
    { route: "incharge-wise", label: "In-Charge Wise" },
    { route: "dept-posting", label: "Department Wise Posting" },
    { route: "recommended-by", label: "Recommended by Employee" },
    { route: "other-references", label: "Other References" },
    { route: "employee-children", label: "Employee's Son/Daughter" },
    { route: "training-during-fy", label: "Training During Financial Year" },
  ];

  reports.forEach(({ route, label }) => {
    it(`GET /api/reports/${route} should return ${label} data`, async () => {
      const res = await request(app).get(`/api/reports/${route}`).set(authHeader(TOKEN));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it(`GET /api/reports/${route} should accept date filters`, async () => {
      const res = await request(app).get(`/api/reports/${route}?from=2026-01-01&to=2026-12-31`).set(authHeader(TOKEN));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe("CSV Export", () => {
  it("should export CSV via query parameter", async () => {
    const res = await request(app).get("/api/reports/application-register?format=csv").set(authHeader(TOKEN));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
  });
});

describe("Error handling", () => {
  it("should return 404 for unknown report type", async () => {
    const res = await request(app).get("/api/reports/nonexistent-report").set(authHeader(TOKEN));
    expect(res.status).toBe(404);
  });
});
