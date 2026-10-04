import DiseaseScan from '../models/DiseaseScan.js';
import User from '../models/User.js';
import { analyzeCattleImage } from '../services/aiDiseaseService.js';

/**
 * @desc    Submit a new cattle image for AI disease screening
 * @route   POST /api/disease-scans
 * @access  Private (Farmer, Admin)
 */
export const createDiseaseScan = async (req, res) => {
  try {
    const { animalType = 'cow', animalIdTag = 'Cattle Tag', imageUrl, symptoms = '' } = req.body;

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Image URL or captured image file is required for disease screening.'
      });
    }

    // Run AI Disease Screening
    const aiResult = await analyzeCattleImage({
      imageUrl,
      animalType,
      animalIdTag
    });

    const newScan = new DiseaseScan({
      farmer: req.user.id,
      animalType,
      animalIdTag,
      imageUrl,
      scanStatus: 'analyzed',
      detectedCondition: aiResult.detectedCondition,
      confidence: aiResult.confidence,
      symptoms: symptoms || aiResult.symptoms,
      recommendations: aiResult.recommendations,
      veterinarianRecommended: aiResult.veterinarianRecommended,
      veterinarianReviewStatus: 'pending_review',
      timeline: [
        {
          status: 'AI_SCREENING_COMPLETED',
          notes: `Initial AI screening completed: ${aiResult.detectedCondition}`,
          updatedBy: req.user.id,
          timestamp: new Date()
        }
      ]
    });

    await newScan.save();

    const populatedScan = await DiseaseScan.findById(newScan._id).populate('farmer', 'name phone email');

    res.status(201).json({
      success: true,
      message: 'Image uploaded and AI screening completed successfully.',
      data: populatedScan
    });
  } catch (error) {
    console.error('Error creating disease scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process disease scan. ' + error.message
    });
  }
};

/**
 * @desc    Get all disease scans for the logged-in farmer
 * @route   GET /api/disease-scans
 * @access  Private (Farmer, Admin)
 */
export const getFarmerScans = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { farmer: req.user.id };
    const scans = await DiseaseScan.find(filter)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    console.error('Error fetching farmer scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve disease scan history.'
    });
  }
};

/**
 * @desc    Get a single disease scan detail report
 * @route   GET /api/disease-scans/:id
 * @access  Private (Farmer, Veterinarian, Admin)
 */
export const getScanById = async (req, res) => {
  try {
    const scan = await DiseaseScan.findById(req.params.id)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email');

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Disease scan record not found.'
      });
    }

    // Authorization check: Farmer can only access own scan
    if (
      req.user.role === 'farmer' &&
      scan.farmer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot view disease scans belonging to another farmer.'
      });
    }

    res.status(200).json({
      success: true,
      data: scan
    });
  } catch (error) {
    console.error('Error fetching scan details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan details.'
    });
  }
};

/**
 * @desc    Get cases queue for Veterinarians
 * @route   GET /api/veterinarian/cases
 * @access  Private (Veterinarian, Admin)
 */
export const getVeterinarianCases = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.veterinarianReviewStatus = status;
    }

    const cases = await DiseaseScan.find(query)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    console.error('Error fetching vet cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch veterinarian case queue.'
    });
  }
};

/**
 * @desc    Review & update disease case by Veterinarian
 * @route   PATCH /api/veterinarian/cases/:id/review
 * @access  Private (Veterinarian, Admin)
 */
export const reviewCaseByVeterinarian = async (req, res) => {
  try {
    const { veterinarianNotes, veterinarianRecommendation, reviewStatus, followUpRequired } = req.body;

    const scan = await DiseaseScan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Disease scan case not found.'
      });
    }

    scan.veterinarian = req.user.id;
    if (veterinarianNotes !== undefined) scan.veterinarianNotes = veterinarianNotes;
    if (veterinarianRecommendation !== undefined) scan.veterinarianRecommendation = veterinarianRecommendation;
    if (reviewStatus) scan.veterinarianReviewStatus = reviewStatus;
    if (followUpRequired !== undefined) scan.followUpRequired = followUpRequired;

    scan.timeline.push({
      status: reviewStatus ? reviewStatus.toUpperCase() : 'VET_REVIEW_UPDATED',
      notes: `Veterinarian review updated: ${veterinarianRecommendation || 'Professional evaluation completed.'}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    await scan.save();

    const updatedScan = await DiseaseScan.findById(scan._id)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email');

    res.status(200).json({
      success: true,
      message: 'Veterinarian case review updated successfully.',
      data: updatedScan
    });
  } catch (error) {
    console.error('Error updating vet review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record veterinarian review.'
    });
  }
};
