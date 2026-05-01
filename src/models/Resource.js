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
  resource_type: {
    type: String,
    enum: ['file', 'link'],
    default: 'file',
  },
  file_url: {
    type: String,
  },
  external_url: {
    type: String,
    trim: true,
  },
  file_type: {
    type: String,
    enum: ['pdf', 'video', 'image', 'zip', 'docx', 'pptx', 'link'],
  },
  bootcamp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bootcamp',
    default: null
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    default: null
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
  },
  download_count: {
    type: Number,
    default: 0,
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

resourceSchema.pre('validate', function validateResourceTarget(next) {
  if (this.resource_type === 'link' && !this.external_url) {
    this.invalidate('external_url', 'External URL is required for link resources');
  }

  if (this.resource_type === 'file' && !this.file_url) {
    this.invalidate('file_url', 'File URL is required for uploaded resources');
  }

  next();
});

export default mongoose.model('Resource', resourceSchema);
