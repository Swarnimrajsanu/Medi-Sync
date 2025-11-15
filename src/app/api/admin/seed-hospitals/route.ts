import HospitalModel from "@/app/model/Hospital.model";
import { connectDB } from "@/lib/dbConnect";
import { NextResponse } from "next/server";

const sampleHospitals = [
  // Bangalore Hospitals
  {
    name: "Apollo Hospitals Bangalore",
    city: "bangalore",
    address: "154/11, Bannerghatta Road, Opp. IIM-B, Bangalore - 560076",
    rating: 4.5,
    contact: "+91-80-2630-4050",
    surgeries: [
      {
        type: "Cardiac Surgery",
        minCost: 200000,
        maxCost: 500000,
        specialty: "Cardiology",
      },
      {
        type: "Orthopedic Surgery",
        minCost: 150000,
        maxCost: 400000,
        specialty: "Orthopedics",
      },
      {
        type: "General Surgery",
        minCost: 80000,
        maxCost: 200000,
        specialty: "General Surgery",
      },
    ],
    distance: 5.2,
  },
  {
    name: "Manipal Hospital Bangalore",
    city: "bangalore",
    address: "98, HAL Old Airport Road, Kodihalli, Bangalore - 560017",
    rating: 4.6,
    contact: "+91-80-2502-4444",
    surgeries: [
      {
        type: "Neurosurgery",
        minCost: 300000,
        maxCost: 800000,
        specialty: "Neurology",
      },
      {
        type: "Oncology Surgery",
        minCost: 250000,
        maxCost: 600000,
        specialty: "Oncology",
      },
      {
        type: "Laparoscopic Surgery",
        minCost: 100000,
        maxCost: 300000,
        specialty: "General Surgery",
      },
    ],
    distance: 8.5,
  },
  {
    name: "Fortis Hospital Bangalore",
    city: "bangalore",
    address: "154/9, Bannerghatta Road, Opposite IIM-B, Bangalore - 560076",
    rating: 4.4,
    contact: "+91-80-6621-4444",
    surgeries: [
      {
        type: "Cardiac Surgery",
        minCost: 180000,
        maxCost: 450000,
        specialty: "Cardiology",
      },
      {
        type: "Orthopedic Surgery",
        minCost: 120000,
        maxCost: 350000,
        specialty: "Orthopedics",
      },
      {
        type: "Urology Surgery",
        minCost: 90000,
        maxCost: 250000,
        specialty: "Urology",
      },
    ],
    distance: 6.8,
  },
  // Delhi Hospitals
  {
    name: "AIIMS Delhi",
    city: "delhi",
    address: "Ansari Nagar, New Delhi - 110029",
    rating: 4.8,
    contact: "+91-11-2658-8500",
    surgeries: [
      {
        type: "Cardiac Surgery",
        minCost: 50000,
        maxCost: 150000,
        specialty: "Cardiology",
      },
      {
        type: "Neurosurgery",
        minCost: 80000,
        maxCost: 200000,
        specialty: "Neurology",
      },
      {
        type: "Orthopedic Surgery",
        minCost: 40000,
        maxCost: 120000,
        specialty: "Orthopedics",
      },
      {
        type: "General Surgery",
        minCost: 30000,
        maxCost: 100000,
        specialty: "General Surgery",
      },
    ],
    distance: 12.3,
  },
  {
    name: "Max Super Specialty Hospital Delhi",
    city: "delhi",
    address: "1, 2, Press Enclave Road, Saket, New Delhi - 110017",
    rating: 4.7,
    contact: "+91-11-2651-5050",
    surgeries: [
      {
        type: "Cardiac Surgery",
        minCost: 250000,
        maxCost: 600000,
        specialty: "Cardiology",
      },
      {
        type: "Oncology Surgery",
        minCost: 300000,
        maxCost: 700000,
        specialty: "Oncology",
      },
      {
        type: "Orthopedic Surgery",
        minCost: 150000,
        maxCost: 400000,
        specialty: "Orthopedics",
      },
      {
        type: "Bariatric Surgery",
        minCost: 200000,
        maxCost: 500000,
        specialty: "Bariatric Surgery",
      },
    ],
    distance: 9.7,
  },
];

export async function POST(req: Request) {
  try {
    await connectDB();

    // Check if hospitals already exist
    const existingHospitals = await HospitalModel.find({
      name: { $in: sampleHospitals.map((h) => h.name) },
    });

    if (existingHospitals.length > 0) {
      return NextResponse.json(
        {
          message: `${existingHospitals.length} hospital(s) already exist. Use DELETE to clear and reseed.`,
          existing: existingHospitals.map((h) => h.name),
        },
        { status: 200 }
      );
    }

    // Insert hospitals
    const insertedHospitals = await HospitalModel.insertMany(sampleHospitals);

    return NextResponse.json(
      {
        message: `Successfully seeded ${insertedHospitals.length} hospitals`,
        hospitals: insertedHospitals.map((h) => ({
          id: String(h._id),
          name: h.name,
          city: h.city,
          address: h.address,
          rating: h.rating,
          surgeries: h.surgeries,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Seed hospitals error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to seed hospitals",
        details: error.errors || error,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    // Delete only the seeded hospitals
    const result = await HospitalModel.deleteMany({
      name: { $in: sampleHospitals.map((h) => h.name) },
    });

    return NextResponse.json(
      {
        message: `Successfully deleted ${result.deletedCount} hospital(s)`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete hospitals error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete hospitals",
      },
      { status: 500 }
    );
  }
}

