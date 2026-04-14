#!/usr/bin/env node

import { put } from '@vercel/blob';

async function testBlobUpload() {
  try {
    console.log('[v0] Starting blob upload test to parcels bucket...');
    
    // Token passed as argument or from env
    const token = process.argv[2] || process.env.BLOB_READ_WRITE_TOKEN;
    console.log('[v0] Token provided:', !!token);
    if (!token) {
      throw new Error('No BLOB_READ_WRITE_TOKEN provided. Pass as argument: node 117-test-blob-upload.mjs <token>');
    }
    
    // Create a test image (small 1x1 white PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0xE5, 0x27, 0xDE,
      0xFC, 0x2B, 0xEE, 0x6E, 0x4B, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    console.log('[v0] Created test PNG buffer, size:', pngBuffer.length, 'bytes');
    console.log('[v0] Token prefix:', token.substring(0, 25) + '...');
    
    // Test 1: Upload with simple filename to default bucket
    const filename1 = `test-${Date.now()}.png`;
    console.log('\n[v0] Test 1: Uploading to default bucket with filename:', filename1);
    
    const result1 = await put(filename1, pngBuffer, {
      access: 'private',
      addRandomSuffix: false,
      token: token,
    });
    
    console.log('[v0] ✅ Default bucket upload SUCCESS');
    console.log('[v0]   URL:', result1.url);
    console.log('[v0]   Pathname:', result1.pathname);
    console.log('[v0]   Size:', result1.size);
    
    // Test 2: Upload with folder structure
    const filename2 = `test-condo/condo-123/test-${Date.now()}.png`;
    console.log('\n[v0] Test 2: Uploading with folder structure:', filename2);
    
    const result2 = await put(filename2, pngBuffer, {
      access: 'private',
      addRandomSuffix: false,
      token: token,
    });
    
    console.log('[v0] ✅ Folder structure upload SUCCESS');
    console.log('[v0]   URL:', result2.url);
    console.log('[v0]   Pathname:', result2.pathname);
    
    console.log('\n[v0] ✅✅✅ FINAL RESULT: All blob uploads successful!');
    console.log('[v0] Files ARE being stored successfully in Vercel Blob');
    console.log('[v0] Copy the URL structure from above to use in your application');
    
  } catch (error) {
    console.error('[v0] ❌ Blob upload FAILED');
    console.error('[v0] Error:', error.message);
    console.error('[v0] Code:', error.code);
    if (error.details) console.error('[v0] Details:', error.details);
    process.exit(1);
  }
}

testBlobUpload();
