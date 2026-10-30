import { Router } from 'express';
import { login, getMe, changePassword, updateProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

export default router;
