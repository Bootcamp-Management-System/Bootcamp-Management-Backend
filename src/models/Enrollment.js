import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bootcamp: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bootcamp', 
    required: true 
  },
  is_active: { 
    type: Boolean, 
    default: false 
  },
  enrollment_otp: { 
    code: String,
    expiresAt: Date
  },
  activated_at: { 
    type: Date 
  }
}, { timestamps: true });

// A student can only have one enrollment record per bootcamp
enrollmentSchema.index({ student: 1, bootcamp: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
