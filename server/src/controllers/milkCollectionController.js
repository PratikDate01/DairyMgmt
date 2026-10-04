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
      session
    });

    if (existingCollection) {
      return res.status(409).json({
        success: false,
        message: `A milk collection already exists for this farmer on ${normalizedDate.toISOString().split('T')[0]} (${session} shift).`
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
    const { farmerId, date } = req.query;

    const query = { dairyOwner: dairyOwnerId };

    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      query.farmer = farmerId;
    }

    if (date && !isNaN(new Date(date).getTime())) {
      const d = new Date(date);
      const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      query.collectionDate = { $gte: startOfDay, $lte: endOfDay };
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

    const collections = await MilkCollection.find({ farmer: farmerId })
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
