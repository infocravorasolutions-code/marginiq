import express from 'express';
import { protect } from '../middlewares/auth';
import { NotificationService } from '../services/alerts/NotificationService';

const router = express.Router();

router.use(protect);

router.get('/', async (req: any, res) => {
  try {
    const notifications = await NotificationService.getNotifications(req.user._id, req.user.organizationId);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/read', async (req: any, res) => {
  try {
    const notif = await NotificationService.markAsRead(req.params.id, req.user._id, req.user.organizationId);
    res.json({ success: true, data: notif });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/read-all', async (req: any, res) => {
  try {
    await NotificationService.markAllAsRead(req.user._id, req.user.organizationId);
    res.json({ success: true, data: {} });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    await NotificationService.deleteNotification(req.params.id, req.user._id, req.user.organizationId);
    res.json({ success: true, data: {} });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
