import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";

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

    // Extract filename from path
    const basename = filename.replace("/uploaded/", "");
    if (!basename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Construct full file path
    const filepath = join(process.cwd(), "public", "uploaded", basename);

    try {
      // Delete the file
      await unlink(filepath);
    } catch {
      // File might not exist, which is fine
      console.log("File not found or already deleted:", filepath);
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      filename: basename,
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
