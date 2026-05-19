import { Router } from "express";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import pdfService from "../services/pdf.service";

export const biodataRouter = Router();
biodataRouter.use(authenticate);

// Get biodata by applicationId
biodataRouter.get("/:applicationId", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const biodata = await prisma.biodataForm.findUnique({
      where: { applicationId },
      include: {
        academics: true,
        otherTrainings: true,
        sports: true,
        extracurriculars: true,
        familyMembers: true,
        gnfcRelatives: true,
        postings: true,
      },
    });
    res.json({ success: true, data: biodata });
  } catch (error) {
    next(error);
  }
});

// POST: Create or update biodata (upsert by applicationId)
biodataRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const {
      applicationId,
      local_address,
      permanent_address,
      caste,
      height_cm,
      weight_kg,
      blood_group,
      photo_path,
      physically_challenged,
      challenge_details,
      student_declaration,
    } = req.body;
    if (!applicationId) return res.status(400).json({ success: false, message: "applicationId is required" });

    const payload: any = {
      local_address: local_address || "",
      permanent_address: permanent_address || "",
      caste,
      height_cm: height_cm ? Number(height_cm) : undefined,
      weight_kg: weight_kg ? Number(weight_kg) : undefined,
      blood_group,
      photo_path,
      physically_challenged: physically_challenged ?? undefined,
      challenge_details,
      student_declaration: student_declaration ?? undefined,
    };

    // Clean undefined values
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    const existing = await prisma.biodataForm.findUnique({ where: { applicationId: Number(applicationId) } });
    if (existing) {
      const updated = await prisma.biodataForm.update({
        where: { id: existing.id },
        data: payload,
        include: { academics: true, familyMembers: true, postings: true },
      });
      return res.json({ success: true, data: updated });
    }

    const created = await prisma.biodataForm.create({
      data: { applicationId: Number(applicationId), ...payload },
      include: { academics: true, familyMembers: true, postings: true },
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// PUT: Upsert biodata by applicationId (used by frontend test & full biodata form)
biodataRouter.put("/:applicationId", async (req: AuthRequest, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const {
      local_address,
      permanent_address,
      caste,
      height_cm,
      weight_kg,
      blood_group,
      photo_path,
      physically_challenged,
      challenge_details,
      student_declaration,
      academics,
      familyMembers,
      gnfcRelatives,
      postings,
    } = req.body;

    const payload: any = {
      local_address: local_address || "",
      permanent_address: permanent_address || "",
      caste,
      height_cm: height_cm ? Number(height_cm) : undefined,
      weight_kg: weight_kg ? Number(weight_kg) : undefined,
      blood_group,
      photo_path,
      physically_challenged: physically_challenged ?? undefined,
      challenge_details,
      student_declaration: student_declaration ?? undefined,
    };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    // Upsert biodata form
    const existing = await prisma.biodataForm.findUnique({ where: { applicationId } });
    let biodata;
    if (existing) {
      biodata = await prisma.biodataForm.update({ where: { id: existing.id }, data: payload });
    } else {
      biodata = await prisma.biodataForm.create({ data: { applicationId, ...payload } });
    }

    // Handle child tables if provided
    if (Array.isArray(academics)) {
      await prisma.biodataAcademic.deleteMany({ where: { biodataId: biodata.id } });
      for (const a of academics) {
        await prisma.biodataAcademic.create({
          data: {
            biodataId: biodata.id,
            course_name: a.course_name,
            board_university: a.board_university,
            passing_year: Number(a.passing_year),
            percentage_cgpa: Number(a.percentage_cgpa),
          },
        });
      }
    }

    if (Array.isArray(familyMembers)) {
      await prisma.biodataFamilyMember.deleteMany({ where: { biodataId: biodata.id } });
      for (const fm of familyMembers) {
        await prisma.biodataFamilyMember.create({
          data: {
            biodataId: biodata.id,
            member_name: fm.member_name,
            relationship: fm.relationship,
            age: Number(fm.age),
            occupation: fm.occupation,
            contact_no: fm.contact_no,
          },
        });
      }
    }

    if (Array.isArray(gnfcRelatives)) {
      await prisma.biodataGnfcRelative.deleteMany({ where: { biodataId: biodata.id } });
      for (const gr of gnfcRelatives) {
        await prisma.biodataGnfcRelative.create({
          data: {
            biodataId: biodata.id,
            relative_name: gr.relative_name,
            relationship: gr.relationship,
            department: gr.department,
            employee_no: gr.employee_no,
          },
        });
      }
    }

    if (Array.isArray(postings)) {
      await prisma.biodataPosting.deleteMany({ where: { biodataId: biodata.id } });
      for (const p of postings) {
        await prisma.biodataPosting.create({
          data: {
            biodataId: biodata.id,
            department: p.department,
            in_charge: p.in_charge,
            posting_from: new Date(p.posting_from),
            posting_to: new Date(p.posting_to),
            remarks: p.remarks,
          },
        });
      }
    }

    const result = await prisma.biodataForm.findUnique({
      where: { id: biodata.id },
      include: {
        academics: true,
        otherTrainings: true,
        sports: true,
        extracurriculars: true,
        familyMembers: true,
        gnfcRelatives: true,
        postings: true,
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Generate printable biodata PDF
biodataRouter.post("/:applicationId/generate", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { biodata: true, college: true },
    });
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    const pdf = await pdfService.generateBiodataPdf(application);
    res.json({ success: true, data: { pdfUrl: pdf.url } });
  } catch (error) {
    next(error);
  }
});
