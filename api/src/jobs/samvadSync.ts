import cron from "node-cron";
import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import prisma from "../prisma";

const MAX_RETRIES = 3;
const EMPLOYEE_DEFAULT_PASSWORD = process.env.EMPLOYEE_DEFAULT_PASSWORD || "gnfc123";
const CREATE_EMPLOYEE_USERS = process.env.CREATE_EMPLOYEE_USERS === "true";

const normalizeLabel = (text: string) =>
  text
    .replace(/\s*:\s*$/, "")
    .trim()
    .toLowerCase();

const extractText = ($: cheerio.CheerioAPI, selectors: string[]) => {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;
    }
  }
  return "";
};

const extractFieldValue = ($: cheerio.CheerioAPI, labels: string[]) => {
  const normalizedLabels = labels.map(normalizeLabel);

  for (const label of normalizedLabels) {
    const row = $("tr")
      .filter((_, el) => {
        const texts = $(el)
          .find("td, th")
          .map((_, cell) => normalizeLabel($(cell).text()))
          .get();
        return texts.some((text) => text === label);
      })
      .first();

    if (row.length) {
      const cells = row.find("td, th");
      for (let index = 0; index < cells.length; index++) {
        const cell = cells.eq(index);
        if (normalizeLabel(cell.text()) === label && index + 1 < cells.length) {
          return cells
            .eq(index + 1)
            .text()
            .trim();
        }
      }
    }

    const td = $("td")
      .filter((_, el) => normalizeLabel($(el).text()) === label)
      .first();
    if (td.length) {
      const nextCell = td.next("td");
      if (nextCell.length) return nextCell.text().trim();

      const cells = td.closest("tr").find("td");
      if (cells.length > 1) {
        return cells.eq(1).text().trim();
      }
    }
  }
  return "";
};

const fetchEmployeeDetails = async (empId: number, retryCount = 0): Promise<any | null> => {
  try {
    const url = `http://egnfc/isdweb/telecom/TEmpDetails.aspx?EmpId=${empId}`;
    const response = await axios.get(url, {
      timeout: 10000,
      // If NTLM/Windows Auth is needed, custom axios agents might be required here later.
    });

    const $ = cheerio.load(response.data);

    const fullName = extractText($, [
      "#CPHolderContent_lblShortName",
      "#CPHolderContent_lblFName",
      "#CPHolderContent_lblMName",
      "#CPHolderContent_lblLName",
    ]);

    const firstName = extractText($, ["#CPHolderContent_lblFName"]);
    const middleName = extractText($, ["#CPHolderContent_lblMName"]);
    const lastName = extractText($, ["#CPHolderContent_lblLName"]);
    const name = fullName || [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

    const department =
      extractText($, ["#CPHolderContent_lblDepartment", "#CPHolderContent_lblSubDepartment", "#CPHolderContent_lblLocation"]) ||
      extractFieldValue($, ["Department", "Dept", "Sub Department", "Location"]);
    const designation = extractText($, ["#CPHolderContent_lblDesignation"]) || extractFieldValue($, ["Designation", "Desig"]);
    const email =
      extractText($, ['a[href^="mailto:"]']).replace(/^mailto:/i, "") || extractFieldValue($, ["Email", "Official Email", "E-mail"]);

    if (!name) {
      return null;
    }

    return {
      employee_no: empId.toString(),
      name,
      department: department || "Unknown",
      designation: designation || "Employee",
      email: email || `${empId}@gnfc.in`,
      active: true,
    };
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retry ${retryCount + 1} for EmpId ${empId}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchEmployeeDetails(empId, retryCount + 1);
    }
    console.error(`Failed to fetch details for EmpId ${empId} after ${MAX_RETRIES} retries:`, error.message);
    return null;
  }
};

const ensureEmployeeUser = async (employee: any, hashedPassword: string, allowCreate = true) => {
  const existingUser = await prisma.user.findUnique({ where: { employeeId: employee.id } });
  if (existingUser) {
    if (existingUser.email !== employee.email) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { email: employee.email || `${employee.employee_no}@gnfc.in` },
      });
    }
    return false;
  }

  if (!allowCreate) {
    return false;
  }

  const username = employee.employee_no;
  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) {
    if (!existingByUsername.employeeId || existingByUsername.email !== employee.email) {
      await prisma.user.update({
        where: { id: existingByUsername.id },
        data: {
          employeeId: employee.id,
          email: employee.email || `${employee.employee_no}@gnfc.in`,
        },
      });
    }
    return false;
  }

  await prisma.user.create({
    data: {
      username,
      email: employee.email || `${employee.employee_no}@gnfc.in`,
      password: hashedPassword,
      role: "RECOMMENDING_EMPLOYEE",
      employeeId: employee.id,
    },
  });

  return true;
};

export const runSyncJob = async () => {
  console.log("Starting SAMVAD Employee Sync...");
  let updatedCount = 0;
  let createdUserCount = 0;

  const hashedPassword = CREATE_EMPLOYEE_USERS ? await bcrypt.hash(EMPLOYEE_DEFAULT_PASSWORD, 10) : "";

  const BATCH_SIZE = 50;
  for (let i = 1; i <= 12000; i += BATCH_SIZE) {
    const batchPromises = [];
    for (let j = i; j < i + BATCH_SIZE && j <= 12000; j++) {
      batchPromises.push(fetchEmployeeDetails(j));
    }

    const batchResults = await Promise.all(batchPromises);

    for (const emp of batchResults) {
      if (emp) {
        try {
          const savedEmployee = await prisma.employee.upsert({
            where: { employee_no: emp.employee_no },
            update: {
              name: emp.name,
              department: emp.department,
              designation: emp.designation,
              email: emp.email,
              active: true,
            },
            create: emp,
          });
          updatedCount++;

          const created = await ensureEmployeeUser(savedEmployee, hashedPassword, CREATE_EMPLOYEE_USERS);
          if (created) {
            createdUserCount++;
          }
        } catch (dbError: any) {
          console.error(`DB upsert error for EmpId ${emp.employee_no}:`, dbError.message);
        }
      }
    }

    if ((i - 1 + BATCH_SIZE) % 1000 === 0) {
      console.log(`Processed up to EmpId ${i - 1 + BATCH_SIZE}`);
    }
  }

  console.log(`SAMVAD Employee Sync completed. Updated ${updatedCount} records. Created ${createdUserCount} employee users.`);

  return {
    updatedCount,
    createdUserCount,
    createEmployeeUsers: CREATE_EMPLOYEE_USERS,
  };
};

export const scheduleSamvadSync = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Running nightly SAMVAD sync job at 2 AM...");
    await runSyncJob();
  });
};
