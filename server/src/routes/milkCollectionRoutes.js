import express from 'express';
import {
  createCollection,
  getDairyOwnerCollections,
  getFarmerCollections,
  getFarmerCollectionsForDairy
} from '../controllers/milkCollectionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply authMiddleware to all milk collection routes
router.use(authMiddleware);

// Dairy Owner Endpoints
router.post('/', requireRole('dairyOwner', 'admin'), createCollection);
router.get('/dairy-owner', requireRole('dairyOwner', 'admin'), getDairyOwnerCollections);
router.get('/farmer/:farmerId', requireRole('dairyOwner', 'admin'), getFarmerCollectionsForDairy);

// Farmer Endpoints
router.get('/farmer', requireRole('farmer', 'admin'), getFarmerCollections);

export default router;
