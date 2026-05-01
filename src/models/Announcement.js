import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: {
      type: String,
      enum: ['All Users', 'All Students', 'All Instructors', 'All Admins', 'Division'],
      required: true
    },
    division: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
