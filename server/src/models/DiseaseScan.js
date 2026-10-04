import mongoose from 'mongoose';

const diseaseScanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required']
    },
    animalType: {
      type: String,
      enum: ['cow', 'buffalo', 'goat', 'sheep', 'other'],
      default: 'cow',
      required: true
    },
    animalIdTag: {
      type: String,
      trim: true,
      default: 'Cattle Tag'
    },
    imageUrl: {
      type: String,
      required: [true, 'Scan image URL is required']
    },
    publicId: {
      type: String,
      default: ''
    },
    scanStatus: {
      type: String,
      enum: ['pending', 'analyzed', 'failed'],
      default: 'analyzed'
    },
    detectedCondition: {
      type: String,
      required: true,
      trim: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    symptoms: {
      type: String,
      trim: true
    },
    recommendations: {
      type: String,
      trim: true
    },
    veterinarianRecommended: {
      type: Boolean,
      default: true
    },
    veterinarianReviewStatus: {
      type: String,
      enum: [
        'pending_review',
        'under_review',
        'review_completed',
        'info_requested',
        'closed'
      ],
      default: 'pending_review'
    },
    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    veterinarianNotes: {
      type: String,
      trim: true,
      default: ''
    },
    veterinarianRecommendation: {
      type: String,
      trim: true,
      default: ''
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    timeline: [
      {
        status: { type: String, required: true },
        notes: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'disease_scans'
  }
);

diseaseScanSchema.index({ farmer: 1, createdAt: -1 });
diseaseScanSchema.index({ veterinarianReviewStatus: 1 });

const DiseaseScan = mongoose.model('DiseaseScan', diseaseScanSchema);

export default DiseaseScan;
