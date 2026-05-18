import { Router } from 'express';
export const documentVerificationRouter = Router();

documentVerificationRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
