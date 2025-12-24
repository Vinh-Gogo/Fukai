// Enhanced file upload API route with proper validation, error handling, and security
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createFileTooLargeResponse,
  createInvalidFileTypeResponse,
  createStorageErrorResponse,
  createInternalServerErrorResponse,
  formatFileSize,
  generateRequestId,
  createRequestContext,
} from "@/lib/utils/response";
import { validateFileUpload } from "@/lib/api/validation";
import { FILE_CONFIG, PATHS } from "@/lib/api/config";
import type { UploadedFileInfo } from "@/lib/api/types";

// Generate unique filename with timestamp and random component
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = randomBytes(8).toString("hex");
  const extension = originalName.split(".").pop() || "pdf";
  return `${timestamp}-${randomId}.${extension}`;
}

// Calculate file checksum for integrity verification
async function calculateChecksum(buffer: Buffer): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const context = createRequestContext(request);

  try {
    // Parse form data
    const formData = await request.formData();

    // Validate upload request
    const validation = validateFileUpload(formData);
    if (!validation.success) {
      return createValidationErrorResponse(
        {
          isValid: false,
          errors: validation.errors,
        },
        requestId,
      );
    }

    const { file } = (validation as { success: true; data: { file: File } })
      .data;

    // Additional file validation
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      return createFileTooLargeResponse(
        FILE_CONFIG.MAX_SIZE_FORMATTED,
        requestId,
      );
    }

    if (
      !FILE_CONFIG.ALLOWED_TYPES.includes(
        file.type as (typeof FILE_CONFIG.ALLOWED_TYPES)[number],
      )
    ) {
      return createInvalidFileTypeResponse(
        [...FILE_CONFIG.ALLOWED_TYPES],
        requestId,
      );
    }

    // Ensure upload directory exists
    try {
      await mkdir(PATHS.UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
      return createStorageErrorResponse(
        "create directory",
        undefined,
        requestId,
      );
    }

    // Generate unique filename and path
    const uniqueFilename = generateUniqueFilename(file.name);
    const filepath = join(PATHS.UPLOAD_DIR, uniqueFilename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate checksum for integrity verification
    const checksum = await calculateChecksum(buffer);

    // Save file to disk
    try {
      await writeFile(filepath, buffer);
    } catch (error) {
      console.error("Failed to write file:", error);
      return createStorageErrorResponse(
        "write file",
        error instanceof Error ? error.message : undefined,
        requestId,
      );
    }

    // Prepare response data
    const fileInfo: UploadedFileInfo = {
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimeType: file.type,
      url: `/uploaded/${uniqueFilename}`,
      uploadedAt: new Date().toISOString(),
      checksum,
    };

    // Log successful upload
    console.log(
      `[${requestId}] File uploaded successfully: ${uniqueFilename} (${formatFileSize(file.size)})`,
    );

    return createSuccessResponse(
      fileInfo,
      `File "${file.name}" uploaded successfully`,
      undefined,
      requestId,
    );
  } catch (error) {
    console.error(`[${requestId}] Upload error:`, error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("quota") || error.message.includes("space")) {
        return createStorageErrorResponse(
          "upload",
          "Insufficient storage space",
          requestId,
        );
      }
    }

    return createInternalServerErrorResponse(
      "An unexpected error occurred during file upload",
      error,
      requestId,
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return createSuccessResponse(
    { message: "File upload endpoint - use POST method to upload files" },
    "Upload endpoint information",
    undefined,
    generateRequestId(),
  );
}

export async function PUT() {
  return createSuccessResponse(
    { error: "Method not allowed - use POST to upload files" },
    undefined,
    405, // Method Not Allowed
    generateRequestId(),
  );
}

export async function DELETE() {
  return createSuccessResponse(
    { error: "Method not allowed - use POST to upload files" },
    undefined,
    405, // Method Not Allowed
    generateRequestId(),
  );
}
