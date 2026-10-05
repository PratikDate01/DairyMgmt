import express from 'express';
import {
  createMedicine,
  getMyMedicines,
  getAvailableMedicines,
  getInventorySummary,
  getLowStockMedicines,
  getMedicineById,
  updateMedicine,
  updateStock,
  updateAvailability,
  deactivateMedicine,
  processPrescription
} from '../controllers/medicineController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all medicine routes with authMiddleware
router.use(authMiddleware);

// Process Prescription Search (Farmer, Admin)
router.post('/process-prescription', requireRole('farmer', 'admin'), processPrescription);

// 1. Create Medicine (Medical Provider only)
router.post('/', requireRole('medicalProvider'), createMedicine);

// 2. Get My Medicines Inventory (Medical Provider only)
router.get('/my', requireRole('medicalProvider'), getMyMedicines);

// 3. Public Read-Only Catalog (Farmer, Medical Provider, Admin)
router.get('/available', requireRole('farmer', 'medicalProvider', 'admin'), getAvailableMedicines);

// 4. Inventory Summary (Medical Provider, Admin)
router.get('/summary', requireRole('medicalProvider', 'admin'), getInventorySummary);

// 5. Low Stock Medicines (Medical Provider only)
router.get('/low-stock', requireRole('medicalProvider'), getLowStockMedicines);

// 6. Get Medicine By ID (Medical Provider, Farmer, Admin)
router.get('/:medicineId', requireRole('medicalProvider', 'farmer', 'admin'), getMedicineById);

// 7. Update Medicine Details (Medical Provider only)
router.patch('/:medicineId', requireRole('medicalProvider'), updateMedicine);

// 8. Update Stock (Medical Provider only)
router.patch('/:medicineId/stock', requireRole('medicalProvider'), updateStock);

// 9. Update Availability (Medical Provider only)
router.patch('/:medicineId/availability', requireRole('medicalProvider'), updateAvailability);

// 10. Deactivate Medicine (Medical Provider only)
router.patch('/:medicineId/deactivate', requireRole('medicalProvider'), deactivateMedicine);

export default router;
