import { put } from '@vercel/blob';

async function testBlobUpload() {
  try {
    console.log('[TEST] Starting blob upload test...');
    console.log('[TEST] BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'NOT SET');
    
    // Create a test image buffer
    const testBuffer = Buffer.from('test image data');
    const blob = new Blob([testBuffer], { type: 'image/jpeg' });
    
    console.log('[TEST] Uploading to default bucket...');
    const result1 = await put('test-file-1.jpg', blob, {
      access: 'public',
      addRandomSuffix: false,
    });
    console.log('[TEST] Default bucket result:', result1.url);
    
    // Try to upload with "parcels/" prefix
    console.log('[TEST] Uploading with parcels/ prefix...');
    const result2 = await put('parcels/test-file-2.jpg', blob, {
      access: 'public',
      addRandomSuffix: false,
    });
    console.log('[TEST] With prefix result:', result2.url);
    
    // Check if there's a separate PARCELS token
    if (process.env.PARCELS_BLOB_READ_WRITE_TOKEN) {
      console.log('[TEST] PARCELS_BLOB_READ_WRITE_TOKEN found, trying with it...');
      // This would need special handling with the Blob SDK
    }
    
    console.log('[TEST] SUCCESS - Files uploaded');
  } catch (error) {
    console.error('[TEST] ERROR:', error.message);
    console.error('[TEST] Full error:', error);
  }
}

testBlobUpload();
