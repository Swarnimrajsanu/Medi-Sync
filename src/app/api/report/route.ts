import Report from "@/app/model/Report.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";

// POST - Upload report
export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PDF and images (JPEG, PNG) are allowed." 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size exceeds 10MB limit." 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "reports");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const filename = `${decoded.id}-${timestamp}-${randomStr}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    const reportUrl = `/uploads/reports/${filename}`;

    // Save report metadata to database
    const report = await Report.create({
      userId: decoded.id,
      name: file.name,
      url: reportUrl,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
    });

    return NextResponse.json({
      id: (report._id as any).toString(),
      name: report.name,
      url: report.url,
      type: report.type,
      size: report.size,
      uploadedAt: report.uploadedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Report upload error:", error);
    return NextResponse.json({ 
      error: "Failed to upload report. Please try again." 
    }, { status: 500 });
  }
}

// GET - Fetch all reports for user
export async function GET(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await Report.find({ userId: decoded.id })
      .sort({ uploadedAt: -1 })
      .lean();

    const formattedReports = reports.map((report) => ({
      id: report._id.toString(),
      userId: report.userId.toString(),
      name: report.name,
      url: report.url,
      type: report.type,
      size: report.size,
      uploadedAt: report.uploadedAt.toISOString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    return NextResponse.json({ reports: formattedReports });
  } catch (error: any) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reports. Please try again." 
    }, { status: 500 });
  }
}

// DELETE - Delete report
export async function DELETE(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    // Find and verify ownership
    const report = await Report.findOne({ _id: reportId, userId: decoded.id });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), "public", report.url);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Report.findByIdAndDelete(reportId);

    return NextResponse.json({ 
      message: "Report deleted successfully",
      id: reportId,
    });
  } catch (error: any) {
    console.error("Report delete error:", error);
    return NextResponse.json({ 
      error: "Failed to delete report. Please try again." 
    }, { status: 500 });
  }
}
