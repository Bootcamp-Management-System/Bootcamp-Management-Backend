import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID required"],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session ID required"],
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "Excused"],
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);