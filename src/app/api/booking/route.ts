import HospitalModel from "@/app/model/Hospital.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { BookingRequest, Hospital } from "@/types/surgery";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Authentication is optional for viewing/searching hospitals
    const decoded: any = verifyToken(req);
    // Continue even if not authenticated - allow public access to search

    const body: BookingRequest = await req.json();
    const { budget, surgeryType, location } = body;

    if (!budget || budget <= 0) {
      return NextResponse.json({ error: "Budget is required and must be greater than 0" }, { status: 400 });
    }

    // Build query based on filters
    const query: any = {};
    
    // Budget range (within 20% of budget)
    const budgetRange = {
      min: budget * 0.8,
      max: budget * 1.2,
    };
    query.price = { $gte: budgetRange.min, $lte: budgetRange.max };

    // Filter by location if provided
    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: "i" };
    }

    // Filter by surgery type if provided
    if (surgeryType && surgeryType.trim()) {
      query.specialties = { $in: [new RegExp(surgeryType.trim(), "i")] };
    }

    // Query database
    const dbHospitals = await HospitalModel.find(query)
      .sort({ rating: -1, price: 1 })
      .limit(10)
      .lean();

    // Transform to match Hospital interface
    const hospitals: Hospital[] = dbHospitals.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      location: h.location,
      price: h.price,
      rating: h.rating,
      specialties: h.specialties,
      distance: h.distance,
      image: h.image,
      contact: h.contact,
    }));

    return NextResponse.json({
      hospitals,
      message: hospitals.length > 0 
        ? `Found ${hospitals.length} hospital(s) matching your criteria`
        : "No hospitals found matching your criteria. Try adjusting your budget.",
    });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
