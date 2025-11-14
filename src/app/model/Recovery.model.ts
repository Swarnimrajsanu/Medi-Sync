import mongoose, { Document, Model } from "mongoose";

export interface IRecoveryTask extends Document {
  type: "medicine" | "exercise" | "followup" | "restriction";
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  scheduledTime?: string;
  frequency?: "daily" | "weekly" | "as-needed";
  completedDates: Date[];
}

export interface IRecoveryPlan extends Document {
  userId: mongoose.Types.ObjectId;
  tasks: IRecoveryTask[];
  startDate: Date;
  endDate?: Date;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryTaskSchema = new mongoose.Schema<IRecoveryTask>({
  type: {
    type: String,
    enum: ["medicine", "exercise", "followup", "restriction"],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  scheduledTime: {
    type: String,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "as-needed"],
    default: "daily",
  },
  completedDates: {
    type: [Date],
    default: [],
  },
});

const RecoveryPlanSchema = new mongoose.Schema<IRecoveryPlan>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    tasks: {
      type: [RecoveryTaskSchema],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
RecoveryPlanSchema.index({ userId: 1 });

const RecoveryPlan: Model<IRecoveryPlan> =
  mongoose.models.RecoveryPlan || mongoose.model<IRecoveryPlan>("RecoveryPlan", RecoveryPlanSchema);

export default RecoveryPlan;

