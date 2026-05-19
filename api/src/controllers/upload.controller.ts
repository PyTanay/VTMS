import { Request, Response } from "express";

export const uploadSingle = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const file = req.file;
  // Return a public URL path relative to server (served from /uploads)
  const url = `/uploads/${file.filename}`;
  res.json({ filename: file.filename, url, size: file.size, mimetype: file.mimetype });
};

export const uploadMultiple = (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const items = files.map((f) => ({ filename: f.filename, url: `/uploads/${f.filename}`, size: f.size, mimetype: f.mimetype }));
  res.json({ files: items });
};
