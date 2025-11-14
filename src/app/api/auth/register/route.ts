import User from "@/app/model/User.model";
import { connectDB } from "@/lib/dbConnect";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Parse request body first (outside try block so it's accessible in catch)
  let body: any = null;
  try {
    body = await req.json();
  } catch (parseError) {
    return NextResponse.json({ 
      error: "Invalid request body. Please provide name, email, and password." 
    }, { status: 400 });
  }

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

    const { name, email, password } = body;

    // Validate input
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required and must be a valid string" 
      }, { status: 400 });
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ 
        error: "Name must be at least 2 characters long" 
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
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map((err: any) => err.message);
      const errorMessage = errors.length > 0 ? errors.join(", ") : "Validation error";
      console.error("Validation errors:", errors);
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 400 });
    }

    // Handle duplicate key error (E11000)
    if (error.code === 11000) {
      // Check which field caused the duplicate
      const keyPattern = error.keyPattern || {};
      const keyValue = error.keyValue || {};
      
      console.error("Duplicate key error:", { keyPattern, keyValue });
      
      if (keyPattern.email || keyValue.email) {
        return NextResponse.json({ 
          error: "User with this email already exists" 
        }, { status: 400 });
      } else if (keyPattern.username) {
        // Old username index from previous schema - check if email actually exists
        console.warn("Old username index detected. Attempting to drop it...");
        try {
          const userEmail = body?.email;
          
          if (userEmail) {
            const emailExists = await User.findOne({ email: userEmail.toLowerCase().trim() });
            if (emailExists) {
              return NextResponse.json({ 
                error: "User with this email already exists" 
              }, { status: 400 });
            }
          }
          
          // Try to drop the old username index automatically
          try {
            await User.collection.dropIndex("username_1");
            console.log("✅ Successfully dropped old username index");
            
            // Retry user creation after dropping the index
            const user = await User.create({ 
              name: body.name.trim(), 
              email: body.email.toLowerCase().trim(), 
              password: body.password 
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
          } catch (dropError: any) {
            // Index doesn't exist or couldn't be dropped
            if (dropError.code === 27 || dropError.codeName === "IndexNotFound") {
              // Index already doesn't exist, but we still got the error - retry creation
              try {
                const user = await User.create({ 
                  name: body.name.trim(), 
                  email: body.email.toLowerCase().trim(), 
                  password: body.password 
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
              } catch (retryError: any) {
                // Still failing - return error
                return NextResponse.json({ 
                  error: "Registration failed. Please try again." 
                }, { status: 500 });
              }
            } else {
              // Couldn't drop index for another reason
              console.error("Failed to drop username index:", dropError);
              return NextResponse.json({ 
                error: "Registration failed due to database configuration. Please contact support." 
              }, { status: 500 });
            }
          }
        } catch (checkError) {
          return NextResponse.json({ 
            error: "Registration failed. Please try again." 
          }, { status: 500 });
        }
      } else {
        // Unknown duplicate key
        return NextResponse.json({ 
          error: "A user with this information already exists" 
        }, { status: 400 });
      }
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
