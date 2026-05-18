import { Router } from 'express';
export const certificateRouter = Router();

certificateRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
