import express from 'express';
import {
  createCattle,
  getFarmerCattle,
  getCattleById,
  updateCattle,
  deleteCattle
} from '../controllers/cattleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all cattle routes
router.use(authMiddleware);

// Farmer & Admin CRUD Endpoints
router.post('/', requireRole('farmer', 'admin'), createCattle);
router.get('/', requireRole('farmer', 'veterinarian', 'admin'), getFarmerCattle);
router.get('/:id', requireRole('farmer', 'veterinarian', 'admin'), getCattleById);
router.patch('/:id', requireRole('farmer', 'admin'), updateCattle);
router.delete('/:id', requireRole('farmer', 'admin'), deleteCattle);

export default router;
