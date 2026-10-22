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

// Process Prescription Search (Farmer, Medical Provider, Admin)
router.post('/process-prescription', requireRole('farmer', 'medicalProvider', 'admin'), processPrescription);

// 1. Create Medicine (Medical Provider and Admin)
router.post('/', requireRole('medicalProvider', 'admin'), createMedicine);

// 2. Get My Medicines Inventory (Medical Provider and Admin)
router.get('/my', requireRole('medicalProvider', 'admin'), getMyMedicines);

// 3. Public Read-Only Catalog (Farmer, Medical Provider, Admin)
router.get('/available', requireRole('farmer', 'medicalProvider', 'admin'), getAvailableMedicines);

// 4. Inventory Summary (Medical Provider, Admin)
router.get('/summary', requireRole('medicalProvider', 'admin'), getInventorySummary);

// 5. Low Stock Medicines (Medical Provider and Admin)
router.get('/low-stock', requireRole('medicalProvider', 'admin'), getLowStockMedicines);

// 6. Get Medicine By ID (Medical Provider, Farmer, Admin)
router.get('/:medicineId', requireRole('medicalProvider', 'farmer', 'admin'), getMedicineById);

// 7. Update Medicine Details (Medical Provider and Admin)
router.patch('/:medicineId', requireRole('medicalProvider', 'admin'), updateMedicine);

// 8. Update Stock (Medical Provider and Admin)
router.patch('/:medicineId/stock', requireRole('medicalProvider', 'admin'), updateStock);

// 9. Update Availability (Medical Provider and Admin)
router.patch('/:medicineId/availability', requireRole('medicalProvider', 'admin'), updateAvailability);

// 10. Deactivate Medicine (Medical Provider and Admin)
router.patch('/:medicineId/deactivate', requireRole('medicalProvider', 'admin'), deactivateMedicine);

export default router;
