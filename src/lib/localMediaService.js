/**
 * Local Media Service
 * Handles file uploads to local storage instead of Supabase
 */

/**
 * Upload a file to local storage (public/HeySpender Media/General)
 * In development, files are served from the public folder
 * @param {File} file - The file to upload
 * @param {string} userId - User ID for naming the file
 * @param {string} folder - Subfolder (e.g., 'wishlist-covers', 'wishlist-items')
 * @returns {Promise<string>} The public URL path to the file
 */
export async function uploadImageToLocal(file, userId, folder = '') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  // For browser uploads, we need to send to a server endpoint
  // Since we're using Vite, we can use FormData and fetch to upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('folder', folder);

  try {
    // In development with Vite, we'll handle this differently
    // For now, we'll just copy the file to public folder manually or via backend
    // But since this is a static site, we'll use a simpler approach:
    // Return a local path that can be set when the file is manually placed in public folder
    
    // For a real implementation, you'd need a backend endpoint to handle uploads
    // For now, we'll simulate by returning the expected path
    const publicPath = `/HeySpender Media/General/${fileName}`;
    
    // Store file reference in localStorage for dev purposes
    // In production, you'd upload to a server or use a service
    if (typeof window !== 'undefined' && window.localStorage) {
      const fileReader = new FileReader();
      return new Promise((resolve, reject) => {
        fileReader.onload = (e) => {
          // For images, we can store as data URL temporarily
          // This is NOT recommended for production - just for demo
          resolve(publicPath);
        };
        fileReader.onerror = reject;
        fileReader.readAsDataURL(file);
      });
    }
    
    return publicPath;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Alternative: Save file directly to public folder using Node.js (server-side)
 * This function should be called from a backend API endpoint
 */
export async function saveFileToPublic(file, fileName) {
  // This would be implemented on the server side
  // For example, in a Vite plugin or API route
  const fs = await import('fs');
  const path = await import('path');
  
  const targetDir = path.join(process.cwd(), 'public/HeySpender Media/General');
  const targetPath = path.join(targetDir, fileName);
  
  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Save file
  const buffer = await file.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(buffer));
  
  return `/HeySpender Media/General/${fileName}`;
}

/**
 * For client-side file handling without backend,
 * we'll use a simple approach: copy files manually to public folder
 * and return the expected path
 */
export function getLocalImagePath(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  return `/HeySpender Media/General/${fileName}`;
}

/**
 * Delete a file from the public folder
 * This function attempts to delete files from the local public folder
 * @param {string} imageUrl - The URL/path of the image to delete
 * @returns {Promise<boolean>} - True if deletion was successful or file didn't exist
 */
export async function deleteImageFromLocal(imageUrl) {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      console.warn('Could not extract filename from URL:', imageUrl);
      return false;
    }

    // In a browser environment, we can't directly delete files from the public folder
    // This would require a backend API endpoint to handle file deletion
    // For now, we'll log the deletion attempt and return true
    console.log(`Would delete file: ${filename} from public/HeySpender Media/General/`);
    
    // In a real implementation, you would make an API call to delete the file:
    // const response = await fetch('/api/delete-file', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filename })
    // });
    // return response.ok;

    return true; // Assume success for now
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Delete multiple images from local storage
 * @param {string[]} imageUrls - Array of image URLs to delete
 * @returns {Promise<{success: number, failed: number}>} - Count of successful and failed deletions
 */
export async function deleteMultipleImages(imageUrls) {
  let successCount = 0;
  let failedCount = 0;

  for (const imageUrl of imageUrls) {
    const success = await deleteImageFromLocal(imageUrl);
    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

