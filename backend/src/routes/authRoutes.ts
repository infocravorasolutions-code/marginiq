import express from 'express';
import { register, login, createUser, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Password management
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', protect, changePassword);

// Admin user creation
router.post('/users', protect, createUser);

export default router;
