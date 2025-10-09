import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://hgvdslcpndmimatvliyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndmRzbGNwbmRtaW1hdHZsaXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA2NjksImV4cCI6MjA3NTAwNjY2OX0.1d-UszrAW-_rUemrmBEbHRoa1r8zOrbo-wtKaXMPW9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mediaDir = path.join(__dirname, '../public/HeySpender Media/General');

async function convertImagesToAvif() {
  console.log('🔄 Converting all existing images to AVIF format...\n');

  try {
    // Get all image files in the directory
    const files = fs.readdirSync(mediaDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });

    console.log(`Found ${imageFiles.length} images to convert\n`);

    const conversions = [];

    for (const file of imageFiles) {
      const filePath = path.join(mediaDir, file);
      const fileNameWithoutExt = file.replace(/\.[^/.]+$/, '');
      const avifFileName = `${fileNameWithoutExt}.avif`;
      const avifPath = path.join(mediaDir, avifFileName);

      try {
        console.log(`⚙️  Converting ${file} to ${avifFileName}...`);

        // Convert to AVIF
        await sharp(filePath)
          .avif({
            quality: 80,
            effort: 4
          })
          .toFile(avifPath);

        console.log(`✅ Converted ${file} to AVIF`);

        conversions.push({
          original: file,
          avif: avifFileName,
          oldPath: `/HeySpender Media/General/${file}`,
          newPath: `/HeySpender Media/General/${avifFileName}`
        });

        // Optionally delete the original file
        // fs.unlinkSync(filePath);
        // console.log(`🗑️  Deleted original ${file}`);

      } catch (err) {
        console.error(`❌ Error converting ${file}:`, err.message);
      }
    }

    // Update database URLs
    console.log('\n🔄 Updating database URLs...\n');

    for (const conversion of conversions) {
      // Update wishlists
      const { data: wishlists, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, cover_image_url')
        .eq('cover_image_url', conversion.oldPath);

      if (wishlistError) {
        console.error(`Error fetching wishlists with ${conversion.oldPath}:`, wishlistError);
      } else if (wishlists && wishlists.length > 0) {
        for (const wishlist of wishlists) {
          const { error: updateError } = await supabase
            .from('wishlists')
            .update({ cover_image_url: conversion.newPath })
            .eq('id', wishlist.id);

          if (updateError) {
            console.error(`❌ Error updating wishlist ${wishlist.id}:`, updateError);
          } else {
            console.log(`✅ Updated wishlist ${wishlist.id}: ${conversion.original} → ${conversion.avif}`);
          }
        }
      }

      // Update wishlist items
      const { data: items, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('id, image_url')
        .eq('image_url', conversion.oldPath);

      if (itemsError) {
        console.error(`Error fetching items with ${conversion.oldPath}:`, itemsError);
      } else if (items && items.length > 0) {
        for (const item of items) {
          const { error: updateError } = await supabase
            .from('wishlist_items')
            .update({ image_url: conversion.newPath })
            .eq('id', item.id);

          if (updateError) {
            console.error(`❌ Error updating item ${item.id}:`, updateError);
          } else {
            console.log(`✅ Updated item ${item.id}: ${conversion.original} → ${conversion.avif}`);
          }
        }
      }
    }

    console.log('\n✅ Conversion complete!');
    console.log(`\nConverted ${conversions.length} images to AVIF format`);
    console.log('\n⚠️  Note: Original files are kept. Delete them manually if desired.');

  } catch (error) {
    console.error('Error in conversion process:', error);
  }
}

convertImagesToAvif();

