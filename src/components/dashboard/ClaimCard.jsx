import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Calendar, Clock, User, ExternalLink, Trash2, CheckCircle, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow } from 'date-fns';

const ClaimCard = ({ 
  claim, 
  onUpdateStatus, 
  onUpdateClaim, 
  onDelete,
  onViewWishlist 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    fulfilled: CheckCircle,
    cancelled: X,
    expired: Clock
  };

  const item = claim.wishlist_items;
  const wishlist = item?.wishlists;
  const wishlistOwner = wishlist?.users;

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(claim.id, newStatus);
  };

  const handleDelete = () => {
    onDelete(claim.id);
    setShowDeleteDialog(false);
  };

  const isExpired = new Date(claim.expire_at) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(claim.expire_at) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white border-2 border-black overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {item?.name || 'Unknown Item'}
            </h3>
            <p className="text-sm text-gray-600">
              For <span className="font-medium">{wishlistOwner?.username || 'Unknown User'}</span>'s {wishlist?.title || 'wishlist'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[claim.status]} border-0`}>
              {React.createElement(statusIcons[claim.status], { className: "w-3 h-3 mr-1" })}
              {claim.status?.charAt(0).toUpperCase() + claim.status?.slice(1)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewWishlist(wishlist.slug)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('confirmed')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('fulfilled')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Fulfilled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Claim
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Item Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Estimated Price</div>
            <div className="font-semibold">
              ₦{item?.unit_price_estimate?.toLocaleString() || 'Not specified'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Claimed On</div>
            <div className="font-medium text-sm">
              {format(new Date(claim.created_at), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-gray-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {isExpired ? 'Expired' : 'Expires'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {format(new Date(claim.expire_at), 'MMM dd, yyyy')}
            {!isExpired && (
              <span className="ml-2 text-xs">
                ({daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left)
              </span>
            )}
          </div>
          {!isExpired && (
            <Progress 
              value={Math.max(0, 100 - (daysUntilExpiry / 7) * 100)} 
              className="mt-2 h-1"
            />
          )}
        </div>

        {/* Notes */}
        {claim.note && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Note</div>
            <div className="text-sm text-gray-700 bg-gray-50 p-2">
              {claim.note}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewWishlist(wishlist.slug)}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Wishlist
          </Button>
          
          {claim.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('confirmed')}
              className="flex-1 bg-brand-orange text-black hover:bg-brand-orange/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          )}
          
          {claim.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('fulfilled')}
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Fulfilled
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this claim? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClaimCard;
