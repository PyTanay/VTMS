import { Router } from 'express';
export const employeeRouter = Router();

employeeRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
