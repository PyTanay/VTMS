import { Router } from 'express';
export const scrutinyRouter = Router();

scrutinyRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
