import mongoose, { Document, Model } from "mongoose";

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new mongoose.Schema<IReport>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
ReportSchema.index({ userId: 1 });
ReportSchema.index({ uploadedAt: -1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;

