import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import MilkCollection from '../models/MilkCollection.js';
import DairyFarmerConnection from '../models/DairyFarmerConnection.js';
import User from '../models/User.js';

/**
 * @route GET /api/payments/unpaid-collections
 * @desc Get unsettled milk collections for a selected farmer and date range (Dairy Owner)
 */
export const getUnpaidCollections = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { farmerId, startDate, endDate } = req.query;

    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Farmer ID is required'
      });
    }

    // Verify active connection
    const activeConnection = await DairyFarmerConnection.findOne({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      status: 'active'
    });

    if (!activeConnection) {
      return res.status(403).json({
        success: false,
        message: 'This farmer is not actively connected to your dairy.'
      });
    }

    // Build query for milk collections
    const collectionQuery = {
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      paymentStatus: { $ne: 'settled' }
    };

    if (startDate || endDate) {
      collectionQuery.collectionDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        const d = new Date(startDate);
        collectionQuery.collectionDate.$gte = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        const d = new Date(endDate);
        collectionQuery.collectionDate.$lte = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      }
    }

    // Load all collections matching filter
    const allCollections = await MilkCollection.find(collectionQuery).sort({ collectionDate: -1 });

    // Double check active payments for this farmer and dairy owner to exclude any collections in non-cancelled payments
    const activePayments = await Payment.find({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      paymentStatus: { $ne: 'cancelled' }
    }).select('collectionIds milkCollections');

    const settledCollectionIds = new Set();
    activePayments.forEach((p) => {
      if (Array.isArray(p.collectionIds)) {
        p.collectionIds.forEach((id) => settledCollectionIds.add(id.toString()));
      }
      if (Array.isArray(p.milkCollections)) {
        p.milkCollections.forEach((id) => settledCollectionIds.add(id.toString()));
      }
    });

    // Filter out collections that are already in active payments or marked settled
    const unpaidCollections = allCollections.filter(
      (c) => c.paymentStatus !== 'settled' && !settledCollectionIds.has(c._id.toString())
    );

    const totalUnsettledAmount = unpaidCollections.reduce(
      (sum, c) => sum + (c.totalAmount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: unpaidCollections.length,
      totalUnsettledAmount: Math.round(totalUnsettledAmount * 100) / 100,
      collections: unpaidCollections
    });

  } catch (error) {
    console.error(`Get Unpaid Collections Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching unpaid collections'
    });
  }
};

/**
 * @route POST /api/payments/preview
 * @desc Calculate settlement preview before creating payment
 */
export const previewSettlement = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { farmerId, collectionIds, paidAmount, paymentMethod, paymentDate, remarks } = req.body;

    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Farmer ID is required'
      });
    }

    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one milk collection must be selected'
      });
    }

    // Verify active connection
    const activeConnection = await DairyFarmerConnection.findOne({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      status: 'active'
    });

    if (!activeConnection) {
      return res.status(403).json({
        success: false,
        message: 'This farmer is not actively connected to your dairy.'
      });
    }

    // Fetch target collections
    const collections = await MilkCollection.find({
      _id: { $in: collectionIds },
      dairyOwner: dairyOwnerId,
      farmer: farmerId
    });

    if (collections.length !== collectionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected milk collection records could not be found or do not belong to this farmer.'
      });
    }

    // Check double payment: check if any collection is already settled or in an active payment
    const settledInColl = collections.some((c) => c.paymentStatus === 'settled');
    const activePayments = await Payment.find({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      paymentStatus: { $ne: 'cancelled' },
      $or: [
        { collectionIds: { $in: collectionIds } },
        { milkCollections: { $in: collectionIds } }
      ]
    });

    if (settledInColl || activePayments.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected milk collections have already been included in an active payment settlement.'
      });
    }

    // Authoritative gross amount calculation
    const grossAmount = Math.round(collections.reduce((sum, c) => sum + (c.totalAmount || 0), 0) * 100) / 100;
    const totalQuantity = Math.round(collections.reduce((sum, c) => sum + (c.quantityLiters || 0), 0) * 10) / 10;
    const paid = paidAmount !== undefined ? Math.round(Number(paidAmount) * 100) / 100 : grossAmount;

    if (paid > grossAmount) {
      return res.status(400).json({
        success: false,
        message: `Paid amount (₹${paid}) cannot exceed gross amount (₹${grossAmount})`
      });
    }

    const remainingAmount = Math.round((grossAmount - paid) * 100) / 100;
    const paymentStatus = paid === 0 ? 'pending' : remainingAmount === 0 ? 'paid' : 'partiallyPaid';

    return res.status(200).json({
      success: true,
      collectionCount: collections.length,
      totalQuantityLiters: totalQuantity,
      grossAmount,
      paidAmount: paid,
      remainingAmount,
      paymentStatus,
      collections
    });

  } catch (error) {
    console.error(`Preview Settlement Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating settlement preview'
    });
  }
};

