import express from 'express';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import { CommentService } from '../services/CommentService';

const router = express.Router();

router.use(protect);

router.get('/:entityType/:entityId', async (req: any, res) => {
  try {
    const entityType = String(req.params.entityType || '').toUpperCase();
    const comments = await CommentService.getComments(req.user.organizationId, entityType, req.params.entityId);
    res.json({ success: true, data: comments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requirePermission('comments.manage'), async (req: any, res) => {
  try {
    const { entityType, entityId, body, mentions } = req.body;
    const normalizedType = String(entityType || '').toUpperCase();
    const comment = await CommentService.createComment(req.user.organizationId, req.user._id, normalizedType, entityId, body, mentions);
    res.status(201).json({ success: true, data: comment });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', requirePermission('comments.manage'), async (req: any, res) => {
  try {
    await CommentService.deleteComment(req.params.id, req.user.organizationId, req.user._id, req.user.role);
    res.json({ success: true, data: {} });
  } catch (err: any) {
    res.status(403).json({ success: false, message: err.message });
  }
});

export default router;
