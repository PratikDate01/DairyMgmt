import mongoose from 'mongoose';

const dairyFarmerConnectionSchema = new mongoose.Schema(
  {
    dairyOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dairy Owner reference is required'],
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'rejected', 'disconnected'],
        message: '{VALUE} is not a valid connection status'
      },
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'dairy_farmer_connections'
  }
);

// Compound index to ensure uniqueness between a specific dairy owner and farmer
dairyFarmerConnectionSchema.index({ dairyOwner: 1, farmer: 1 }, { unique: true });

const DairyFarmerConnection = mongoose.model('DairyFarmerConnection', dairyFarmerConnectionSchema);

export default DairyFarmerConnection;
