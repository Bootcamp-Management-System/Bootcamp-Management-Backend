import mongoose from 'mongoose';

const bootcampSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  division: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Division', 
    required: true 
  },
  description: { 
    type: String 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['PLANNING', 'RECRUITING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNING'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  bannerImage: { 
    type: String 
  },
  detailedHistory: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model('Bootcamp', bootcampSchema);
