import bcrypt from "bcryptjs";
import mongoose, { Document, Model } from "mongoose";

// TypeScript interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email"
      ]
    },
    password: { 
      type: String, 
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ["patient", "doctor", "admin"],
        message: "{VALUE} is not a valid role"
      },
      default: "patient",
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        //delete ret.password;
        return ret;
      }
    }
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Note: email already has unique: true, so we don't need a separate index
// The unique: true on email field automatically creates an index
// Removing duplicate index to avoid conflicts

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Clean up old username index if it exists (one-time operation)
if (mongoose.connection.readyState === 1) {
  // Only run if already connected
  User.collection.dropIndex("username_1").catch((err: any) => {
    // Index doesn't exist or already dropped - that's fine
    if (err.code !== 27 && err.codeName !== "IndexNotFound") {
      console.warn("Could not drop old username index:", err.message);
    }
  });
} else {
  // If not connected yet, set up a one-time listener
  mongoose.connection.once("connected", async () => {
    try {
      await User.collection.dropIndex("username_1");
      console.log("✅ Cleaned up old username index");
    } catch (err: any) {
      // Index doesn't exist or already dropped - that's fine
      if (err.code !== 27 && err.codeName !== "IndexNotFound") {
        console.warn("Could not drop old username index:", err.message);
      }
    }
  });
}

export default User;