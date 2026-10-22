import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import {
  parseAndValidateBase64Image,
  extractTextFromImage,
  parsePrescriptionLines,
  matchCandidatesToInventory
} from '../services/prescriptionOcrService.js';

// Centralized low stock threshold constant
export const LOW_STOCK_THRESHOLD = 10;

/**
 * @route POST /api/medicines
 * @desc Create a new medicine entry (Medical Provider operation)
 */
export const createMedicine = async (req, res) => {
  try {
    const medicalProviderId = req.user.role === 'admin' ? (req.body.medicalProvider || req.user.id) : req.user.id;
    const {
      name,
      genericName = '',
      category,
      description = '',
      price,
      stockQuantity,
      unit = 'tablet',
      availability = 'available'
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name is required and must be at least 2 characters long.'
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.'
      });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number.'
      });
    }

    const numericStock = Number(stockQuantity);
    if (isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity must be a non-negative number.'
      });
    }

    // Auto rule: zero stock implies unavailable; positive stock defaults to available
    let finalAvailability = availability;
    if (numericStock === 0) {
      finalAvailability = 'unavailable';
    } else if (numericStock > 0) {
      finalAvailability = 'available';
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      genericName: genericName.trim(),
      category: category.trim(),
      description: description.trim(),
      price: numericPrice,
      stockQuantity: numericStock,
      unit,
      availability: finalAvailability,
      medicalProvider: medicalProviderId,
      isActive: true
    });

    await medicine.populate('medicalProvider', '_id name phone');

    return res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully',
      medicine
    });
  } catch (error) {
    console.error(`Create Medicine Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while adding medicine'
    });
  }
};

/**
 * @route GET /api/medicines/my
 * @desc Get inventory owned by authenticated Medical Provider
 */
export const getMyMedicines = async (req, res) => {
  try {
    const { search, category, availability, isActive, lowStock, page = 1, limit = 50 } = req.query;

    const query = {};
    if (req.user.role === 'medicalProvider') {
      query.medicalProvider = req.user.id;
    } else if (req.query.medicalProvider) {
      query.medicalProvider = req.query.medicalProvider;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (availability) {
      query.availability = availability;
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true') {
      query.stockQuantity = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { genericName: regex }, { category: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [medicines, totalCount] = await Promise.all([
      Medicine.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('medicalProvider', '_id name phone'),
      Medicine.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: medicines.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      medicines
    });
  } catch (error) {
    console.error(`Get My Medicines Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching inventory'
    });
  }
};

/**
 * @route GET /api/medicines/available
 * @desc Public read-only catalog of currently available medicines
 */
export const getAvailableMedicines = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;

    const query = {
      isActive: true,
      availability: 'available',
      stockQuantity: { $gt: 0 }
    };

    if (category) {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { genericName: regex }, { category: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [medicines, totalCount] = await Promise.all([
      Medicine.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('medicalProvider', '_id name phone'),
      Medicine.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: medicines.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      medicines
    });
  } catch (error) {
    console.error(`Get Available Medicines Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching medicine catalog'
    });
  }
};

/**
 * @route GET /api/medicines/summary
 * @desc Get inventory summary metrics
 */
export const getInventorySummary = async (req, res) => {
  try {
    const { role, id } = req.user;

    const query = {};
    if (role === 'medicalProvider') {
      query.medicalProvider = new mongoose.Types.ObjectId(id);
    }

    const totalMedicines = await Medicine.countDocuments(query);
    const activeMedicines = await Medicine.countDocuments({ ...query, isActive: true });
    const availableMedicines = await Medicine.countDocuments({ ...query, isActive: true, availability: 'available', stockQuantity: { $gt: 0 } });
    const unavailableMedicines = await Medicine.countDocuments({ ...query, availability: 'unavailable' });
    const outOfStockMedicines = await Medicine.countDocuments({ ...query, stockQuantity: 0 });
    const lowStockMedicines = await Medicine.countDocuments({ ...query, stockQuantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } });

    const stockSumAgg = await Medicine.aggregate([
      { $match: query },
      { $group: { _id: null, totalUnits: { $sum: '$stockQuantity' } } }
    ]);

    const totalStockUnits = stockSumAgg[0]?.totalUnits || 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalMedicines,
        activeMedicines,
        availableMedicines,
        unavailableMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        totalStockUnits,
        lowStockThreshold: LOW_STOCK_THRESHOLD
      }
    });
  } catch (error) {
    console.error(`Get Inventory Summary Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching inventory summary'
    });
  }
};

/**
 * @route GET /api/medicines/low-stock
 * @desc Get low-stock medicines for Medical Provider
 */
