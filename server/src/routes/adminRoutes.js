import express from 'express';
import {
  getAdminOverviewStats,
  getAdminUsers,
  toggleUserStatus,
  updateUserVerification,
  getAdminCattle,
  getAdminVetRequests,
  getAdminMedicines,
  getAdminFodderListings,
  moderateFodderListing,
  getAdminComplaints,
  updateComplaintStatus
} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Strict RBAC: All Admin routes require authentication AND 'admin' role
router.use(authMiddleware);
router.use(requireRole('admin'));

// 1. Overview & Statistics
router.get('/overview-stats', getAdminOverviewStats);

// 2. User Directory & Status
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/verification', updateUserVerification);

// 3. Cattle Directory
router.get('/cattle', getAdminCattle);

// 4. Veterinary Requests & Clinical Oversight
router.get('/vet-requests', getAdminVetRequests);

// 5. Medicines & Inventory Oversight
router.get('/medicines', getAdminMedicines);

// 6. Fodder Listings & Marketplace Moderation
router.get('/fodder-listings', getAdminFodderListings);
router.patch('/fodder-listings/:id/status', moderateFodderListing);

// 7. Complaints & Dispute Resolution
router.get('/complaints', getAdminComplaints);
router.patch('/complaints/:id', updateComplaintStatus);

export default router;
