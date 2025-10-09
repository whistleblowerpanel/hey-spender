import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getUserFriendlyError } from '@/lib/utils';
import FileUpload from '@/components/ui/file-upload';

const AddItemsModal = ({ isOpen, onClose, wishlist, onSave }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([{
    name: '',
    description: '',
    unit_price_estimate: '',
    qty_total: 1,
    product_url: '',
    image_url: '',
    allow_group_gift: false
  }]);

  const addItem = () => {
    setItems([...items, {
      name: '',
      description: '',
      unit_price_estimate: '',
      qty_total: 1,
      product_url: '',
      image_url: '',
      allow_group_gift: false
    }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleFileUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateItem(index, 'image_url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const validItems = items.filter(item => item.name.trim());
      await onSave(validItems);
      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
      toast({ variant: 'destructive', title: 'Unable to add items', description: getUserFriendlyError(error, 'adding items') });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" fullscreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add Items to "{wishlist?.title}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-brand-accent-red hover:text-brand-accent-red/90"
                  >
                    <X className="w-6 h-6" strokeWidth={3} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="md:col-span-2">
                  <Label htmlFor={`item-name-${index}`} className="text-sm">Item Name *</Label>
                  <Input
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Enter item name"
                    className="mt-1"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor={`item-description-${index}`} className="text-sm">Description</Label>
                  <Textarea
                    id={`item-description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Describe the item..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Price and Quantity - Side by side on mobile */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <Label htmlFor={`item-price-${index}`} className="text-sm">Estimated Price (₦)</Label>
                    <Input
                      id={`item-price-${index}`}
                      type="text"
                      value={item.unit_price_estimate ? parseInt(item.unit_price_estimate).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (value === '' || /^\d+$/.test(value)) {
                          updateItem(index, 'unit_price_estimate', value);
                        }
                      }}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label htmlFor={`item-quantity-${index}`} className="text-sm">Quantity</Label>
                    <Input
                      id={`item-quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.qty_total}
                      onChange={(e) => updateItem(index, 'qty_total', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Product URL */}
                <div className="md:col-span-2">
                  <Label htmlFor={`item-url-${index}`} className="text-sm">Product URL</Label>
                  <Input
                    id={`item-url-${index}`}
                    type="url"
                    value={item.product_url}
                    onChange={(e) => updateItem(index, 'product_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <Label className="text-sm">Item Image</Label>
                  {item.image_url ? (
                    <div className="mt-2 relative">
                      <img 
                        src={item.image_url} 
                        alt="Item preview" 
                        className="w-full h-32 sm:h-48 object-cover border-2 border-black"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateItem(index, 'image_url', '')}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <FileUpload 
                        onFileSelect={(file) => handleFileUpload(index, file)}
                        variant="white"
                      />
                    </div>
                  )}
                </div>

                {/* Group Gift */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`item-group-gift-${index}`}
                      checked={item.allow_group_gift}
                      onCheckedChange={(checked) => updateItem(index, 'allow_group_gift', checked)}
                    />
                    <Label htmlFor={`item-group-gift-${index}`} className="text-sm">
                      Allow group gifts (multiple people can contribute)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="modal"
            onClick={addItem}
            className="w-full bg-brand-accent-red text-white text-sm sm:text-base mt-2 mb-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Item
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="modal" onClick={onClose} className="bg-white w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleSave} variant="modal" className="bg-brand-orange text-black w-full sm:w-auto hover:shadow-md transition-shadow">
            Add Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemsModal;
