import mongoose, { Document, Model } from "mongoose";

export interface ISurgery {
  type: string;
  minCost: number;
  maxCost: number;
  specialty: string;
}

export interface IHospital extends Document {
  name: string;
  city: string;
  address: string;
  rating: number;
  surgeries: ISurgery[];
  distance?: number;
  image?: string;
  contact?: string;
  // Legacy fields for backward compatibility
  location?: string;
  price?: number;
  specialties?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SurgerySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "Surgery type is required"],
    trim: true,
  },
  minCost: {
    type: Number,
    required: [true, "Minimum cost is required"],
    min: [0, "Cost must be positive"],
  },
  maxCost: {
    type: Number,
    required: [true, "Maximum cost is required"],
    min: [0, "Cost must be positive"],
    validate: {
      validator: function(this: ISurgery, value: number) {
        return value >= this.minCost;
      },
      message: "Maximum cost must be greater than or equal to minimum cost",
    },
  },
  specialty: {
    type: String,
    required: [true, "Specialty is required"],
    trim: true,
  },
}, { _id: false });

const HospitalSchema = new mongoose.Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating must be between 0 and 5"],
      max: [5, "Rating must be between 0 and 5"],
    },
    surgeries: {
      type: [SurgerySchema],
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
    // Legacy fields for backward compatibility
    location: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: [0, "Price must be positive"],
    },
    specialties: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
HospitalSchema.index({ city: 1 });
HospitalSchema.index({ "surgeries.type": 1 });
HospitalSchema.index({ "surgeries.minCost": 1 });
HospitalSchema.index({ rating: -1 });

const Hospital: Model<IHospital> =
  mongoose.models.Hospital || mongoose.model<IHospital>("Hospital", HospitalSchema);

export default Hospital;

