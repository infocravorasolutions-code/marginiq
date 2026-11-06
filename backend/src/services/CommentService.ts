import Comment from '../models/Comment';
import { AuditService } from './AuditService';

export class CommentService {
  static async getComments(organizationId: string, entityType: any, entityId: string) {
    return Comment.find({ organizationId, entityType, entityId })
      .sort({ createdAt: 1 })
      .populate('userId', 'firstName lastName email')
      .lean();
  }

  static async createComment(organizationId: string, userId: string, entityType: any, entityId: string, body: string, mentions?: string[]) {
    const comment = await Comment.create({
      organizationId,
      userId,
      entityType,
      entityId,
      body,
      mentions
    } as any);
    
    await AuditService.log(organizationId, userId, 'COMMENT_CREATED', entityType, entityId, { commentId: comment._id });
    
    return Comment.findById(comment._id).populate('userId', 'firstName lastName email').lean();
  }

  static async deleteComment(id: string, organizationId: string, userId: string, userRole: string) {
    const comment = await Comment.findOne({ _id: id, organizationId });
    if (!comment) throw new Error('Comment not found');

    if (comment.userId.toString() !== userId && userRole !== 'OWNER' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new Error('Not authorized to delete this comment');
    }

    await Comment.deleteOne({ _id: id });
    await AuditService.log(organizationId, userId, 'COMMENT_DELETED', comment.entityType, comment.entityId, { commentId: id });
    return true;
  }
}
