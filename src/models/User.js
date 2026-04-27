import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super-admin', 'admin', 'instructor', 'student'], required: true },
  campusId: { type: String, unique: true, sparse: true }, // Optional for admins, required for students (enforced in logic)
  motivation: { type: String },
  dedication: { type: String },
  
  // New Membership-Centric Logic
  memberships: [
    {
      division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
      isMember: { type: Boolean, default: false },
      isInstructor: { type: Boolean, default: false },
      isMentoring: { type: Boolean, default: false }
    }
  ],
  is_Member: { type: Boolean, default: false }, // Global flag: true if user is member of at least one division
  is_Mentoring: { type: Boolean, default: false }, // Global lock for instructor assignments
  
  // Legacy Fields (kept for backward compatibility during migration)
  division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  assignedDivisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Division' }],
  
  // Recruitment Flow Flags
  is_EmailVerified: { type: Boolean, default: false },
  
  tokenVersion: { type: Number, default: 0 },
  firstLogin: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  googleId: { type: String },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetOTP: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
