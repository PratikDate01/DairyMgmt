import Cattle from '../models/Cattle.js';

/**
 * @route   POST /api/cattle
 * @desc    Create a new cattle record for the authenticated farmer
 * @access  Private (Farmer, Admin)
 */
export const createCattle = async (req, res) => {
  try {
    const { nameTag, breed, gender, ageYears, healthStatus, imageUrl, notes } = req.body;

    if (!nameTag || !nameTag.trim() || !breed || !breed.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cattle name/tag number and breed are required.'
      });
    }

    const farmerId = req.user.role === 'admin' && req.body.farmer ? req.body.farmer : req.user.id;

    const newCattle = await Cattle.create({
      farmer: farmerId,
      nameTag: nameTag.trim(),
      breed: breed.trim(),
      gender: gender || 'female',
      ageYears: ageYears !== undefined && ageYears !== null ? Number(ageYears) : 3,
      healthStatus: healthStatus || 'healthy',
      imageUrl: imageUrl || '',
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Cattle record registered successfully.',
      cattle: newCattle
    });
  } catch (error) {
    console.error(`Create Cattle Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering cattle record.'
    });
  }
};

/**
 * @route   GET /api/cattle
 * @desc    Get all cattle records owned by the authenticated farmer
 * @access  Private (Farmer, Veterinarian, Admin)
 */
export const getFarmerCattle = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'farmer') {
      // Strict ownership scoping for farmers
      query.farmer = req.user.id;
    } else if (req.query.farmerId) {
      query.farmer = req.query.farmerId;
    }

    const cattleList = await Cattle.find(query)
      .populate('farmer', 'name phone email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cattleList.length,
      cattle: cattleList
    });
  } catch (error) {
    console.error(`Get Cattle Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cattle records.'
    });
  }
};

/**
 * @route   GET /api/cattle/:id
 * @desc    Get a single cattle record with ownership check
 * @access  Private (Farmer, Veterinarian, Admin)
 */
export const getCattleById = async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id).populate('farmer', 'name phone email');

    if (!cattle) {
      return res.status(404).json({
        success: false,
        message: 'Cattle record not found.'
      });
    }

    // Strict Ownership Enforcement
    if (req.user.role === 'farmer' && cattle.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this cattle record.'
      });
    }

    return res.status(200).json({
      success: true,
      cattle
    });
  } catch (error) {
    console.error(`Get Cattle By ID Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cattle record details.'
    });
  }
};

/**
 * @route   PATCH /api/cattle/:id
 * @desc    Update a cattle record with ownership check
 * @access  Private (Farmer, Admin)
 */
export const updateCattle = async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);

    if (!cattle) {
      return res.status(404).json({
        success: false,
        message: 'Cattle record not found.'
      });
    }

    // Strict Ownership Enforcement
    if (req.user.role === 'farmer' && cattle.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to update this cattle record.'
      });
    }

    const { nameTag, breed, gender, ageYears, healthStatus, imageUrl, notes, lastHealthCheck } = req.body;

    if (nameTag !== undefined) cattle.nameTag = nameTag.trim();
    if (breed !== undefined) cattle.breed = breed.trim();
    if (gender !== undefined) cattle.gender = gender;
    if (ageYears !== undefined) cattle.ageYears = Number(ageYears);
    if (healthStatus !== undefined) cattle.healthStatus = healthStatus;
    if (imageUrl !== undefined) cattle.imageUrl = imageUrl;
    if (notes !== undefined) cattle.notes = notes.trim();
    if (lastHealthCheck !== undefined) cattle.lastHealthCheck = lastHealthCheck;

    await cattle.save();

    return res.status(200).json({
      success: true,
      message: 'Cattle record updated successfully.',
      cattle
    });
  } catch (error) {
    console.error(`Update Cattle Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating cattle record.'
    });
  }
};

/**
 * @route   DELETE /api/cattle/:id
 * @desc    Delete a cattle record with ownership check
 * @access  Private (Farmer, Admin)
 */
export const deleteCattle = async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);

    if (!cattle) {
      return res.status(404).json({
        success: false,
        message: 'Cattle record not found.'
      });
    }

    // Strict Ownership Enforcement
    if (req.user.role === 'farmer' && cattle.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this cattle record.'
      });
    }

    await cattle.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Cattle record deleted successfully.'
    });
  } catch (error) {
    console.error(`Delete Cattle Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting cattle record.'
    });
  }
};
