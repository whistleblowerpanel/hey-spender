import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { getUserFriendlyError } from '@/lib/utils';
import { cashGoalSchema } from '@/lib/formValidation';
import FormField from '@/components/forms/FormField';
import DateInput from '@/components/forms/DateInput';

const AddCashGoalModal = ({ isOpen, onClose, wishlists, onSave }) => {
  const { toast } = useToast();
  
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting }
  } = useForm({
    resolver: zodResolver(cashGoalSchema),
    defaultValues: {
      title: '',
      target_amount: 0,
      deadline: null,
      wishlist_id: ''
    }
  });

  const deadlineValue = useWatch({ control, name: 'deadline' });
  const [deadlineType, setDeadlineType] = React.useState('flexible');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      reset({
        title: '',
        target_amount: 0,
        deadline: null,
        wishlist_id: ''
      });
      setDeadlineType('flexible');
    }
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const goalData = {
        title: data.title.trim(),
        target_amount: data.target_amount,
        deadline: deadlineType === 'specific' && data.deadline ? data.deadline.toISOString() : null,
        wishlist_id: data.wishlist_id
      };
      
      await onSave(goalData);
      onClose();
    } catch (error) {
      console.error('Error creating cash goal:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to create cash goal',
        description: getUserFriendlyError(error, 'creating the cash goal')
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" fullscreenOnMobile={false}>
        <DialogHeader>
          <DialogTitle>Add New Cash Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Title */}
          <FormField
            control={control}
            name="title"
            label="Goal Title"
            required
            behaviorOverrides={{
              inputProps: {
                placeholder: 'e.g., Save for new laptop',
              }
            }}
          />

          {/* Target Amount */}
          <FormField
            control={control}
            name="target_amount"
            label="Target Amount"
            required
            behaviorOverrides={{
              inputProps: {
                placeholder: '150,000',
              }
            }}
          />

          {/* Wishlist Selection */}
          <div className="space-y-2">
            <Label htmlFor="wishlist-select" className="text-sm sm:text-base font-medium flex items-center gap-1">
              Wishlist
              <span className="text-red-600" aria-label="required">*</span>
            </Label>
            <Select 
              value={watch('wishlist_id')}
              onValueChange={(value) => setValue('wishlist_id', value)}
            >
              <SelectTrigger id="wishlist-select" className="mt-2 border-2 border-black">
                <SelectValue placeholder="Select a wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlists?.map(wishlist => (
                  <SelectItem key={wishlist.id} value={wishlist.id}>
                    {wishlist.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline Type */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-medium">Deadline</Label>
            <RadioGroup 
              value={deadlineType}
              onValueChange={(value) => {
                setDeadlineType(value);
                if (value === 'flexible') {
                  setValue('deadline', null);
                }
              }}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="flexible" 
                  id="goal-flexible"
                  className="w-4 h-4 border-2 border-black rounded-none data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green [&>span]:hidden"
                />
                <Label htmlFor="goal-flexible" className="font-normal cursor-pointer">No specific deadline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="specific" 
                  id="goal-specific"
                  className="w-4 h-4 border-2 border-black rounded-none data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green [&>span]:hidden"
                />
                <Label htmlFor="goal-specific" className="font-normal cursor-pointer">Specific deadline</Label>
              </div>
            </RadioGroup>

            {deadlineType === 'specific' && (
              <DateInput
                value={deadlineValue}
                onChange={(date) => setValue('deadline', date)}
                minDate={new Date()}
                placeholder="Pick a deadline"
                className="mt-2"
              />
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="modal" 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="bg-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="modal" 
              className="bg-brand-orange text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCashGoalModal;
