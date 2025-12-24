/**
 * Health check endpoint for Next.js that tests connection to FastAPI backend
 */
import { NextRequest, NextResponse } from "next/server";
import { backendAPI } from "@/lib/api/backend-client";

export async function GET(request: NextRequest) {
  try {
    // Test connection to FastAPI backend using backend client
    const fastapiHealth = await backendAPI.getHealth();

    return NextResponse.json({
      status: "healthy",
      service: "nextjs-frontend",
      fastapi_connection: "connected",
      fastapi_health: fastapiHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "nextjs-frontend",
        fastapi_connection: "disconnected",
        error: `Unable to connect to FastAPI backend: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
