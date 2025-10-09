import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const SideDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel'
}) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div
        ref={drawerRef}
        className="w-full max-w-md bg-white h-full shadow-xl transform transition-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <h2 className="text-xl font-semibold text-brand-purple-dark">{title}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {(onSave || onCancel) && (
          <div className="border-t-2 border-black p-6">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1"
                >
                  {cancelLabel}
                </Button>
              )}
              {onSave && (
                <Button
                  onClick={onSave}
                  variant="custom"
                  className="bg-brand-orange text-black flex-1"
                >
                  {saveLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideDrawer;
