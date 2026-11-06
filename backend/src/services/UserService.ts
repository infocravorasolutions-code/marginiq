import User from '../models/User';
import Organization from '../models/Organization';
import { AuditService } from './AuditService';
import bcrypt from 'bcryptjs';

export class UserService {
  static async getUsers(organizationId: string) {
    return User.find({ organizationId }).select('-passwordHash').lean();
  }

  static async getUser(id: string, organizationId: string) {
    return User.findOne({ _id: id, organizationId }).select('-passwordHash').lean();
  }

  static async createUser(organizationId: string, inviterId: string, userData: any) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) throw new Error('Email already exists');

    // Default password for invited users, they should reset it
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('TempPassword123!', salt);

    const user = await User.create({
      ...userData,
      passwordHash,
      organizationId,
      status: 'INVITED'
    });

    await AuditService.log(organizationId, inviterId, 'USER_CREATED', 'USER', user._id.toString(), { role: user.role });
    return user;
  }

  static async updateUser(id: string, organizationId: string, updaterId: string, updaterRole: string, updateData: any) {
    const user = await User.findOne({ _id: id, organizationId });
    if (!user) throw new Error('User not found');

    // Prevent changing the last owner's role or status
    if (user.role === 'OWNER' && (updateData.role || updateData.status)) {
      const ownerCount = await User.countDocuments({ organizationId, role: 'OWNER', status: 'ACTIVE' });
      if (ownerCount <= 1 && (updateData.role !== 'OWNER' || updateData.status !== 'ACTIVE')) {
        throw new Error('Cannot change role/status of the last active OWNER');
      }
    }

    // Only OWNER/ADMIN can change roles
    if (updateData.role && updaterRole !== 'OWNER' && updaterRole !== 'ADMIN' && updaterRole !== 'SUPER_ADMIN') {
      throw new Error('Not authorized to change roles');
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true, select: '-passwordHash' }
    ).lean();

    await AuditService.log(organizationId, updaterId, 'USER_UPDATED', 'USER', id, updateData);
    return updated;
  }

  static async deleteUser(id: string, organizationId: string, updaterId: string) {
    const user = await User.findOne({ _id: id, organizationId });
    if (!user) throw new Error('User not found');

    if (user.role === 'OWNER') {
      const ownerCount = await User.countDocuments({ organizationId, role: 'OWNER' });
      if (ownerCount <= 1) throw new Error('Cannot delete the last OWNER');
    }

    await User.deleteOne({ _id: id });
    await AuditService.log(organizationId, updaterId, 'USER_DELETED', 'USER', id);
    return true;
  }
}
