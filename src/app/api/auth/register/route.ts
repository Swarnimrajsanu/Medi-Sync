import User from "@/app/model/User.model";
import { connectDB } from "@/lib/dbConnect";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Connect to database
    await connectDB();
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB connection failed");
      return NextResponse.json({ 
        error: "Database connection failed. Please try again later." 
      }, { status: 500 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Invalid request body. Please provide name, email, and password." 
      }, { status: 400 });
    }

    const { name, email, password } = body;

    // Validate input
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required and must be a valid string" 
      }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required and must be a valid string" 
      }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ 
        error: "Password is required and must be at least 6 characters" 
      }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        error: "Please provide a valid email address" 
      }, { status: 400 });
    }

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Create new user
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password 
    });

    return NextResponse.json({ 
      message: "User registered successfully",
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ 
        error: errors.join(", ") || "Validation error" 
      }, { status: 400 });
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "User with this email already exists" 
      }, { status: 400 });
    }

    // Handle MongoDB connection errors
    if (error.name === "MongoServerError" || error.name === "MongooseError") {
      return NextResponse.json({ 
        error: "Database error. Please try again later." 
      }, { status: 500 });
    }

    // Generic error
    return NextResponse.json({ 
      error: error.message || "Server error. Please try again." 
    }, { status: 500 });
  }
}
