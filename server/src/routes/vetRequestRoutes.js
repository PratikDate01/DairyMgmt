import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  createVetRequest,
  getFarmerRequests,
  getVeterinarianRequests,
  getVetRequestById,
  acceptVetRequest,
  rejectVetRequest,
  escalateVetRequest,
  saveClinicalExamination,
  saveFinalDiagnosis,
  savePrescription,
  saveFollowUpAndComplete
} from '../controllers/vetRequestController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole('farmer', 'admin'), createVetRequest);
router.get('/farmer', requireRole('farmer', 'admin'), getFarmerRequests);
router.get('/veterinarian', requireRole('veterinarian', 'admin'), getVeterinarianRequests);
router.get('/:id', getVetRequestById);
router.patch('/:id/accept', requireRole('veterinarian', 'admin'), acceptVetRequest);
router.patch('/:id/reject', requireRole('veterinarian', 'admin'), rejectVetRequest);
router.post('/:id/escalate', requireRole('farmer', 'admin'), escalateVetRequest);

// Clinical Case Workflow Routes (Phase 23)
router.patch('/:id/examination', requireRole('veterinarian', 'admin'), saveClinicalExamination);
router.patch('/:id/diagnosis', requireRole('veterinarian', 'admin'), saveFinalDiagnosis);
router.patch('/:id/prescription', requireRole('veterinarian', 'admin'), savePrescription);
router.patch('/:id/follow-up', requireRole('veterinarian', 'admin'), saveFollowUpAndComplete);

export default router;
