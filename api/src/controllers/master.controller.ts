import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.category.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getBranches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.branch.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getColleges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.college.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getStates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.state.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.district.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getTalukas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.taluka.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.city.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.department.findMany();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
