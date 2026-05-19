import { Router } from "express";
import * as masterController from "../controllers/master.controller";
import { authenticate, authorize } from "../middleware/auth";

export const masterRouter = Router();
masterRouter.use(authenticate);

// ──────────────────────────────────────────
// Categories
// ──────────────────────────────────────────
masterRouter.get("/categories", masterController.getCategories);
masterRouter.get("/categories/:id", masterController.getCategoryById);
masterRouter.post("/categories", authorize(["ADMIN"]), masterController.createCategory);
masterRouter.put("/categories/:id", authorize(["ADMIN"]), masterController.updateCategory);
masterRouter.delete("/categories/:id", authorize(["ADMIN"]), masterController.deleteCategory);

// ──────────────────────────────────────────
// Branches
// ──────────────────────────────────────────
masterRouter.get("/branches", masterController.getBranches);
masterRouter.get("/branches/:id", masterController.getBranchById);
masterRouter.post("/branches", authorize(["ADMIN"]), masterController.createBranch);
masterRouter.put("/branches/:id", authorize(["ADMIN"]), masterController.updateBranch);
masterRouter.delete("/branches/:id", authorize(["ADMIN"]), masterController.deleteBranch);

// ──────────────────────────────────────────
// Colleges
// ──────────────────────────────────────────
masterRouter.get("/colleges", masterController.getColleges);
masterRouter.get("/colleges/:id", masterController.getCollegeById);
masterRouter.post("/colleges", authorize(["ADMIN"]), masterController.createCollege);
masterRouter.put("/colleges/:id", authorize(["ADMIN"]), masterController.updateCollege);
masterRouter.delete("/colleges/:id", authorize(["ADMIN"]), masterController.deleteCollege);

// ──────────────────────────────────────────
// States
// ──────────────────────────────────────────
masterRouter.get("/states", masterController.getStates);
masterRouter.get("/states/:id", masterController.getStateById);
masterRouter.post("/states", authorize(["ADMIN"]), masterController.createState);
masterRouter.put("/states/:id", authorize(["ADMIN"]), masterController.updateState);
masterRouter.delete("/states/:id", authorize(["ADMIN"]), masterController.deleteState);

// ──────────────────────────────────────────
// Districts
// ──────────────────────────────────────────
masterRouter.get("/districts", masterController.getDistricts);
masterRouter.get("/districts/:id", masterController.getDistrictById);
masterRouter.post("/districts", authorize(["ADMIN"]), masterController.createDistrict);
masterRouter.put("/districts/:id", authorize(["ADMIN"]), masterController.updateDistrict);
masterRouter.delete("/districts/:id", authorize(["ADMIN"]), masterController.deleteDistrict);

// ──────────────────────────────────────────
// Talukas
// ──────────────────────────────────────────
masterRouter.get("/talukas", masterController.getTalukas);
masterRouter.get("/talukas/:id", masterController.getTalukaById);
masterRouter.post("/talukas", authorize(["ADMIN"]), masterController.createTaluka);
masterRouter.put("/talukas/:id", authorize(["ADMIN"]), masterController.updateTaluka);
masterRouter.delete("/talukas/:id", authorize(["ADMIN"]), masterController.deleteTaluka);

// ──────────────────────────────────────────
// Cities
// ──────────────────────────────────────────
masterRouter.get("/cities", masterController.getCities);
masterRouter.get("/cities/:id", masterController.getCityById);
masterRouter.post("/cities", authorize(["ADMIN"]), masterController.createCity);
masterRouter.put("/cities/:id", authorize(["ADMIN"]), masterController.updateCity);
masterRouter.delete("/cities/:id", authorize(["ADMIN"]), masterController.deleteCity);

// ──────────────────────────────────────────
// Departments
// ──────────────────────────────────────────
masterRouter.get("/departments", masterController.getDepartments);
masterRouter.get("/departments/:id", masterController.getDepartmentById);
masterRouter.post("/departments", authorize(["ADMIN"]), masterController.createDepartment);
masterRouter.put("/departments/:id", authorize(["ADMIN"]), masterController.updateDepartment);
masterRouter.delete("/departments/:id", authorize(["ADMIN"]), masterController.deleteDepartment);
