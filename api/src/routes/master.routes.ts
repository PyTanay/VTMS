import { Router } from 'express';
import * as masterController from '../controllers/master.controller';

export const masterRouter = Router();

masterRouter.get('/categories', masterController.getCategories);
masterRouter.get('/branches', masterController.getBranches);
masterRouter.get('/colleges', masterController.getColleges);
masterRouter.get('/states', masterController.getStates);
masterRouter.get('/districts', masterController.getDistricts);
masterRouter.get('/talukas', masterController.getTalukas);
masterRouter.get('/cities', masterController.getCities);
masterRouter.get('/departments', masterController.getDepartments);
