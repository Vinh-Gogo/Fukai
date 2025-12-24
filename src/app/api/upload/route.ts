import { NextRequest, NextResponse } from "next/server";
import { backendAPI } from "@/lib/api/backend-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large (max 50MB)" },
        { status: 400 },
      );
    }

    // Create FormData for backend upload
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Upload to backend
    const result = await backendAPI.uploadDocument(backendFormData);

    // Return success response from backend
    return NextResponse.json(result);
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 },
    );
  }
}
