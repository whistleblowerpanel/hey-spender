import React from 'react';

const FileUpload = ({ 
  onFileSelect, 
  acceptedTypes = "PNG, JPG, WEBP", 
  maxSize = "5MB",
  className = "",
  variant = "default" // default, purple, white, etc.
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'purple':
        return {
          container: "border-2 border-dashed border-white/30 p-4 md:p-8 text-center bg-white/5",
          icon: "text-white/70",
          primaryText: "text-white font-medium text-sm md:text-lg",
          secondaryText: "text-white/70 text-xs md:text-sm mt-1"
        };
      case 'white':
        return {
          container: "border-2 border-dashed border-gray-300 p-4 md:p-8 text-center bg-white",
          icon: "text-gray-500",
          primaryText: "text-gray-700 font-medium text-sm md:text-lg",
          secondaryText: "text-gray-500 text-xs md:text-sm mt-1"
        };
      case 'dark':
        return {
          container: "border-2 border-dashed border-gray-600 p-4 md:p-8 text-center bg-gray-800",
          icon: "text-gray-400",
          primaryText: "text-gray-200 font-medium text-sm md:text-lg",
          secondaryText: "text-gray-400 text-xs md:text-sm mt-1"
        };
      default:
        return {
          container: "border-2 border-dashed border-gray-300 p-4 md:p-8 text-center bg-gray-50",
          icon: "text-gray-500",
          primaryText: "text-gray-700 font-medium text-sm md:text-lg",
          secondaryText: "text-gray-500 text-xs md:text-sm mt-1"
        };
    }
  };

  const styles = getVariantStyles();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`${styles.container} ${className} relative cursor-pointer`}>
      <div className="space-y-2 md:space-y-4">
        <div className="w-10 h-10 md:w-16 md:h-16 mx-auto flex items-center justify-center">
          <svg className={`w-8 h-8 md:w-12 md:h-12 ${styles.icon}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
        <div>
          <p className={styles.primaryText}>Click to upload or drag and drop</p>
          <p className={styles.secondaryText}>{acceptedTypes} (MAX. {maxSize})</p>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default FileUpload;
