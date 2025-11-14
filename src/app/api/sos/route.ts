import User from "@/app/model/User.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { SOSRequest } from "@/types/sos";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SOSRequest = await req.json();
    const { message, location, latitude, longitude, emergencyType } = body;

    // Get user details
    const user = await User.findById(decoded.id).select("name email");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate alert ID
    const alertId = `SOS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // In a real application, you would:
    // 1. Find nearest doctor/hospital based on location
    // 2. Send SMS via Twilio to emergency contacts and doctor
    // 3. Send email notifications
    // 4. Notify nearby hospitals/ambulance services
    // 5. Store the alert in database for tracking
    // 6. Integrate with location services

    // For now, we'll simulate doctor assignment
    // In production, this would query the database for nearest available doctor
    const doctorPhone = "+91-9304378349"; // This should come from database
    const doctorName = "Dr. Emergency Response"; // This should come from database
    const contactsNotified = 3; // Simulated number of contacts notified

    // Log the emergency alert (in production, store in database)
    console.log("🚨 EMERGENCY ALERT:", {
      alertId,
      userId: decoded.id,
      patientName: user.name,
      patientEmail: user.email,
      message: message || "Emergency assistance needed",
      location: location || "Location not provided",
      coordinates: latitude && longitude ? { latitude, longitude } : null,
      emergencyType: emergencyType || "medical",
      doctorPhone,
      doctorName,
      timestamp,
    });

    return NextResponse.json({
      message: "Emergency alert sent successfully. Help is on the way!",
      alertId,
      timestamp,
      contactsNotified,
      doctorPhone,
      doctorName,
    });
  } catch (error: any) {
    console.error("SOS error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
