import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task ID is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    contentUrl: {
      type: String,
      required: [true, "Submission content (URL/Link) is required"],
    },
    comment: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resubmission_required"],
      default: "pending",
    },
    feedback: {
      type: String,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate submissions by the same student for the same task
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
