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
      enum: ['farmer', 'dairyOwner', 'medicalProvider', 'admin', 'veterinarian']
    },
    roles: {
      type: [String],
      validate: {
        validator: function (arr) {
          if (!arr || arr.length === 0) return false;
          const validRoles = ['farmer', 'dairyOwner', 'medicalProvider', 'admin', 'veterinarian'];
          return arr.every(r => validRoles.includes(r));
        },
        message: 'Invalid role provided in roles list'
      },
      default: function() {
        return this.role ? [this.role] : ['farmer'];
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    specialization: {
      type: String,
      trim: true,
      default: 'Large Animal & Cattle Specialist'
    },
    expertise: {
      type: [String],
      default: ['Cattle Health', 'Mastitis', 'Foot and Mouth Disease', 'General Diagnostics']
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    clinicName: {
      type: String,
      trim: true,
      default: 'Regional Veterinary Care Center'
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Post-init hook for backward compatibility with older documents having single `role`
userSchema.post('init', function (doc) {
  if (!doc.roles || doc.roles.length === 0) {
    if (doc.role) {
      doc.roles = [doc.role];
    } else {
      doc.roles = ['farmer'];
    }
  }
});

const User = mongoose.model('User', userSchema);

export default User;

