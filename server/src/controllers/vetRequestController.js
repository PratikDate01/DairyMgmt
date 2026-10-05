import VetRequest from '../models/VetRequest.js';
import DiseaseScan from '../models/DiseaseScan.js';
import Cattle from '../models/Cattle.js';
import User from '../models/User.js';

/**
 * Helper function to select the next suitable veterinarian using Phase 20 recommendation scoring
 */
export const findNextEligibleVeterinarian = async (scan, attemptedVetIds = []) => {
  try {
    const attemptedStrings = attemptedVetIds.map(id => (id ? id.toString() : ''));

    // Find active users with veterinarian role excluding attempted vets
    const candidateVets = await User.find({
      isActive: true,
      _id: { $nin: attemptedStrings },
      $or: [{ roles: 'veterinarian' }, { role: 'veterinarian' }]
    }).select('name phone email specialization expertise availability clinicName roles role');

    if (!candidateVets || candidateVets.length === 0) {
      return null;
    }

    const detectedCondition = scan?.detectedCondition || 'General Health Condition';
    const conditionLower = detectedCondition.toLowerCase();
    const confidence = scan?.confidence || 75;

    // Score candidates using Phase 20 criteria (Max Score: 100)
    const ranked = candidateVets.map((vet) => {
      let score = 10; // Base suitability
      const spec = vet.specialization || 'Large Animal & Cattle Specialist';
      const exp = vet.expertise && vet.expertise.length > 0 ? vet.expertise : ['Cattle Health', 'General Diagnostics'];
      const avail = vet.availability || 'available';

      const specMatch = spec.toLowerCase().includes(conditionLower) || conditionLower.split(' ').some(w => w.length > 3 && spec.toLowerCase().includes(w));
      const expMatch = exp.some(item => item.toLowerCase().includes(conditionLower) || conditionLower.split(' ').some(w => w.length > 3 && item.toLowerCase().includes(w)));
      if (specMatch || expMatch) score += 40;

      if (avail === 'available') score += 30;

      if (confidence >= 80 || conditionLower.includes('mastitis') || conditionLower.includes('critical')) {
        score += 20;
      }

      score = Math.min(100, Math.max(0, score));
      return { vet, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked[0].vet;
  } catch (err) {
    console.error('Error finding next eligible veterinarian:', err);
    return null;
  }
};

/**
 * @desc    Create a new veterinarian consultation request from farmer
 * @route   POST /api/vet-requests
 * @access  Private (Farmer, Admin)
 */
export const createVetRequest = async (req, res) => {
  try {
    const { veterinarianId, diseaseScanId, farmerMessage = '' } = req.body;

    if (!veterinarianId || !diseaseScanId) {
      return res.status(400).json({
        success: false,
        message: 'Veterinarian selection and disease scan reference are required.'
      });
    }

    // Load DiseaseScan & verify existence
    const scan = await DiseaseScan.findById(diseaseScanId).populate('cattle');
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Disease scan record not found.'
      });
    }

    // Ownership Verification: Scan must belong to the authenticated farmer
    if (req.user.role === 'farmer' && scan.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to request consultation for cattle belonging to another farmer.'
      });
    }

    // Load & verify target Veterinarian user
    const targetVet = await User.findById(veterinarianId);
    if (!targetVet || !targetVet.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected veterinarian account not found or is currently inactive.'
      });
    }

    const vetRoles = targetVet.roles && targetVet.roles.length > 0 ? targetVet.roles : [targetVet.role];
    if (!vetRoles.includes('veterinarian')) {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not registered as a veterinarian.'
      });
    }

    // Duplicate Request Protection: Check if a pending request already exists for this scan and vet
    const existingPending = await VetRequest.findOne({
      farmer: req.user.id,
      veterinarian: veterinarianId,
      diseaseScan: diseaseScanId,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: `A consultation request to Dr. ${targetVet.name} is already pending for this health screening.`
      });
    }

    // Derive fields server-side from authoritative DiseaseScan record
    const riskLevel = scan.confidence >= 88 ? 'High' : scan.confidence >= 80 ? 'Moderate' : 'Low';

    const newRequest = new VetRequest({
      farmer: req.user.id,
      veterinarian: targetVet._id,
      cattle: scan.cattle._id || scan.cattle,
      diseaseScan: scan._id,
      symptoms: scan.symptoms || '',
      aiCondition: scan.detectedCondition || 'General Health Concern',
      riskLevel: riskLevel,
      farmerMessage: farmerMessage.trim(),
      status: 'pending',
      requestedAt: new Date()
    });

    await newRequest.save();

    // Update DiseaseScan record linking target veterinarian
    scan.veterinarian = targetVet._id;
    scan.veterinarianReviewStatus = 'under_review';
    scan.timeline.push({
      status: 'VET_REQUESTED',
      notes: `Consultation request sent to Dr. ${targetVet.name}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });
    await scan.save();

    const populatedRequest = await VetRequest.findById(newRequest._id)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email specialization clinicName availability')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl')
      .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms recommendations')
      .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

    return res.status(201).json({
      success: true,
      message: `Consultation request sent successfully to Dr. ${targetVet.name}.`,
      data: populatedRequest
    });

  } catch (error) {
    console.error('Error creating vet request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit veterinarian request. ' + error.message
    });
  }
};

/**
 * @desc    Get all consultation requests submitted by the logged-in farmer
 * @route   GET /api/vet-requests/farmer
 * @access  Private (Farmer, Admin)
 */
export const getFarmerRequests = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { farmer: req.user.id };

    const requests = await VetRequest.find(filter)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email specialization clinicName availability')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl')
      .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms recommendations')
      .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching farmer vet requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your veterinarian requests.'
    });
  }
};

/**
 * @desc    Get incoming consultation requests assigned to the logged-in veterinarian
 * @route   GET /api/vet-requests/veterinarian
 * @access  Private (Veterinarian, Admin)
 */
export const getVeterinarianRequests = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { veterinarian: req.user.id };
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const requests = await VetRequest.find(filter)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email specialization clinicName availability')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus')
      .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms recommendations')
      .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching vet incoming requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve incoming consultation requests.'
    });
  }
};

/**
 * @desc    Get single VetRequest detail
 * @route   GET /api/vet-requests/:id
 * @access  Private (Farmer, Veterinarian, Admin)
 */
export const getVetRequestById = async (req, res) => {
  try {
    const vetReq = await VetRequest.findById(req.params.id)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email specialization clinicName availability')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl healthStatus')
      .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms recommendations')
      .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

    if (!vetReq) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian request record not found.'
      });
    }

    // Security check: Must belong to farmer or veterinarian or admin
    if (
      req.user.role === 'farmer' && vetReq.farmer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have access to view this request.'
      });
    }

    if (
      req.user.role === 'veterinarian' && vetReq.veterinarian._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot view consultation requests assigned to another veterinarian.'
      });
    }

    return res.status(200).json({
      success: true,
      data: vetReq
    });
  } catch (error) {
    console.error('Error fetching vet request detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch request details.'
    });
  }
};

/**
 * @desc    Accept a consultation request by Veterinarian
 * @route   PATCH /api/vet-requests/:id/accept
 * @access  Private (Veterinarian, Admin)
 */
export const acceptVetRequest = async (req, res) => {
  try {
    const vetReq = await VetRequest.findById(req.params.id);

    if (!vetReq) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian request record not found.'
      });
    }

    // Security check: Veterinarian can only accept requests assigned to them
    if (req.user.role === 'veterinarian' && vetReq.veterinarian.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot accept a consultation request assigned to another veterinarian.'
      });
    }

    vetReq.status = 'accepted';
    vetReq.respondedAt = new Date();
    await vetReq.save();

    // Update DiseaseScan timeline
    const scan = await DiseaseScan.findById(vetReq.diseaseScan);
    if (scan) {
      scan.veterinarianReviewStatus = 'under_review';
      scan.timeline.push({
        status: 'VET_ACCEPTED',
        notes: `Consultation request accepted by Dr. ${req.user.name || 'Veterinarian'}`,
        updatedBy: req.user.id,
        timestamp: new Date()
      });
      await scan.save();
    }

    const updated = await VetRequest.findById(vetReq._id)
      .populate('farmer', 'name phone email')
      .populate('veterinarian', 'name phone email specialization clinicName availability')
      .populate('cattle', 'nameTag breed gender ageYears imageUrl')
      .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms')
      .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

    return res.status(200).json({
      success: true,
      message: 'Consultation request accepted successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error accepting vet request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept consultation request.'
    });
  }
};

/**
 * @desc    Reject a consultation request by Veterinarian & automatically escalate to next suitable vet
 * @route   PATCH /api/vet-requests/:id/reject
 * @access  Private (Veterinarian, Admin)
 */
export const rejectVetRequest = async (req, res) => {
  try {
    const { rejectionReason = '' } = req.body;
    const vetReq = await VetRequest.findById(req.params.id);

    if (!vetReq) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian request record not found.'
      });
    }

    // Security check: Veterinarian can only reject requests assigned to them
    if (req.user.role === 'veterinarian' && vetReq.veterinarian.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot reject a consultation request assigned to another veterinarian.'
      });
    }

    const previousVetId = vetReq.veterinarian;
    const reasonText = rejectionReason.trim() || 'Veterinarian is currently unavailable for new cases.';

    // Record rejection in escalation history
    vetReq.escalationHistory.push({
      veterinarian: previousVetId,
      status: 'rejected',
      reason: reasonText,
      assignedAt: vetReq.requestedAt || vetReq.updatedAt || new Date(),
      respondedAt: new Date()
    });

    // Gather all attempted vet IDs
    const attemptedVetIds = [
      previousVetId,
      ...vetReq.escalationHistory.map(h => h.veterinarian)
    ];

    // Find disease scan for recommendation criteria
    const scan = await DiseaseScan.findById(vetReq.diseaseScan);

    // Attempt escalation to next eligible veterinarian
    const nextVet = await findNextEligibleVeterinarian(scan, attemptedVetIds);

    if (nextVet) {
      // Escalation success: Assign next vet and revert to pending
      vetReq.veterinarian = nextVet._id;
      vetReq.status = 'pending';
      vetReq.requestedAt = new Date();
      vetReq.rejectionReason = '';

      await vetReq.save();

      if (scan) {
        scan.veterinarian = nextVet._id;
        scan.veterinarianReviewStatus = 'under_review';
        scan.timeline.push({
          status: 'VET_ESCALATED',
          notes: `Consultation declined by Dr. ${req.user.name || 'Veterinarian'}. Request automatically escalated to Dr. ${nextVet.name}.`,
          updatedBy: req.user.id,
          timestamp: new Date()
        });
        await scan.save();
      }

      const updated = await VetRequest.findById(vetReq._id)
        .populate('farmer', 'name phone email')
        .populate('veterinarian', 'name phone email specialization clinicName availability')
        .populate('cattle', 'nameTag breed gender ageYears imageUrl')
        .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms')
        .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

      return res.status(200).json({
        success: true,
        escalated: true,
        message: `Consultation request declined and automatically forwarded to Dr. ${nextVet.name}.`,
        data: updated
      });
    } else {
      // No available veterinarian: terminal rejected state
      vetReq.status = 'rejected';
      vetReq.rejectionReason = `${reasonText} (No other suitable veterinarian is currently available.)`;
      vetReq.respondedAt = new Date();

      await vetReq.save();

      if (scan) {
        scan.timeline.push({
          status: 'VET_REJECTED',
          notes: `Consultation request declined by Dr. ${req.user.name || 'Veterinarian'}: ${reasonText}. No other suitable veterinarian available.`,
          updatedBy: req.user.id,
          timestamp: new Date()
        });
        await scan.save();
      }

      const updated = await VetRequest.findById(vetReq._id)
        .populate('farmer', 'name phone email')
        .populate('veterinarian', 'name phone email specialization clinicName availability')
        .populate('cattle', 'nameTag breed gender ageYears imageUrl')
        .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms')
        .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

      return res.status(200).json({
        success: true,
        escalated: false,
        message: 'Consultation request declined. No other suitable veterinarian is currently available.',
        data: updated
      });
    }
  } catch (error) {
    console.error('Error rejecting vet request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process veterinarian request decline.'
    });
  }
};

/**
 * @desc    Escalate a pending consultation request to the next available veterinarian (timeout / manual trigger)
 * @route   POST /api/vet-requests/:id/escalate
 * @access  Private (Farmer, Admin)
 */
export const escalateVetRequest = async (req, res) => {
  try {
    const vetReq = await VetRequest.findById(req.params.id);

    if (!vetReq) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian request record not found.'
      });
    }

    // Security check: Must belong to farmer or admin
    if (req.user.role === 'farmer' && vetReq.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only escalate consultation requests submitted for your own cattle.'
      });
    }

    if (vetReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending requests can be escalated. Current status is "${vetReq.status}".`
      });
    }

    // Response Timeout verification
    const timeoutMinutes = parseInt(process.env.VET_REQUEST_TIMEOUT_MINUTES || '30', 10);
    const requestedTime = new Date(vetReq.requestedAt || vetReq.createdAt).getTime();
    const elapsedMinutes = (Date.now() - requestedTime) / (1000 * 60);

    const isForce = req.body.force === true || req.user.role === 'admin';

    if (elapsedMinutes < timeoutMinutes && !isForce) {
      const remainingMins = Math.ceil(timeoutMinutes - elapsedMinutes);
      return res.status(400).json({
        success: false,
        message: `Veterinarian response timeout has not been reached yet. Please wait ${remainingMins} more minute(s) before escalating, or request manual escalation.`
      });
    }

    const previousVetId = vetReq.veterinarian;
    const currentVetUser = await User.findById(previousVetId);

    // Add current vet to escalation history
    vetReq.escalationHistory.push({
      veterinarian: previousVetId,
      status: 'timeout',
      reason: req.body.reason || `No response received within ${timeoutMinutes} minutes timeout limit.`,
      assignedAt: vetReq.requestedAt || vetReq.createdAt,
      respondedAt: new Date()
    });

    const attemptedVetIds = [
      previousVetId,
      ...vetReq.escalationHistory.map(h => h.veterinarian)
    ];

    const scan = await DiseaseScan.findById(vetReq.diseaseScan);

    // Find next eligible vet
    const nextVet = await findNextEligibleVeterinarian(scan, attemptedVetIds);

    if (nextVet) {
      vetReq.veterinarian = nextVet._id;
      vetReq.status = 'pending';
      vetReq.requestedAt = new Date();

      await vetReq.save();

      if (scan) {
        scan.veterinarian = nextVet._id;
        scan.veterinarianReviewStatus = 'under_review';
        scan.timeline.push({
          status: 'VET_ESCALATED_TIMEOUT',
          notes: `Request escalated due to response timeout from Dr. ${currentVetUser?.name || 'Veterinarian'}. Reassigned to Dr. ${nextVet.name}.`,
          updatedBy: req.user.id,
          timestamp: new Date()
        });
        await scan.save();
      }

      const updated = await VetRequest.findById(vetReq._id)
        .populate('farmer', 'name phone email')
        .populate('veterinarian', 'name phone email specialization clinicName availability')
        .populate('cattle', 'nameTag breed gender ageYears imageUrl')
        .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms')
        .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

      return res.status(200).json({
        success: true,
        escalated: true,
        message: `Request successfully escalated and reassigned to Dr. ${nextVet.name}.`,
        data: updated
      });
    } else {
      vetReq.status = 'rejected';
      vetReq.rejectionReason = `Response timeout elapsed for Dr. ${currentVetUser?.name || 'Veterinarian'}. No other suitable veterinarian is currently available.`;
      vetReq.respondedAt = new Date();

      await vetReq.save();

      if (scan) {
        scan.timeline.push({
          status: 'VET_ESCALATION_FAILED',
          notes: `Response timeout elapsed. Escalation attempted but no other suitable veterinarian is available.`,
          updatedBy: req.user.id,
          timestamp: new Date()
        });
        await scan.save();
      }

      const updated = await VetRequest.findById(vetReq._id)
        .populate('farmer', 'name phone email')
        .populate('veterinarian', 'name phone email specialization clinicName availability')
        .populate('cattle', 'nameTag breed gender ageYears imageUrl')
        .populate('diseaseScan', 'imageUrl detectedCondition confidence symptoms')
        .populate('escalationHistory.veterinarian', 'name phone email specialization clinicName');

      return res.status(200).json({
        success: true,
        escalated: false,
        message: 'No other suitable veterinarian is currently available to accept this escalated request.',
        data: updated
      });
    }
  } catch (error) {
    console.error('Error escalating vet request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to escalate veterinarian request. ' + error.message
    });
  }
};
