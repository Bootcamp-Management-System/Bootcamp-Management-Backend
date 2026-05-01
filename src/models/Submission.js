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
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contentUrl: {
      type: String,
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    driveUrl: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    submissionType: {
      type: String,
      enum: ["file", "github", "drive", "mixed"],
      default: "mixed",
    },
    comment: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "graded", "returned", "reviewed", "resubmission_required"],
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
    gradeLetter: {
      type: String,
      enum: ["A", "B", "C", "D"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    version: {
      type: Number,
      default: 1,
    },
    versions: [
      {
        contentUrl: String,
        title: String,
        description: String,
        githubUrl: String,
        driveUrl: String,
        fileUrl: String,
        fileName: String,
        comment: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

submissionSchema.pre("validate", function validateSubmissionContent() {
  if (!this.contentUrl && !this.githubUrl && !this.driveUrl && !this.fileUrl) {
    this.invalidate("contentUrl", "Submit a file, GitHub link, Google Drive link, or project link");
  }
});

// Prevent duplicate submissions by the same student for the same task
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
