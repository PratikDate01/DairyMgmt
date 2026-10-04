import mongoose from 'mongoose';
import User from '../models/User.js';
import DairyFarmerConnection from '../models/DairyFarmerConnection.js';
import { normalizePhone } from '../utils/phoneUtils.js';

/**
 * @route GET /api/dairy-connections/search-farmer
 * @desc Search for a farmer by phone number (Dairy Owner operation)
 */
export const searchFarmer = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number parameter is required'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number'
      });
    }

    // Search for a registered user with role === 'farmer'
    const farmer = await User.findOne({
      phone: normalizedPhone,
      role: 'farmer'
    }).select('_id name phone role isActive');

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer account not found for this mobile number.'
      });
    }

    return res.status(200).json({
      success: true,
      farmer: {
        id: farmer._id,
        name: farmer.name,
        phone: farmer.phone,
        role: farmer.role,
        isActive: farmer.isActive
      }
    });

  } catch (error) {
    console.error(`Search Farmer Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while searching for farmer'
    });
  }
};

/**
 * @route POST /api/dairy-connections/request
 * @desc Send a connection request from a Dairy Owner to a Farmer
 */
export const requestConnection = async (req, res) => {
  try {
    const { farmerPhone, farmerId } = req.body;
    const dairyOwnerId = req.user.id;

    let targetFarmer = null;

    if (farmerId) {
      if (!mongoose.Types.ObjectId.isValid(farmerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid farmer ID format'
        });
      }
      targetFarmer = await User.findById(farmerId);
    } else if (farmerPhone) {
      const normalizedPhone = normalizePhone(farmerPhone);
      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number'
        });
      }
      targetFarmer = await User.findOne({ phone: normalizedPhone, role: 'farmer' });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Farmer ID or phone number is required'
      });
    }

    if (!targetFarmer || targetFarmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Target user is not a registered farmer'
      });
    }

    if (targetFarmer._id.toString() === dairyOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot connect to your own account'
      });
    }

    // Check existing connection record
    let connection = await DairyFarmerConnection.findOne({
      dairyOwner: dairyOwnerId,
      farmer: targetFarmer._id
    });

    if (connection) {
      if (connection.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'This farmer is already actively connected to your dairy.'
        });
      }
      if (connection.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'A connection request is already pending with this farmer.'
        });
      }
      // If rejected or disconnected, reset status to pending
      connection.status = 'pending';
      await connection.save();
    } else {
      connection = await DairyFarmerConnection.create({
        dairyOwner: dairyOwnerId,
        farmer: targetFarmer._id,
        status: 'pending'
      });
    }

    await connection.populate('farmer', '_id name phone role isActive');
    await connection.populate('dairyOwner', '_id name phone role isActive');

    return res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      connection
    });

  } catch (error) {
    console.error(`Request Connection Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while sending connection request'
    });
  }
};

/**
 * @route GET /api/dairy-connections/dairy-farmers
 * @desc Get all connections for the authenticated Dairy Owner
 */
export const getDairyFarmers = async (req, res) => {
  try {
    const dairyOwnerId = req.user.id;

    const connections = await DairyFarmerConnection.find({ dairyOwner: dairyOwnerId })
      .populate('farmer', '_id name phone role isActive')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: connections.length,
      connections
    });

  } catch (error) {
    console.error(`Get Dairy Farmers Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching connected farmers'
    });
  }
};

/**
 * @route GET /api/dairy-connections/farmer-dairies
 * @desc Get all connections for the authenticated Farmer
 */
export const getFarmerDairies = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const connections = await DairyFarmerConnection.find({ farmer: farmerId })
      .populate('dairyOwner', '_id name phone role isActive')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: connections.length,
      connections
    });

  } catch (error) {
    console.error(`Get Farmer Dairies Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dairy connections'
    });
  }
};

/**
 * @route PATCH /api/dairy-connections/:connectionId/accept
 * @desc Accept an incoming connection request (Farmer operation)
 */
export const acceptConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid connection ID format'
      });
    }

    const connection = await DairyFarmerConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Ownership check: must be target farmer
    if (connection.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to accept this connection request.'
      });
    }

    connection.status = 'active';
    await connection.save();
    await connection.populate('dairyOwner', '_id name phone role isActive');
    await connection.populate('farmer', '_id name phone role isActive');

    return res.status(200).json({
      success: true,
      message: 'Connection request accepted successfully',
      connection
    });

  } catch (error) {
    console.error(`Accept Connection Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while accepting connection request'
    });
  }
};

/**
 * @route PATCH /api/dairy-connections/:connectionId/reject
 * @desc Reject an incoming connection request (Farmer operation)
 */
export const rejectConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid connection ID format'
      });
    }

    const connection = await DairyFarmerConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Ownership check: must be target farmer
    if (connection.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to reject this connection request.'
      });
    }

    connection.status = 'rejected';
    await connection.save();
    await connection.populate('dairyOwner', '_id name phone role isActive');
    await connection.populate('farmer', '_id name phone role isActive');

    return res.status(200).json({
      success: true,
      message: 'Connection request rejected',
      connection
    });

  } catch (error) {
    console.error(`Reject Connection Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while rejecting connection request'
    });
  }
};

/**
 * @route PATCH /api/dairy-connections/:connectionId/disconnect
 * @desc Disconnect an existing connection (Dairy Owner or Farmer)
 */
export const disconnectConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid connection ID format'
      });
    }

    const connection = await DairyFarmerConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection relationship not found'
      });
    }

    // Ownership check: must be either the dairy owner or the farmer
    const userId = req.user.id;
    if (connection.dairyOwner.toString() !== userId && connection.farmer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify this connection relationship.'
      });
    }

    connection.status = 'disconnected';
    await connection.save();
    await connection.populate('dairyOwner', '_id name phone role isActive');
    await connection.populate('farmer', '_id name phone role isActive');

    return res.status(200).json({
      success: true,
      message: 'Relationship disconnected successfully',
      connection
    });

  } catch (error) {
    console.error(`Disconnect Connection Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while disconnecting relationship'
    });
  }
};
