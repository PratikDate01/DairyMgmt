import mongoose from 'mongoose';
import MilkCollection from '../models/MilkCollection.js';
import Payment from '../models/Payment.js';
import DairyFarmerConnection from '../models/DairyFarmerConnection.js';
import User from '../models/User.js';

/**
 * Helper to parse date range filters safely
 */
const parseDateRange = (query) => {
  const { preset, startDate, endDate } = query;
  let start = null;
  let end = null;

  const now = new Date();

  if (preset === 'today') {
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
  } else if (preset === 'last7days') {
    end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);
    start.setUTCHours(0, 0, 0, 0);
  } else if (preset === 'thisMonth') {
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  } else if (preset === 'lastMonth') {
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
  } else if (startDate || endDate) {
    if (startDate) {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) throw new Error('Invalid start date format');
      start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    }
    if (endDate) {
      const d = new Date(endDate);
      if (isNaN(d.getTime())) throw new Error('Invalid end date format');
      end = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
    }
  }

  if (start && end && start > end) {
    throw new Error('Start date cannot be later than end date');
  }

  return { start, end };
};

/**
 * @route GET /api/reports/milk-summary
 * @desc Get overall milk collection summary analytics
 */
export const getMilkSummary = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { start, end } = parseDateRange(req.query);

    const matchStage = {};

    if (role === 'dairyOwner') {
      matchStage.dairyOwner = new mongoose.Types.ObjectId(id);
    } else if (role === 'farmer') {
      matchStage.farmer = new mongoose.Types.ObjectId(id);
    } else if (role === 'admin') {
      if (req.query.farmerId && mongoose.Types.ObjectId.isValid(req.query.farmerId)) {
        matchStage.farmer = new mongoose.Types.ObjectId(req.query.farmerId);
      }
      if (req.query.dairyOwnerId && mongoose.Types.ObjectId.isValid(req.query.dairyOwnerId)) {
        matchStage.dairyOwner = new mongoose.Types.ObjectId(req.query.dairyOwnerId);
      }
    }

    if (start || end) {
      matchStage.collectionDate = {};
      if (start) matchStage.collectionDate.$gte = start;
      if (end) matchStage.collectionDate.$lte = end;
    }

    const aggregation = await MilkCollection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCollectionRecords: { $sum: 1 },
          totalMilkQuantity: { $sum: '$quantityLiters' },
          avgMilkQuantity: { $avg: '$quantityLiters' },
          totalMilkValue: { $sum: '$totalAmount' },
          avgFat: { $avg: '$fatPercentage' },
          avgRate: { $avg: '$ratePerLiter' }
        }
      }
    ]);

    const stats = aggregation[0] || {
      totalCollectionRecords: 0,
      totalMilkQuantity: 0,
      avgMilkQuantity: 0,
      totalMilkValue: 0,
      avgFat: 0,
      avgRate: 0
    };

    return res.status(200).json({
      success: true,
      summary: {
        totalCollectionRecords: stats.totalCollectionRecords,
        totalMilkQuantity: Math.round(stats.totalMilkQuantity * 10) / 10,
        averageMilkQuantity: Math.round(stats.avgMilkQuantity * 10) / 10,
        totalMilkValue: Math.round(stats.totalMilkValue * 100) / 100,
        averageFat: Math.round(stats.avgFat * 10) / 10,
        averageRate: Math.round(stats.avgRate * 100) / 100
      }
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Start date')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error(`Get Milk Summary Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating milk summary' });
  }
};

/**
 * @route GET /api/reports/payment-summary
 * @desc Get payment settlement summary analytics
 */