export const getLowStockMedicines = async (req, res) => {
  try {
    const query = {
      isActive: true,
      stockQuantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD }
    };

    if (req.user.role === 'medicalProvider') {
      query.medicalProvider = req.user.id;
    } else if (req.query.medicalProvider) {
      query.medicalProvider = req.query.medicalProvider;
    }

    const medicines = await Medicine.find(query)
      .sort({ stockQuantity: 1 })
      .populate('medicalProvider', '_id name phone');

    return res.status(200).json({
      success: true,
      count: medicines.length,
      threshold: LOW_STOCK_THRESHOLD,
      medicines
    });
  } catch (error) {
    console.error(`Get Low Stock Medicines Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching low stock items'
    });
  }
};

/**
 * @route GET /api/medicines/:medicineId
 * @desc Get single medicine detail
 */
export const getMedicineById = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { role, id } = req.user;

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Medicine ID format'
      });
    }

    const medicine = await Medicine.findById(medicineId).populate('medicalProvider', '_id name phone');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine record not found'
      });
    }

    // Role-based visibility validation
    if (role === 'farmer') {
      if (!medicine.isActive || medicine.availability !== 'available' || medicine.stockQuantity <= 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. This medicine is currently unavailable.'
        });
      }
    } else if (role === 'medicalProvider') {
      if (medicine.medicalProvider._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not authorized to access another provider’s medicine record.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      medicine
    });
  } catch (error) {
    console.error(`Get Medicine By ID Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching medicine details'
    });
  }
};

/**
 * @route PATCH /api/medicines/:medicineId
 * @desc Update medicine details (Medical Provider operation)
 */
export const updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const medicalProviderId = req.user.id;
    const { name, genericName, category, description, price, unit } = req.body;

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Medicine ID format'
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine record not found'
      });
    }

    if (medicine.medicalProvider.toString() !== medicalProviderId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify another provider’s medicine.'
      });
    }

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Medicine name must be at least 2 characters long.'
        });
      }
      medicine.name = name.trim();
    }

    if (genericName !== undefined) medicine.genericName = genericName.trim();
    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({ success: false, message: 'Category cannot be empty.' });
      }
      medicine.category = category.trim();
    }
    if (description !== undefined) medicine.description = description.trim();

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
      }
      medicine.price = numericPrice;
    }

    if (unit !== undefined) {
      const validUnits = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'other'];
      if (!validUnits.includes(unit)) {
        return res.status(400).json({ success: false, message: 'Invalid medicine unit.' });
      }
      medicine.unit = unit;
    }

    await medicine.save();
    await medicine.populate('medicalProvider', '_id name phone');

    return res.status(200).json({
      success: true,
      message: 'Medicine details updated successfully',
      medicine
    });
  } catch (error) {
    console.error(`Update Medicine Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating medicine details'
    });
  }
};

/**
 * @route PATCH /api/medicines/:medicineId/stock
 * @desc Update stock quantity (Medical Provider operation)
 */
export const updateStock = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const medicalProviderId = req.user.id;
    const { stockQuantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Medicine ID format'
      });
    }

    const numericStock = Number(stockQuantity);
    if (isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity must be a non-negative number.'
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine record not found'
      });
    }

    if (medicine.medicalProvider.toString() !== medicalProviderId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify this inventory.'
      });
    }

    medicine.stockQuantity = numericStock;

    // Automatic rule: zero stock implies unavailable; adding stock restores availability if active
    if (numericStock === 0) {
      medicine.availability = 'unavailable';
    } else if (numericStock > 0 && medicine.isActive) {
      medicine.availability = 'available';
    }

    await medicine.save();
    await medicine.populate('medicalProvider', '_id name phone');

    return res.status(200).json({
      success: true,
      message: 'Stock quantity updated successfully',
      medicine
    });
  } catch (error) {
    console.error(`Update Stock Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating stock'
    });
  }
};

/**
 * @route PATCH /api/medicines/:medicineId/availability
 * @desc Set availability to 'available' or 'unavailable' (Medical Provider operation)
 */
export const updateAvailability = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const medicalProviderId = req.user.id;
    const { availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Medicine ID format'
      });
    }

    if (!['available', 'unavailable'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be either "available" or "unavailable".'
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine record not found'
      });
    }

    if (medicine.medicalProvider.toString() !== medicalProviderId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify this medicine.'
      });
    }

    // Backend rule: Cannot mark zero-stock item as available
    if (availability === 'available' && medicine.stockQuantity === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set availability to "available" when stock quantity is zero.'
      });
    }

    medicine.availability = availability;
    await medicine.save();
    await medicine.populate('medicalProvider', '_id name phone');

    return res.status(200).json({
      success: true,
      message: `Availability updated to ${availability}`,
      medicine
    });
  } catch (error) {
    console.error(`Update Availability Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating availability'
    });
  }
};

/**
 * @route PATCH /api/medicines/:medicineId/deactivate
 * @desc Deactivate medicine (Soft Delete)
 */
export const deactivateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const medicalProviderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Medicine ID format'
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine record not found'
      });
    }

    if (medicine.medicalProvider.toString() !== medicalProviderId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to deactivate this medicine.'
      });
    }

    medicine.isActive = false;
    medicine.availability = 'unavailable';
    await medicine.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine entry deactivated successfully',
      medicine
    });
  } catch (error) {
    console.error(`Deactivate Medicine Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating medicine'
    });
  }
};

