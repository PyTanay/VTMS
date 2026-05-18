import { Router } from 'express';
export const noDueRouter = Router();

noDueRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
