import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
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
  bootcampApplied: {
    type: String,
    required: true
  },

  status: { 
    type: String, 
    enum: [
      'PENDING',
      'SCREENED_ROUND_1',
      'TASK_EVALUATION',
      'WAITLISTED',
      'WAITLIST_TASK_EVALUATION',
      'ACCEPTED',
      'REJECTED',
      'MEMBER'
    ], 
    default: 'PENDING' 
  },

  // Phase 1: Dynamic answers matching admin-defined phase1Fields in template
  phase1Answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Phase 2: Dynamic answers matching admin-defined phase2Fields in template
  phase2Submission: {
    taskLinkSent: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date }
  },

  // Phase 3: Dynamic answers matching admin-defined waitlistFields in template
  waitlistSubmission: {
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date }
  },

  // Full decision audit trail — admin can decide multiple times
  decisionHistory: [{
    decision: { 
      type: String, 
      enum: ['PASS', 'ACCEPT', 'REJECT', 'WAIT', 'MEMBER'],
      required: true
    },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    timestamp: { type: Date, default: Date.now }
  }],

  bootcamp_id_issued: { type: String }

}, { timestamps: true, autoIndex: false });

// One application per student per bootcamp
// applicationSchema.index({ student: 1, bootcamp: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
