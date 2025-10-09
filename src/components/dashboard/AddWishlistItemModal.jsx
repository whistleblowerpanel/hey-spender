import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import FileUpload from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { imageService } from '@/lib/wishlistService';
import { getUserFriendlyError } from '@/lib/utils';

const AddWishlistItemModal = ({ isOpen, onClose, wishlists, defaultWishlistId, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit_price_estimate: '',
    qty_total: '1',
    product_url: '',
    description: '',
    wishlist_id: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        unit_price_estimate: '',
        qty_total: '1',
        product_url: '',
        description: '',
        wishlist_id: defaultWishlistId || '',
        image_url: ''
      });
    }
  }, [isOpen, defaultWishlistId]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await imageService.uploadItemImage(file, 'temp-user-id');
      setFormData(prev => ({ ...prev, image_url: url }));
      toast({ 
        title: 'Image uploaded successfully', 
        description: 'Your image has been added to the item.' 
      });
    } catch (e) {
      console.error('Upload failed', e);
      toast({ 
        variant: 'destructive', 
        title: 'Upload failed', 
        description: getUserFriendlyError(e, 'uploading the image') 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.wishlist_id) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please provide a name and select a wishlist.' });
      return;
    }

    setLoading(true);
    try {
      const cleanAmount = String(formData.unit_price_estimate).replace(/,/g, '');
      const payload = {
        name: formData.name.trim(),
        wishlist_id: formData.wishlist_id,
        unit_price_estimate: formData.unit_price_estimate ? parseFloat(cleanAmount) : null,
        qty_total: formData.qty_total ? parseInt(formData.qty_total) : 1,
        product_url: formData.product_url?.trim() || null,
        description: formData.description?.trim() || null,
        image_url: formData.image_url || null
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Error creating wishlist item:', err);
      toast({ variant: 'destructive', title: 'Unable to create item', description: getUserFriendlyError(err, 'creating the item') });
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.name.trim() && formData.wishlist_id;

  const formatNumber = (value) => {
    const numericValue = String(value).replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg sm:max-h-[95vh]" fullscreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle>Add New Wishlist Item</DialogTitle>
          <DialogDescription>
            Add a new item to your wishlist. Fill in the details below to create your wishlist item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>Item Image</Label>
            <div className="mt-2">
              {formData.image_url ? (
                <div className="space-y-2">
                  <img alt="Item" src={formData.image_url} className="h-24 w-24 object-cover border-2 border-black rounded" />
                  <Button variant="outline" onClick={() => setFormData(p => ({ ...p, image_url: '' }))} className="text-xs">
                    <X className="w-3 h-3 mr-1"/>Remove Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileUpload 
                    variant="white"
                    onFileSelect={handleImageUpload}
                    acceptedTypes="PNG, JPG, WEBP"
                    maxSize="5MB"
                  />
                  <div className="text-center text-sm text-gray-500">
                    <span>or</span>
                  </div>
                  <div>
                    <Label htmlFor="image-url" className="text-sm">Image URL (optional)</Label>
                    <Input 
                      id="image-url"
                      type="url" 
                      value={formData.image_url} 
                      onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))} 
                      placeholder="https://example.com/image.jpg" 
                      className="mt-1" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g., iPhone 15 Pro" className="mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="item-price">Estimated Price (₦)</Label>
              <Input id="item-price" inputMode="numeric" value={formData.unit_price_estimate} onChange={(e) => setFormData(p => ({ ...p, unit_price_estimate: formatNumber(e.target.value) }))} className="mt-2" />
            </div>

            <div>
              <Label htmlFor="item-qty">Quantity</Label>
              <Input id="item-qty" type="number" min="1" step="1" value={formData.qty_total} onChange={(e) => setFormData(p => ({ ...p, qty_total: e.target.value }))} className="mt-2" />
            </div>
          </div>

          <div>
            <Label htmlFor="item-url">Product URL (optional)</Label>
            <Input id="item-url" type="url" value={formData.product_url} onChange={(e) => setFormData(p => ({ ...p, product_url: e.target.value }))} placeholder="https://example.com/product" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="item-desc">Description (optional)</Label>
            <Textarea id="item-desc" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="mt-2 min-h-[80px]" />
          </div>

          <div>
            <Label>Link to Wishlist</Label>
            <Select value={formData.wishlist_id} onValueChange={(v) => setFormData(p => ({ ...p, wishlist_id: v }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlists?.length ? (
                  wishlists.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-wl" disabled>No wishlists available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="modal" onClick={onClose} disabled={loading} className="bg-white">Cancel</Button>
          <Button onClick={handleSave} variant="modal" className="bg-brand-orange text-black" disabled={loading || !isValid}>
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWishlistItemModal;