export const getPaymentSummary = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { start, end } = parseDateRange(req.query);

    const matchStage = {
      paymentStatus: { $ne: 'cancelled' }
    };

    if (role === 'dairyOwner') {
      matchStage.dairyOwner = new mongoose.Types.ObjectId(id);
    } else if (role === 'farmer') {
      matchStage.farmer = new mongoose.Types.ObjectId(id);
    } else if (role === 'admin') {
      if (req.query.farmerId && mongoose.Types.ObjectId.isValid(req.query.farmerId)) {
        matchStage.farmer = new mongoose.Types.ObjectId(req.query.farmerId);
      }
      if (req.query.dairyOwnerId && mongoose.Types.ObjectId.isValid(req.query.dairyOwnerId)) {
        matchStage.dairyOwner = new mongoose.Types.ObjectId(req.query.dairyOwnerId);
      }
    }

    if (start || end) {
      matchStage.paymentDate = {};
      if (start) matchStage.paymentDate.$gte = start;
      if (end) matchStage.paymentDate.$lte = end;
    }

    const aggregation = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPaymentRecords: { $sum: 1 },
          totalGrossAmount: { $sum: '$grossAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalOutstandingAmount: { $sum: '$remainingAmount' },
          paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          partiallyPaidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'partiallyPaid'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } }
        }
      }
    ]);

    const stats = aggregation[0] || {
      totalPaymentRecords: 0,
      totalGrossAmount: 0,
      totalPaidAmount: 0,
      totalOutstandingAmount: 0,
      paidCount: 0,
      partiallyPaidCount: 0,
      pendingCount: 0
    };

    return res.status(200).json({
      success: true,
      summary: {
        totalPaymentRecords: stats.totalPaymentRecords,
        totalGrossAmount: Math.round(stats.totalGrossAmount * 100) / 100,
        totalPaidAmount: Math.round(stats.totalPaidAmount * 100) / 100,
        totalOutstandingAmount: Math.round(stats.totalOutstandingAmount * 100) / 100,
        paidCount: stats.paidCount,
        partiallyPaidCount: stats.partiallyPaidCount,
        pendingCount: stats.pendingCount
      }
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Start date')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error(`Get Payment Summary Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating payment summary' });
  }
};

/**
 * @route GET /api/reports/farmer-summary
 * @desc Get farmer-wise breakdown report (Dairy Owner / Admin)
 */
