import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  createDiseaseScan,
  getFarmerScans,
  getScanById,
  getRecommendedVeterinarians
} from '../controllers/diseaseScanController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole('farmer', 'admin'), createDiseaseScan);
router.get('/', requireRole('farmer', 'admin'), getFarmerScans);
router.get('/:id', getScanById);
router.get('/:id/recommended-veterinarians', requireRole('farmer', 'admin'), getRecommendedVeterinarians);

export default router;
