import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

const SwipeActions = ({ onEdit, onDelete, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - startX;
    
    // Only allow left swipe
    if (deltaX < 0) {
      setCurrentX(Math.max(deltaX, -120));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (currentX < -60) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCurrentX(0);
    }
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    
    if (deltaX < 0) {
      setCurrentX(Math.max(deltaX, -120));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (currentX < -60) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCurrentX(0);
    }
  };

  const closeActions = () => {
    setIsOpen(false);
    setCurrentX(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${isOpen ? -120 : currentX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Main content */}
        <div className="w-full flex-shrink-0" onClick={closeActions}>
          {children}
        </div>
        
        {/* Action buttons */}
        <div className="absolute right-0 top-0 h-full flex">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-full border-r-0 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="h-full bg-red-500 text-white hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwipeActions;
