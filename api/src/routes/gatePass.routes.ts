import { Router } from 'express';
export const gatePassRouter = Router();

gatePassRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
