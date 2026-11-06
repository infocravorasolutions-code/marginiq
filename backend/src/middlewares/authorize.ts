import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/PermissionService';

export const requirePermission = (permission: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !PermissionService.hasPermission(role, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to perform this action.' 
      });
    }
    next();
  };
};
