import DiseaseScan from '../models/DiseaseScan.js';
import User from '../models/User.js';
import Cattle from '../models/Cattle.js';
import { analyzeCattleImage } from '../services/aiDiseaseService.js';

/**
 * @desc    Submit a new cattle image for AI disease screening
 * @route   POST /api/disease-scans
 * @access  Private (Farmer, Admin)
 */
export const createDiseaseScan = async (req, res) => {
  try {
    const { cattleId, animalType = 'cow', animalIdTag = 'Cattle Tag', imageUrl, symptoms = '' } = req.body;

    if (!cattleId) {
      return res.status(400).json({
        success: false,
        message: 'Cattle selection (cattleId) is required for disease screening.'
      });
    }

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Image URL or captured image file is required for disease screening.'
      });
    }

    // Verify cattle existence and ownership
    const cattle = await Cattle.findById(cattleId);
    if (!cattle) {
      return res.status(404).json({
        success: false,
        message: 'Selected cattle record not found.'
      });
    }

    // Server-side ownership verification
    if (req.user.role === 'farmer' && cattle.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to run AI screening for cattle belonging to another farmer.'
      });
    }

    const resolvedAnimalType = animalType || (cattle.gender === 'male' ? 'bull' : 'cow');
    const resolvedAnimalTag = cattle.nameTag || animalIdTag;

    // Run AI Disease Screening
    const aiResult = await analyzeCattleImage({
      imageUrl,
      animalType: resolvedAnimalType,
      animalIdTag: resolvedAnimalTag
    });

    const newScan = new DiseaseScan({
      farmer: req.user.id,
      cattle: cattle._id,
      animalType: resolvedAnimalType,
      animalIdTag: resolvedAnimalTag,
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
          notes: `Initial AI screening completed for ${cattle.nameTag}: ${aiResult.detectedCondition}`,
          updatedBy: req.user.id,
          timestamp: new Date()
        }
      ]
    });

    await newScan.save();

    // Update cattle's lastHealthCheck timestamp
    cattle.lastHealthCheck = new Date();
    await cattle.save();

    const populatedScan = await DiseaseScan.findById(newScan._id)
      .populate('farmer', 'name phone email')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus lastHealthCheck');

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
 * @desc    Get all disease scans for the logged-in farmer (optionally filtered by cattleId)
 * @route   GET /api/disease-scans
 * @access  Private (Farmer, Admin)
 */
export const getFarmerScans = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { farmer: req.user.id };
    if (req.query.cattleId) {
      filter.cattle = req.query.cattleId;
    }

    const scans = await DiseaseScan.find(filter)
      .populate('farmer', 'name phone email')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus lastHealthCheck')
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
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus lastHealthCheck')
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
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus lastHealthCheck')
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

/**
 * @desc    Get recommended veterinarians for a specific disease scan
 * @route   GET /api/disease-scans/:id/recommended-veterinarians
 * @access  Private (Farmer, Admin)
 */
export const getRecommendedVeterinarians = async (req, res) => {
  try {
    const scan = await DiseaseScan.findById(req.params.id)
      .populate('farmer', 'name phone email')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus');

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Disease scan record not found.'
      });
    }

    // Ownership check: Farmer can only access recommendations for their own scans
    if (req.user.role === 'farmer' && scan.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view recommendations for this disease scan.'
      });
    }

    const detectedCondition = scan.detectedCondition || 'General Health Condition';
    const conditionLower = detectedCondition.toLowerCase();

    // Find all active users with veterinarian role (supporting multi-role users)
    const vets = await User.find({
      isActive: true,
      $or: [{ roles: 'veterinarian' }, { role: 'veterinarian' }]
    }).select('name phone email specialization expertise availability clinicName roles role');

    if (!vets || vets.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No veterinarians are currently registered for recommendation.',
        scan: {
          id: scan._id,
          cattleTag: scan.animalIdTag,
          detectedCondition,
          confidence: scan.confidence,
          symptoms: scan.symptoms
        },
        recommendations: []
      });
    }

    // Score and rank veterinarians (Max Total = 100)
    const rankedVets = vets.map((vet) => {
      let score = 10; // Base suitability score (10 pts)
      const matchReasons = [];

      const spec = vet.specialization || 'Large Animal & Cattle Specialist';
      const exp = vet.expertise && vet.expertise.length > 0
        ? vet.expertise
        : ['Cattle Health', 'Mastitis', 'Foot and Mouth Disease', 'General Diagnostics'];
      const avail = vet.availability || 'available';

      matchReasons.push('General cattle health & veterinary diagnostic match');

      // 1. Condition & Symptom Expertise Match (+40 points)
      const specMatch = spec.toLowerCase().includes(conditionLower) || conditionLower.split(' ').some(word => word.length > 3 && spec.toLowerCase().includes(word));
      const expMatch = exp.some(item => item.toLowerCase().includes(conditionLower) || conditionLower.split(' ').some(word => word.length > 3 && item.toLowerCase().includes(word)));

      if (specMatch || expMatch) {
        score += 40;
        matchReasons.unshift(`Expertise matches preliminary AI screening result (${detectedCondition})`);
      }

      // 2. Availability Match (+30 points)
      if (avail === 'available') {
        score += 30;
        matchReasons.push('Registered veterinarian available for consultation');
      } else if (avail === 'busy') {
        matchReasons.push('Registered veterinarian currently busy');
      } else {
        matchReasons.push('Registered veterinarian currently offline');
      }

      // 3. High Risk Suitability (+20 points)
      if (scan.confidence >= 80 || conditionLower.includes('mastitis') || conditionLower.includes('critical')) {
        score += 20;
        matchReasons.push('Suitable for high-priority cattle healthcare');
      }

      // Clamp score to strict 0–100 range
      score = Math.min(100, Math.max(0, score));

      let matchLevel = 'General Match';
      let badge = 'Available';
      if (score >= 90) {
        matchLevel = 'Highly Suitable';
        badge = 'Best Match';
      } else if (score >= 70) {
        matchLevel = 'Suitable';
        badge = 'Recommended';
      }

      return {
        veterinarianId: vet._id,
        name: vet.name,
        phone: vet.phone,
        email: vet.email,
        specialization: spec,
        expertise: exp,
        availability: avail,
        clinicName: vet.clinicName || 'Regional Veterinary Care Center',
        matchScore: score,
        matchLevel,
        badge,
        matchReasons
      };
    });

    // Sort by match score descending
    rankedVets.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      scan: {
        id: scan._id,
        cattleTag: scan.animalIdTag,
        detectedCondition,
        confidence: scan.confidence,
        symptoms: scan.symptoms
      },
      recommendations: rankedVets
    });
  } catch (error) {
    console.error('Error in getRecommendedVeterinarians:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate veterinarian recommendations.'
    });
  }
};
