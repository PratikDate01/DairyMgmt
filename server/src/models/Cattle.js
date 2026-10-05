import mongoose from 'mongoose';

const cattleSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true
    },
    nameTag: {
      type: String,
      required: [true, 'Cattle name or tag number is required'],
      trim: true,
      minlength: [1, 'Name or tag number cannot be empty']
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
      trim: true
    },
    gender: {
      type: String,
      enum: {
        values: ['female', 'male'],
        message: '{VALUE} is not a valid gender option'
      },
      default: 'female'
    },
    ageYears: {
      type: Number,
      default: 3,
      min: [0, 'Age in years cannot be negative']
    },
    healthStatus: {
      type: String,
      enum: {
        values: ['healthy', 'sick', 'under_observation', 'treatment_ongoing'],
        message: '{VALUE} is not a valid health status'
      },
      default: 'healthy'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    lastHealthCheck: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'cattle'
  }
);

cattleSchema.index({ farmer: 1, createdAt: -1 });

const Cattle = mongoose.model('Cattle', cattleSchema);

export default Cattle;
