#!/usr/bin/env node

/**
 * Test script to verify the upload API is working
 */

import fs from 'fs';
import path from 'path';

// Create a simple test image file
const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageContent, 'base64');

// Create test file
const testFileName = 'test-image.png';
const testFilePath = path.join(process.cwd(), testFileName);
fs.writeFileSync(testFilePath, testImageBuffer);

console.log('🧪 Testing upload API...');

// Test the API endpoint
const formData = new FormData();
const file = new File([testImageBuffer], testFileName, { type: 'image/png' });
formData.append('file', file);
formData.append('fileName', `test-user-${Date.now()}.png`);

try {
  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Upload API test successful!');
    console.log('📁 Uploaded to:', result.url);
  } else {
    const error = await response.text();
    console.error('❌ Upload API test failed:');
    console.error('Status:', response.status);
    console.error('Error:', error);
  }
} catch (error) {
  console.error('❌ Upload API test failed with error:');
  console.error(error.message);
}

// Clean up test file
fs.unlinkSync(testFilePath);
