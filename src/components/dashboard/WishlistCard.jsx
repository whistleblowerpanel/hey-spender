import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Eye, Share2, Gift, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const WishlistCard = ({ 
  wishlist, 
  onEdit, 
  onView, 
  onShare, 
  onAddItems,
  onDelete,
  isSelected = false,
  onSelect
}) => {
  const visibilityLabel = {
    public: 'Public',
    unlisted: 'Unlisted',
    private: 'Private'
  }[wishlist.visibility];

  const visibilityColor = {
    public: 'bg-green-100 text-green-800',
    unlisted: 'bg-yellow-100 text-yellow-800',
    private: 'bg-gray-100 text-gray-800'
  }[wishlist.visibility];

  const statusColor = {
    draft: 'bg-gray-100 text-gray-800',
    live: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-600'
  }[wishlist.status];

  const progress = wishlist.items_count && wishlist.items_count > 0 
    ? (wishlist.items_fulfilled_count || 0) / wishlist.items_count * 100 
    : 0;

  return (
    <div className="bg-white border-2 border-black overflow-hidden hover:shadow-lg transition-shadow relative">
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(wishlist.id, checked)}
          />
        </div>
      )}
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-brand-purple-light to-brand-purple-dark relative">
        {wishlist.cover_image_url ? (
          <img 
            src={wishlist.cover_image_url} 
            alt={wishlist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-12 h-12 text-white opacity-70" />
          </div>
        )}
        
        {/* Status and Visibility badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 text-xs font-medium ${statusColor}`}>
            {wishlist.status}
          </span>
          <span className={`px-2 py-1 text-xs font-medium ${visibilityColor}`}>
            {visibilityLabel}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Title and Occasion */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">{wishlist.title}</h3>
          {wishlist.occasion && (
            <span className="inline-block px-3 py-1 bg-brand-purple-light text-brand-purple-dark text-sm font-medium">
              {wishlist.occasion}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="text-sm text-gray-600 mb-4">
          {wishlist.wishlist_date 
            ? `Due ${new Date(wishlist.wishlist_date).toLocaleDateString()}`
            : 'Flexible timing'
          }
        </div>

        {/* Progress */}
        <div className="space-y-3 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-4" />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items</span>
            <span className="font-semibold">
              {wishlist.items_fulfilled_count || 0} / {wishlist.items_count || 0}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={onAddItems}
            variant="outline" 
            size="sm"
            className="flex-1 mr-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-brand-purple-dark hover:bg-brand-purple-dark/90">
                <MoreHorizontal className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddItems}>
                <Gift className="mr-2 h-4 w-4" />
                Add Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-brand-accent-red">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
