import PDFDocument from "pdfkit";
import { uploadsDir, uploadsBaseUrl } from "../config/storage";
import fs from "fs";
import path from "path";

/** Add GNFC letterhead to any PDF — with 40mm (~113pt) top space for physical letterhead */
const addGnfcHeader = (doc: PDFKit.PDFDocument) => {
  const leftMargin = 50;
  const rightMargin = 50;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // ── Letterhead Space (40mm ≈ 113pt) ──
  const letterheadSpaceBottom = 115;
  const headerTextY = letterheadSpaceBottom - 80;

  doc
    .fontSize(6)
    .fillColor("#ccc")
    .font("Helvetica")
    .text("40mm letterhead space", leftMargin, letterheadSpaceBottom - 12, { width: contentWidth, align: "center" });

  // ── GNFC Logo ──
  try {
    const logoPath = path.join(__dirname, "../../gnfc_logo_wotext.svg");
    if (fs.existsSync(logoPath)) {
      const svgContent = fs.readFileSync(logoPath, "utf-8");
      doc.image(svgContent, leftMargin, headerTextY, { fit: [40, 40] });
    }
  } catch {
    /* Logo not available */
  }

  // ── Company details ──
  doc
    .fontSize(11)
    .fillColor("#1a237e")
    .font("Helvetica-Bold")
    .text("GUJARAT NARMADA VALLEY FERTILIZERS & CHEMICALS LTD.", leftMargin + 45, headerTextY, {
      width: contentWidth - 45,
      align: "left",
    });
  let yPos = doc.y;
  doc
    .fontSize(7.5)
    .fillColor("#444")
    .font("Helvetica")
    .text("(A Government of Gujarat Undertaking)", leftMargin + 45, yPos + 2, { width: contentWidth - 45, align: "left" });
  yPos = doc.y;
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text("CIN: L24110GJ1976PLC002667  |  GST: 24AAACG2574B1Z1", leftMargin + 45, yPos + 2, {
      width: contentWidth - 45,
      align: "left",
    });
  yPos = doc.y;
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text("P.O. Narmadanagar 392 015, Dist. Bharuch, Gujarat", leftMargin + 45, yPos + 2, { width: contentWidth - 45, align: "left" });
  yPos = doc.y;
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text("Phone: (02642) 232700  |  Website: www.gnfc.in  |  Email: training@gnfc.in", leftMargin + 45, yPos + 2, {
      width: contentWidth - 45,
      align: "left",
    });

  const separatorY = letterheadSpaceBottom + 5;
  doc.rect(leftMargin, separatorY, contentWidth, 1.5).fill("#1a237e");
  doc.fillColor("#000");
  return separatorY;
};

