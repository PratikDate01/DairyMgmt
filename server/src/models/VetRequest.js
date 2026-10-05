import mongoose from 'mongoose';

const vetRequestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required']
    },
    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Veterinarian reference is required'],
      index: true
    },
    cattle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle',
      required: [true, 'Cattle reference is required']
    },
    diseaseScan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiseaseScan',
      required: [true, 'Disease scan reference is required']
    },
    symptoms: {
      type: String,
      trim: true,
      default: ''
    },
    aiCondition: {
      type: String,
      trim: true,
      default: 'General Condition'
    },
    riskLevel: {
      type: String,
      trim: true,
      default: 'Moderate'
    },
    farmerMessage: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'escalated'],
      default: 'pending',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    escalationHistory: [
      {
        veterinarian: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        status: {
          type: String,
          enum: ['rejected', 'timeout', 'escalated'],
          default: 'rejected'
        },
        reason: {
          type: String,
          trim: true,
          default: ''
        },
        assignedAt: {
          type: Date
        },
        respondedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'vet_requests'
  }
);

vetRequestSchema.index({ farmer: 1, createdAt: -1 });
vetRequestSchema.index({ veterinarian: 1, createdAt: -1 });
vetRequestSchema.index({ diseaseScan: 1, veterinarian: 1, status: 1 });

const VetRequest = mongoose.model('VetRequest', vetRequestSchema);

export default VetRequest;
