import { Router } from 'express';
export const reportRouter = Router();

reportRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
