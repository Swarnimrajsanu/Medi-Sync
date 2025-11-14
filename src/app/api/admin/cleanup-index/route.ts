// Admin endpoint to clean up old database indexes
// This is a one-time cleanup utility

import User from "@/app/model/User.model";
import { connectDB } from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const db = User.db;
    if (!db) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 });
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
      
      return NextResponse.json({ 
        message: "Successfully dropped old username index",
        indexes: await collection.indexes()
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        message: "No username index found - already cleaned up",
        indexes: indexes
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error cleaning up index:", error);
    
    // Index doesn't exist - that's fine
    if (error.code === 27 || error.codeName === "IndexNotFound") {
      return NextResponse.json({ 
        message: "Index already doesn't exist",
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to clean up index" 
    }, { status: 500 });
  }
}

