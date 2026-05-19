import { getFinancialYear, getShortFinancialYear } from "../src/services/numbering.service";

describe("getFinancialYear", () => {
  it("returns 2025-26 for a date in April 2025", () => {
    const d = new Date("2025-04-15");
    expect(getFinancialYear(d)).toBe("2025-26");
  });

  it("returns 2025-26 for a date in March 2026", () => {
    const d = new Date("2026-03-15");
    expect(getFinancialYear(d)).toBe("2025-26");
  });

  it("returns 2026-27 for a date in December 2026", () => {
    const d = new Date("2026-12-15");
    expect(getFinancialYear(d)).toBe("2026-27");
  });

  it("returns 2024-25 for a date in January 2025", () => {
    const d = new Date("2025-01-15");
    expect(getFinancialYear(d)).toBe("2024-25");
  });
});

describe("getShortFinancialYear", () => {
  it("returns 2526 for April 2025", () => {
    const d = new Date("2025-04-01");
    expect(getShortFinancialYear(d)).toBe("2526");
  });

  it("returns 2425 for January 2025", () => {
    const d = new Date("2025-01-01");
    expect(getShortFinancialYear(d)).toBe("2425");
  });
});
