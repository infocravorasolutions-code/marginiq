import Notification from '../../models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
  static async createNotification(data: {
    organizationId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    type: string;
    title: string;
    message: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    entityType?: string;
    entityId?: mongoose.Types.ObjectId;
    metadata?: any;
  }) {
    return Notification.create(data);
  }

  static async getNotifications(userId: string, organizationId: string, limit = 50) {
    return Notification.find({ userId, organizationId }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  static async getUnreadCount(userId: string, organizationId: string) {
    return Notification.countDocuments({ userId, organizationId, read: false });
  }

  static async markAsRead(id: string, userId: string, organizationId: string) {
    return Notification.findOneAndUpdate({ _id: id, userId, organizationId }, { read: true }, { new: true });
  }

  static async markAllAsRead(userId: string, organizationId: string) {
    return Notification.updateMany({ userId, organizationId, read: false }, { read: true });
  }
  
  static async deleteNotification(id: string, userId: string, organizationId: string) {
    return Notification.findOneAndDelete({ _id: id, userId, organizationId });
  }
}
