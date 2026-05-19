import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

// ──────────────────────────────────────────
// Generic helpers for master CRUD
// ──────────────────────────────────────────

type PrismaDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

const masterEntities: Record<string, { delegate: PrismaDelegate; nameField: string; uniqueField?: string }> = {
  categories: {
    delegate: prisma.category,
    nameField: "name",
    uniqueField: "name",
  },
  branches: {
    delegate: prisma.branch,
    nameField: "branch_name",
    uniqueField: "branch_name",
  },
  colleges: {
    delegate: prisma.college,
    nameField: "college_name",
  },
  states: {
    delegate: prisma.state,
    nameField: "name",
    uniqueField: "name",
  },
  districts: {
    delegate: prisma.district,
    nameField: "name",
  },
  talukas: {
    delegate: prisma.taluka,
    nameField: "name",
  },
  cities: {
    delegate: prisma.city,
    nameField: "name",
  },
  departments: {
    delegate: prisma.department,
    nameField: "department_name",
    uniqueField: "department_name",
  },
};

// ──────────────────────────────────────────
// Generic GET /:entity
// ──────────────────────────────────────────

const generateGetAll = (entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = masterEntities[entity];
      const search = req.query.search as string | undefined;
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;

      let include: any;
      let where: any = {};

      if (entity === "districts" && parentId) where.stateId = parentId;
      if (entity === "talukas" && parentId) where.districtId = parentId;
      if (entity === "cities" && parentId) where.talukaId = parentId;

      // For hierarchical entities, include parent info
      if (entity === "districts") include = { state: { select: { id: true, name: true } } };
      if (entity === "talukas")
        include = { district: { select: { id: true, name: true, state: { select: { id: true, name: true } } } } };
      if (entity === "cities")
        include = { taluka: { select: { id: true, name: true, district: { select: { id: true, name: true } } } } };

      if (search) {
        where[info.nameField] = { contains: search, mode: "insensitive" };
      }

      const data = await info.delegate.findMany({ where, include, orderBy: { [info.nameField]: "asc" } });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
};

// ──────────────────────────────────────────
// Generic GET /:entity/:id
// ──────────────────────────────────────────

const generateGetById = (entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const info = masterEntities[entity];

      let include: any;
      if (entity === "districts") include = { state: true, talukas: true };
      if (entity === "talukas") include = { district: true, cities: true };
      if (entity === "cities") include = { taluka: true };
      if (entity === "colleges") include = { _count: { select: { applications: true } } };

      const record = await info.delegate.findUnique({ where: { id }, include });
      if (!record) return res.status(404).json({ success: false, message: `${entity.slice(0, -1)} not found` });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };
};

// ──────────────────────────────────────────
// Generic POST /:entity  (create)
// ──────────────────────────────────────────

const generateCreate = (entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = masterEntities[entity];
      const { name, ...extra } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: `Field "${info.nameField}" is required` });
      }

      const data: any = { [info.nameField]: name };

      // Handle parent IDs for hierarchical entities
      if (entity === "districts" && req.body.stateId) data.stateId = Number(req.body.stateId);
      if (entity === "talukas" && req.body.districtId) data.districtId = Number(req.body.districtId);
      if (entity === "cities" && req.body.talukaId) data.talukaId = Number(req.body.talukaId);

      // Extra fields (e.g., college place)
      if (entity === "colleges" && req.body.place) data.place = req.body.place;

      const record = await info.delegate.create({ data });
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(409).json({ success: false, message: `${entity.slice(0, -1)} with this name already exists` });
      }
      next(error);
    }
  };
};

// ──────────────────────────────────────────
// Generic PUT /:entity/:id  (update)
// ──────────────────────────────────────────

const generateUpdate = (entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const info = masterEntities[entity];

      const data: any = {};
      if (req.body.name !== undefined) data[info.nameField] = req.body.name;
      if (entity === "colleges" && req.body.place !== undefined) data.place = req.body.place;
      if (entity === "districts" && req.body.stateId !== undefined) data.stateId = Number(req.body.stateId);
      if (entity === "talukas" && req.body.districtId !== undefined) data.districtId = Number(req.body.districtId);
      if (entity === "cities" && req.body.talukaId !== undefined) data.talukaId = Number(req.body.talukaId);

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields to update" });
      }

      const record = await info.delegate.update({ where: { id }, data });
      res.json({ success: true, data: record });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(409).json({ success: false, message: `${entity.slice(0, -1)} with this name already exists` });
      }
      if (error?.code === "P2025") {
        return res.status(404).json({ success: false, message: `${entity.slice(0, -1)} not found` });
      }
      next(error);
    }
  };
};

// ──────────────────────────────────────────
// Generic DELETE /:entity/:id
// ──────────────────────────────────────────

const generateDelete = (entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const info = masterEntities[entity];
      await info.delegate.delete({ where: { id } });
      res.json({ success: true, message: `${entity.slice(0, -1)} deleted successfully` });
    } catch (error: any) {
      if (error?.code === "P2025") {
        return res.status(404).json({ success: false, message: `${entity.slice(0, -1)} not found` });
      }
      next(error);
    }
  };
};

// ──────────────────────────────────────────
// Exported route handlers (used by master.routes.ts)
// ──────────────────────────────────────────

// GET handlers
export const getCategories = generateGetAll("categories");
export const getBranches = generateGetAll("branches");
export const getColleges = generateGetAll("colleges");
export const getStates = generateGetAll("states");
export const getDistricts = generateGetAll("districts");
export const getTalukas = generateGetAll("talukas");
export const getCities = generateGetAll("cities");
export const getDepartments = generateGetAll("departments");

// GET by ID handlers
export const getCategoryById = generateGetById("categories");
export const getBranchById = generateGetById("branches");
export const getCollegeById = generateGetById("colleges");
export const getStateById = generateGetById("states");
export const getDistrictById = generateGetById("districts");
export const getTalukaById = generateGetById("talukas");
export const getCityById = generateGetById("cities");
export const getDepartmentById = generateGetById("departments");

// POST handlers
export const createCategory = generateCreate("categories");
export const createBranch = generateCreate("branches");
export const createCollege = generateCreate("colleges");
export const createState = generateCreate("states");
export const createDistrict = generateCreate("districts");
export const createTaluka = generateCreate("talukas");
export const createCity = generateCreate("cities");
export const createDepartment = generateCreate("departments");

// PUT handlers
export const updateCategory = generateUpdate("categories");
export const updateBranch = generateUpdate("branches");
export const updateCollege = generateUpdate("colleges");
export const updateState = generateUpdate("states");
export const updateDistrict = generateUpdate("districts");
export const updateTaluka = generateUpdate("talukas");
export const updateCity = generateUpdate("cities");
export const updateDepartment = generateUpdate("departments");

// DELETE handlers
export const deleteCategory = generateDelete("categories");
export const deleteBranch = generateDelete("branches");
export const deleteCollege = generateDelete("colleges");
export const deleteState = generateDelete("states");
export const deleteDistrict = generateDelete("districts");
export const deleteTaluka = generateDelete("talukas");
export const deleteCity = generateDelete("cities");
export const deleteDepartment = generateDelete("departments");
