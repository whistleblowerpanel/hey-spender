# Local Media Upload System

## Overview

The HeySpender application now uses a local file storage system instead of Supabase Storage for all media uploads. Files are stored in `public/HeySpender Media/General/` and served directly from the public folder.

## API Endpoint

### POST `/api/upload`

Upload a media file to local storage.

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (File): The image file to upload
- `fileName` (string): The desired filename (automatically generated from user ID and timestamp)

**Response** (200 OK):
```json
{
  "url": "/HeySpender Media/General/userId-timestamp.ext"
}
```

**Error Response** (400/500):
```json
{
  "error": "Error message"
}
```

## Usage Examples

### Using imageService (Recommended)

```javascript
import { imageService } from '@/lib/wishlistService';

// Upload a cover image
const coverUrl = await imageService.uploadCoverImage(file, userId);

// Upload an item image
const itemUrl = await imageService.uploadItemImage(file, userId);
```

### Direct API Call

```javascript
// Create FormData
const formData = new FormData();
formData.append('file', file);
formData.append('fileName', `${userId}-${Date.now()}.${fileExt}`);

// Upload
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Upload failed');
}

const { url } = await response.json();
console.log('Uploaded to:', url);
```

### Component Example

```javascript
import { imageService } from '@/lib/wishlistService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function MyComponent() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const url = await imageService.uploadCoverImage(file, user.id);
      // Save url to state or database
      console.log('Image uploaded:', url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

## File Naming Convention

Files are named using the following pattern:
```
{userId}-{timestamp}.{extension}
```

Examples:
- `1a727d42-4357-44f7-b87a-bb23983f153a-1759519109142.jpeg`
- `temp-user-id-1759856876944.webp`

## Supported File Types

The system accepts all standard image formats:
- JPEG/JPG
- PNG
- WebP
- GIF

Images are stored in their original format without conversion.

File size limits:
- Maximum: 5MB (can be configured in validation)

### File Storage

Images are stored in their original format:
- **No conversion**: Files maintain their original format and quality
- **Original extension**: Files keep their original file extension
- **Direct storage**: Files are saved directly to the public folder

## Storage Location

All uploaded files are stored in:
```
/Users/gq/Projects/hey-spender/public/HeySpender Media/General/
```

They are accessible via the URL path:
```
/HeySpender Media/General/{filename}
```

## Implementation Details

### Vite Plugin

The upload functionality is implemented as a Vite plugin (`vite-plugin-file-upload.js`) that:
1. Intercepts POST requests to `/api/upload`
2. Parses multipart form data
3. Saves files to the public folder in their original format
4. Returns the public URL path

### Development vs Production

**Development (with Vite)**:
- Upload endpoint handled by Vite API plugin
- Files saved directly to public folder
- Hot reload works seamlessly

**Production**:
- ✅ Full upload functionality implemented
- ✅ Serverless API endpoint handles uploads
- ✅ Compatible with Vercel, Netlify, and other platforms
- ✅ Files saved to public folder automatically

## Migration from Supabase

All existing media files have been:
1. Downloaded from Supabase Storage
2. Saved to `public/HeySpender Media/General/`
3. Database URLs updated to local paths

See `MEDIA_MIGRATION_SUMMARY.md` for full migration details.

## Security Considerations

1. **File Validation**: Currently validates file type and size on client
2. **Filename Sanitization**: Uses UUID-based naming to prevent collisions
3. **Public Access**: All files in public folder are publicly accessible
4. **No Authentication**: Upload endpoint has no auth (add if needed)

## Production Upload Features

✅ **Implemented:**
1. Server-side file type validation
2. File size limits (10MB)
3. CORS configuration
4. Error handling and logging
5. Automatic directory creation
6. Temporary file cleanup

## Future Improvements

1. Add authentication to upload endpoint
2. Add image optimization (resize, compress)
3. Organize files into subfolders by date or user
4. Add file deletion endpoint
5. Implement CDN integration
6. Add upload progress tracking

## Troubleshooting

### Upload fails with "Invalid content type"
- Ensure Content-Type header is `multipart/form-data`
- Check that FormData is properly constructed

### Files not appearing after upload
- Check that public folder is being served
- Verify file was saved to correct location
- Check console for errors

### Images not displaying
- Verify URL path is correct: `/HeySpender Media/General/{filename}`
- Check that file exists in public folder
- Ensure server is serving static files from public

## Related Files

- `vite-plugin-file-upload.js` - Vite plugin for upload endpoint
- `src/lib/wishlistService.js` - Image service with upload functions
- `src/lib/localMediaService.js` - Helper utilities for local storage
- `src/components/dashboard/AddOccasionModal.jsx` - Example component using uploads
- `tools/download-supabase-media.js` - Migration script for downloading files
- `tools/update-image-urls.js` - Migration script for updating database URLs

