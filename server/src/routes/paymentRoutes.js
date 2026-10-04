import express from 'express';
import {
  getUnpaidCollections,
  previewSettlement,
  createPayment,
  getDairyOwnerPayments,
  getFarmerPayments,
  getPaymentDetails,
  updatePaymentStatus
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all payment routes with authMiddleware
router.use(authMiddleware);

// Dairy Owner Routes
router.get('/unpaid-collections', requireRole('dairyOwner', 'admin'), getUnpaidCollections);
router.post('/preview', requireRole('dairyOwner', 'admin'), previewSettlement);
router.post('/', requireRole('dairyOwner', 'admin'), createPayment);
router.get('/dairy-owner', requireRole('dairyOwner', 'admin'), getDairyOwnerPayments);
router.patch('/:paymentId/status', requireRole('dairyOwner', 'admin'), updatePaymentStatus);

// Farmer Routes (Read-Only)
router.get('/farmer', requireRole('farmer', 'admin'), getFarmerPayments);

// Shared Route for Payment Details
router.get('/:paymentId', getPaymentDetails);

export default router;
