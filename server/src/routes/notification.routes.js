import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createBroadcastAnnouncement,
} from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/broadcast', authorize(['ADMIN']), createBroadcastAnnouncement);

export default router;