export const getFarmerSummary = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Farmers cannot access farmer-wise breakdown reports.'
      });
    }

    const dairyOwnerId = role === 'dairyOwner' ? new mongoose.Types.ObjectId(id) : null;

    // Find active connections
    const connQuery = { status: 'active' };
    if (dairyOwnerId) {
      connQuery.dairyOwner = dairyOwnerId;
    }

    const connections = await DairyFarmerConnection.find(connQuery).populate('farmer', '_id name phone');
    const farmerList = connections.map((c) => c.farmer).filter(Boolean);

    if (farmerList.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        farmers: []
      });
    }

    const farmerIds = farmerList.map((f) => f._id);

    // Aggregate milk collection by farmer
    const milkMatch = { farmer: { $in: farmerIds } };
    if (dairyOwnerId) milkMatch.dairyOwner = dairyOwnerId;

    const milkAgg = await MilkCollection.aggregate([
      { $match: milkMatch },
      {
        $group: {
          _id: '$farmer',
          totalMilkQuantity: { $sum: '$quantityLiters' },
          totalMilkValue: { $sum: '$totalAmount' },
          collectionCount: { $sum: 1 },
          lastCollectionDate: { $max: '$collectionDate' }
        }
      }
    ]);

    const milkMap = new Map();
    milkAgg.forEach((item) => milkMap.set(item._id.toString(), item));

    // Aggregate payments by farmer
    const paymentMatch = { farmer: { $in: farmerIds }, paymentStatus: { $ne: 'cancelled' } };
    if (dairyOwnerId) paymentMatch.dairyOwner = dairyOwnerId;

    const paymentAgg = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$farmer',
          totalGross: { $sum: '$grossAmount' },
          totalPaid: { $sum: '$paidAmount' },
          remaining: { $sum: '$remainingAmount' }
        }
      }
    ]);

    const paymentMap = new Map();
    paymentAgg.forEach((item) => paymentMap.set(item._id.toString(), item));

    // Combine results
    const summaryList = farmerList.map((farmer) => {
      const fId = farmer._id.toString();
      const m = milkMap.get(fId) || {};
      const p = paymentMap.get(fId) || {};

      const totalMilkValue = Math.round((m.totalMilkValue || 0) * 100) / 100;
      const totalPaid = Math.round((p.totalPaid || 0) * 100) / 100;
      const outstandingAmount = Math.round(Math.max(0, totalMilkValue - totalPaid) * 100) / 100;

      return {
        farmer: {
          _id: farmer._id,
          name: farmer.name,
          phone: farmer.phone
        },
        totalMilkQuantity: Math.round((m.totalMilkQuantity || 0) * 10) / 10,
        totalMilkValue,
        totalPaid,
        outstandingAmount,
        collectionCount: m.collectionCount || 0,
        lastCollectionDate: m.lastCollectionDate || null
      };
    });

    return res.status(200).json({
      success: true,
      count: summaryList.length,
      farmers: summaryList
    });
  } catch (error) {
    console.error(`Get Farmer Summary Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating farmer summary' });
  }
};

/**
 * @route GET /api/reports/date-wise-milk
 * @desc Get date-wise aggregated milk collections
 */
export const getDateWiseMilk = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { start, end } = parseDateRange(req.query);

    const matchStage = {};

    if (role === 'dairyOwner') {
      matchStage.dairyOwner = new mongoose.Types.ObjectId(id);
    } else if (role === 'farmer') {
      matchStage.farmer = new mongoose.Types.ObjectId(id);
    } else if (role === 'admin' && req.query.farmerId) {
      matchStage.farmer = new mongoose.Types.ObjectId(req.query.farmerId);
    }

    if (start || end) {
      matchStage.collectionDate = {};
      if (start) matchStage.collectionDate.$gte = start;
      if (end) matchStage.collectionDate.$lte = end;
    }

    const aggregation = await MilkCollection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectionDate' } },
          totalLiters: { $sum: '$quantityLiters' },
          avgFat: { $avg: '$fatPercentage' },
          avgRate: { $avg: '$ratePerLiter' },
          totalValue: { $sum: '$totalAmount' },
          collectionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const records = aggregation.map((item) => ({
      date: item._id,
      totalLiters: Math.round(item.totalLiters * 10) / 10,
      averageFat: Math.round(item.avgFat * 10) / 10,
      averageRate: Math.round(item.avgRate * 100) / 100,
      totalValue: Math.round(item.totalValue * 100) / 100,
      collectionCount: item.collectionCount
    }));

    return res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Start date')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error(`Get Date-Wise Milk Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating date-wise milk report' });
  }
};

/**
 * @route GET /api/reports/date-wise-payments
 * @desc Get date-wise aggregated payment settlements
 */
export const getDateWisePayments = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { start, end } = parseDateRange(req.query);

    const matchStage = {
      paymentStatus: { $ne: 'cancelled' }
    };

    if (role === 'dairyOwner') {
      matchStage.dairyOwner = new mongoose.Types.ObjectId(id);
    } else if (role === 'farmer') {
      matchStage.farmer = new mongoose.Types.ObjectId(id);
    }

    if (start || end) {
      matchStage.paymentDate = {};
      if (start) matchStage.paymentDate.$gte = start;
      if (end) matchStage.paymentDate.$lte = end;
    }

    const aggregation = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
          paymentCount: { $sum: 1 },
          grossAmount: { $sum: '$grossAmount' },
          paidAmount: { $sum: '$paidAmount' },
          outstandingAmount: { $sum: '$remainingAmount' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const records = aggregation.map((item) => ({
      date: item._id,
      paymentCount: item.paymentCount,
      grossAmount: Math.round(item.grossAmount * 100) / 100,
      paidAmount: Math.round(item.paidAmount * 100) / 100,
      outstandingAmount: Math.round(item.outstandingAmount * 100) / 100
    }));

    return res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Start date')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error(`Get Date-Wise Payments Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating date-wise payment report' });
  }
};

