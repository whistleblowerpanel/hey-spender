import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Image upload field with preview
 * Supports file selection, preview, and removal
 */
const ImageUploadField = ({
  label,
  value,
  onChange,
  onUpload,
  required = false,
  disabled = false,
  maxSizeMB = 10,
  accept = 'image/*',
  description,
  error,
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || '');

  // Sync previewUrl with value prop changes
  useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be under ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload if handler provided
    if (onUpload) {
      setUploading(true);
      try {
        const uploadedUrl = await onUpload(file);
        onChange?.(uploadedUrl);
        setPreviewUrl(uploadedUrl);
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload image. Please try again.');
        setPreviewUrl('');
      } finally {
        setUploading(false);
      }
    } else {
      // Just pass the file object
      onChange?.(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange?.(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label className="text-sm sm:text-base font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </Label>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {previewUrl ? (
          // Preview
          <div className="flex items-center justify-between">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-24 w-24 object-cover border-2 border-black rounded"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="border-2 border-black"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        ) : (
          // Upload Button
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <div className="h-16 w-16 flex items-center justify-center bg-gray-100 border-2 border-black rounded">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              JPG, PNG, WEBP, GIF up to {maxSizeMB}MB
            </span>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Description */}
      {description && !error && (
        <p className="text-xs sm:text-sm text-gray-500">{description}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default ImageUploadField;

