// Enhanced file delete API route with proper validation, error handling, and security
import { NextRequest } from "next/server";
import { unlink, stat } from "fs/promises";
import { join } from "path";

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createFileNotFoundResponse,
  createStorageErrorResponse,
  createBadRequestResponse,
  createInternalServerErrorResponse,
  generateRequestId,
  createRequestContext,
} from "@/lib/utils/response";
import { validateFileDelete } from "@/lib/api/validation";
import { PATHS } from "@/lib/api/config";

// Verify file exists and get its stats
async function verifyFileExists(filepath: string) {
  try {
    const stats = await stat(filepath);
    return {
      exists: true,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    return { exists: false };
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  const context = createRequestContext(request);

  try {
    // Parse URL search parameters
    const { searchParams } = new URL(request.url);

    // Validate delete request
    const validation = validateFileDelete(searchParams);
    if (!validation.success) {
      return createValidationErrorResponse(
        {
          isValid: false,
          errors: validation.errors,
        },
        requestId,
      );
    }

    const filename = (
      validation as { success: true; data: { filename: string } }
    ).data.filename;

    // Construct full file path
    const filepath = join(PATHS.UPLOAD_DIR, filename);

    // Verify file exists before attempting deletion
    const fileInfo = await verifyFileExists(filepath);
    if (!fileInfo.exists) {
      return createFileNotFoundResponse(filename, requestId);
    }

    // Attempt to delete the file
    try {
      await unlink(filepath);
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
      return createStorageErrorResponse(
        "delete file",
        error instanceof Error ? error.message : undefined,
        requestId,
      );
    }

    // Verify file was actually deleted
    const postDeleteCheck = await verifyFileExists(filepath);
    if (postDeleteCheck.exists) {
      console.error(`File ${filename} still exists after deletion attempt`);
      return createStorageErrorResponse(
        "verify deletion",
        "File was not successfully deleted",
        requestId,
      );
    }

    // Log successful deletion
    console.log(
      `[${requestId}] File deleted successfully: ${filename} (${fileInfo.size} bytes)`,
    );

    return createSuccessResponse(
      {
        filename,
        deleted: true,
        size: fileInfo.size,
        deletedAt: new Date().toISOString(),
      },
      `File "${filename}" deleted successfully`,
      undefined,
      requestId,
    );
  } catch (error) {
    console.error(`[${requestId}] Delete error:`, error);
    return createInternalServerErrorResponse(
      "An unexpected error occurred during file deletion",
      error,
      requestId,
    );
  }
}

// Handle GET requests for file existence check
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return createBadRequestResponse(
        "Filename parameter is required",
        undefined,
        requestId,
      );
    }

    // Validate filename format
    if (!filename.startsWith("/uploaded/")) {
      return createBadRequestResponse(
        "Invalid file path format",
        undefined,
        requestId,
      );
    }

    const basename = filename.replace("/uploaded/", "");
    const filepath = join(PATHS.UPLOAD_DIR, basename);

    // Check if file exists
    const fileInfo = await verifyFileExists(filepath);

    return createSuccessResponse(
      {
        filename: basename,
        exists: fileInfo.exists,
        ...(fileInfo.exists && {
          size: fileInfo.size,
          modifiedAt: fileInfo.modifiedAt,
        }),
      },
      fileInfo.exists ? "File exists" : "File does not exist",
      undefined,
      requestId,
    );
  } catch (error) {
    console.error(`[${requestId}] File existence check error:`, error);
    return createInternalServerErrorResponse(
      "An unexpected error occurred while checking file existence",
      error,
      requestId,
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return createSuccessResponse(
    {
      error:
        "Method not allowed - use DELETE to remove files or GET to check existence",
    },
    undefined,
    405, // Method Not Allowed
    generateRequestId(),
  );
}

export async function PUT() {
  return createSuccessResponse(
    {
      error:
        "Method not allowed - use DELETE to remove files or GET to check existence",
    },
    undefined,
    405, // Method Not Allowed
    generateRequestId(),
  );
}