/**
 * @route GET /api/reports/dashboard-summary
 * @desc Get role-based high-level dashboard metrics (Dairy Owner, Farmer, Admin)
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === 'admin') {
      const [totalUsers, totalFarmers, totalDairyOwners, totalMedicalProviders] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'farmer' }),
        User.countDocuments({ role: 'dairyOwner' }),
        User.countDocuments({ role: 'medicalProvider' })
      ]);

      const milkAgg = await MilkCollection.aggregate([
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantityLiters' },
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ]);

      const payAgg = await Payment.aggregate([
        { $match: { paymentStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalGross: { $sum: '$grossAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$remainingAmount' }
          }
        }
      ]);

      const milk = milkAgg[0] || { totalQuantity: 0, totalValue: 0 };
      const pay = payAgg[0] || { totalPayments: 0, totalGross: 0, totalPaid: 0, totalOutstanding: 0 };

      return res.status(200).json({
        success: true,
        role: 'admin',
        metrics: {
          users: {
            totalUsers,
            totalFarmers,
            totalDairyOwners,
            totalMedicalProviders
          },
          milk: {
            totalQuantity: Math.round(milk.totalQuantity * 10) / 10,
            totalValue: Math.round(milk.totalValue * 100) / 100
          },
          payments: {
            totalPayments: pay.totalPayments,
            totalGross: Math.round(pay.totalGross * 100) / 100,
            totalPaid: Math.round(pay.totalPaid * 100) / 100,
            totalOutstanding: Math.round(pay.totalOutstanding * 100) / 100
          }
        }
      });
    }

    if (role === 'dairyOwner') {
      const ownerId = new mongoose.Types.ObjectId(id);

      const activeFarmersCount = await DairyFarmerConnection.countDocuments({
        dairyOwner: ownerId,
        status: 'active'
      });

      const milkAgg = await MilkCollection.aggregate([
        { $match: { dairyOwner: ownerId } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantityLiters' },
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ]);

      const payAgg = await Payment.aggregate([
        { $match: { dairyOwner: ownerId, paymentStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$remainingAmount' }
          }
        }
      ]);

      const milk = milkAgg[0] || { totalQuantity: 0, totalValue: 0 };
      const pay = payAgg[0] || { totalPaid: 0, totalOutstanding: 0 };

      return res.status(200).json({
        success: true,
        role: 'dairyOwner',
        metrics: {
          activeFarmers: activeFarmersCount,
          totalQuantity: Math.round(milk.totalQuantity * 10) / 10,
          totalValue: Math.round(milk.totalValue * 100) / 100,
          totalPaid: Math.round(pay.totalPaid * 100) / 100,
          totalOutstanding: Math.round(pay.totalOutstanding * 100) / 100
        }
      });
    }

    if (role === 'farmer') {
      const farmerId = new mongoose.Types.ObjectId(id);

      const milkAgg = await MilkCollection.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantityLiters' },
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ]);

      const payAgg = await Payment.aggregate([
        { $match: { farmer: farmerId, paymentStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$remainingAmount' }
          }
        }
      ]);

      const milk = milkAgg[0] || { totalQuantity: 0, totalValue: 0 };
      const pay = payAgg[0] || { totalPaid: 0, totalOutstanding: 0 };

      return res.status(200).json({
        success: true,
        role: 'farmer',
        metrics: {
          totalQuantity: Math.round(milk.totalQuantity * 10) / 10,
          totalValue: Math.round(milk.totalValue * 100) / 100,
          totalPaid: Math.round(pay.totalPaid * 100) / 100,
          totalOutstanding: Math.round(pay.totalOutstanding * 100) / 100
        }
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden. Your role is not authorized for dashboard summary reports.'
    });
  } catch (error) {
    console.error(`Get Dashboard Summary Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error generating dashboard summary' });
  }
};
