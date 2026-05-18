import { Router } from 'express';
export const permissionLetterRouter = Router();

permissionLetterRouter.get('/', (req, res) => { res.json({ success: true, data: [] }) });
