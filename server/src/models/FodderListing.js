import mongoose from 'mongoose';

const fodderListingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required']
    },
    title: {
      type: String,
      required: [true, 'Fodder title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    fodderType: {
      type: String,
      required: [true, 'Fodder type is required'],
      enum: [
        'Green Fodder',
        'Dry Fodder',
        'Maize Fodder',
        'Hay',
        'Silage',
        'Grass',
        'Crop Residue',
        'Other'
      ],
      default: 'Green Fodder'
    },
    customFodderType: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    quantityUnit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['kg', 'quintal', 'ton', 'bundle', 'acre'],
      default: 'kg'
    },
    availableDate: {
      type: Date,
      required: [true, 'Available date is required'],
      default: Date.now
    },
    imageUrl: {
      type: String,
      default: ''
    },
    location: {
      area: { type: String, required: [true, 'Area / Village is required'], trim: true },
      city: { type: String, required: [true, 'City / Town is required'], trim: true },
      district: { type: String, default: '', trim: true },
      state: { type: String, default: '', trim: true }
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive', 'expired'],
      default: 'active'
    },
    contactPhone: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual index for fast status and date queries
fodderListingSchema.index({ status: 1, createdAt: -1 });
fodderListingSchema.index({ farmer: 1 });

const FodderListing = mongoose.model('FodderListing', fodderListingSchema);

export default FodderListing;
