import User from "@/app/model/User.model";
import { connectDB } from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    const exists = await User.findOne({ email });
    if (exists)
      return NextResponse.json({ error: "User already exists" }, { status: 400 });

    await User.create({ name, email, password });

    return NextResponse.json({ message: "User registered successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
