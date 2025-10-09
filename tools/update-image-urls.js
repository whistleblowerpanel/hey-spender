import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgvdslcpndmimatvliyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndmRzbGNwbmRtaW1hdHZsaXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA2NjksImV4cCI6MjA3NTAwNjY2OX0.1d-UszrAW-_rUemrmBEbHRoa1r8zOrbo-wtKaXMPW9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateImageUrls() {
  console.log('🔄 Updating image URLs from Supabase to local paths...\n');

  try {
    // Update wishlist cover images
    const { data: wishlists, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id, cover_image_url')
      .not('cover_image_url', 'is', null);

    if (wishlistError) {
      console.error('Error fetching wishlists:', wishlistError);
    } else {
      console.log(`Found ${wishlists.length} wishlists with cover images\n`);
      
      for (const wishlist of wishlists) {
        const oldUrl = wishlist.cover_image_url;
        
        // Extract filename from Supabase URL
        let fileName = '';
        try {
          const urlObj = new URL(oldUrl);
          const pathParts = urlObj.pathname.split('/');
          fileName = pathParts[pathParts.length - 1];
        } catch (err) {
          // If it's not a valid URL, try to extract filename directly
          fileName = oldUrl.split('/').pop();
        }

        const newUrl = `/HeySpender Media/General/${fileName}`;
        
        // Update the record
        const { error: updateError } = await supabase
          .from('wishlists')
          .update({ cover_image_url: newUrl })
          .eq('id', wishlist.id);

        if (updateError) {
          console.error(`❌ Error updating wishlist ${wishlist.id}:`, updateError);
        } else {
          console.log(`✅ Updated wishlist ${wishlist.id}: ${fileName}`);
        }
      }
    }

    // Update wishlist item images
    const { data: items, error: itemsError } = await supabase
      .from('wishlist_items')
      .select('id, image_url')
      .not('image_url', 'is', null);

    if (itemsError) {
      console.error('Error fetching wishlist items:', itemsError);
    } else {
      console.log(`\nFound ${items.length} wishlist items with images\n`);
      
      for (const item of items) {
        const oldUrl = item.image_url;
        
        // Skip data URLs (base64 encoded images)
        if (oldUrl.startsWith('data:')) {
          console.log(`⏭️  Skipping item ${item.id} (data URL)`);
          continue;
        }

        // Extract filename from Supabase URL
        let fileName = '';
        try {
          const urlObj = new URL(oldUrl);
          const pathParts = urlObj.pathname.split('/');
          fileName = pathParts[pathParts.length - 1];
        } catch (err) {
          // If it's not a valid URL, try to extract filename directly
          fileName = oldUrl.split('/').pop();
        }

        const newUrl = `/HeySpender Media/General/${fileName}`;
        
        // Update the record
        const { error: updateError } = await supabase
          .from('wishlist_items')
          .update({ image_url: newUrl })
          .eq('id', item.id);

        if (updateError) {
          console.error(`❌ Error updating item ${item.id}:`, updateError);
        } else {
          console.log(`✅ Updated item ${item.id}: ${fileName}`);
        }
      }
    }

    console.log('\n✅ Image URL migration complete!');

  } catch (error) {
    console.error('Error in migration process:', error);
  }
}

updateImageUrls();

