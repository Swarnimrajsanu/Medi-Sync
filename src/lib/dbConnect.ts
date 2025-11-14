console.log('=== DEBUG INFO ===');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length);
console.log('MONGODB_URI first 30 chars:', process.env.MONGODB_URI?.substring(0, 30));
console.log('==================');



import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function dbConnect(): Promise<void> {
  // If already connected, reuse the connection
  if (connection.isConnected) {
    console.log("Already connected to database");
    return;
  }

  try {
    // Check if URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("URI format:", process.env.MONGODB_URI.substring(0, 20) + "...");
    
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });

    connection.isConnected = db.connections[0].readyState;
    console.log("✅ Successfully connected to database");
    
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    
    // Log more details
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    
    process.exit(1);
  }
}

export default dbConnect;