import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    showOnLandingPage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Prevent a student from rating the same session twice
feedbackSchema.index({ student: 1, session: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);
