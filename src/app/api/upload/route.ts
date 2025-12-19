import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large (max 50MB)' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomId}-${file.name}`;
    const filepath = join(process.cwd(), 'public', 'uploaded', filename);

    // Ensure uploaded directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploaded');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return success response with file info
    return NextResponse.json({
      success: true,
      filename,
      originalName: file.name,
      size: file.size,
      url: `/uploaded/${filename}`,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
