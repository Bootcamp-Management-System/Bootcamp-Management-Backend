import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bootcamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Bootcamp', required: true },
  division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Lead mentor
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'], default: 'ACTIVE' },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
