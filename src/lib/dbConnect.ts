import mongoose from "mongoose";

export const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If connection string is missing, throw error
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 MongoDB Connected");
  } catch (err: any) {
    console.error("❌ MongoDB Connection Error:", err);
    throw new Error(`Database connection failed: ${err.message || "Unknown error"}`);
  }
};
