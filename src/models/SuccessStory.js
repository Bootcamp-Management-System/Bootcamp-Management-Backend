import mongoose from "mongoose";

const successStorySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
    },
    studentImage: {
      type: String, // URL to the student's photo
    },
    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
    },
    story: {
      type: String,
      required: true,
    },
    achievement: {
      type: String, // e.g. "Software Engineer at Google"
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SuccessStory", successStorySchema);
