import mongoose from "mongoose";

const applicationTemplateSchema = new mongoose.Schema(
  {
    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
      unique: true,
    },
    phase1Fields: [
      {
        name: String,
        label: String,
        type: { type: String, enum: ["text", "textarea", "number", "dropdown"], default: "text" },
        options: [String], // Only for dropdowns
        required: { type: Boolean, default: true },
      },
    ],
    phase2Fields: [
      {
        name: String,
        label: String,
        type: { type: String, enum: ["text", "textarea", "url"], default: "text" },
        required: { type: Boolean, default: true },
      },
    ],
    waitlistFields: [
      {
        name: String,
        label: String,
        type: { type: String, enum: ["text", "textarea", "url"], default: "text" },
        required: { type: Boolean, default: true },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ApplicationTemplate", applicationTemplateSchema);
