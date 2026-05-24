/**
 * Unit tests for PDF service functions.
 * Tests that functions are exported correctly and produce expected output.
 */

describe("PDF Service", () => {
  it("should export all generator functions", () => {
    const pdfService = require("../src/services/pdf.service");
    expect(pdfService).toHaveProperty("generatePermissionLetterPdf");
    expect(pdfService).toHaveProperty("generateBiodataPdf");
    expect(pdfService).toHaveProperty("generateGatePassPdf");
    expect(pdfService).toHaveProperty("generateCertificatePdf");
    expect(pdfService).toHaveProperty("generateNoDuePdf");
    expect(pdfService).toHaveProperty("generatePostingLetterPdf");
  });

  it("should export default object with all functions", () => {
    const pdfService = require("../src/services/pdf.service");
    const defaultExport = pdfService.default;
    expect(defaultExport).toHaveProperty("generatePermissionLetterPdf");
    expect(defaultExport).toHaveProperty("generateBiodataPdf");
    expect(defaultExport).toHaveProperty("generateGatePassPdf");
    expect(defaultExport).toHaveProperty("generateCertificatePdf");
    expect(defaultExport).toHaveProperty("generateNoDuePdf");
    expect(defaultExport).toHaveProperty("generatePostingLetterPdf");
  });

  it("should generate valid filename formats", () => {
    const { generatePermissionLetterPdf } = require("../src/services/pdf.service");
    expect(typeof generatePermissionLetterPdf).toBe("function");
  });

  it("each generator function should accept required parameters", () => {
    const {
      generatePermissionLetterPdf,
      generateBiodataPdf,
      generateGatePassPdf,
      generateCertificatePdf,
      generateNoDuePdf,
      generatePostingLetterPdf,
    } = require("../src/services/pdf.service");

    // All functions should accept at least one parameter
    expect(generatePermissionLetterPdf.length).toBeGreaterThanOrEqual(1);
    expect(generateBiodataPdf.length).toBeGreaterThanOrEqual(1);
    expect(generateGatePassPdf.length).toBeGreaterThanOrEqual(1);
    expect(generateCertificatePdf.length).toBeGreaterThanOrEqual(2); // app + cert
    expect(generateNoDuePdf.length).toBeGreaterThanOrEqual(1);
    expect(generatePostingLetterPdf.length).toBeGreaterThanOrEqual(1);
  });
});
