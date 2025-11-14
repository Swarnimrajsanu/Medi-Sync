// Utility script to drop old username index from MongoDB
// This should be run once to fix the duplicate key error

import mongoose from "mongoose";
import { connectDB } from "./dbConnect";

export async function dropOldUsernameIndex() {
  try {
    await connectDB();
    
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB connection failed");
      return false;
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database not available");
      return false;
    }

    const collection = db.collection("users");
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);

    // Check if username index exists
    const usernameIndex = indexes.find((idx: any) => idx.name === "username_1");
    
    if (usernameIndex) {
      console.log("Found old username index, dropping it...");
      await collection.dropIndex("username_1");
      console.log("✅ Successfully dropped username_1 index");
      return true;
    } else {
      console.log("No username index found - already cleaned up");
      return true;
    }
  } catch (error: any) {
    console.error("Error dropping index:", error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  dropOldUsernameIndex()
    .then((success) => {
      if (success) {
        console.log("✅ Index cleanup completed");
        process.exit(0);
      } else {
        console.error("❌ Index cleanup failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

