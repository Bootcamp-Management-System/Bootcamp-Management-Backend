import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'division_admin', 'admin', 'instructor', 'student'], required: true },
  division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  firstLogin: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  googleId: { type: String },
  instructorId: { type: String },
  temporaryPassword: { type: String },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
