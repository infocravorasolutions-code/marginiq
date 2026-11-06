import express from 'express';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import { UserService } from '../services/UserService';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('users.view'), async (req: any, res) => {
  try {
    const users = await UserService.getUsers(req.user.organizationId);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', requirePermission('users.view'), async (req: any, res) => {
  try {
    const user = await UserService.getUser(req.params.id, req.user.organizationId);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requirePermission('users.manage'), async (req: any, res) => {
  try {
    const user = await UserService.createUser(req.user.organizationId, req.user._id, req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/:id', requirePermission('users.manage'), async (req: any, res) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.user.organizationId, req.user._id, req.user.role, req.body);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', requirePermission('users.manage'), async (req: any, res) => {
  try {
    await UserService.deleteUser(req.params.id, req.user.organizationId, req.user._id);
    res.json({ success: true, data: {} });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
