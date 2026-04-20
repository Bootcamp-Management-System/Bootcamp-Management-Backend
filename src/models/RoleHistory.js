import mongoose from 'mongoose';

const roleHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previousRole: { type: String, required: true },
  newRole: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  reason: { type: String }
}, { timestamps: true });

export default mongoose.model('RoleHistory', roleHistorySchema);