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

  it("handles April 1st correctly (start of FY)", () => {
    const d = new Date("2025-04-01");
    expect(getFinancialYear(d)).toBe("2025-26");
  });

  it("handles March 31st correctly (end of FY)", () => {
    const d = new Date("2026-03-31");
    expect(getFinancialYear(d)).toBe("2025-26");
  });

  it("returns correct FY for edge year 2029-30", () => {
    const d = new Date("2029-04-01");
    expect(getFinancialYear(d)).toBe("2029-30");
  });

  it("returns correct FY for February 2030", () => {
    const d = new Date("2030-02-15");
    expect(getFinancialYear(d)).toBe("2029-30");
  });

  it("uses current date when no argument provided", () => {
    const result = getFinancialYear();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
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

  it("returns 2930 for April 2029", () => {
    const d = new Date("2029-04-01");
    expect(getShortFinancialYear(d)).toBe("2930");
  });

  it("returns 3031 for March 2031", () => {
    const d = new Date("2031-03-15");
    expect(getShortFinancialYear(d)).toBe("3031");
  });

  it("uses current date when no argument provided", () => {
    const result = getShortFinancialYear();
    expect(result).toMatch(/^\d{4}$/);
  });
});
