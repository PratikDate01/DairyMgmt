import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      minlength: [2, 'Medicine name must be at least 2 characters long'],
      maxlength: [150, 'Medicine name cannot exceed 150 characters']
    },
    genericName: {
      type: String,
      trim: true,
      maxlength: [150, 'Generic name cannot exceed 150 characters'],
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative']
    },
    unit: {
      type: String,
      enum: {
        values: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'other'],
        message: '{VALUE} is not a valid unit'
      },
      default: 'tablet'
    },
    availability: {
      type: String,
      enum: {
        values: ['available', 'unavailable'],
        message: '{VALUE} is not a valid availability status'
      },
      default: 'available'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    medicalProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Medical Provider reference is required'],
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'medicines'
  }
);

// Indexes for fast query performance
medicineSchema.index({ medicalProvider: 1, isActive: 1 });
medicineSchema.index({ availability: 1, isActive: 1, stockQuantity: 1 });
medicineSchema.index({ name: 'text', genericName: 'text', category: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