/**
 * @route POST /api/payments
 * @desc Create a new payment settlement (Dairy Owner operation)
 */
export const createPayment = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const {
      farmerId,
      collectionIds,
      paymentPeriodStart,
      paymentPeriodEnd,
      paidAmount,
      paymentMethod = 'cash',
      paymentDate = new Date(),
      referenceNumber = '',
      remarks = ''
    } = req.body;

    // 1. Validation
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Farmer ID is required'
      });
    }

    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one milk collection record for settlement'
      });
    }

    // 2. Active connection check
    const activeConnection = await DairyFarmerConnection.findOne({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      status: 'active'
    });

    if (!activeConnection) {
      return res.status(403).json({
        success: false,
        message: 'This farmer is not actively connected to your dairy.'
      });
    }

    // 3. Load target collections and verify ownership
    const collections = await MilkCollection.find({
      _id: { $in: collectionIds },
      dairyOwner: dairyOwnerId,
      farmer: farmerId
    });

    if (collections.length !== collectionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Selected milk collections could not be verified for this farmer'
      });
    }

    // Derive period start/end if missing
    let pStart = paymentPeriodStart;
    let pEnd = paymentPeriodEnd;

    if (!pStart || !pEnd) {
      const dates = collections.map((c) => new Date(c.collectionDate).getTime());
      if (!pStart) pStart = new Date(Math.min(...dates));
      if (!pEnd) pEnd = new Date(Math.max(...dates));
    }

    const startDateObj = new Date(pStart);
    const endDateObj = new Date(pEnd);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment period dates'
      });
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Payment period end date cannot be earlier than start date'
      });
    }

    // 4. Double payment check: ensure no collection is already settled or in an active payment
    const settledInColl = collections.some((c) => c.paymentStatus === 'settled');
    const existingActivePayment = await Payment.findOne({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      paymentStatus: { $ne: 'cancelled' },
      $or: [
        { collectionIds: { $in: collectionIds } },
        { milkCollections: { $in: collectionIds } }
      ]
    });

    if (settledInColl || existingActivePayment) {
      return res.status(409).json({
        success: false,
        message: 'This milk collection has already been included in a payment settlement.'
      });
    }

    // 5. Authoritative backend money calculations
    const grossAmountRaw = collections.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const grossAmount = Math.round(grossAmountRaw * 100) / 100;

    const paid = Number(paidAmount);
    if (isNaN(paid) || paid < 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount must be a non-negative number'
      });
    }

    if (paid > grossAmount) {
      return res.status(400).json({
        success: false,
        message: `Paid amount (₹${paid}) cannot exceed total gross settlement amount (₹${grossAmount})`
      });
    }

    const remainingAmount = Math.round((grossAmount - paid) * 100) / 100;

    let paymentStatus = 'pending';
    if (remainingAmount === 0) {
      paymentStatus = 'paid';
    } else if (paid > 0) {
      paymentStatus = 'partiallyPaid';
    }

    // 6. Create payment document
    const newPayment = await Payment.create({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      collectionIds,
      milkCollections: collectionIds,
      paymentPeriodStart: startDateObj,
      paymentPeriodEnd: endDateObj,
      grossAmount,
      paidAmount: paid,
      remainingAmount,
      paymentStatus,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim()
    });

    // Update milk collections to settled
    await MilkCollection.updateMany(
      { _id: { $in: collectionIds } },
      { $set: { paymentStatus: 'settled', paymentId: newPayment._id } }
    );

    await newPayment.populate('farmer', '_id name phone');
    await newPayment.populate('dairyOwner', '_id name phone');
    await newPayment.populate('collectionIds');
    await newPayment.populate('milkCollections');

    return res.status(201).json({
      success: true,
      message: 'Payment settlement created successfully',
      payment: newPayment
    });

  } catch (error) {
    console.error(`Create Payment Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating payment settlement'
    });
  }
};

/**
 * @route GET /api/payments/dairy-owner
 * @desc Get payment history for authenticated Dairy Owner
 */
export const getDairyOwnerPayments = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { farmerId, status, startDate, endDate } = req.query;

    const query = { dairyOwner: dairyOwnerId };
    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      query.farmer = farmerId;
    }
    if (status && ['pending', 'partiallyPaid', 'paid', 'cancelled'].includes(status)) {
      query.paymentStatus = status;
    }
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }

    const payments = await Payment.find(query)
      .populate('farmer', '_id name phone')
      .populate('collectionIds')
      .populate('milkCollections')
      .sort({ createdAt: -1 });

    // Calculate aggregated stats
    const totalGross = payments
      .filter((p) => p.paymentStatus !== 'cancelled')
      .reduce((sum, p) => sum + (p.grossAmount || 0), 0);
    const totalPaid = payments
      .filter((p) => p.paymentStatus !== 'cancelled')
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalPending = payments
      .filter((p) => p.paymentStatus !== 'cancelled')
      .reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

    return res.status(200).json({
      success: true,
      count: payments.length,
      metrics: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100
      },
      payments
    });

  } catch (error) {
    console.error(`Get Dairy Owner Payments Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payment history'
    });
  }
};

