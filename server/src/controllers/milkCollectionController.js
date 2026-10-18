import mongoose from 'mongoose';
import MilkCollection from '../models/MilkCollection.js';
import DairyFarmerConnection from '../models/DairyFarmerConnection.js';
import User from '../models/User.js';

/**
 * @route POST /api/milk-collections
 * @desc Record a new milk collection (Dairy Owner operation)
 */
export const createCollection = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const {
      farmerId,
      collectionDate,
      session = 'morning',
      milkType = 'cow',
      quantityLiters,
      fatPercentage,
      ratePerLiter
    } = req.body;

    // 1. Basic validation
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Farmer ID is required'
      });
    }

    if (!collectionDate || isNaN(new Date(collectionDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid collection date is required'
      });
    }

    if (!['morning', 'evening'].includes(session)) {
      return res.status(400).json({
        success: false,
        message: 'Session must be either morning or evening'
      });
    }

    const normalizedMilkType = String(milkType).toLowerCase();
    if (!['cow', 'buffalo'].includes(normalizedMilkType)) {
      return res.status(400).json({
        success: false,
        message: 'Milk type must be either cow or buffalo'
      });
    }

    const qty = Number(quantityLiters);
    if (isNaN(qty) || qty <= 0 || qty > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number up to 1000 liters'
      });
    }

    const fat = Number(fatPercentage);
    if (isNaN(fat) || fat < 0 || fat > 20) {
      return res.status(400).json({
        success: false,
        message: 'Fat percentage must be a number between 0 and 20'
      });
    }

    const rate = Number(ratePerLiter);
    if (isNaN(rate) || rate < 0 || rate > 500) {
      return res.status(400).json({
        success: false,
        message: 'Rate per liter must be a valid non-negative number'
      });
    }

    // 2. Verify target farmer exists and role is farmer
    const farmerUser = await User.findById(farmerId);
    if (!farmerUser || farmerUser.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer account not found'
      });
    }

    // 3. Connection validation: MUST have an active connection
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

    // 4. Normalize collection date to midnight UTC for uniform comparison and unique index
    const dateObj = new Date(collectionDate);
    const normalizedDate = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    ));

    // 5. Pre-check for duplicate collection
    const existingCollection = await MilkCollection.findOne({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      collectionDate: normalizedDate,
      session,
      milkType: normalizedMilkType
    });

    if (existingCollection) {
      return res.status(409).json({
        success: false,
        message: `A ${normalizedMilkType} milk collection already exists for this farmer on ${normalizedDate.toISOString().split('T')[0]} (${session} shift).`
      });
    }

    // 6. Calculate total amount authoritatively on backend
    const totalAmount = Math.round(qty * rate * 100) / 100;

    // 7. Save collection record
    const newCollection = await MilkCollection.create({
      dairyOwner: dairyOwnerId,
      farmer: farmerId,
      collectionDate: normalizedDate,
      session,
      milkType: normalizedMilkType,
      quantityLiters: qty,
      fatPercentage: fat,
      ratePerLiter: rate,
      totalAmount
    });

    await newCollection.populate('farmer', '_id name phone');
    await newCollection.populate('dairyOwner', '_id name phone');

    return res.status(201).json({
      success: true,
      message: 'Milk collection recorded successfully',
      collection: newCollection
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A milk collection already exists for this farmer, date, and shift session.'
      });
    }

    console.error(`Create Milk Collection Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while recording milk collection'
    });
  }
};

/**
 * @route GET /api/milk-collections/dairy-owner
 * @desc Get collection records for authenticated Dairy Owner
 */
export const getDairyOwnerCollections = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { farmerId, date, startDate, endDate, session, milkType } = req.query;

    const query = { dairyOwner: dairyOwnerId };

    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      query.farmer = farmerId;
    }

    if (session && ['morning', 'evening'].includes(session)) {
      query.session = session;
    }

    if (milkType && ['cow', 'buffalo'].includes(String(milkType).toLowerCase())) {
      query.milkType = String(milkType).toLowerCase();
    }

    if (date && !isNaN(new Date(date).getTime())) {
      const d = new Date(date);
      const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      query.collectionDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.collectionDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        const sd = new Date(startDate);
        query.collectionDate.$gte = new Date(Date.UTC(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0, 0));
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        const ed = new Date(endDate);
        query.collectionDate.$lte = new Date(Date.UTC(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59, 999));
      }
    }

    const collections = await MilkCollection.find(query)
      .populate('farmer', '_id name phone')
      .sort({ collectionDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: collections.length,
      collections
    });

  } catch (error) {
    console.error(`Get Dairy Owner Collections Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching collection history'
    });
  }
};

