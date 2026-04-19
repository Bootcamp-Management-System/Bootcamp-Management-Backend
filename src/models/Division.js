import mongoose from "mongoose";

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Division name is required"],
      enum: ["cyber", "cpd", "datascience", "development"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Division", divisionSchema);