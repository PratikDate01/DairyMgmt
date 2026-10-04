import express from 'express';
import {
  getMilkSummary,
  getPaymentSummary,
  getFarmerSummary,
  getDateWiseMilk,
  getDateWisePayments,
  getDashboardSummary
} from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all report routes with authMiddleware
router.use(authMiddleware);

// Exclude medicalProvider from all report routes (require dairyOwner, farmer, or admin)
router.use(requireRole('dairyOwner', 'farmer', 'admin'));

// Report Endpoints
router.get('/milk-summary', getMilkSummary);
router.get('/payment-summary', getPaymentSummary);
router.get('/farmer-summary', requireRole('dairyOwner', 'admin'), getFarmerSummary);
router.get('/date-wise-milk', getDateWiseMilk);
router.get('/date-wise-payments', getDateWisePayments);
router.get('/dashboard-summary', getDashboardSummary);

export default router;
