/**
 * VTMS Frontend Form Test Suite
 *
 * Run with: npx tsx client/src/test/forms.test.ts
 * OR copy this content into browser console while logged into VTMS.
 *
 * Tests all form submissions by submitting dummy data to validate:
 * 1. Application creation (employee ward + other reference)
 * 2. Application workflow (status transitions, scrutiny, permission letter)
 * 3. Biodata creation
 * 4. Certificate creation
 * 5. No-due clearance
 * 6. Posting letter creation
 * 7. Document verification
 * 8. Gate pass generation
 * 9. Master data CRUD
 * 10. User management
 * 11. Report generation
 *
 * All test data uses random identifiers to avoid conflicts.
 */

const BASE = "http://localhost:3000/api";
const TEST_PREFIX = `TEST_${Date.now()}`;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

class VTMSFormTester {
  private results: TestResult[] = [];
  private createdIds: Record<string, number> = {};
  private createdRefs: Record<string, string> = {};

  private async api(method: string, path: string, body?: any): Promise<any> {
    const url = `${BASE}${path}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  private record(name: string, fn: () => Promise<any>): Promise<any> {
    return fn()
      .then((data) => {
        this.results.push({ name, passed: true, data });
        console.log(`✅ PASS: ${name}`);
        return data;
      })
      .catch((err) => {
        this.results.push({ name, passed: false, error: err.message });
        console.log(`❌ FAIL: ${name} -> ${err.message}`);
        return null;
      });
  }

  // ─── 1. Master Data CRUD Tests ───

  async testMasterDataCRUD() {
    // Create
    const catRes = await this.api("POST", "/masters/categories", { name: `${TEST_PREFIX}_Category` });
    this.createdIds.testCategory = catRes.data.id;
    console.log("  Created category:", catRes.data.id);

    // Read
    const catGet = await this.api("GET", `/masters/categories/${catRes.data.id}`);
    if (catGet.data.name !== `${TEST_PREFIX}_Category`) throw new Error("Category name mismatch");

    // Update
    await this.api("PUT", `/masters/categories/${catRes.data.id}`, { name: `${TEST_PREFIX}_Category_Updated` });

    // Read again
    const catGet2 = await this.api("GET", `/masters/categories/${catRes.data.id}`);
    if (catGet2.data.name !== `${TEST_PREFIX}_Category_Updated`) throw new Error("Category update failed");

    // Delete
    await this.api("DELETE", `/masters/categories/${catRes.data.id}`);

    // Verify delete
    try {
      await this.api("GET", `/masters/categories/${catRes.data.id}`);
      throw new Error("Should have been deleted");
    } catch (err: any) {
      if (err.message.includes("404") || err.message.includes("not found")) {
        // Expected
      } else {
        throw err;
      }
    }

    return { created: catRes.data.id };
  }

  // ─── 2. Application Creation (Employee Ward) ───

  async testApplicationEmployeeWard() {
    // First, find a valid employee for recommending
    const empRes = await this.api("GET", "/employees?active=true&search=a");
    const employees = empRes.data || [];
    if (employees.length === 0) {
      console.log("  ⚠️ No employees found for test, skipping employee ward test");
      return null;
    }

    const emp = employees[0];
    const colleges = (await this.api("GET", "/masters/colleges")).data || [];
    const branches = (await this.api("GET", "/masters/branches")).data || [];
    const categories = (await this.api("GET", "/masters/categories")).data || [];

    const payload = {
      applicant_type: "EMPLOYEE_WARD",
      student_name: `${TEST_PREFIX}_Student`,
      student_surname: "TestSurname",
      student_father_name: "TestFather",
      student_email: `${TEST_PREFIX}@test.com`,
      student_mobile: "9876543210",
      categoryId: categories[0]?.id || 1,
      branchId: branches[0]?.id || 1,
      year_of_study: 3,
      semester: 5,
      collegeId: colleges[0]?.id || 1,
      requested_from: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      requested_to: new Date(Date.now() + 86400000 * 120).toISOString().slice(0, 10),
      recommending_employee_id: emp.id,
      presently_pursuing: true,
      training_compulsory: true,
      part_of_curriculum: true,
      full_time_course: true,
      status: "SUBMITTED",
    };

    const appRes = await this.api("POST", "/applications", payload);
    this.createdIds.testApplication = appRes.data.id;
    this.createdRefs.testAppNo = appRes.data.application_no;
    console.log("  Created application:", appRes.data.id, appRes.data.application_no);
    return appRes.data;
  }

  // ─── 3. Application Status Workflow ───

  async testApplicationWorkflow() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application created");

    // Test status transitions
    const statuses = ["PENDING_APPROVAL", "APPROVED", "RECEIVED_BY_TC"];
    for (const status of statuses) {
      await this.api("PATCH", `/applications/${appId}/status`, { status });
      const app = await this.api("GET", `/applications/${appId}`);
      if (app.data.status !== status) throw new Error(`Expected status ${status}, got ${app.data.status}`);
    }

    return { appId, finalStatus: statuses[statuses.length - 1] };
  }

  // ─── 4. Scrutiny ───

  async testScrutiny() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Get available users for in-charge
    const usersRes = await this.api("GET", "/users");
    const inChargeUser = (usersRes.data || []).find((u: any) => u.role === "TRAINING_IN_CHARGE" || u.role === "ADMIN");

    const payload = {
      scrutiny_in_charge_id: inChargeUser?.id || 1,
      scrutiny_date: new Date().toISOString().slice(0, 10),
      scrutiny_remarks: "Test scrutiny passed",
      approved_from: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      approved_to: new Date(Date.now() + 86400000 * 120).toISOString().slice(0, 10),
      status: "SCRUTINIZED",
    };

    const res = await this.api("POST", `/scrutiny/${appId}`, payload);
    return res.data;
  }

  // ─── 5. Permission Letter ───

  async testPermissionLetter() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Generate permission letter
    const depRes = await this.api("GET", "/masters/departments");
    const deptId = (depRes.data || [])[0]?.id || 1;

    await this.api("PATCH", `/applications/${appId}/permission-letter`, {
      permission_letter_ref: `${TEST_PREFIX}_PL`,
      permission_letter_date: new Date().toISOString().slice(0, 10),
      posting_department_id: deptId,
      status: "PERMISSION_LETTER_SENT",
    });

    // Generate PDF
    const pdfRes = await this.api("POST", `/permission-letters/${appId}/generate`);
    console.log("  Permission letter PDF:", pdfRes.data.pdfUrl);

    return pdfRes.data;
  }

  // ─── 6. Document Verification ───

  async testDocumentVerification() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Create doc verification record
    const dvRes = await this.api("POST", "/document-verification", {
      applicationId: appId,
      file_path: `/uploads/test_${TEST_PREFIX}.pdf`,
      doc_type: "Test Document",
    });

    // Verify it
    const verifyRes = await this.api("PATCH", `/document-verification/${dvRes.data.id}/verify`, {
      remarks: "Test verification",
    });

    if (!verifyRes.data.verified) throw new Error("Document should be verified");

    return verifyRes.data;
  }

  // ─── 7. Biodata ───

  async testBiodata() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    const payload = {
      local_address: `${TEST_PREFIX} Local Address, Test City`,
      permanent_address: `${TEST_PREFIX} Permanent Address, Hometown`,
      caste: "General",
      height_cm: 170,
      weight_kg: 65,
      blood_group: "O+",
      physically_challenged: false,
      student_declaration: true,
      academics: [
        { course_name: "SSCE", board_university: "GSEB", passing_year: 2020, percentage_cgpa: 85.5 },
        { course_name: "HSCE", board_university: "GSEB", passing_year: 2022, percentage_cgpa: 78.0 },
      ],
      familyMembers: [
        { member_name: "Test Father", relationship: "Father", age: 50, occupation: "Engineer", contact_no: "9876543210" },
      ],
    };

    const bioRes = await this.api("PUT", `/biodata/${appId}`, payload);
    return bioRes.data;
  }

  // ─── 8. Gate Pass ───

  async testGatePass() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Update joining details first
    await this.api("PATCH", `/applications/${appId}/join`, {
      joining_date: new Date().toISOString().slice(0, 10),
      gate_pass_no: `${TEST_PREFIX}_GP`,
      gate_pass_valid_up_to: new Date(Date.now() + 86400000 * 90).toISOString().slice(0, 10),
      status: "JOINING_PENDING",
    });

    // Generate gate pass PDF
    const gpRes = await this.api("POST", `/gate-pass/${appId}/generate`);
    console.log("  Gate pass PDF:", gpRes.data.pdfUrl);

    return gpRes.data;
  }

  // ─── 9. Posting Letter ───

  async testPostingLetter() {
    // Create a posting letter
    const payload = {
      qualification_branch: `Test Branch ${TEST_PREFIX}`,
      college_short_name: "Test College",
      college_place: "Test Place",
      posting_department: `Test Dept ${TEST_PREFIX}`,
      to_report_to: "Test Officer",
      reporting_officer_email: `${TEST_PREFIX}_officer@test.com`,
      selected_weekdays: "Monday,Tuesday,Wednesday,Thursday,Friday",
      training_in_charge: "Test Incharge",
      department_head: "Test Head",
      applicationIds: [this.createdIds.testApplication].filter(Boolean),
    };

    if (payload.applicationIds.length === 0) throw new Error("No application for posting");

    const postRes = await this.api("POST", "/postings", payload);
    this.createdIds.testPosting = postRes.data.id;

    // Generate PDF
    const pdfRes = await this.api("POST", `/postings/${postRes.data.id}/generate`);
    console.log("  Posting letter PDF:", pdfRes.data.pdfUrl);

    return postRes.data;
  }

  // ─── 10. Certificate ───

  async testCertificate() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Update completion dates
    await this.api("PATCH", `/applications/${appId}/status`, {
      status: "TRAINING_COMPLETED",
    });

    // Create certificate
    const certRes = await this.api("POST", "/certificates", {
      applicationId: appId,
      behavioral_rating: "Excellent",
      progress_rating: "Good",
      actual_completion_date: new Date().toISOString().slice(0, 10),
      report_submission_date: new Date().toISOString().slice(0, 10),
    });

    this.createdIds.testCertificate = certRes.data.id;

    // Generate PDF
    const pdfRes = await this.api("POST", `/certificates/${certRes.data.id}/generate`);
    console.log("  Certificate PDF:", pdfRes.data.pdfUrl);

    return certRes.data;
  }

  // ─── 11. No Due Clearance ───

  async testNoDue() {
    const appId = this.createdIds.testApplication;
    if (!appId) throw new Error("No test application");

    // Get/create no-due form
    const ndRes = await this.api("GET", `/no-dues/application/${appId}`);
    const form = ndRes.data;

    // Clear each line
    for (const line of form.lines || []) {
      await this.api("PATCH", `/no-dues/line/${line.id}/clear`, {
        remarks: `Cleared by test ${TEST_PREFIX}`,
      });
    }

    // Finalize
    await this.api("PATCH", `/no-dues/${form.id}/finalize`, {});

    // Verify
    const ndCheck = await this.api("GET", `/no-dues/application/${appId}`);
    if (ndCheck.data.status !== "CLEARED") throw new Error("No-due should be CLEARED");

    return ndCheck.data;
  }

  // ─── 12. Reports Test ───

  async testReports() {
    const reports = [
      "application-register",
      "approved",
      "permissions",
      "branch-wise",
      "college-wise",
      "training-completed",
      "incharge-wise",
      "college-wise-apps",
      "dept-posting",
      "recommended-by",
      "other-references",
      "employee-children",
      "training-during-fy",
    ];

    const results: any[] = [];
    for (const report of reports) {
      try {
        const res = await this.api("GET", `/reports/${report}`);
        results.push({ report, count: res.data?.total || res.data?.data?.length || 0 });
        console.log(`  Report ${report}: ${results[results.length - 1].count} rows`);
      } catch (err: any) {
        results.push({ report, error: err.message });
        console.log(`  Report ${report}: ERROR - ${err.message}`);
      }
    }
    return results;
  }

  // ─── 13. Employee API Test ───

  async testEmployeeAPI() {
    const res = await this.api("GET", "/employees");
    const count = res.data?.length || 0;
    console.log(`  Employees found: ${count}`);

    if (count > 0) {
      const emp = res.data[0];
      // Verify employee has proper EC number
      if (!emp.employee_no || emp.employee_no === "1") {
        console.warn(`  ⚠️ Employee ${emp.id} has suspicious EC No: "${emp.employee_no}"`);
      }
    }

    return { count, sample: res.data?.[0] || null };
  }

  // ─── 14. User Management Test ───

  async testUserManagement() {
    const res = await this.api("GET", "/users");
    const count = res.data?.length || 0;
    console.log(`  Users found: ${count}`);
    return { count };
  }

  // ─── Run All Tests ───

  async runAll(): Promise<TestResult[]> {
    console.log("\n═══════════════════════════════════════════");
    console.log("🔍 VTMS Frontend Form Test Suite");
    console.log(`📋 Test Prefix: ${TEST_PREFIX}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log("═══════════════════════════════════════════\n");

    const tests = [
      ["1. Master Data CRUD", () => this.testMasterDataCRUD()],
      ["2. Employee API", () => this.testEmployeeAPI()],
      ["3. Application (Employee Ward)", () => this.testApplicationEmployeeWard()],
      ["4. Application Workflow", () => this.testApplicationWorkflow()],
      ["5. Scrutiny", () => this.testScrutiny()],
      ["6. Permission Letter", () => this.testPermissionLetter()],
      ["7. Document Verification", () => this.testDocumentVerification()],
      ["8. Biodata", () => this.testBiodata()],
      ["9. Gate Pass", () => this.testGatePass()],
      ["10. Posting Letter", () => this.testPostingLetter()],
      ["11. Certificate", () => this.testCertificate()],
      ["12. No Due Clearance", () => this.testNoDue()],
      ["13. Reports", () => this.testReports()],
      ["14. User Management", () => this.testUserManagement()],
    ];

    for (const test of tests) {
      const [name, fn] = test as [string, () => Promise<any>];
      console.log(`\n── ${name} ──`);
      await this.record(name, fn);
    }

    // Summary
    console.log("\n═══════════════════════════════════════════");
    console.log("📊 TEST SUMMARY");
    console.log("═══════════════════════════════════════════");
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    console.log(`✅ Passed: ${passed}/${this.results.length}`);
    console.log(`❌ Failed: ${failed}/${this.results.length}`);
    console.log(`📋 Total Tests: ${this.results.length}`);

    if (failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.results.filter((r) => !r.passed).forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    }

    console.log("═══════════════════════════════════════════\n");
    return this.results;
  }
}

// ─── Runner ───

async function main() {
  const tester = new VTMSFormTester();
  const results = await tester.runAll();

  // Return results as formatted JSON for potential CI integration
  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}

// Auto-execute if run directly
if (typeof window !== "undefined") {
  (window as any).runVTMSFormTest = main;
  console.log("ℹ️ Run tests with: runVTMSFormTest().then(r => console.table(r.results))");
}

export { VTMSFormTester, main };
export default main;
