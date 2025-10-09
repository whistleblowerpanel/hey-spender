import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://hgvdslcpndmimatvliyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndmRzbGNwbmRtaW1hdHZsaXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA2NjksImV4cCI6MjA3NTAwNjY2OX0.1d-UszrAW-_rUemrmBEbHRoa1r8zOrbo-wtKaXMPW9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Target directory for downloaded media
const targetDir = path.join(__dirname, '../public/HeySpender Media/General');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadMedia() {
  try {
    console.log('📥 Starting media download from Supabase...\n');

    // List all files in the storage bucket
    const { data: files, error: listError } = await supabase.storage
      .from('HeySpender Media')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    console.log(`Found ${files.length} files in storage\n`);

    // Also get files from subdirectories
    const allFiles = [];
    
    // Get files from root
    for (const file of files) {
      if (file.id) {
        const { data: { publicUrl } } = supabase.storage
          .from('HeySpender Media')
          .getPublicUrl(file.name);
        allFiles.push({ name: file.name, url: publicUrl });
      }
    }

    // Get files from wishlist-covers subdirectory
    const { data: coverFiles } = await supabase.storage
      .from('HeySpender Media')
      .list('wishlist-covers', {
        limit: 1000
      });

    if (coverFiles) {
      for (const file of coverFiles) {
        if (file.id) {
          const filePath = `wishlist-covers/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('HeySpender Media')
            .getPublicUrl(filePath);
          allFiles.push({ name: file.name, url: publicUrl, subfolder: 'wishlist-covers' });
        }
      }
    }

    // Get files from wishlist-items subdirectory
    const { data: itemFiles } = await supabase.storage
      .from('HeySpender Media')
      .list('wishlist-items', {
        limit: 1000
      });

    if (itemFiles) {
      for (const file of itemFiles) {
        if (file.id) {
          const filePath = `wishlist-items/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('HeySpender Media')
            .getPublicUrl(filePath);
          allFiles.push({ name: file.name, url: publicUrl, subfolder: 'wishlist-items' });
        }
      }
    }

    console.log(`Total files to download: ${allFiles.length}\n`);

    // Download each file
    let successCount = 0;
    let errorCount = 0;

    for (const file of allFiles) {
      try {
        const filename = file.name;
        const filepath = path.join(targetDir, filename);
        
        // Check if file already exists
        if (fs.existsSync(filepath)) {
          console.log(`⏭️  Skipping ${filename} (already exists)`);
          successCount++;
          continue;
        }

        console.log(`⬇️  Downloading ${filename}...`);
        await downloadFile(file.url, filepath);
        console.log(`✅ Downloaded ${filename}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error downloading ${file.name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Download complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`\nFiles saved to: ${targetDir}`);

  } catch (error) {
    console.error('Error in download process:', error);
  }
}

// Fetch all image URLs from database
async function fetchImageUrlsFromDatabase() {
  try {
    console.log('\n🔍 Fetching image URLs from database...\n');

    // Fetch wishlist cover images
    const { data: wishlists, error: wishlistError } = await supabase
      .from('wishlists')
      .select('cover_image_url')
      .not('cover_image_url', 'is', null);

    if (wishlistError) {
      console.error('Error fetching wishlists:', wishlistError);
    } else {
      console.log(`Found ${wishlists.length} wishlist cover images`);
    }

    // Fetch wishlist item images
    const { data: items, error: itemsError } = await supabase
      .from('wishlist_items')
      .select('image_url')
      .not('image_url', 'is', null);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    } else {
      console.log(`Found ${items.length} wishlist item images`);
    }

    // Download images from database URLs
    const allUrls = [
      ...(wishlists || []).map(w => w.cover_image_url),
      ...(items || []).map(i => i.image_url)
    ];

    console.log(`\nTotal image URLs to download: ${allUrls.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const url of allUrls) {
      try {
        // Extract filename from URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        const filepath = path.join(targetDir, filename);

        // Check if file already exists
        if (fs.existsSync(filepath)) {
          console.log(`⏭️  Skipping ${filename} (already exists)`);
          successCount++;
          continue;
        }

        console.log(`⬇️  Downloading ${filename}...`);
        await downloadFile(url, filepath);
        console.log(`✅ Downloaded ${filename}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error downloading from ${url}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Database image download complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

  } catch (error) {
    console.error('Error fetching from database:', error);
  }
}

// Run both download methods
async function main() {
  await downloadMedia();
  await fetchImageUrlsFromDatabase();
}

main();

