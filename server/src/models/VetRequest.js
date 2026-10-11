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
      enum: [
        'pending',
        'accepted',
        'examination',
        'diagnosed',
        'prescription_created',
        'completed',
        'rejected',
        'escalated'
      ],
      default: 'pending',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    clinicalExamination: {
      observations: { type: String, trim: true, default: '' },
      physicalSymptoms: { type: String, trim: true, default: '' },
      temperature: { type: String, trim: true, default: '' },
      appetite: { type: String, trim: true, default: '' },
      additionalNotes: { type: String, trim: true, default: '' },
      examinedAt: { type: Date }
    },
    finalDiagnosis: {
      diagnosis: { type: String, trim: true, default: '' },
      notes: { type: String, trim: true, default: '' },
      severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical', ''], default: '' },
      treatmentAdvice: { type: String, trim: true, default: '' },
      additionalAdvice: { type: String, trim: true, default: '' },
      diagnosedAt: { type: Date }
    },
    prescription: {
      medicines: [
        {
          medicineName: { type: String, trim: true, default: '' },
          dosage: { type: String, trim: true, default: '' },
          frequency: { type: String, trim: true, default: '' },
          duration: { type: String, trim: true, default: '' },
          instructions: { type: String, trim: true, default: '' }
        }
      ],
      generalInstructions: { type: String, trim: true, default: '' },
      dietaryAdvice: { type: String, trim: true, default: '' },
      prescribedAt: { type: Date }
    },
    followUp: {
      required: { type: Boolean, default: false },
      date: { type: Date },
      instructions: { type: String, trim: true, default: '' },
      notes: { type: String, trim: true, default: '' },
      status: { type: String, enum: ['scheduled', 'completed', 'not_required'], default: 'not_required' }
    },
    clinicalTimeline: [
      {
        stage: { type: String, required: true },
        title: { type: String, required: true },
        notes: { type: String, default: '' },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
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
