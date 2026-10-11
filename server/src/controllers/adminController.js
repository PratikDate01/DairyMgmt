import mongoose from 'mongoose';
import User from '../models/User.js';
import Cattle from '../models/Cattle.js';
import VetRequest from '../models/VetRequest.js';
import Medicine from '../models/Medicine.js';
import MedicineRequest from '../models/MedicineRequest.js';
import FodderListing from '../models/FodderListing.js';
import MilkCollection from '../models/MilkCollection.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';

/**
 * @route GET /api/admin/overview-stats
 * @desc Get comprehensive real system metrics and recent feeds across all domains
 */
export const getAdminOverviewStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalDairyOwners,
      totalVeterinarians,
      totalMedicalStores,
      totalAdmins,
      pendingVetVerifications,
      pendingStoreVerifications,
      totalCattle,
      activeVetRequests,
      totalVetRequests,
      totalMedicines,
      totalMedicineRequests,
      activeFodderListings,
      totalFodderListings,
      totalComplaints,
      openComplaints,
      recentUsers,
      recentVetRequests,
      recentMedicineRequests,
      recentFodderListings,
      recentComplaints
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ $or: [{ role: 'farmer' }, { roles: 'farmer' }] }),
      User.countDocuments({ $or: [{ role: 'dairyOwner' }, { roles: 'dairyOwner' }] }),
      User.countDocuments({ $or: [{ role: 'veterinarian' }, { roles: 'veterinarian' }] }),
      User.countDocuments({ $or: [{ role: 'medicalProvider' }, { roles: 'medicalProvider' }] }),
      User.countDocuments({ $or: [{ role: 'admin' }, { roles: 'admin' }] }),
      User.countDocuments({
        $or: [{ role: 'veterinarian' }, { roles: 'veterinarian' }],
        verificationStatus: 'pending'
      }),
      User.countDocuments({
        $or: [{ role: 'medicalProvider' }, { roles: 'medicalProvider' }],
        verificationStatus: 'pending'
      }),
      Cattle.countDocuments(),
      VetRequest.countDocuments({
        status: { $in: ['pending', 'accepted', 'examination', 'diagnosed', 'prescription_created'] }
      }),
      VetRequest.countDocuments(),
      Medicine.countDocuments({ isActive: true }),
      MedicineRequest.countDocuments(),
      FodderListing.countDocuments({ status: 'active' }),
      FodderListing.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      User.find()
        .select('_id name phone email role roles isActive verificationStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      VetRequest.find()
        .populate('farmer', '_id name phone')
        .populate('veterinarian', '_id name phone specialization')
        .populate('cattle', '_id nameTag breed')
        .sort({ createdAt: -1 })
        .limit(5),
      MedicineRequest.find()
        .populate('farmer', '_id name phone')
        .populate('medicalProvider', '_id name phone')
        .populate('medicine', '_id name price')
        .sort({ createdAt: -1 })
        .limit(5),
      FodderListing.find()
        .populate('farmer', '_id name phone')
        .sort({ createdAt: -1 })
        .limit(5),
      Complaint.find()
        .populate('submittedBy', '_id name phone role')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Milk and Payment aggregations
    const [milkAgg, payAgg] = await Promise.all([
      MilkCollection.aggregate([
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantityLiters' },
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { paymentStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$grossAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$remainingAmount' }
          }
        }
      ])
    ]);

    const milk = milkAgg[0] || { totalQuantity: 0, totalValue: 0 };
    const pay = payAgg[0] || { totalGross: 0, totalPaid: 0, totalOutstanding: 0 };

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          totalUsers,
          totalFarmers,
          totalDairyOwners,
          totalVeterinarians,
          totalMedicalStores,
          totalAdmins,
          pendingVetVerifications,
          pendingStoreVerifications
        },
        operations: {
          totalCattle,
          activeVetRequests,
          totalVetRequests,
          totalMedicines,
          totalMedicineRequests,
          activeFodderListings,
          totalFodderListings,
          totalComplaints,
          openComplaints
        },
        financials: {
          totalMilkQuantity: Math.round(milk.totalQuantity * 10) / 10,
          totalMilkValue: Math.round(milk.totalValue * 100) / 100,
          totalGrossPayments: Math.round(pay.totalGross * 100) / 100,
          totalDisbursedFunds: Math.round(pay.totalPaid * 100) / 100,
          totalOutstandingBalance: Math.round(pay.totalOutstanding * 100) / 100
        }
      },
      recent: {
        users: recentUsers,
        vetRequests: recentVetRequests,
        medicineRequests: recentMedicineRequests,
        fodderListings: recentFodderListings,
        complaints: recentComplaints
      }
    });

  } catch (error) {
    console.error(`Admin Overview Stats Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while compiling overview stats'
    });
  }
};

/**
 * @route GET /api/admin/users
 * @desc Get list of all registered users with role, status, verification, and search filtering
 */
export const getAdminUsers = async (req, res) => {
  try {
    const { role, status, verificationStatus, search } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.$or = [{ role }, { roles: role }];
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (verificationStatus && verificationStatus !== 'all') {
      query.verificationStatus = verificationStatus;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: regex },
            { phone: regex },
            { email: regex },
            { clinicName: regex }
          ]
        }
      ];
      delete query.$or;
    }

    const users = await User.find(query)
      .select('_id name phone email role roles isActive verificationStatus verificationNotes licenseNumber clinicName specialization expertise createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error(`Get Admin Users Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user directory'
    });
  }
};

