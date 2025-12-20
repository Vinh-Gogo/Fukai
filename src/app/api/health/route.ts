/**
 * Health check endpoint for Next.js that tests connection to FastAPI backend
 */
import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/api/_lib/utils/response';
import { generateRequestId } from '@/app/api/_lib/utils/response';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Test connection to FastAPI backend
    const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

    const response = await fetch(`${fastapiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`FastAPI health check failed: ${response.status} ${response.statusText}`);
    }

    const fastapiHealth = await response.json();

    return createSuccessResponse({
      status: 'healthy',
      service: 'nextjs-frontend',
      fastapi_connection: 'connected',
      fastapi_health: fastapiHealth,
      timestamp: new Date().toISOString(),
    }, 'Frontend health check successful', undefined, requestId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return createErrorResponse(
      'Frontend health check failed',
      `Unable to connect to FastAPI backend: ${errorMessage}`,
      503, // Service Unavailable
      undefined,
      {
        fastapi_url: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000',
        error: errorMessage,
      },
      requestId
    );
  }
}
