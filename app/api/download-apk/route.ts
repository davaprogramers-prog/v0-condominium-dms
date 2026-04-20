import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the app type from query params (apk or aab)
    const appType = request.nextUrl.searchParams.get('type') || 'aab';
    
    // Determine the file path
    const fileName = appType === 'apk' ? 'InteliCON.apk' : 'InteliCON.aab';
    const filePath = join(process.cwd(), 'app', 'android-ios', fileName);

    console.log('[v0] Attempting to serve:', filePath);

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Set proper headers for file download
    const headers = new Headers({
      'Content-Type': appType === 'apk' ? 'application/vnd.android.package-archive' : 'application/x-aab',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileBuffer.length.toString(),
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[v0] Download error:', error);
    return NextResponse.json(
      { error: 'File not found or error reading file' },
      { status: 404 }
    );
  }
}
