import express from 'express';
import {
  searchFarmer,
  requestConnection,
  getDairyFarmers,
  getFarmerDairies,
  acceptConnection,
  rejectConnection,
  disconnectConnection
} from '../controllers/dairyFarmerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply authMiddleware to all connection routes
router.use(authMiddleware);

// Dairy Owner Endpoints
router.get('/search-farmer', requireRole('dairyOwner', 'admin'), searchFarmer);
router.post('/request', requireRole('dairyOwner', 'admin'), requestConnection);
router.get('/dairy-farmers', requireRole('dairyOwner', 'admin'), getDairyFarmers);

// Farmer Endpoints
router.get('/farmer-dairies', requireRole('farmer', 'admin'), getFarmerDairies);
router.patch('/:connectionId/accept', requireRole('farmer', 'admin'), acceptConnection);
router.patch('/:connectionId/reject', requireRole('farmer', 'admin'), rejectConnection);

// Common Disconnect Endpoint (Accessible by Dairy Owner or Farmer on their own relationship)
router.patch('/:connectionId/disconnect', disconnectConnection);

export default router;
