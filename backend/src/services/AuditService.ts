import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

export class AuditService {
  static async log(
    organizationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: any
  ) {
    try {
      await AuditLog.create({
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        metadata
      });
    } catch (err) {
      console.error('AuditLog Error:', err);
    }
  }

  static async getLogs(organizationId: string, filters: any = {}) {
    const query: any = { organizationId };
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    return AuditLog.find(query).sort({ createdAt: -1 }).limit(100).populate('userId', 'firstName lastName email').lean();
  }
}
