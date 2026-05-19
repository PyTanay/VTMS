import path from "path";

export const uploadsDir = path.join(process.cwd(), "uploads");
export const uploadsBaseUrl = "/uploads"; // served by express static

export default { uploadsDir, uploadsBaseUrl };
