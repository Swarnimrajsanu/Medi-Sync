import User from "@/app/model/User.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded: any = verifyToken(req);

    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await User.findById(decoded.id).select("-password");

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}
