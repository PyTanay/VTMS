import { Router } from 'express';
export const biodataRouter = Router();

biodataRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
