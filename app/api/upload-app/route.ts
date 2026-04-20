import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const appType = formData.get('appType') as string; // 'android' or 'ios'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!appType || !['android', 'ios'].includes(appType)) {
      return NextResponse.json({ error: 'Invalid app type' }, { status: 400 });
    }

    // Create a filename with timestamp
    const extension = file.name.split('.').pop();
    const filename = `app-${appType}-${Date.now()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      appType: appType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
