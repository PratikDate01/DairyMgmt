import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    collectionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MilkCollection',
        required: [true, 'At least one milk collection ID is required']
      }
    ],
    milkCollections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MilkCollection'
      }
    ],
    paymentPeriodStart: {
      type: Date,
      required: [true, 'Payment period start date is required']
    },
    paymentPeriodEnd: {
      type: Date,
      required: [true, 'Payment period end date is required']
    },
    grossAmount: {
      type: Number,
      required: [true, 'Gross amount is required'],
      min: [0, 'Gross amount cannot be negative']
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0, 'Paid amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      min: [0, 'Remaining amount cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'partiallyPaid', 'paid', 'cancelled'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending',
      index: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'bankTransfer', 'upi', 'other'],
        message: '{VALUE} is not a valid payment method'
      },
      default: 'cash'
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'payments'
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
