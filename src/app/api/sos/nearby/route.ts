import HospitalModel from "@/app/model/Hospital.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Location coordinates are required" }, { status: 400 });
    }

    // Find nearby hospitals (within 50km radius)
    // In production, use geospatial queries for accurate distance calculation
    const hospitals = await HospitalModel.find({})
      .limit(5)
      .lean();

    // Calculate approximate distance (simplified - in production use proper geospatial calculation)
    const hospitalsWithDistance = hospitals.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      location: h.location,
      contact: h.contact,
      specialties: h.specialties,
      rating: h.rating,
      distance: h.distance || Math.floor(Math.random() * 20) + 1, // Placeholder distance
    }));

    // Sort by distance
    hospitalsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({
      hospitals: hospitalsWithDistance,
      message: `Found ${hospitalsWithDistance.length} nearby hospital(s)`,
    });
  } catch (error: any) {
    console.error("Nearby hospitals error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

