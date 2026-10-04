import mongoose from 'mongoose';

const medicineRequestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true
    },
    medicalProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Medical Provider reference is required'],
      index: true
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine reference is required'],
      index: true
    },
    medicineNameSnapshot: {
      type: String,
      required: [true, 'Medicine name snapshot is required'],
      trim: true
    },
    unitPriceSnapshot: {
      type: Number,
      required: [true, 'Unit price snapshot is required'],
      min: [0, 'Unit price snapshot cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'packed', 'ready', 'completed', 'cancelled', 'rejected'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    providerRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    packedAt: {
      type: Date,
      default: null
    },
    readyAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'medicine_requests'
  }
);

// Compound indexes for query efficiency
medicineRequestSchema.index({ farmer: 1, createdAt: -1 });
medicineRequestSchema.index({ medicalProvider: 1, status: 1, createdAt: -1 });

const MedicineRequest = mongoose.model('MedicineRequest', medicineRequestSchema);

export default MedicineRequest;
