import PDFDocument from "pdfkit";
import { uploadsDir, uploadsBaseUrl } from "../config/storage";
import fs from "fs";
import path from "path";

/** Add GNFC letterhead to any PDF */
const addGnfcHeader = (doc: PDFKit.PDFDocument) => {
  const headerY = 30;
  // Top accent line
  doc.rect(30, headerY, doc.page.width - 60, 3).fill("#1a237e");
  doc
    .fontSize(14)
    .fillColor("#1a237e")
    .font("Helvetica-Bold")
    .text("GUJARAT NARMADA VALLEY FERTILIZERS & CHEMICALS LTD.", 30, headerY + 8, { align: "center", width: doc.page.width - 60 });
  doc
    .fontSize(8)
    .fillColor("#555")
    .font("Helvetica")
    .text("(A Government of Gujarat Undertaking)  |  CIN: L24110GJ1976PLC002667", { align: "center", width: doc.page.width - 60 });
  doc
    .fontSize(8)
    .fillColor("#555")
    .font("Helvetica")
    .text("P.O. Narmadanagar 392 015, Dist. Bharuch, Gujarat  |  Phone: (02642) 232700  |  www.gnfc.in", {
      align: "center",
      width: doc.page.width - 60,
    });
  // Bottom line of header
  const headerBottom = 72;
  doc.rect(30, headerBottom, doc.page.width - 60, 1).fill("#ccc");
  doc.fillColor("#000");
  return headerBottom;
};

