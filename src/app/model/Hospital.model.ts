import mongoose, { Document, Model } from "mongoose";

export interface IHospital extends Document {
  name: string;
  location: string;
  price: number;
  rating: number;
  specialties: string[];
  distance?: number;
  image?: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new mongoose.Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating must be between 0 and 5"],
      max: [5, "Rating must be between 0 and 5"],
    },
    specialties: {
      type: [String],
      required: [true, "Specialties are required"],
      default: [],
    },
    distance: {
      type: Number,
      min: [0, "Distance must be positive"],
    },
    image: {
      type: String,
    },
    contact: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
HospitalSchema.index({ location: 1 });
HospitalSchema.index({ price: 1 });
HospitalSchema.index({ rating: -1 });

const Hospital: Model<IHospital> =
  mongoose.models.Hospital || mongoose.model<IHospital>("Hospital", HospitalSchema);

export default Hospital;

