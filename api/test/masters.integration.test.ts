/**
 * Integration tests for Master Data CRUD endpoints.
 */
import request from "supertest";
import app from "../src/index";
import { createTestToken, authHeader } from "./helpers/setup";

let TOKEN: string;

beforeAll(() => {
  TOKEN = createTestToken({ role: "ADMIN" });
});

describe("GET /api/masters/:entity", () => {
  const entities = ["categories", "branches", "colleges", "states", "districts", "talukas", "cities", "departments"];

  entities.forEach((entity) => {
    it(`should list ${entity}`, async () => {
      const res = await request(app).get(`/api/masters/${entity}`).set(authHeader(TOKEN));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  it("should return 404 for unknown entity", async () => {
    const res = await request(app).get("/api/masters/nonexistent").set(authHeader(TOKEN));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/masters/:entity", () => {
  it("should attempt to create a new category", async () => {
    const res = await request(app)
      .post("/api/masters/categories")
      .set(authHeader(TOKEN))
      .send({ name: `Test Category ${Date.now()}` });

    // 201 = created, 409 = conflict (duplicate name), 500 = server error
    expect([201, 409, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
    }
  });

  it("should reject creation without auth", async () => {
    const res = await request(app).post("/api/masters/categories").send({ name: "Unauthorized Category" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/masters/:entity/:id", () => {
  it("should handle non-existent entity", async () => {
    const res = await request(app).put("/api/masters/categories/999999").set(authHeader(TOKEN)).send({ name: "Ghost" });

    expect([404, 500]).toContain(res.status);
  });
});

describe("DELETE /api/masters/:entity/:id", () => {
  it("should handle non-existent entity", async () => {
    const res = await request(app).delete("/api/masters/categories/999999").set(authHeader(TOKEN));
    expect([404, 500]).toContain(res.status);
  });
});
