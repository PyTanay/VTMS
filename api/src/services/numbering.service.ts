import prisma from "../prisma";

export const getFinancialYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, 3 = April
  // Financial year is Apr-Mar, so from April onwards it's the next FY
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

export const getShortFinancialYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `${year.toString().slice(-2)}${(year + 1).toString().slice(-2)}`;
  }
  return `${(year - 1).toString().slice(-2)}${year.toString().slice(-2)}`;
};

// Fetch branch code from master (short code derived from branch name)
const getBranchCode = async (branchId?: number): Promise<string> => {
  if (!branchId) return "XX";
  try {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return "XX";
    // Extract first 2 uppercase letters from branch name
    const code = branch.branch_name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    return code || "XX";
  } catch {
    return "XX";
  }
};

// Get the next serial number for a given prefix and financial year
const getNextSerial = async (prefix: string, fy: string): Promise<string> => {
  // Use a simple approach: count existing records with matching pattern
  const pattern = `${prefix}${fy}-`;
  // For application_no pattern: APP-{FY_SHORT}-{BRANCH}-{SERIAL}
  // We count by matching prefix
  return "1"; // fallback — actual counting is done per-function
};

const padSerial = (num: number, width: number = 4): string => {
  return String(num).padStart(width, "0");
};

export const generateApplicationNo = async (branchId?: number): Promise<string> => {
  const fy = getShortFinancialYear();
  const branchCode = await getBranchCode(branchId);
  const prefix = `APP${fy}${branchCode}`;

  // Count existing applications with this prefix pattern
  const existingCount = await prisma.application.count({
    where: { application_no: { startsWith: prefix } },
  });
  const seq = padSerial(existingCount + 1, 5);

  return `${prefix}${seq}`;
};

export const generatePermissionLetterRef = async (branchId?: number): Promise<string> => {
  const fy = getShortFinancialYear();
  const branchCode = await getBranchCode(branchId);
  const prefix = `PL${fy}${branchCode}`;

  const existingCount = await prisma.application.count({
    where: { permission_letter_ref: { startsWith: prefix } },
  });
  const seq = padSerial(existingCount + 1, 4);

  return `${prefix}${seq}`;
};

export const generateCertificateRef = async (): Promise<string> => {
  const fy = getShortFinancialYear();
  const prefix = `CERT${fy}`;

  const existingCount = await prisma.certificate.count({
    where: { certificate_ref: { startsWith: prefix } },
  });
  const seq = padSerial(existingCount + 1, 4);

  return `${prefix}${seq}`;
};

export const generateNoDueRef = async (): Promise<string> => {
  const fy = getShortFinancialYear();
  const prefix = `ND${fy}`;

  const existingCount = await prisma.noDueForm.count({
    where: { no_due_ref: { startsWith: prefix } },
  });
  const seq = padSerial(existingCount + 1, 4);

  return `${prefix}${seq}`;
};

export default { getFinancialYear, generateApplicationNo, generatePermissionLetterRef, generateCertificateRef, generateNoDueRef };