export const generatePermissionLetterPdf = async (application: any, options?: { ref?: string }) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const filename = `permission_letter_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("PERMISSION LETTER", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(11).fillColor("#000").font("Helvetica");
  doc.text(`Ref: ${options?.ref || "N/A"}`, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}`, {
    align: "right",
  });
  doc.moveDown(1);
  doc.text(`To,`);
  doc.text(`${application.student_name} ${application.student_surname}`);
  doc.text(`${application.college?.college_name || ""}`);
  doc.moveDown(1);
  doc.text(`Application No: ${application.application_no}`);
  doc.text(`Subject: Permission for Vocational Training`);
  doc.moveDown(0.5);
  // Horizontal rule
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(1);
  doc.text("Dear Student,");
  doc.moveDown(0.5);
  doc.text("This is to inform you that permission is hereby granted for your vocational training as per the details mentioned below:");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").text("Training Details:");
  doc.font("Helvetica");
  doc.text(`• Permission Ref: ${options?.ref || "N/A"}`);
  doc.text(`• Issuance Date: ${new Date().toLocaleDateString("en-IN")}`);
  doc.moveDown(0.5);
  doc.text("Please present this letter at the training center for further processing.");
  doc.moveDown(2);
  doc.text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.moveDown(0.5);
  // Footer
  doc.rect(30, doc.page.height - 50, doc.page.width - 60, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("This is a computer-generated document. No signature is required.", 30, doc.page.height - 45, {
      align: "center",
      width: doc.page.width - 60,
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export const generateBiodataPdf = async (application: any) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const filename = `biodata_${application.application_no || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);
  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(16).fillColor("#1a237e").font("Helvetica-Bold").text("BIODATA / JOINING FORM", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(11).fillColor("#000").font("Helvetica");
  doc.text(`Application No: ${application.application_no}`);
  doc.text(`Name: ${application.student_name} ${application.student_surname}`);
  doc.text(`Father's Name: ${application.student_father_name}`);
  doc.text(`Email: ${application.student_email}`);
  doc.text(`Mobile: ${application.student_mobile}`);
  doc.moveDown(0.5);
  doc.rect(30, doc.y, doc.page.width - 60, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  const biodata = application.biodata || {};
  doc.text(`Local Address: ${biodata.local_address || "-"}`);
  doc.text(`Permanent Address: ${biodata.permanent_address || "-"}`);
  doc.text(`Caste: ${biodata.caste || "-"}`);
  doc.text(`Blood Group: ${biodata.blood_group || "-"}`);
  if (biodata.photo_path) doc.text(`Photo: ${biodata.photo_path}`);
  doc.moveDown(2);
  doc.text("Student's Signature", { align: "right" });
  doc.rect(30, doc.page.height - 50, doc.page.width - 60, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("This is a computer-generated document.", 30, doc.page.height - 45, { align: "center", width: doc.page.width - 60 });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export const generateGatePassPdf = async (application: any) => {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
  const filename = `gate_pass_${application.application_no || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  // Front page
  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("GATE PASS", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(12).fillColor("#000").font("Helvetica");
  doc.text(`Gate Pass No: ${application.gate_pass_no || "TBD"}`);
  doc.text(`Valid Up To: ${application.gate_pass_valid_up_to?.toString().slice(0, 10) || "TBD"}`);
  doc.moveDown(0.5);
  doc.rect(20, doc.y, doc.page.width - 40, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.text(`Trainee: ${application.student_name} ${application.student_surname}`);
  doc.text(`Application No: ${application.application_no}`);
  doc.text(`Mobile: ${application.student_mobile}`);
  doc.moveDown(0.5);
  doc.text(`College: ${application.college?.college_name || "-"}`);
  doc.text(`Joining Date: ${application.joining_date?.toString().slice(0, 10) || "TBD"}`);
  doc.moveDown(1);
  doc.fontSize(10).text("___________________________", { align: "right" });
  doc.text("Trainee's Signature", { align: "right" });

  doc.addPage();
  // Back page
  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(14).fillColor("#1a237e").font("Helvetica-Bold").text("IMPORTANT INSTRUCTIONS", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(10).fillColor("#000").font("Helvetica");
  const instructions = [
    "1. This gate pass is valid only during the specified training period.",
    "2. Present this pass to security personnel at every entry/exit point.",
    "3. Do not share or transfer this pass to any other person.",
    "4. In case of loss or damage, report immediately to the training center.",
    "5. This pass must be returned upon completion of training.",
    "6. Trainees must follow all safety and security protocols.",
    "7. Unauthorized use of this pass will result in disciplinary action.",
  ];
  instructions.forEach((inst) => doc.text(inst));
  doc.moveDown(1);
  doc.fontSize(10).text("___________________________", { align: "right" });
  doc.text("Authorized Signatory", { align: "right" });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export const generateCertificatePdf = async (application: any, certificate: any) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const filename = `certificate_${certificate.certificate_ref || application.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(4);
  // Decorative line
  doc.rect(80, doc.y, doc.page.width - 160, 2).fill("#1a237e");
  doc.moveDown(2);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("CERTIFICATE OF COMPLETION", { align: "center" });
  doc.moveDown(1);
  doc.rect(120, doc.y, doc.page.width - 240, 1).fill("#1a237e");
  doc.moveDown(2);
  doc.fontSize(12).fillColor("#000").font("Helvetica");
  doc.text(
    `This is to certify that ${application.student_name} ${application.student_surname} has successfully completed the vocational training programme as per the guidelines of Gujarat Narmada Valley Fertilizers & Chemicals Ltd.`,
    { align: "center" },
  );
  doc.moveDown(1.5);
  doc.text(`Certificate No: ${certificate.certificate_ref}`);
  doc.text(`Completion Date: ${certificate.actual_completion_date?.toString().slice(0, 10) || "N/A"}`);
  doc.text(`Behavioral Rating: ${certificate.behavioral_rating || "N/A"}`);
  doc.text(`Progress Rating: ${certificate.progress_rating || "N/A"}`);
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  if (certificate.is_duplicate) {
    doc.fontSize(10).fillColor("#dc2626").text("**[DUPLICATE CERTIFICATE]**", { align: "center" });
    doc
      .fontSize(10)
      .fillColor("#000")
      .text(`Approved By: ${certificate.duplicate_approved_by || "-"}`);
    doc.text(`Reason: ${certificate.duplicate_reason || "-"}`);
  }
  doc.moveDown(3);
  doc.fontSize(11).text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.moveDown(0.5);
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("This is a computer-generated document. No signature is required.", 40, doc.page.height - 45, {
      align: "center",
      width: doc.page.width - 80,
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export const generateNoDuePdf = async (noDueForm: any) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const filename = `no_due_${noDueForm.no_due_ref}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("NO DUES CERTIFICATE", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(11).fillColor("#000").font("Helvetica");
  doc.text(`Reference: ${noDueForm.no_due_ref}`);
  doc.text(`Application No: ${noDueForm.application?.application_no || "N/A"}`);
  doc.text(`Trainee: ${noDueForm.application?.student_name || ""} ${noDueForm.application?.student_surname || ""}`);
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.fontSize(14).text("Clearance Items", { underline: true });
  doc.moveDown(0.5);

  if (Array.isArray(noDueForm.lines)) {
    // Table header
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Sr.", 40, doc.y, { width: 30, continued: true });
    doc.text("Item", 70, doc.y, { width: 250, continued: true });
    doc.text("Status", 320, doc.y, { width: 100, continued: true });
    doc.text("Cleared On", 420, doc.y, { width: 120 });
    doc.font("Helvetica");
    doc.moveDown(0.5);
    doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ddd");
    doc.moveDown(0.3);

    noDueForm.lines.forEach((line: any, index: number) => {
      doc
        .fontSize(10)
        .text(`${index + 1}.`, 40, doc.y, { width: 30, continued: true })
        .text(line.item_name, 70, doc.y, { width: 250, continued: true })
        .text(line.cleared ? "✓ CLEARED" : "✗ PENDING", 320, doc.y, { width: 100, continued: true })
        .text(line.cleared && line.cleared_at ? new Date(line.cleared_at).toLocaleDateString() : "-", 420, doc.y, { width: 120 });
    });
  }

  doc.moveDown(1);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  if (noDueForm.status === "CLEARED") {
    doc.fontSize(12).fillColor("#16a34a").text("Status: ✓ ALL DUES CLEARED");
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor("#000")
      .text("This is to certify that the above trainee has no outstanding dues with the organization.");
  } else {
    doc.fontSize(12).fillColor("#dc2626").text("Status: ⚠ PENDING — Some items are yet to be cleared.");
  }

  doc.moveDown(2);
  doc.text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("This is a computer-generated document.", 40, doc.page.height - 45, { align: "center", width: doc.page.width - 80 });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export const generatePostingLetterPdf = async (letter: any) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const filename = `posting_letter_${letter.ref_no}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  addGnfcHeader(doc);
  doc.moveDown(3);
  doc.fontSize(18).fillColor("#1a237e").font("Helvetica-Bold").text("POSTING LETTER", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(11).fillColor("#000").font("Helvetica");
  doc.text(`Reference: ${letter.ref_no}`);
  doc.text(
    `Date: ${letter.created_at ? new Date(letter.created_at).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}`,
    { align: "right" },
  );
  doc.moveDown(1);
  doc.text("To,");
  doc.text("The Department Head / In-Charge");
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(1);
  doc.font("Helvetica-Bold").text("Subject: Posting of Trainees for Vocational Training");
  doc.moveDown(0.5);
  doc.font("Helvetica");
  doc.text(`Qualification / Branch: ${letter.qualification_branch}`);
  doc.text(`College: ${letter.college_short_name}, ${letter.college_place}`);
  doc.text(`Posting Department: ${letter.posting_department}`);
  doc.text(`Report To: ${letter.to_report_to}`);
  doc.text(`Training In-Charge: ${letter.training_in_charge}`);
  doc.text(`Department Head: ${letter.department_head}`);
  doc.text(`Scheduled Days: ${letter.selected_weekdays}`);
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 0.5).fill("#ccc");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").text("List of Trainees:");
  doc.font("Helvetica");
  doc.moveDown(0.3);

  if (Array.isArray(letter.students)) {
    letter.students.forEach((student: any, index: number) => {
      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${student.application?.student_name} ${student.application?.student_surname} (${student.application?.application_no})`,
        );
    });
  }

  doc.moveDown(1);
  doc.text("Please ensure trainees report on time and follow all safety and compliance procedures as per GNFC guidelines.");
  doc.moveDown(2);
  doc.text("Authorized Signatory", { align: "right" });
  doc.text("Training Center", { align: "right" });
  doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill("#ccc");
  doc
    .fontSize(8)
    .fillColor("#888")
    .text("This is a computer-generated document. No signature is required.", 40, doc.page.height - 45, {
      align: "center",
      width: doc.page.width - 80,
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const url = `${uploadsBaseUrl}/${filename}`;
  return { path: filePath, url, filename };
};

export default {
  generatePermissionLetterPdf,
  generateBiodataPdf,
  generateGatePassPdf,
  generateCertificatePdf,
  generateNoDuePdf,
  generatePostingLetterPdf,
};
