import { Router } from 'express';
export const postingRouter = Router();

postingRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
