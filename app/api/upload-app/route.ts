import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const appType = formData.get('appType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!appType || !['android', 'ios'].includes(appType)) {
      return NextResponse.json({ error: 'Invalid app type' }, { status: 400 });
    }

    // Validate file size (max 500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 500MB limit' }, { status: 400 });
    }

    // Create a filename with timestamp
    const extension = file.name.split('.').pop();
    const filename = `app-${appType}-${Date.now()}.${extension}`;

    console.log('[v0] Uploading file:', filename, 'Size:', file.size);

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('[v0] Upload successful:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      appType: appType,
    });
  } catch (error) {
    console.error('[v0] Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