/**
 * @route POST /api/medicines/process-prescription
 * @desc Upload and process prescription to extract medicine names via real OCR and match with DB catalog
 * @access Private (Farmer, Medical Provider, Admin)
 */
export const processPrescription = async (req, res) => {
  try {
    const {
      prescriptionData,
      correctedText,
      fileName = 'prescription.jpg',
      fileType = 'image/jpeg',
      prescribedMedicinesText = ''
    } = req.body;

    // Fetch all active medicines from database
    const dbMedicines = await Medicine.find({ isActive: true })
      .populate('medicalProvider', '_id name phone address');

    let ocrText = '';
    let ocrConfidence = 0;
    let isManuallyCorrected = false;

    // Case 1: Farmer provided corrected text directly (manual edit flow)
    if (correctedText && typeof correctedText === 'string' && correctedText.trim().length > 0) {
      ocrText = correctedText.trim();
      isManuallyCorrected = true;
    } else {
      // Case 2: Process uploaded image file via OCR
      if (!prescriptionData) {
        return res.status(400).json({
          success: false,
          message: 'Prescription document (image data) is required for processing.'
        });
      }

      // Decode and validate image buffer using magic bytes
      let imageBuffer;
      try {
        const validated = parseAndValidateBase64Image(prescriptionData);
        imageBuffer = validated.buffer;
      } catch (valErr) {
        return res.status(400).json({
          success: false,
          message: valErr.message || 'Invalid prescription image format.'
        });
      }

      // Run genuine Tesseract OCR on image pixels
      const ocrResult = await extractTextFromImage(imageBuffer);
      ocrText = ocrResult.rawText || '';
      ocrConfidence = ocrResult.confidence || 0;
    }

    // If manual extra notes / prescribed text was provided alongside OCR, append it
    let combinedText = ocrText;
    if (prescribedMedicinesText && typeof prescribedMedicinesText === 'string') {
      const extraTrimmed = prescribedMedicinesText.trim();
      if (extraTrimmed.length > 0 && !combinedText.toLowerCase().includes(extraTrimmed.toLowerCase())) {
        combinedText = combinedText ? `${combinedText}\n${extraTrimmed}` : extraTrimmed;
      }
    }

    // Check if any readable text was extracted
    if (!combinedText || combinedText.trim().length === 0) {
      return res.status(200).json({
        success: true,
        ocrText: '',
        ocrConfidence: 0,
        originalFileName: fileName,
        detectedMedicines: [],
        matchingMedicines: [],
        unmatchedMedicines: [],
        extractedMedicines: [],
        message: 'No readable text could be extracted from this image. Please upload a clear, well-lit photo or enter medicine names manually.'
      });
    }

    // Parse structured candidates from text
    const candidates = parsePrescriptionLines(combinedText);

    // If lines weren't parsed into standard candidates (e.g. single line / comma separated), extract comma/newline tokens
    if (candidates.length === 0 && combinedText.trim().length > 0) {
      const fallbackTokens = combinedText
        .split(/[,;\n\r]+/)
        .map(t => t.trim())
        .filter(t => t.length > 2);

      fallbackTokens.forEach(t => {
        candidates.push({
          rawLine: t,
          candidateName: t,
          strength: '',
          dosage: '',
          route: '',
          frequency: '',
          duration: ''
        });
      });
    }

    // Match candidates against MongoDB inventory
    const matchResults = matchCandidatesToInventory(candidates, dbMedicines);

    // Format legacy extractedMedicines for backward compatibility with existing modals
    const legacyExtracted = matchResults.detectedMedicines.map(item => ({
      name: item.candidateName,
      genericName: item.matchedMedicine?.genericName || '',
      category: item.matchedMedicine?.category || 'Prescribed Medicine',
      status: item.matchedMedicine?.isAvailable ? 'Available' : (item.matchedMedicine ? 'Out of Stock' : 'Not Currently in Stock'),
      available: !!item.matchedMedicine?.isAvailable,
      medicineId: item.matchedMedicine?._id || null,
      strength: item.strength,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      matchStatus: item.matchStatus,
      confidence: item.confidence
    }));

    return res.status(200).json({
      success: true,
      message: matchResults.matchingMedicines.length > 0
        ? `Prescription analyzed: found ${matchResults.matchingMedicines.length} in-stock medicine(s) in catalog.`
        : 'Prescription analyzed. No in-stock catalog matches found for the detected items.',
      originalFileName: fileName,
      fileType,
      ocrText,
      ocrConfidence,
      isManuallyCorrected,
      detectedMedicines: matchResults.detectedMedicines,
      matchingMedicines: matchResults.matchingMedicines,
      unmatchedMedicines: matchResults.unmatchedMedicines,
      extractedMedicines: legacyExtracted
    });
  } catch (error) {
    console.error(`Process Prescription Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to process prescription image: ' + error.message
    });
  }
};