/**
 * @route PATCH /api/admin/users/:id/status
 * @desc Activate or suspend user account
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    if (id === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot suspend your own administrator account.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User account ${targetUser.isActive ? 'activated' : 'suspended'} successfully`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        phone: targetUser.phone,
        isActive: targetUser.isActive
      }
    });

  } catch (error) {
    console.error(`Toggle User Status Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while changing user account status'
    });
  }
};

/**
 * @route PATCH /api/admin/users/:id/verification
 * @desc Approve or reject veterinarian / medical-store verification
 */
export const updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, licenseNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Must be pending, approved, or rejected.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.verificationStatus = status;
    if (notes !== undefined) {
      targetUser.verificationNotes = notes.trim();
    }
    if (licenseNumber !== undefined) {
      targetUser.licenseNumber = licenseNumber.trim();
    }

    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Verification status updated to ${status}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        role: targetUser.role,
        roles: targetUser.roles,
        verificationStatus: targetUser.verificationStatus,
        verificationNotes: targetUser.verificationNotes,
        licenseNumber: targetUser.licenseNumber
      }
    });

  } catch (error) {
    console.error(`Update User Verification Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating verification status'
    });
  }
};

/**
 * @route GET /api/admin/cattle
 * @desc Admin view of all registered cattle across farmers
 */
export const getAdminCattle = async (req, res) => {
  try {
    const { healthStatus, search } = req.query;

    const query = {};

    if (healthStatus && healthStatus !== 'all') {
      query.healthStatus = healthStatus;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ nameTag: regex }, { breed: regex }, { notes: regex }];
    }

    const cattle = await Cattle.find(query)
      .populate('farmer', '_id name phone email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cattle.length,
      cattle
    });

  } catch (error) {
    console.error(`Get Admin Cattle Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cattle records'
    });
  }
};

/**
 * @route GET /api/admin/vet-requests
 * @desc Admin view of all veterinary requests and escalation history
 */
export const getAdminVetRequests = async (req, res) => {
  try {
    const { status, riskLevel, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'all') {
      query.riskLevel = riskLevel;
    }

    const requests = await VetRequest.find(query)
      .populate('farmer', '_id name phone email')
      .populate('veterinarian', '_id name phone email specialization clinicName')
      .populate('cattle', '_id nameTag breed gender ageYears healthStatus')
      .populate('diseaseScan')
      .populate('escalationHistory.veterinarian', '_id name phone specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error(`Get Admin Vet Requests Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching veterinary requests'
    });
  }
};

/**
 * @route GET /api/admin/medicines
 * @desc Admin view of all medicines in the catalog
 */
export const getAdminMedicines = async (req, res) => {
  try {
    const { category, availability, search } = req.query;

    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (availability && availability !== 'all') {
      query.availability = availability;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { genericName: regex }, { category: regex }];
    }

    const medicines = await Medicine.find(query)
      .populate('medicalProvider', '_id name phone email clinicName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: medicines.length,
      medicines
    });

  } catch (error) {
    console.error(`Get Admin Medicines Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching medicines'
    });
  }
};

/**
 * @route GET /api/admin/fodder-listings
 * @desc Admin view of all fodder listings
 */
export const getAdminFodderListings = async (req, res) => {
  try {
    const { status, fodderType, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fodderType && fodderType !== 'all') {
      query.fodderType = fodderType;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { 'location.city': regex }];
    }

    const listings = await FodderListing.find(query)
      .populate('farmer', '_id name phone email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });

  } catch (error) {
    console.error(`Get Admin Fodder Listings Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching fodder listings'
    });
  }
};

/**
 * @route PATCH /api/admin/fodder-listings/:id/status
 * @desc Moderation action: update status of fodder listing
 */
export const moderateFodderListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Listing ID' });
    }

    if (!['active', 'sold', 'inactive', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, sold, inactive, or expired.'
      });
    }

    const listing = await FodderListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, returnDocument: 'after' }
    ).populate('farmer', '_id name phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Fodder listing not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Fodder listing status updated to ${status}`,
      listing
    });

  } catch (error) {
    console.error(`Moderate Fodder Listing Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while moderating fodder listing'
    });
  }
};

/**
 * @route GET /api/admin/complaints
 * @desc Admin view of all complaints
 */
export const getAdminComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const complaints = await Complaint.find(query)
      .populate('submittedBy', '_id name phone email role roles')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });

  } catch (error) {
    console.error(`Get Admin Complaints Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching complaints'
    });
  }
};

/**
 * @route PATCH /api/admin/complaints/:id
 * @desc Update complaint status and resolution notes
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Complaint ID' });
    }

    if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be open, in_progress, resolved, or closed.'
      });
    }

    const updateFields = {};
    if (status) {
      updateFields.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateFields.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      updateFields.adminNotes = adminNotes.trim();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, returnDocument: 'after' }
    ).populate('submittedBy', '_id name phone email role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });

  } catch (error) {
    console.error(`Update Complaint Status Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating complaint'
    });
  }
};