// ═══════════════════════════════════════════════════
// 1. PERMISSION LETTER PDF — All SOP Fields
// ═══════════════════════════════════════════════════
export const generatePermissionLetterPdf = async (application: any, options?: { ref?: string }) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const filename = `permission_letter_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  const separatorY = addGnfcHeader(doc);
  doc.y = separatorY + 20;

  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("PERMISSION LETTER", { align: "center" });
  doc.moveDown(0.3);
  doc.rect(60, doc.y, doc.page.width - 120, 1.5).fill("#1a237e");
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor("#000").font("Helvetica");
  doc.text(`Ref: ${options?.ref || "N/A"}`, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}`, {
    align: "right",
  });
  doc.moveDown(1.5);

  // Addressee
  doc.font("Helvetica-Bold").text("To,");
  doc.font("Helvetica").fontSize(10);
  doc.text("The Principal / Training & Placement Officer");
  doc.text(application.college?.college_name || "____________________");
  const collegeAddr = [application.college?.college_address, application.college?.city, application.college?.district]
    .filter(Boolean)
    .join(", ");
  doc.text(collegeAddr || "");
  doc.text(application.college?.pincode ? `Pincode: ${application.college.pincode}` : "");
  doc.text(`College Website: ${application.college_website || "N/A"}`);
  doc.text(`Email: ${application.college_hod_email || application.college?.email || "N/A"}`);
  doc.moveDown(1);

  // Subject
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(10.5);
  doc.text(`Subject: Permission for Vocational Training — ${application.student_name || ""} ${application.student_surname || ""}`);
  doc.moveDown(0.3);
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(10);

  doc.text("Dear Sir/Madam,");
  doc.moveDown(0.5);
  doc.text(
    `With reference to your application letter Ref: ${application.college_letter_ref || "N/A"} dated ${application.college_letter_date ? new Date(application.college_letter_date).toLocaleDateString("en-IN") : "N/A"}, ` +
      `we are pleased to grant permission for vocational training to the following student:`,
  );
  doc.moveDown(0.8);

  // Student Details Table
  const tblTop = doc.y;
  const c1 = 50,
    c2 = 210,
    rH = 20;
  doc.rect(40, tblTop, doc.page.width - 80, rH).fill("#1a237e");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9.5);
  doc.text("Particulars", c1 + 5, tblTop + 5);
  doc.text("Details", c2 + 5, tblTop + 5);
  doc.fillColor("#000").font("Helvetica").fontSize(9);

  const rows = [
    ["Application No", application.application_no || "N/A"],
    ["Student Name", `${application.student_name || ""} ${application.student_surname || ""}`],
    ["Father's Name", application.student_father_name || "-"],
    ["Category", application.category?.name || "-"],
    ["Branch / Discipline", application.branch?.branch_name || "-"],
    ["Year / Semester", `Year ${application.year_of_study || "-"} / Semester ${application.semester || "-"}`],
    ["College", application.college?.college_name || "-"],
    ["College Application Ref", application.college_letter_ref || "N/A"],
    [
      "College Letter Date",
      application.college_letter_date ? new Date(application.college_letter_date).toLocaleDateString("en-IN") : "N/A",
    ],
    [
      "Requested Period",
      `${application.requested_from ? new Date(application.requested_from).toLocaleDateString("en-IN") : "___"} to ${application.requested_to ? new Date(application.requested_to).toLocaleDateString("en-IN") : "___"}`,
    ],
    [
      "Approved Period",
      `${application.approved_from ? new Date(application.approved_from).toLocaleDateString("en-IN") : "___"} to ${application.approved_to ? new Date(application.approved_to).toLocaleDateString("en-IN") : "___"}`,
    ],
    ["Posting Department", application.posting_department?.department_name || "To be assigned"],
  ];
  rows.forEach((r, i) => {
    const y = tblTop + rH + i * rH;
    if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, rH).fill("#f5f5f5");
    doc.fillColor("#000").text(r[0], c1 + 5, y + 5);
    doc.text(r[1], c2 + 5, y + 5);
  });

  doc.y = tblTop + rH + rows.length * rH + 15;
  doc.moveDown(0.5);
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(1);

  // Training In-Charge
  doc.font("Helvetica-Bold").fontSize(10).text("Training In-Charge:");
  doc.font("Helvetica").fontSize(10);
  doc.text(application.scrutiny_in_charge?.name || application.training_in_charge_name || "____________________");
  doc.text("Training Center, GNFC Ltd., Narmadanagar");
  doc.moveDown(1);

  // Attachments
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(10).text("Enclosures:");
  doc.font("Helvetica").fontSize(9.5);
  doc.text("1. Annexure 1 — College HOD Endorsement (signed & stamped)");
  doc.text("2. Annexure 2 — Student Undertaking (signed by student & HOD)");
  doc.text("3. Acknowledgement Letter");
  doc.text("4. Terms & Conditions for Vocational Training");
  doc.moveDown(1.5);

  doc.text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.moveDown(0.5);

  doc.rect(30, doc.page.height - 50, doc.page.width - 60, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 30, doc.page.height - 45, { align: "center", width: doc.page.width - 60 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

// ═══════════════════════════════════════════════════
// 2. BIODATA PDF — All SOP Fields (academic, family, relatives, sports)
// ═══════════════════════════════════════════════════
export const generateBiodataPdf = async (application: any) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const filename = `biodata_${application.application_no || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  const sy = addGnfcHeader(doc);
  doc.y = sy + 20;
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("BIODATA / JOINING FORM", { align: "center" });
  doc.moveDown(0.3);
  doc.rect(60, doc.y, doc.page.width - 120, 1.5).fill("#1a237e");
  doc.moveDown(1.5);

  const bd = application.biodata || {};
  const C = 42,
    rH = 16;

  const section = (title: string) => {
    doc.fontSize(10).fillColor("#1a237e").font("Helvetica-Bold").text(title, C);
    doc.moveDown(0.2);
    doc.rect(C, doc.y, doc.page.width - 84, 0.5).fill("#1a237e");
    doc.moveDown(0.3);
    doc.fontSize(8.5).fillColor("#000").font("Helvetica");
  };

  // A: Joining Info
  section("A: Joining Information");
  [
    [
      "Student Name",
      `${application.student_name || ""} ${application.student_surname || ""}`,
      "App No",
      application.application_no || "N/A",
    ],
    [
      "Father's Name",
      application.student_father_name || "-",
      "Joining Date",
      bd.joining_date ? new Date(bd.joining_date).toLocaleDateString() : "___",
    ],
    [
      "Training Period",
      `${application.approved_from ? new Date(application.approved_from).toLocaleDateString() : "___"} to ${application.approved_to ? new Date(application.approved_to).toLocaleDateString() : "___"}`,
      "College",
      application.college?.college_name || "-",
    ],
  ].forEach((r, i) => {
    if (i % 2 === 0) doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#f5f5f5");
    doc.text(r[0], C + 3, doc.y + 3, { width: 70 });
    doc.text(r[1], C + 75, doc.y + 3, { width: 100 });
    doc.text(r[2], C + 185, doc.y + 3, { width: 65 });
    doc.text(r[3] || "", C + 255, doc.y + 3, { width: 150 });
    doc.y += rH;
  });
  doc.moveDown(0.3);

  // B: Personal Details
  section("B: Personal Details");
  [
    ["Title", application.student_title || "-", "Surname", application.student_surname || ""],
    [
      "Student Name",
      application.student_name || "",
      "Son/Daughter",
      application.son_daughter === true ? "Son" : application.son_daughter === false ? "Daughter" : "-",
    ],
    ["Relation", application.relation || "-", "Category", application.category?.name || "-"],
    ["Caste", bd.caste || "-", "Blood Group", bd.blood_group || "-"],
    ["Height(cm)", bd.height_cm || "-", "Weight(kg)", bd.weight_kg || "-"],
    ["DOB", bd.dob ? new Date(bd.dob).toLocaleDateString() : "-", "Gender", bd.gender || "-"],
    ["Mobile", application.student_mobile || "-", "Email", application.student_email || "-"],
    ["Alt Contact", bd.alternate_contact || "-", "Emergency", bd.emergency_contact || "-"],
    ["Disability", bd.challenge ? "Yes" : "No", "Details", bd.challenge_details || "-"],
  ].forEach((r, i) => {
    if (i % 2 === 0) doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#f5f5f5");
    doc.text(r[0], C + 3, doc.y + 3, { width: 70 });
    doc.text(r[1], C + 75, doc.y + 3, { width: 100 });
    doc.text(r[2], C + 185, doc.y + 3, { width: 65 });
    doc.text(r[3] || "", C + 255, doc.y + 3, { width: 150 });
    doc.y += rH;
  });
  doc
    .fontSize(9)
    .fillColor("#333")
    .font("Helvetica-Bold")
    .text(`Local Address: ${bd.local_address || "-"}`, C, doc.y + 2);
  doc.y += rH;
  doc.text(`Permanent Address: ${bd.permanent_address || "-"}`, C, doc.y + 2);
  doc.moveDown(0.3);

  // C: Academic Details
  section("C: Academic Details (from SSCE)");
  const academics = Array.isArray(bd.academics) ? bd.academics : [];
  if (academics.length > 0) {
    doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#1a237e");
    doc.fillColor("#fff").fontSize(7.5).font("Helvetica-Bold");
    doc.text("Sr", C + 2, doc.y + 4, { width: 18 });
    doc.text("Exam", C + 22, doc.y + 4, { width: 55 });
    doc.text("Board/Univ", C + 80, doc.y + 4, { width: 60 });
    doc.text("Year", C + 145, doc.y + 4, { width: 30 });
    doc.text("Percent", C + 180, doc.y + 4, { width: 40 });
    doc.text("Div", C + 225, doc.y + 4, { width: 30 });
    doc.text("Subject", C + 260, doc.y + 4, { width: 120 });
    doc.y += rH;
    doc.fillColor("#000").font("Helvetica").fontSize(7.5);
    academics.forEach((a: any, i: number) => {
      if (i % 2 === 0) doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#f5f5f5");
      doc.text(`${i + 1}`, C + 2, doc.y + 4);
      doc.text(a.exam_name || "-", C + 22, doc.y + 4);
      doc.text(a.board_university || "-", C + 80, doc.y + 4);
      doc.text(a.year ? String(a.year) : "-", C + 145, doc.y + 4);
      doc.text(a.percentage ? `${a.percentage}%` : "-", C + 180, doc.y + 4);
      doc.text(a.division || "-", C + 225, doc.y + 4);
      doc.text(a.subject || "-", C + 260, doc.y + 4);
      doc.y += rH;
    });
  } else doc.fontSize(8).text("No academic records entered.", C);
  doc.moveDown(0.3);

  if (bd.previous_trainings) {
    doc.fontSize(9).fillColor("#333").font("Helvetica-Bold").text(`Previous Trainings: ${bd.previous_trainings}`);
    doc.moveDown(0.2);
  }

  // D: Sports
  if (bd.sports_activities || bd.extra_curricular) {
    section("D: Sports & Extra-Curricular");
    doc.text(bd.sports_activities ? `Sports: ${bd.sports_activities}` : "");
    doc.text(bd.extra_curricular ? `Awards: ${bd.extra_curricular}` : "");
    doc.moveDown(0.3);
  }

  // E: Family
  section("E: Family Background");
  const family = Array.isArray(bd.family_members) ? bd.family_members : [];
  if (family.length > 0) {
    doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#1a237e");
    doc.fillColor("#fff").fontSize(7.5).font("Helvetica-Bold");
    doc.text("Name", C + 3, doc.y + 4, { width: 90 });
    doc.text("Relation", C + 105, doc.y + 4, { width: 65 });
    doc.text("Age", C + 180, doc.y + 4, { width: 25 });
    doc.text("Occupation", C + 215, doc.y + 4, { width: 80 });
    doc.text("Mobile", C + 305, doc.y + 4, { width: 80 });
    doc.y += rH;
    doc.fillColor("#000").font("Helvetica").fontSize(7.5);
    family.forEach((m: any, i: number) => {
      if (i % 2 === 0) doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#f5f5f5");
      doc.text(m.name || "-", C + 3, doc.y + 4, { width: 90 });
      doc.text(m.relation || "-", C + 105, doc.y + 4, { width: 65 });
      doc.text(m.age ? String(m.age) : "-", C + 180, doc.y + 4, { width: 25 });
      doc.text(m.occupation || "-", C + 215, doc.y + 4, { width: 80 });
      doc.text(m.mobile || "-", C + 305, doc.y + 4, { width: 80 });
      doc.y += rH;
    });
  } else doc.fontSize(8).text("No family records entered.", C);
  doc.moveDown(0.3);

  // F: GNFC Relatives
  section("F: Relatives / Known Persons in GNFC");
  const relatives = Array.isArray(bd.gnfc_relatives) ? bd.gnfc_relatives : [];
  if (relatives.length > 0) {
    doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#1a237e");
    doc.fillColor("#fff").fontSize(7.5).font("Helvetica-Bold");
    doc.text("Name", C + 3, doc.y + 4, { width: 90 });
    doc.text("Relation", C + 105, doc.y + 4, { width: 65 });
    doc.text("EC No", C + 185, doc.y + 4, { width: 55 });
    doc.text("Department", C + 250, doc.y + 4, { width: 100 });
    doc.y += rH;
    doc.fillColor("#000").font("Helvetica").fontSize(7.5);
    relatives.forEach((r: any, i: number) => {
      if (i % 2 === 0) doc.rect(C, doc.y, doc.page.width - 84, rH).fill("#f5f5f5");
      doc.text(r.name || "-", C + 3, doc.y + 4, { width: 90 });
      doc.text(r.relation || "-", C + 105, doc.y + 4, { width: 65 });
      doc.text(r.employee_no || "-", C + 185, doc.y + 4, { width: 55 });
      doc.text(r.department || "-", C + 250, doc.y + 4, { width: 100 });
      doc.y += rH;
    });
  } else doc.fontSize(8).text("No GNFC relatives entered.", C);
  doc.moveDown(0.5);

  doc.rect(C, doc.y, doc.page.width - 84, 0.5).fill("#ccc");
  doc.moveDown(0.3);
  doc.fontSize(8.5).font("Helvetica-Bold").text("Student Declaration");
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .text("I hereby declare that all information above is true. I agree to abide by GNFC rules and regulations.");
  doc.moveDown(1);
  doc.text("Student's Signature: ___________________   Date: ___________", { align: "right" });
  doc.moveDown(0.3);

  doc.rect(30, doc.page.height - 50, doc.page.width - 60, 1).fill("#ccc");
  doc
    .fontSize(7.5)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 30, doc.page.height - 45, { align: "center", width: doc.page.width - 60 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

// ═══════════════════════════════════════════════════
// 3. GATE PASS PDF — Front & Back with all fields
// ═══════════════════════════════════════════════════
export const generateGatePassPdf = async (application: any) => {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
  const filename = `gate_pass_${application.application_no || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  const bd = application.biodata || {};
  doc.pipe(writeStream);

  // ── FRONT PAGE ──
  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("GATE PASS", { align: "center" });
  doc.moveDown(0.3);
  doc.rect(60, doc.y, doc.page.width - 120, 1.5).fill("#1a237e");
  doc.moveDown(1.5);

  doc.fontSize(9).fillColor("#000").font("Helvetica");
  doc.text(`Gate Pass No: ${application.gate_pass_no || application.application_no || "TBD"}`, { align: "right" });
  doc.text(
    `Valid Up To: ${application.gate_pass_valid_up_to ? new Date(application.gate_pass_valid_up_to).toLocaleDateString() : "TBD"}`,
    { align: "right" },
  );
  doc.moveDown(1);

  // Photo placeholder
  if (bd.photo_path) {
    try {
      doc.image(bd.photo_path, doc.page.width - 120, doc.y - 20, { fit: [60, 70] });
    } catch {}
  } else {
    doc.rect(doc.page.width - 110, doc.y - 20, 80, 90).stroke("#ccc");
    doc
      .fontSize(7)
      .fillColor("#999")
      .text("Photo", doc.page.width - 95, doc.y + 10);
  }

  const GC = 30,
    G2 = 120,
    GR = 17;
  const gDetails = [
    ["App No", application.application_no || "N/A"],
    ["Trainee Name", `${application.student_name || ""} ${application.student_surname || ""}`],
    ["Father's Name", application.student_father_name || "-"],
    ["Blood Group", bd.blood_group || "-"],
    ["Qualification", application.branch?.branch_name || "-"],
    ["College", application.college?.college_name || "-"],
    ["Posting Dept", application.posting_department?.department_name || "-"],
    ["Joining Date", application.joining_date ? new Date(application.joining_date).toLocaleDateString() : "___"],
    ["Valid Up To", application.gate_pass_valid_up_to ? new Date(application.gate_pass_valid_up_to).toLocaleDateString() : "___"],
    ["Mobile", application.student_mobile || "-"],
  ];
  gDetails.forEach((d, i) => {
    if (i % 2 === 0) doc.rect(GC, doc.y, doc.page.width - 50, GR).fill("#f5f5f5");
    doc
      .fillColor("#000")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(d[0], GC + 3, doc.y + 3, { width: 80 });
    doc.font("Helvetica").text(d[1], G2 + 3, doc.y + 3, { width: doc.page.width - G2 - 40 });
    doc.y += GR;
  });
  doc.moveDown(1);
  doc.fontSize(9).text("___________________________", { align: "right" });
  doc.text("Trainee's Signature", { align: "right" });

  // ── BACK PAGE ──
  doc.addPage();
  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("IMPORTANT INSTRUCTIONS", { align: "center" });
  doc.moveDown(0.5);
  doc.rect(60, doc.y, doc.page.width - 120, 1).fill("#1a237e");
  doc.moveDown(1.5);
  doc.fontSize(10).fillColor("#000").font("Helvetica");
  [
    "1. Valid only during the specified training period.",
    "2. Present to security at every entry/exit point.",
    "3. Do not share or transfer this pass.",
    "4. Report loss/damage immediately to Training Center.",
    "5. Return this pass upon training completion.",
    "6. Follow all safety, security & plant discipline protocols.",
    "7. Unauthorized use may result in disciplinary action.",
    "8. Entry into restricted areas without authorization is prohibited.",
  ].forEach((i) => doc.text(i, { lineGap: 4 }));
  doc.moveDown(2);
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.fontSize(9).text("Holder's Name: _________________   Signature: _________________", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(10).text("Authorized Signatory", { align: "right" });
  doc.rect(30, doc.page.height - 50, doc.page.width - 60, 1).fill("#ccc");
  doc
    .fontSize(7.5)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 30, doc.page.height - 45, { align: "center", width: doc.page.width - 60 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

// ═══════════════════════════════════════════════════
// 4. CERTIFICATE PDF — All SOP fields
// ═══════════════════════════════════════════════════
export const generateCertificatePdf = async (application: any, certificate: any) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const filename = `certificate_${certificate.certificate_ref || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(4);
  doc.rect(80, doc.y, doc.page.width - 160, 2).fill("#1a237e");
  doc.moveDown(2);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("CERTIFICATE OF COMPLETION", { align: "center" });
  doc.moveDown(0.5);
  doc.rect(120, doc.y, doc.page.width - 240, 1).fill("#1a237e");
  doc.moveDown(2);
  doc.fontSize(11.5).fillColor("#000").font("Helvetica");
  doc.text(`This is to certify that ${application.student_name || ""} ${application.student_surname || ""}`, { align: "center" });
  doc.text(`of ${application.college?.college_name || "____"}, ${application.branch?.branch_name || "____"}`, { align: "center" });
  doc.text("has successfully completed the vocational training programme", { align: "center" });
  doc.text("as per the guidelines of Gujarat Narmada Valley Fertilizers & Chemicals Ltd.", { align: "center" });
  doc.moveDown(1.5);

  // Details
  const CT = doc.y;
  const CC1 = 80,
    CC2 = 200,
    CR = 18;
  const cRows = [
    ["Certificate No", certificate.certificate_ref || "N/A"],
    ["Student Name", `${application.student_name || ""} ${application.student_surname || ""}`],
    ["Institute", application.college?.college_name || "-"],
    ["Course / Branch", application.branch?.branch_name || "-"],
    ["Year / Semester", `Year ${application.year_of_study || "-"} / Sem ${application.semester || "-"}`],
    ["Study Department", application.study_department || "-"],
    ["Project Title", certificate.project_title || "-"],
    [
      "Training Period",
      `${application.approved_from ? new Date(application.approved_from).toLocaleDateString() : "___"} to ${application.approved_to ? new Date(application.approved_to).toLocaleDateString() : "___"}`,
    ],
    [
      "Actual Completion Date",
      certificate.actual_completion_date ? new Date(certificate.actual_completion_date).toLocaleDateString() : "___",
    ],
    [
      "Report Submission Date",
      certificate.report_submission_date ? new Date(certificate.report_submission_date).toLocaleDateString() : "___",
    ],
    ["Behaviour During Training", certificate.behavioral_rating || "N/A"],
    ["Progress During Training", certificate.progress_rating || "N/A"],
    ["Remarks", certificate.remarks || "-"],
  ];
  cRows.forEach((r, i) => {
    const y = CT + i * CR;
    if (i % 2 === 0) doc.rect(50, y, doc.page.width - 100, CR).fill("#f5f5f5");
    doc
      .fillColor("#000")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(r[0], 55, y + 4, { width: 140 });
    doc.font("Helvetica").text(r[1], CC1 + 5, y + 4, { width: doc.page.width - CC1 - 60 });
  });
  doc.y = CT + cRows.length * CR + 10;

  if (certificate.is_duplicate) {
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#dc2626").text("**[DUPLICATE CERTIFICATE]**", { align: "center" });
    doc
      .fillColor("#000")
      .fontSize(9)
      .text(`Approved By: ${certificate.duplicate_approved_by || "-"}  |  Reason: ${certificate.duplicate_reason || "-"}`, {
        align: "center",
      });
  }
  doc.moveDown(2);
  doc.fontSize(10.5).text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.moveDown(0.5);
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 40, doc.page.height - 45, { align: "center", width: doc.page.width - 80 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

// ═══════════════════════════════════════════════════
// 5. NO DUE PDF — Full clearance form
// ═══════════════════════════════════════════════════
export const generateNoDuePdf = async (noDueForm: any) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const filename = `no_due_${noDueForm.no_due_ref}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("NO DUES CLEARANCE FORM", { align: "center" });
  doc.moveDown(0.3);
  doc.rect(60, doc.y, doc.page.width - 120, 1.5).fill("#1a237e");
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor("#000").font("Helvetica");
  doc.text(`Reference: ${noDueForm.no_due_ref}`, { align: "right" });
  doc.text(`Date: ${noDueForm.created_at ? new Date(noDueForm.created_at).toLocaleDateString() : new Date().toLocaleDateString()}`, {
    align: "right",
  });
  doc.moveDown(1);

  // Trainee Details
  const app = noDueForm.application || {};
  const bd = app.biodata || {};
  const ND = 42,
    N2 = 180,
    NR = 17;
  doc.fontSize(9.5).fillColor("#1a237e").font("Helvetica-Bold").text("Trainee Details", ND);
  doc.moveDown(0.2);
  doc.rect(ND, doc.y, doc.page.width - 84, 0.5).fill("#1a237e");
  doc.moveDown(0.3);
  doc.fontSize(8.5).fillColor("#000").font("Helvetica");
  [
    ["Trainee Name", `${app.student_name || ""} ${app.student_surname || ""}`, "App No", app.application_no || "N/A"],
    [
      "Father's Name",
      app.student_father_name || "-",
      "Training Period",
      `${app.approved_from ? new Date(app.approved_from).toLocaleDateString() : "___"} to ${app.approved_to ? new Date(app.approved_to).toLocaleDateString() : "___"}`,
    ],
    ["Posting Dept", app.posting_department?.department_name || "-", "Blood Group", bd.blood_group || "-"],
    ["Training In-Charge", noDueForm.training_in_charge || "-", "Dept Head", noDueForm.department_head || "-"],
  ].forEach((r, i) => {
    if (i % 2 === 0) doc.rect(ND, doc.y, doc.page.width - 84, NR).fill("#f5f5f5");
    doc.text(r[0], ND + 3, doc.y + 3, { width: 75 });
    doc.text(r[1], ND + 80, doc.y + 3, { width: 95 });
    doc.text(r[2], N2 + 5, doc.y + 3, { width: 80 });
    doc.text(r[3] || "", N2 + 90, doc.y + 3, { width: 120 });
    doc.y += NR;
  });
  doc.moveDown(0.5);

  // Clearance Items
  doc.fontSize(9.5).fillColor("#1a237e").font("Helvetica-Bold").text("Clearance Items", ND);
  doc.moveDown(0.2);
  doc.rect(ND, doc.y, doc.page.width - 84, 0.5).fill("#1a237e");
  doc.moveDown(0.3);

  const lines = Array.isArray(noDueForm.lines) ? noDueForm.lines : [];
  if (lines.length > 0) {
    doc.rect(ND, doc.y, doc.page.width - 84, NR).fill("#1a237e");
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    doc.text("Sr", ND + 3, doc.y + 4, { width: 20 });
    doc.text("Clearance Item", ND + 30, doc.y + 4, { width: 200 });
    doc.text("Status", ND + 250, doc.y + 4, { width: 60 });
    doc.text("Cleared On", ND + 320, doc.y + 4, { width: 70 });
    doc.text("Remarks", ND + 400, doc.y + 4, { width: 80 });
    doc.y += NR;
    doc.fillColor("#000").font("Helvetica").fontSize(8);
    lines.forEach((line: any, i: number) => {
      if (i % 2 === 0) doc.rect(ND, doc.y, doc.page.width - 84, NR).fill("#f5f5f5");
      doc.text(`${i + 1}.`, ND + 3, doc.y + 4, { width: 20 });
      doc.text(line.item_name || "-", ND + 30, doc.y + 4, { width: 200 });
      doc.text(line.cleared ? "✓ CLEARED" : "✗ PENDING", ND + 250, doc.y + 4, { width: 60 });
      doc.text(line.cleared && line.cleared_at ? new Date(line.cleared_at).toLocaleDateString() : "-", ND + 320, doc.y + 4, {
        width: 70,
      });
      doc.text(line.remarks || "-", ND + 400, doc.y + 4, { width: 80 });
      doc.y += NR;
    });
  } else doc.fontSize(8).text("No clearance items defined.", ND);

  doc.moveDown(1);
  doc.rect(ND, doc.y, doc.page.width - 84, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  if (noDueForm.status === "CLEARED") {
    doc.fontSize(11).fillColor("#16a34a").text("✓ ALL DUES CLEARED");
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000").text("Certified that the above trainee has no outstanding dues with the organization.");
  } else {
    doc.fontSize(11).fillColor("#dc2626").text("⚠ SOME ITEMS PENDING — Clearance incomplete.");
  }
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#000").text("Training In-Charge Signature: ___________________", { align: "right" });
  doc.text("Date: ___________", { align: "right" });
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 40, doc.page.height - 45, { align: "center", width: doc.page.width - 80 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

// ═══════════════════════════════════════════════════
// 6. POSTING LETTER PDF — All SOP fields
// ═══════════════════════════════════════════════════
export const generatePostingLetterPdf = async (letter: any) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const filename = `posting_letter_${letter.ref_no}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("POSTING LETTER", { align: "center" });
  doc.moveDown(0.3);
  doc.rect(60, doc.y, doc.page.width - 120, 1.5).fill("#1a237e");
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor("#000").font("Helvetica");
  doc.text(`Reference: ${letter.ref_no}`, { align: "right" });
  doc.text(
    `Date: ${letter.created_at ? new Date(letter.created_at).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}`,
    { align: "right" },
  );
  doc.moveDown(1.5);

  doc.font("Helvetica-Bold").text("To,");
  doc.font("Helvetica").fontSize(10);
  doc.text(letter.to_report_to ? `The ${letter.to_report_to}` : "The Department Head / In-Charge");
  doc.text(letter.posting_department || "____________________");
  doc.text("GNFC Ltd., Narmadanagar");
  doc.moveDown(1);

  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(10.5);
  doc.text("Subject: Posting of Trainees for Vocational Training");
  doc.moveDown(0.3);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(10);

  doc.text("Dear Sir/Madam,");
  doc.moveDown(0.5);
  doc.text("The following trainees are hereby posted to your department for vocational training as per details below:");
  doc.moveDown(0.8);

  // Details
  const PC = 45,
    P2 = 200,
    PR = 18;
  doc.rect(40, doc.y, doc.page.width - 80, PR).fill("#1a237e");
  doc.fillColor("#fff").fontSize(9).font("Helvetica-Bold");
  doc.text("Particulars", PC + 3, doc.y + 4);
  doc.text("Details", P2 + 3, doc.y + 4);
  doc.y += PR;
  doc.fillColor("#000").font("Helvetica").fontSize(9);

  const pRows: [string, string][] = [
    ["Qualification/Branch", letter.qualification_branch || "-"],
    ["College", `${letter.college_short_name || ""}, ${letter.college_place || ""}`],
    ["Posting Department", letter.posting_department || "-"],
    ["Report To", letter.to_report_to || "-"],
    ["Training In-Charge", letter.training_in_charge || "-"],
    ["Department Head", letter.department_head || "-"],
    ["Scheduled Days", letter.selected_weekdays || "Mon-Fri"],
  ];
  pRows.forEach((r, i) => {
    if (i % 2 === 0) doc.rect(40, doc.y, doc.page.width - 80, PR).fill("#f5f5f5");
    doc.text(r[0], PC + 3, doc.y + 4, { width: 140 });
    doc.text(r[1], P2 + 3, doc.y + 4, { width: doc.page.width - P2 - 50 });
    doc.y += PR;
  });

  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(9.5).text("List of Trainees:");
  doc.font("Helvetica").fontSize(9);
  doc.moveDown(0.3);

  if (Array.isArray(letter.students)) {
    letter.students.forEach((student: any, i: number) => {
      doc.text(
        `${i + 1}. ${student.application?.student_name || ""} ${student.application?.student_surname || ""} (${student.application?.application_no || "N/A"})`,
      );
    });
  }
  doc.moveDown(1);
  doc.text("Please ensure trainees report on time and follow all safety procedures as per GNFC guidelines.");
  doc.moveDown(1);

  // Training Schedule
  doc.font("Helvetica-Bold").fontSize(9.5).text("Training Days:");
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(letter.selected_weekdays_verbose || letter.selected_weekdays || "Monday to Friday");
  doc.moveDown(0.5);
  if (letter.reporting_officer_email) doc.text(`Reporting Officer Email: ${letter.reporting_officer_email}`);
  doc.moveDown(1.5);

  doc.text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.text("GNFC Ltd., Narmadanagar", { align: "right" });
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("Computer-generated document issued by VTMS.", 40, doc.page.height - 45, { align: "center", width: doc.page.width - 80 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
  return { path: filePath, url: `${uploadsBaseUrl}/${filename}`, filename };
};

export default {
  generatePermissionLetterPdf,
  generateBiodataPdf,
  generateGatePassPdf,
  generateCertificatePdf,
  generateNoDuePdf,
  generatePostingLetterPdf,
};
