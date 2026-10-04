import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  createMedicineRequest,
  getMyRequests,
  getProviderRequests,
  getProviderRequestsSummary,
  getMedicineRequestById,
  acceptMedicineRequest,
  rejectMedicineRequest,
  packMedicineRequest,
  readyMedicineRequest,
  completeMedicineRequest,
  cancelMedicineRequest
} from '../controllers/medicineRequestController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Farmer creation & my requests
router.post('/', requireRole('farmer'), createMedicineRequest);
router.get('/my', requireRole('farmer'), getMyRequests);

// Medical Provider request list & summary
router.get('/provider', requireRole('medicalProvider'), getProviderRequests);
router.get('/provider/summary', requireRole('medicalProvider', 'admin'), getProviderRequestsSummary);

// Status transition routes (Medical Provider)
router.patch('/:requestId/accept', requireRole('medicalProvider'), acceptMedicineRequest);
router.patch('/:requestId/reject', requireRole('medicalProvider'), rejectMedicineRequest);
router.patch('/:requestId/pack', requireRole('medicalProvider'), packMedicineRequest);
router.patch('/:requestId/ready', requireRole('medicalProvider'), readyMedicineRequest);
router.patch('/:requestId/complete', requireRole('medicalProvider'), completeMedicineRequest);

// Cancellation (Farmer or Medical Provider)
router.patch('/:requestId/cancel', requireRole('farmer', 'medicalProvider'), cancelMedicineRequest);

// Details by ID (Farmer, Medical Provider, Admin)
router.get('/:requestId', requireRole('farmer', 'medicalProvider', 'admin'), getMedicineRequestById);

export default router;
