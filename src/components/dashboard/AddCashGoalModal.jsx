import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const AddCashGoalModal = ({ isOpen, onClose, wishlists, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: null,
    deadlineType: 'flexible',
    wishlistId: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        title: '',
        targetAmount: '',
        deadline: null,
        deadlineType: 'flexible',
        wishlistId: ''
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.title || !formData.targetAmount || !formData.wishlistId) {
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        title: formData.title,
        target_amount: parseFloat(formData.targetAmount),
        deadline: formData.deadlineType === 'specific' ? formData.deadline?.toISOString() : null,
        wishlist_id: formData.wishlistId
      };

      await onSave(goalData);
      onClose();
    } catch (error) {
      console.error('Error creating cash goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Cash Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="goal-title">Goal Title</Label>
            <Input
              id="goal-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. To Carry Hoelosho For Idris"
              className="mt-2"
            />
          </div>

          {/* Target Amount */}
          <div>
            <Label htmlFor="target-amount">Target Amount (₦)</Label>
            <Input
              id="target-amount"
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              placeholder="100000"
              className="mt-2"
              min="1"
              step="1"
            />
          </div>

          {/* Wishlist Selection */}
          <div>
            <Label>Wishlist</Label>
            <Select 
              value={formData.wishlistId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, wishlistId: value }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlists.map(wishlist => (
                  <SelectItem key={wishlist.id} value={wishlist.id}>
                    {wishlist.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div>
            <Label>Deadline</Label>
            <RadioGroup 
              value={formData.deadlineType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, deadlineType: value }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible" id="goal-flexible" />
                <Label htmlFor="goal-flexible">No specific deadline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="goal-specific" />
                <Label htmlFor="goal-specific">Specific deadline</Label>
              </div>
            </RadioGroup>

            {formData.deadlineType === 'specific' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'PPP') : 'Pick a deadline'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="custom" 
            className="bg-brand-orange text-black"
            disabled={loading || !formData.title || !formData.targetAmount || !formData.wishlistId}
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCashGoalModal;
