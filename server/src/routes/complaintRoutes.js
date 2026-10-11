import express from 'express';
import { createComplaint, getMyComplaints } from '../controllers/complaintController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected user routes
router.post('/', authMiddleware, createComplaint);
router.get('/my', authMiddleware, getMyComplaints);

export default router;
