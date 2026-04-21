import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    description: {
      type: String,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: [true, "Division ID is required"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Removed required as per request
    },
    location: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
  },
  { timestamps: true }
);

sessionSchema.index({ instructor: 1, startTime: 1, endTime: 1 });
sessionSchema.index({ division: 1, startTime: 1, endTime: 1 });

export default mongoose.model("Session", sessionSchema);