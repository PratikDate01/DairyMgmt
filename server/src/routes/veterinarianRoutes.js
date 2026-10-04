import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getVeterinarianCases,
  getScanById,
  reviewCaseByVeterinarian
} from '../controllers/diseaseScanController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('veterinarian', 'admin'));

router.get('/cases', getVeterinarianCases);
router.get('/cases/:id', getScanById);
router.patch('/cases/:id/review', reviewCaseByVeterinarian);

export default router;