/**
 * @route GET /api/payments/farmer
 * @desc Get payment history for authenticated Farmer (Read-Only)
 */
export const getFarmerPayments = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const payments = await Payment.find({ farmer: farmerId })
      .populate('dairyOwner', '_id name phone')
      .populate('collectionIds')
      .populate('milkCollections')
      .sort({ createdAt: -1 });

    const totalPaid = payments
      .filter((p) => p.paymentStatus !== 'cancelled')
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalPending = payments
      .filter((p) => p.paymentStatus !== 'cancelled')
      .reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

    return res.status(200).json({
      success: true,
      count: payments.length,
      metrics: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100
      },
      payments
    });

  } catch (error) {
    console.error(`Get Farmer Payments Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payment history'
    });
  }
};

/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment details
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Payment ID format'
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('farmer', '_id name phone')
      .populate('dairyOwner', '_id name phone')
      .populate('collectionIds')
      .populate('milkCollections');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Ownership check: must be dairyOwner, farmer, or admin
    if (
      payment.dairyOwner._id.toString() !== userId &&
      payment.farmer._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to view this payment record.'
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    console.error(`Get Payment Details Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payment details'
    });
  }
};

/**
 * @route PATCH /api/payments/:paymentId/status
 * @desc Update payment status or record additional payment (Dairy Owner operation)
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { paymentId } = req.params;
    const { additionalPaidAmount, newStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Payment ID format'
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (payment.dairyOwner.toString() !== dairyOwnerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify this payment record.'
      });
    }

    if (newStatus === 'cancelled') {
      payment.paymentStatus = 'cancelled';
      await payment.save();

      // Reset milk collections back to unpaid
      const collIds = payment.collectionIds && payment.collectionIds.length > 0 ? payment.collectionIds : payment.milkCollections;
      if (collIds && collIds.length > 0) {
        await MilkCollection.updateMany(
          { _id: { $in: collIds } },
          { $set: { paymentStatus: 'unpaid', paymentId: null } }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Payment settlement cancelled successfully',
        payment
      });
    }

    if (additionalPaidAmount !== undefined) {
      const add = Number(additionalPaidAmount);
      if (isNaN(add) || add <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Additional paid amount must be a positive number'
        });
      }

      const updatedPaid = Math.round((payment.paidAmount + add) * 100) / 100;
      if (updatedPaid > payment.grossAmount) {
        return res.status(400).json({
          success: false,
          message: `Total paid amount (₹${updatedPaid}) cannot exceed gross amount (₹${payment.grossAmount})`
        });
      }

      payment.paidAmount = updatedPaid;
      payment.remainingAmount = Math.round((payment.grossAmount - updatedPaid) * 100) / 100;

      if (payment.remainingAmount === 0) {
        payment.paymentStatus = 'paid';
      } else if (payment.paidAmount > 0) {
        payment.paymentStatus = 'partiallyPaid';
      }
    }

    await payment.save();
    await payment.populate('farmer', '_id name phone');
    await payment.populate('dairyOwner', '_id name phone');
    await payment.populate('collectionIds');
    await payment.populate('milkCollections');

    return res.status(200).json({
      success: true,
      message: 'Payment settlement updated successfully',
      payment
    });

  } catch (error) {
    console.error(`Update Payment Status Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating payment status'
    });
  }
};