/**
 * @route GET /api/milk-collections/farmer
 * @desc Get collection records for authenticated Farmer
 */
export const getFarmerCollections = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { startDate, endDate, session, milkType } = req.query;

    const query = { farmer: farmerId };

    if (session && ['morning', 'evening'].includes(session)) {
      query.session = session;
    }

    if (milkType && ['cow', 'buffalo'].includes(String(milkType).toLowerCase())) {
      query.milkType = String(milkType).toLowerCase();
    }

    if (startDate || endDate) {
      query.collectionDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        const sd = new Date(startDate);
        query.collectionDate.$gte = new Date(Date.UTC(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0, 0));
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        const ed = new Date(endDate);
        query.collectionDate.$lte = new Date(Date.UTC(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59, 999));
      }
    }

    const collections = await MilkCollection.find(query)
      .populate('dairyOwner', '_id name phone')
      .sort({ collectionDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: collections.length,
      collections
    });

  } catch (error) {
    console.error(`Get Farmer Collections Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching milk collection history'
    });
  }
};

/**
 * @route GET /api/milk-collections/farmer/:farmerId
 * @desc Dairy Owner gets collection history for a specific connected farmer
 */
export const getFarmerCollectionsForDairy = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;
    const { farmerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Farmer ID format'
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
        message: 'Forbidden. You do not have an active connection with this farmer.'
      });
    }

    const collections = await MilkCollection.find({
      dairyOwner: dairyOwnerId,
      farmer: farmerId
    })
      .populate('farmer', '_id name phone')
      .sort({ collectionDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: collections.length,
      collections
    });

  } catch (error) {
    console.error(`Get Farmer Collections For Dairy Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching farmer collection history'
    });
  }
};

/**
 * @route GET /api/milk-collections/ten-day-summary
 * @desc Generate authoritative 10-day summary with daily breakdown, total liters, gross value, paid amount, and outstanding dues
 */
