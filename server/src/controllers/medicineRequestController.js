import MedicineRequest from '../models/MedicineRequest.js';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';

/**
 * @desc    Create a new medicine request (Farmer only)
 * @route   POST /api/medicine-requests
 * @access  Private (Farmer)
 */
export const createMedicineRequest = async (req, res) => {
  try {
    const { medicineId, quantity, notes } = req.body;

    if (!medicineId) {
      return res.status(400).json({ success: false, message: 'Medicine ID is required' });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    // Find medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    if (!medicine.isActive) {
      return res.status(400).json({ success: false, message: 'This medicine is no longer active' });
    }

    if (medicine.availability !== 'available' || medicine.stockQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'This medicine is currently out of stock or unavailable' });
    }

    if (parsedQuantity > medicine.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${parsedQuantity}) exceeds current stock (${medicine.stockQuantity})`
      });
    }

    // Protection against rapid duplicate submissions (e.g. double click within 5 seconds for same medicine and farmer)
    const recentDuplicate = await MedicineRequest.findOne({
      farmer: req.user.id,
      medicine: medicineId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentDuplicate) {
      return res.status(429).json({
        success: false,
        message: 'A duplicate request was submitted recently. Please wait a moment.'
      });
    }

    // Snapshot values calculated on backend
    const unitPriceSnapshot = Number(medicine.price);
    const totalAmount = Number((unitPriceSnapshot * parsedQuantity).toFixed(2));
    const medicineNameSnapshot = medicine.name;
    const medicalProvider = medicine.medicalProvider;

    const newRequest = await MedicineRequest.create({
      farmer: req.user.id,
      medicalProvider,
      medicine: medicine._id,
      medicineNameSnapshot,
      unitPriceSnapshot,
      quantity: parsedQuantity,
      totalAmount,
      status: 'pending',
      notes: notes ? String(notes).trim() : '',
      requestedAt: new Date()
    });

    const populatedRequest = await MedicineRequest.findById(newRequest._id)
      .populate('medicine', 'name genericName category unit price')
      .populate('medicalProvider', 'name email phone storeName');

    return res.status(201).json({
      success: true,
      message: 'Medicine request submitted successfully',
      data: populatedRequest
    });
  } catch (error) {
    console.error('Create medicine request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create medicine request', error: error.message });
  }
};

/**
 * @desc    Get requests created by authenticated Farmer
 * @route   GET /api/medicine-requests/my
 * @access  Private (Farmer)
 */
export const getMyRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { farmer: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await MedicineRequest.countDocuments(query);
    const requests = await MedicineRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('medicine', 'name genericName category unit availability stockQuantity')
      .populate('medicalProvider', 'name phone email storeName address');

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get farmer requests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your requests', error: error.message });
  }
};

/**
 * @desc    Get requests incoming to authenticated Medical Provider
 * @route   GET /api/medicine-requests/provider
 * @access  Private (Medical Provider)
 */
export const getProviderRequests = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { medicalProvider: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      // Search by medicineNameSnapshot
      query.$or = [
        { medicineNameSnapshot: searchRegex }
      ];

      // Also search by farmer name/phone if matching
      const matchingFarmers = await User.find({
        role: 'farmer',
        $or: [{ name: searchRegex }, { phone: searchRegex }]
      }).select('_id');

      if (matchingFarmers.length > 0) {
        query.$or.push({ farmer: { $in: matchingFarmers.map((f) => f._id) } });
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await MedicineRequest.countDocuments(query);
    const requests = await MedicineRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('farmer', 'name phone address village')
      .populate('medicine', 'name genericName category unit stockQuantity availability');

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get provider requests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch provider requests', error: error.message });
  }
};

/**
 * @desc    Get request summary stats for Medical Provider
 * @route   GET /api/medicine-requests/provider/summary
 * @access  Private (Medical Provider, Admin)
 */
export const getProviderRequestsSummary = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { medicalProvider: req.user.id };

    const counts = await MedicineRequest.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      accepted: 0,
      packed: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0
    };

    counts.forEach((item) => {
      if (summary.hasOwnProperty(item._id)) {
        summary[item._id] = item.count;
      }
      summary.total += item.count;
    });

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Get provider summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary stats', error: error.message });
  }
};

/**
 * @desc    Get single medicine request details
 * @route   GET /api/medicine-requests/:requestId
 * @access  Private (Farmer, Medical Provider, Admin)
 */
export const getMedicineRequestById = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId)
      .populate('farmer', 'name phone address village')
      .populate('medicalProvider', 'name phone email storeName address')
      .populate('medicine', 'name genericName category unit price stockQuantity availability');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    // Role verification
    if (req.user.role === 'farmer' && request.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot view another farmer request' });
    }

    if (req.user.role === 'medicalProvider' && request.medicalProvider._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot view requests assigned to another provider' });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Get request by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch request details', error: error.message });
  }
};

/**
 * @desc    Accept pending request (Medical Provider only)
 * @route   PATCH /api/medicine-requests/:requestId/accept
 * @access  Private (Medical Provider)
 */
export const acceptMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    if (request.medicalProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status '${request.status}'. Only 'pending' requests can be accepted.`
      });
    }

    // Atomic stock check and deduction
    const updatedMedicine = await Medicine.findOneAndUpdate(
      {
        _id: request.medicine,
        isActive: true,
        stockQuantity: { $gte: request.quantity }
      },
      {
        $inc: { stockQuantity: -request.quantity }
      },
      { new: true }
    );

    if (!updatedMedicine) {
      return res.status(409).json({
        success: false,
        message: 'Insufficient stock or medicine is no longer active/available.'
      });
    }

    if (updatedMedicine.stockQuantity === 0) {
      updatedMedicine.availability = 'unavailable';
      await updatedMedicine.save();
    }

    request.status = 'accepted';
    request.acceptedAt = new Date();
    if (req.body.providerRemarks) {
      request.providerRemarks = String(req.body.providerRemarks).trim();
    }
    await request.save();

    const populated = await MedicineRequest.findById(request._id)
      .populate('farmer', 'name phone address')
      .populate('medicine', 'name stockQuantity availability');

    return res.status(200).json({
      success: true,
      message: 'Medicine request accepted successfully',
      data: populated
    });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept medicine request', error: error.message });
  }
};

