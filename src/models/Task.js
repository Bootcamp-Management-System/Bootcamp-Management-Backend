import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: [true, "Task must belong to a division"],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Task", taskSchema);
