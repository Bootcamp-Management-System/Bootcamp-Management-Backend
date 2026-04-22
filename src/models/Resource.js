import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  file_url: {
    type: String,
    required: true,
  },
  file_type: {
    type: String,
  },
  bootcamp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bootcamp',
    required: [true, 'Division ID is required'],
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploader_role: {
    type: String,
  },
  visibility: {
    type: String,
    enum: ['public', 'bootcamp'],
    default: 'bootcamp'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Resource', resourceSchema);