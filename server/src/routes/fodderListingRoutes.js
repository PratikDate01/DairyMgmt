import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  createListing,
  getMarketplaceListings,
  getFarmerListings,
  getListingById,
  updateListing,
  deleteListing
} from '../controllers/fodderListingController.js';

const router = express.Router();

// Require authentication for all routes
router.use(authMiddleware);

// Farmer / Admin listing management routes
router.post('/', requireRole('farmer', 'admin'), createListing);
router.get('/', getMarketplaceListings);
router.get('/farmer', requireRole('farmer', 'admin'), getFarmerListings);
router.get('/:id', getListingById);
router.patch('/:id', requireRole('farmer', 'admin'), updateListing);
router.delete('/:id', requireRole('farmer', 'admin'), deleteListing);

export default router;
