import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number or email is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          return /^(?:\+91|0)?[6-9]\d{9}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number or email address`
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['farmer', 'dairyOwner', 'medicalProvider', 'admin', 'veterinarian'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'farmer'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

const User = mongoose.model('User', userSchema);

export default User;

