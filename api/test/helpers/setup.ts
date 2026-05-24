/**
 * Test setup helpers for integration tests.
 * Provides utilities for generating test auth tokens.
 */

/**
 * Get the JWT secret used by the application.
 * The secret is loaded into process.env when ../src/index.ts calls dotenv.config().
 * We try to read it from process.env with a fallback.
 */
export function getJwtSecret(): string {
  return process.env.JWT_SECRET || "test-secret-key-min-32-chars-long!!";
}

export function createTestToken(overrides?: Partial<{ id: number; username: string; role: string; employeeId: number | null }>) {
  const jwt = require("jsonwebtoken");
  const payload = {
    id: overrides?.id ?? 99999,
    username: overrides?.username ?? "testadmin",
    role: overrides?.role ?? "ADMIN",
    employeeId: overrides?.employeeId ?? null,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export default { createTestToken, authHeader, getJwtSecret };