/**
 * @desc    Reject pending request (Medical Provider only)
 * @route   PATCH /api/medicine-requests/:requestId/reject
 * @access  Private (Medical Provider)
 */
export const rejectMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    if (request.medicalProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${request.status}'. Only 'pending' requests can be rejected.`
      });
    }

    request.status = 'rejected';
    request.rejectedAt = new Date();
    if (req.body.providerRemarks) {
      request.providerRemarks = String(req.body.providerRemarks).trim();
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine request rejected',
      data: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject medicine request', error: error.message });
  }
};

/**
 * @desc    Pack accepted request (Medical Provider only)
 * @route   PATCH /api/medicine-requests/:requestId/pack
 * @access  Private (Medical Provider)
 */
export const packMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    if (request.medicalProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark request as packed from status '${request.status}'. Must be in 'accepted' status.`
      });
    }

    request.status = 'packed';
    request.packedAt = new Date();
    if (req.body.providerRemarks) {
      request.providerRemarks = String(req.body.providerRemarks).trim();
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine request marked as packed',
      data: request
    });
  } catch (error) {
    console.error('Pack request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to pack medicine request', error: error.message });
  }
};

/**
 * @desc    Mark packed request as ready for collection (Medical Provider only)
 * @route   PATCH /api/medicine-requests/:requestId/ready
 * @access  Private (Medical Provider)
 */
export const readyMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    if (request.medicalProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }

    if (request.status !== 'packed') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark request as ready from status '${request.status}'. Must be in 'packed' status.`
      });
    }

    request.status = 'ready';
    request.readyAt = new Date();
    if (req.body.providerRemarks) {
      request.providerRemarks = String(req.body.providerRemarks).trim();
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine request marked as ready for pickup',
      data: request
    });
  } catch (error) {
    console.error('Ready request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set request as ready', error: error.message });
  }
};

/**
 * @desc    Mark ready request as completed (Medical Provider only)
 * @route   PATCH /api/medicine-requests/:requestId/complete
 * @access  Private (Medical Provider)
 */
export const completeMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    if (request.medicalProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }

    if (request.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark request as completed from status '${request.status}'. Must be in 'ready' status.`
      });
    }

    request.status = 'completed';
    request.completedAt = new Date();
    if (req.body.providerRemarks) {
      request.providerRemarks = String(req.body.providerRemarks).trim();
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine request completed successfully',
      data: request
    });
  } catch (error) {
    console.error('Complete request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete medicine request', error: error.message });
  }
};

/**
 * @desc    Cancel medicine request (Farmer or Medical Provider)
 * @route   PATCH /api/medicine-requests/:requestId/cancel
 * @access  Private (Farmer, Medical Provider)
 */
export const cancelMedicineRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Medicine request not found' });
    }

    const isFarmer = req.user.role === 'farmer' && request.farmer.toString() === req.user.id;
    const isProvider = req.user.role === 'medicalProvider' && request.medicalProvider.toString() === req.user.id;

    if (!isFarmer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to cancel this request' });
    }

    // Farmer can only cancel 'pending' requests
    if (isFarmer && request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Farmer cannot cancel request in '${request.status}' status. Only pending requests can be cancelled.`
      });
    }

    // Provider can cancel 'pending' or 'accepted' requests
    if (isProvider && !['pending', 'accepted'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Provider cannot cancel request in '${request.status}' status. Only pending or accepted requests can be cancelled.`
      });
    }

    const previousStatus = request.status;

    // If request was already accepted, restore stock!
    if (previousStatus === 'accepted') {
      await Medicine.findByIdAndUpdate(request.medicine, {
        $inc: { stockQuantity: request.quantity },
        $set: { availability: 'available' }
      });
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    if (req.body.reason) {
      request.notes = request.notes ? `${request.notes} (Cancelled: ${req.body.reason})` : `Cancelled: ${req.body.reason}`;
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Medicine request cancelled successfully',
      data: request
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel medicine request', error: error.message });
  }
};
