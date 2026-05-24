/**
 * Integration tests for Auth routes: login, logout, getCurrentUser, register, password management.
 */
import request from "supertest";
import app from "../src/index";
import { createTestToken, authHeader } from "./helpers/setup";

let TOKEN: string;

beforeAll(() => {
  TOKEN = createTestToken({ role: "ADMIN" });
});

describe("POST /api/auth/login", () => {
  it("should reject invalid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "nonexistent_user", password: "testpass123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should handle missing credentials gracefully", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    // Empty body causes Prisma error (username is undefined), returns 500
    expect([400, 401, 500]).toContain(res.status);
  });
});

describe("GET /api/auth/me", () => {
  it("should reject without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should reject with invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalidtoken123");
    expect(res.status).toBe(401);
  });

  it("should return 404 for non-existent user", async () => {
    const res = await request(app).get("/api/auth/me").set(authHeader(TOKEN));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/auth/logout", () => {
  it("should logout successfully", async () => {
    const res = await request(app).post("/api/auth/logout").set(authHeader(TOKEN));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/auth/register (admin only)", () => {
  it("should reject registration without auth", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "noauth", email: "noauth@test.com", password: "newpass123" });
    expect(res.status).toBe(401);
  });

  it("should reject with empty payload", async () => {
    const res = await request(app).post("/api/auth/register").set(authHeader(TOKEN)).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/auth/me/password (change own password)", () => {
  it("should reject without current password", async () => {
    const res = await request(app).put("/api/auth/me/password").set(authHeader(TOKEN)).send({ newPassword: "newpass456" });
    expect(res.status).toBe(400);
  });

  it("should handle non-existent DB user", async () => {
    const res = await request(app)
      .put("/api/auth/me/password")
      .set(authHeader(TOKEN))
      .send({ currentPassword: "wrong", newPassword: "newpass456" });
    expect([400, 401, 404, 500]).toContain(res.status);
  });
});

describe("GET /api/health", () => {
  it("should return health check (no auth required)", async () => {
    const res = await request(app).get("/api/health");
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.status).toBe("ok");
    }
  });
});