export const getTenDaySummary = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { farmerId, startDate, endDate } = req.query;

    let targetFarmerId = null;
    let targetDairyOwnerId = null;

    if (role === 'farmer') {
      targetFarmerId = id;
    } else if (role === 'dairyOwner') {
      targetDairyOwnerId = id;
      if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid Farmer ID is required to generate 10-day summary'
        });
      }
      targetFarmerId = farmerId;

      // Verify active connection
      const activeConnection = await DairyFarmerConnection.findOne({
        dairyOwner: targetDairyOwnerId,
        farmer: targetFarmerId,
        status: 'active'
      });

      if (!activeConnection) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. This farmer is not actively connected to your dairy.'
        });
      }
    } else if (role === 'admin') {
      if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
        return res.status(400).json({
          success: false,
          message: 'Farmer ID is required'
        });
      }
      targetFarmerId = farmerId;
      if (req.query.dairyOwnerId && mongoose.Types.ObjectId.isValid(req.query.dairyOwnerId)) {
        targetDairyOwnerId = req.query.dairyOwnerId;
      }
    }

    // Determine date range for 10-day period
    let startUtc = null;
    let endUtc = null;
    let cycleName = 'Custom 10-Day Period';

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate or endDate format'
        });
      }
      startUtc = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0));
      endUtc = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999));
    } else {
      // Default to current 10-day billing cycle (Cycle 1: 1-10, Cycle 2: 11-20, Cycle 3: 21-End)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();

      if (currentDate <= 10) {
        startUtc = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        endUtc = new Date(Date.UTC(currentYear, currentMonth, 10, 23, 59, 59, 999));
        cycleName = `Cycle 1 (1st - 10th ${now.toLocaleString('default', { month: 'short' })})`;
      } else if (currentDate <= 20) {
        startUtc = new Date(Date.UTC(currentYear, currentMonth, 11, 0, 0, 0, 0));
        endUtc = new Date(Date.UTC(currentYear, currentMonth, 20, 23, 59, 59, 999));
        cycleName = `Cycle 2 (11th - 20th ${now.toLocaleString('default', { month: 'short' })})`;
      } else {
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        startUtc = new Date(Date.UTC(currentYear, currentMonth, 21, 0, 0, 0, 0));
        endUtc = new Date(Date.UTC(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59, 999));
        cycleName = `Cycle 3 (21st - ${lastDayOfMonth}th ${now.toLocaleString('default', { month: 'short' })})`;
      }
    }

    // Build query for milk collections
    const query = {
      farmer: targetFarmerId,
      collectionDate: { $gte: startUtc, $lte: endUtc }
    };
    if (targetDairyOwnerId) {
      query.dairyOwner = targetDairyOwnerId;
    }

    const [farmerDoc, collections] = await Promise.all([
      User.findById(targetFarmerId).select('_id name phone'),
      MilkCollection.find(query)
        .populate('dairyOwner', '_id name phone')
        .populate('farmer', '_id name phone')
        .sort({ collectionDate: 1, session: 1 })
    ]);

    // Group collections by date (YYYY-MM-DD)
    const dailyMap = new Map();

    collections.forEach((c) => {
      const dateKey = new Date(c.collectionDate).toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          morning: null,
          evening: null,
          dailyTotalQuantity: 0,
          dailyTotalAmount: 0,
          isFullySettled: false
        });
      }

      const dayObj = dailyMap.get(dateKey);
      const sessionData = {
        _id: c._id,
        quantityLiters: c.quantityLiters,
        fatPercentage: c.fatPercentage,
        ratePerLiter: c.ratePerLiter,
        totalAmount: c.totalAmount,
        paymentStatus: c.paymentStatus
      };

      if (c.session === 'morning') {
        dayObj.morning = sessionData;
      } else if (c.session === 'evening') {
        dayObj.evening = sessionData;
      }

      dayObj.dailyTotalQuantity = Math.round((dayObj.dailyTotalQuantity + c.quantityLiters) * 10) / 10;
      dayObj.dailyTotalAmount = Math.round((dayObj.dailyTotalAmount + c.totalAmount) * 100) / 100;
      dayObj.isFullySettled = (dayObj.morning ? dayObj.morning.paymentStatus === 'settled' : true) &&
                             (dayObj.evening ? dayObj.evening.paymentStatus === 'settled' : true);
    });

    const dailyRecords = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    // Summary calculations
    const totalMilkQuantity = Math.round(collections.reduce((sum, c) => sum + (c.quantityLiters || 0), 0) * 10) / 10;
    const totalRecordedAmount = Math.round(collections.reduce((sum, c) => sum + (c.totalAmount || 0), 0) * 100) / 100;

    // Amount settled/paid for these specific collections
    const settledCollections = collections.filter((c) => c.paymentStatus === 'settled');
    const amountPaid = Math.round(settledCollections.reduce((sum, c) => sum + (c.totalAmount || 0), 0) * 100) / 100;
    const outstandingAmount = Math.max(0, Math.round((totalRecordedAmount - amountPaid) * 100) / 100);

    const avgFat = collections.length > 0
      ? Math.round((collections.reduce((sum, c) => sum + (c.fatPercentage || 0), 0) / collections.length) * 10) / 10
      : 0;

    const avgRate = collections.length > 0
      ? Math.round((collections.reduce((sum, c) => sum + (c.ratePerLiter || 0), 0) / collections.length) * 100) / 100
      : 0;

    return res.status(200).json({
      success: true,
      period: {
        startDate: startUtc.toISOString().split('T')[0],
        endDate: endUtc.toISOString().split('T')[0],
        cycleName
      },
      farmer: farmerDoc || { _id: targetFarmerId, name: 'Farmer', phone: '' },
      summary: {
        totalMilkQuantity,
        totalRecordedAmount,
        amountPaid,
        outstandingAmount,
        averageFat: avgFat,
        averageRate: avgRate,
        collectionCount: collections.length,
        settledCount: settledCollections.length,
        unpaidCount: collections.length - settledCollections.length
      },
      dailyRecords
    });

  } catch (error) {
    console.error(`Get Ten-Day Summary Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating 10-day milk summary'
    });
  }
};
