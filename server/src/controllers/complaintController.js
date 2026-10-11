import Complaint from '../models/Complaint.js';

/**
 * @route POST /api/complaints
 * @desc Submit a new complaint / grievance (authenticated users)
 */
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Complaint title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Complaint description is required' });
    }

    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      category: category || 'general',
      submittedBy: userId
    });

    await complaint.save();

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error(`Create Complaint Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting complaint'
    });
  }
};

/**
 * @route GET /api/complaints/my
 * @desc Get list of complaints submitted by the authenticated user
 */
export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const complaints = await Complaint.find({ submittedBy: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error(`Get My Complaints Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching your complaints'
    });
  }
};
