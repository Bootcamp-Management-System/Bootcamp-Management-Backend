import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super-admin', 'admin', 'instructor', 'student'], required: true },
  division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  assignedDivisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Division' }],
  is_Member: { type: Boolean, default: false },
  
  // Recruitment Flow Flags
  is_EmailVerified: { type: Boolean, default: false },
  
  tokenVersion: { type: Number, default: 0 },
  firstLogin: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  googleId: { type: String },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
