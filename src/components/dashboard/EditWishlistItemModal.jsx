import React, { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { imageService } from '@/lib/wishlistService';
import { useToast } from '@/components/ui/use-toast';
import { getUserFriendlyError } from '@/lib/utils';
import { wishlistItemSchema } from '@/lib/formValidation';
import FormField from '@/components/forms/FormField';
import ImageUploadField from '@/components/forms/ImageUploadField';

const EditWishlistItemModal = ({ isOpen, onClose, item, wishlists, onSave }) => {
  const { toast } = useToast();
  
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, errors }
  } = useForm({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: {
      name: '',
      description: '',
      unit_price_estimate: 0,
      qty_total: 1,
      product_url: '',
      image_url: '',
      wishlist_id: ''
    }
  });

  // Watch image_url for ImageUploadField
  const imageUrl = useWatch({ control, name: 'image_url' });
  const wishlistId = useWatch({ control, name: 'wishlist_id' });

  // Reset form when item changes
  useEffect(() => {
    if (item && isOpen) {
      // Handle different possible structures of wishlist_id
      let wishlistId = '';
      
      if (item.wishlist_id) {
        // If it's a direct ID
        wishlistId = typeof item.wishlist_id === 'object' ? item.wishlist_id.id : item.wishlist_id;
      } else if (item.wishlist?.id) {
        // If wishlist is nested
        wishlistId = item.wishlist.id;
      }
      
      // Ensure wishlistId is a string for Select component matching
      wishlistId = wishlistId ? String(wishlistId) : '';
      
      reset({
        name: item.name || '',
        description: item.description || '',
        unit_price_estimate: item.unit_price_estimate || 0,
        qty_total: item.qty_total || 1,
        product_url: item.product_url || '',
        image_url: item.image_url || '',
        wishlist_id: wishlistId
      });
    }
  }, [item, isOpen, reset, wishlists]);

  const onSubmit = async (data) => {
    try {
      await onSave(item.id, {
        ...data,
        description: data.description || null,
        product_url: data.product_url || null,
        image_url: data.image_url || null
      });
      onClose();
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to update item',
        description: getUserFriendlyError(error, 'updating the item')
      });
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const url = await imageService.uploadItemImage(file, 'temp-user-id');
      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been updated.'
      });
      return url;
    } catch (error) {
      console.error('Image upload failed:', error);
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: getUserFriendlyError(error, 'uploading the image')
      });
      
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" fullscreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Edit Wishlist Item</DialogTitle>
          <DialogDescription>
            Update the details of your wishlist item. You can modify any information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Item Name */}
          <FormField
            control={control}
            name="name"
            label="Item Name"
            required
            behaviorOverrides={{
              inputProps: {
                placeholder: 'e.g. iPhone 15 Pro',
              }
            }}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            label="Description"
            description="Optional: Describe this item"
            behaviorOverrides={{
              inputProps: {
                placeholder: 'Describe this item...',
              }
            }}
          />

          {/* Price and Quantity - Side by side on mobile */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <FormField
              control={control}
              name="unit_price_estimate"
              label="Price (₦)"
              description="Optional"
            />

            {/* Quantity */}
            <FormField
              control={control}
              name="qty_total"
              label="Quantity"
              required
            />
          </div>

          {/* Product URL */}
          <FormField
            control={control}
            name="product_url"
            label="Product URL"
            description="Optional: Link to the product"
          />

          {/* Image Upload */}
          <ImageUploadField
            label="Item Image"
            value={imageUrl}
            onChange={(url) => setValue('image_url', url)}
            onUpload={handleImageUpload}
            description="Optional: Upload a photo"
          />

          {/* Wishlist Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Link to Wishlist
              <span className="text-red-600 ml-1">*</span>
            </Label>
            <Controller
              control={control}
              name="wishlist_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.wishlist_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a wishlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {wishlists?.length ? (
                      wishlists.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.title}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-wl" disabled>No wishlists available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.wishlist_id && (
              <p className="text-sm text-red-600">{errors.wishlist_id.message}</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="modal"
              onClick={onClose}
              className="bg-white w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="modal"
              className="bg-brand-orange text-black w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWishlistItemModal;
