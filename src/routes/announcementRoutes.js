import express from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('super-admin', 'admin'), getAnnouncements)
  .post(authorize('super-admin', 'admin'), createAnnouncement);

router.route('/:id')
  .delete(authorize('super-admin'), deleteAnnouncement);

export default router;
