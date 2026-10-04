import mongoose from 'mongoose';

const milkCollectionSchema = new mongoose.Schema(
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
    collectionDate: {
      type: Date,
      required: [true, 'Collection date is required'],
      index: true
    },
    session: {
      type: String,
      enum: {
        values: ['morning', 'evening'],
        message: '{VALUE} is not a valid shift session'
      },
      default: 'morning',
      required: true
    },
    quantityLiters: {
      type: Number,
      required: [true, 'Milk quantity in liters is required'],
      min: [0.1, 'Milk quantity must be greater than 0']
    },
    fatPercentage: {
      type: Number,
      required: [true, 'Fat percentage is required'],
      min: [0, 'Fat percentage cannot be negative'],
      max: [20, 'Fat percentage cannot exceed 20%']
    },
    ratePerLiter: {
      type: Number,
      required: [true, 'Rate per liter is required'],
      min: [0, 'Rate per liter cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required']
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'settled'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'unpaid',
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'milk_collections'
  }
);

// Compound index to prevent duplicate entries for the same farmer, date, and shift session
milkCollectionSchema.index(
  { dairyOwner: 1, farmer: 1, collectionDate: 1, session: 1 },
  { unique: true }
);

const MilkCollection = mongoose.model('MilkCollection', milkCollectionSchema);

export default MilkCollection;
