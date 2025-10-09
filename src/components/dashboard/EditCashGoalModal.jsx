import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const EditCashGoalModal = ({ isOpen, onClose, goal, wishlists, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: null,
    deadlineType: 'flexible',
    wishlistId: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      // Handle different possible structures of wishlist_id
      let wishlistId = '';
      
      if (goal.wishlist_id) {
        wishlistId = goal.wishlist_id;
      } else if (goal.wishlist?.id) {
        wishlistId = goal.wishlist.id;
      } else if (goal.wishlist && typeof goal.wishlist === 'object' && goal.wishlist.id) {
        // If wishlist is an object, get its id
        wishlistId = goal.wishlist.id;
      }
      
      // Ensure wishlistId is a string, not an object
      wishlistId = wishlistId ? String(wishlistId) : '';
      
      const newFormData = {
        title: goal.title || '',
        targetAmount: goal.target_amount?.toString() || '',
        deadline: goal.deadline ? new Date(goal.deadline) : null,
        deadlineType: goal.deadline ? 'specific' : 'flexible',
        wishlistId: wishlistId
      };
      
      setFormData(newFormData);
    }
  }, [goal, isOpen]);

  const handleSave = async () => {
    if (!formData.title || !formData.targetAmount) {
      return;
    }

    // Get wishlist ID from form selection, or fallback to original goal's wishlist
    let wishlistId = formData.wishlistId;
    
    // If no wishlist selected in form, use the original goal's wishlist
    if (!wishlistId) {
      if (goal.wishlist_id) {
        wishlistId = goal.wishlist_id;
      } else if (goal.wishlist?.id) {
        wishlistId = goal.wishlist.id;
      }
    }

    setLoading(true);
    try {
      const updates = {
        title: formData.title,
        target_amount: parseFloat(formData.targetAmount),
        deadline: formData.deadlineType === 'specific' ? formData.deadline?.toISOString() : null
      };

      // Only update wishlist_id if it was changed
      if (wishlistId) {
        updates.wishlist_id = wishlistId;
      }

      await onSave(goal.id, updates);
      onClose();
    } catch (error) {
      console.error('Error updating cash goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cash Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="edit-goal-title">Goal Title</Label>
            <Input
              id="edit-goal-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. To Carry Hoelosho For Idris"
              className="mt-2"
            />
          </div>

          {/* Target Amount */}
          <div>
            <Label htmlFor="edit-target-amount">Target Amount (₦)</Label>
            <Input
              id="edit-target-amount"
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
              value={formData.wishlistId || ''} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, wishlistId: value }));
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlists && wishlists.length > 0 ? (
                  wishlists.map(wishlist => (
                    <SelectItem key={wishlist.id} value={wishlist.id}>
                      {wishlist.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-wishlists" disabled>
                    No wishlists available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formData.wishlistId ? String(formData.wishlistId) : 'None'}
            </p>
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
                <RadioGroupItem value="flexible" id="edit-goal-flexible" />
                <Label htmlFor="edit-goal-flexible">No specific deadline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="edit-goal-specific" />
                <Label htmlFor="edit-goal-specific">Specific deadline</Label>
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
            disabled={loading || !formData.title?.trim() || !formData.targetAmount}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCashGoalModal;

