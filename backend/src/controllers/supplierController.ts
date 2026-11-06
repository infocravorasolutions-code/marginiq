import { Response } from 'express';
import Supplier from '../models/Supplier';
import { AuthRequest } from '../middlewares/auth';

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suppliers = await Supplier.find({ organizationId: req.user.organizationId }).sort({ companyName: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newSupplier = new Supplier({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    const savedSupplier = await newSupplier.save();
    res.status(201).json({ success: true, data: savedSupplier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
