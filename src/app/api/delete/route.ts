import { NextRequest, NextResponse } from "next/server";
import { backendAPI } from "@/lib/api/backend-client";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 },
      );
    }

    // Validate that it's an uploaded file (starts with /uploaded/)
    if (!filename.startsWith("/uploaded/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Extract filename from path - this will be used as document ID for backend
    const documentId = filename.replace("/uploaded/", "");
    if (!documentId) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Delete from backend
    const result = await backendAPI.deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      filename: documentId,
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 },
    );
  }
}
