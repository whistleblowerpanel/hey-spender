import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Upload } from 'lucide-react';

const AddItemsModal = ({ isOpen, onClose, wishlist, onSave }) => {
  const [items, setItems] = useState([{
    name: '',
    description: '',
    unit_price_estimate: '',
    qty_total: 1,
    product_url: '',
    image_url: '',
    allow_group_gift: false,
    priority: 'med'
  }]);

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'med', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const addItem = () => {
    setItems([...items, {
      name: '',
      description: '',
      unit_price_estimate: '',
      qty_total: 1,
      product_url: '',
      image_url: '',
      allow_group_gift: false,
      priority: 'med'
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

  const handleSave = async () => {
    try {
      const validItems = items.filter(item => item.name.trim());
      await onSave(validItems);
      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Items to "{wishlist?.title}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="md:col-span-2">
                  <Label htmlFor={`item-name-${index}`}>Item Name *</Label>
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
                  <Label htmlFor={`item-description-${index}`}>Description</Label>
                  <Textarea
                    id={`item-description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Describe the item..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor={`item-price-${index}`}>Estimated Price (₦)</Label>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    value={item.unit_price_estimate}
                    onChange={(e) => updateItem(index, 'unit_price_estimate', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`item-quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.qty_total}
                    onChange={(e) => updateItem(index, 'qty_total', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                {/* Product URL */}
                <div>
                  <Label htmlFor={`item-url-${index}`}>Product URL</Label>
                  <Input
                    id={`item-url-${index}`}
                    type="url"
                    value={item.product_url}
                    onChange={(e) => updateItem(index, 'product_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor={`item-priority-${index}`}>Priority</Label>
                  <Select
                    value={item.priority}
                    onValueChange={(value) => updateItem(index, 'priority', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Group Gift */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`item-group-gift-${index}`}
                      checked={item.allow_group_gift}
                      onCheckedChange={(checked) => updateItem(index, 'allow_group_gift', checked)}
                    />
                    <Label htmlFor={`item-group-gift-${index}`}>
                      Allow group gifts (multiple people can contribute)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addItem}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Item
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="custom" className="bg-brand-orange text-black">
            Add Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemsModal;
