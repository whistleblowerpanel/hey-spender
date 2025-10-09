#!/usr/bin/env node

/**
 * Production Deployment Script
 * Ensures the latest code is built and deployed with the production upload solution
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production deployment...');

// Step 1: Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf dist', { stdio: 'inherit' });
} catch (e) {
  // dist folder might not exist
}

// Step 2: Build the project
console.log('🔨 Building project for production...');
execSync('npm run build', { stdio: 'inherit' });

// Step 3: Verify the build includes the correct upload code
console.log('✅ Verifying production upload code...');
const distPath = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Build failed - dist folder not found');
  process.exit(1);
}

// Check if the built JS contains the old production error message
const jsFiles = fs.readdirSync(path.join(distPath, 'assets')).filter(f => f.endsWith('.js'));
let foundOldCode = false;

for (const jsFile of jsFiles) {
  const filePath = path.join(distPath, 'assets', jsFile);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('not available in production')) {
    console.error(`❌ Old production detection code found in ${jsFile}`);
    foundOldCode = true;
  }
}

if (foundOldCode) {
  console.error('❌ Build contains old code. Please check your source files.');
  process.exit(1);
}

// Step 4: Verify API endpoint exists
console.log('🔍 Verifying API endpoint...');
const apiPath = path.join(process.cwd(), 'api', 'upload.js');
if (!fs.existsSync(apiPath)) {
  console.error('❌ API endpoint not found at api/upload.js');
  process.exit(1);
}

// Step 5: Check vercel.json configuration
console.log('📋 Checking Vercel configuration...');
const vercelPath = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelPath)) {
  console.error('❌ vercel.json not found');
  process.exit(1);
}

console.log('✅ Production deployment ready!');
console.log('');
console.log('📋 Deployment Checklist:');
console.log('  ✅ Build completed successfully');
console.log('  ✅ Old production detection code removed');
console.log('  ✅ API endpoint exists (api/upload.js)');
console.log('  ✅ Vercel configuration present');
console.log('');
console.log('🚀 Ready to deploy! The upload functionality should work in production.');
console.log('');
console.log('💡 If you\'re still seeing the old error, try:');
console.log('  1. Clear your browser cache');
console.log('  2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)');
console.log('  3. Check that the deployment includes the latest build');
