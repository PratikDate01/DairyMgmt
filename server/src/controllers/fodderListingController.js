import FodderListing from '../models/FodderListing.js';
import User from '../models/User.js';

/**
 * @desc    Create a new fodder marketplace listing
 * @route   POST /api/fodder-listings
 * @access  Private (Farmer, Admin)
 */
export const createListing = async (req, res) => {
  try {
    const {
      title,
      fodderType,
      customFodderType,
      description,
      price,
      quantity,
      quantityUnit = 'kg',
      availableDate,
      imageUrl,
      location,
      contactPhone
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Listing title is required' });
    }
    if (!fodderType) {
      return res.status(400).json({ success: false, message: 'Fodder type is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number greater than 0' });
    }
    if (quantity === undefined || quantity === null || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0' });
    }
    if (!location || !location.area || !location.city) {
      return res.status(400).json({ success: false, message: 'Location area/village and city/town are required' });
    }

    // Fetch farmer profile for phone fallback if not provided
    const farmerUser = await User.findById(req.user.id);

    const listing = new FodderListing({
      farmer: req.user.id,
      title: title.trim(),
      fodderType,
      customFodderType: fodderType === 'Other' ? (customFodderType || '').trim() : '',
      description: description.trim(),
      price: Number(price),
      quantity: Number(quantity),
      quantityUnit,
      availableDate: availableDate ? new Date(availableDate) : new Date(),
      imageUrl: imageUrl || '',
      location: {
        area: location.area.trim(),
        city: location.city.trim(),
        district: (location.district || '').trim(),
        state: (location.state || '').trim()
      },
      contactPhone: contactPhone || farmerUser?.phone || '',
      status: 'active'
    });

    await listing.save();
    await listing.populate('farmer', 'name phone email role');

    return res.status(201).json({
      success: true,
      message: 'Fodder listing published successfully',
      listing
    });
  } catch (error) {
    console.error('Error in createListing:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating fodder listing'
    });
  }
};

/**
 * @desc    Get all active fodder listings for the marketplace
 * @route   GET /api/fodder-listings
 * @access  Private (Farmer, Admin, All Auth)
 */
export const getMarketplaceListings = async (req, res) => {
  try {
    const { fodderType, search } = req.query;

    const query = { status: 'active' };

    if (fodderType && fodderType !== 'All') {
      query.fodderType = fodderType;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.area': searchRegex },
        { 'location.city': searchRegex }
      ];
    }

    const listings = await FodderListing.find(query)
      .populate('farmer', 'name phone email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Error in getMarketplaceListings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching fodder marketplace listings'
    });
  }
};

/**
 * @desc    Get listings created by the logged-in farmer
 * @route   GET /api/fodder-listings/farmer
 * @access  Private (Farmer, Admin)
 */
export const getFarmerListings = async (req, res) => {
  try {
    const listings = await FodderListing.find({ farmer: req.user.id })
      .populate('farmer', 'name phone email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Error in getFarmerListings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your fodder listings'
    });
  }
};

/**
 * @desc    Get single fodder listing details
 * @route   GET /api/fodder-listings/:id
 * @access  Private
 */
export const getListingById = async (req, res) => {
  try {
    const listing = await FodderListing.findById(req.params.id)
      .populate('farmer', 'name phone email role');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Fodder listing not found' });
    }

    return res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Error in getListingById:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching listing details'
    });
  }
};

/**
 * @desc    Update a fodder listing (ownership verified)
 * @route   PATCH /api/fodder-listings/:id
 * @access  Private (Owner Farmer or Admin)
 */
export const updateListing = async (req, res) => {
  try {
    const listing = await FodderListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Fodder listing not found' });
    }

    // Server-side ownership security check
    if (req.user.role !== 'admin' && listing.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own fodder listings'
      });
    }

    const {
      title,
      fodderType,
      customFodderType,
      description,
      price,
      quantity,
      quantityUnit,
      availableDate,
      imageUrl,
      location,
      status,
      contactPhone
    } = req.body;

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }

    if (quantity !== undefined && Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    if (title) listing.title = title.trim();
    if (fodderType) listing.fodderType = fodderType;
    if (customFodderType !== undefined) listing.customFodderType = customFodderType.trim();
    if (description) listing.description = description.trim();
    if (price !== undefined) listing.price = Number(price);
    if (quantity !== undefined) listing.quantity = Number(quantity);
    if (quantityUnit) listing.quantityUnit = quantityUnit;
    if (availableDate) listing.availableDate = new Date(availableDate);
    if (imageUrl !== undefined) listing.imageUrl = imageUrl;
    if (status) listing.status = status;
    if (contactPhone) listing.contactPhone = contactPhone.trim();

    if (location) {
      if (location.area) listing.location.area = location.area.trim();
      if (location.city) listing.location.city = location.city.trim();
      if (location.district !== undefined) listing.location.district = location.district.trim();
      if (location.state !== undefined) listing.location.state = location.state.trim();
    }

    await listing.save();
    await listing.populate('farmer', 'name phone email role');

    return res.status(200).json({
      success: true,
      message: 'Fodder listing updated successfully',
      listing
    });
  } catch (error) {
    console.error('Error in updateListing:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating fodder listing'
    });
  }
};

/**
 * @desc    Delete a fodder listing (ownership verified)
 * @route   DELETE /api/fodder-listings/:id
 * @access  Private (Owner Farmer or Admin)
 */
export const deleteListing = async (req, res) => {
  try {
    const listing = await FodderListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Fodder listing not found' });
    }

    // Server-side ownership security check
    if (req.user.role !== 'admin' && listing.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own fodder listings'
      });
    }

    await FodderListing.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Fodder listing deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteListing:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting fodder listing'
    });
  }
};
