import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AddItemFormModal from './AddItemsModal';
import { ArrowLeft, ArrowRight, Sparkles, Plus, X as XIcon } from 'lucide-react';
import { wishlistSchema } from '@/lib/formValidation';
import FormField from '@/components/forms/FormField';
import DateInput from '@/components/forms/DateInput';
import ImageUploadField from '@/components/forms/ImageUploadField';

const GetStartedWizard = ({ isOpen, onClose, onComplete, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [cashGoals, setCashGoals] = useState([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      title: '',
      occasion: '',
      story: '',
      visibility: 'unlisted',
      event_date: null,
      cover_image_url: ''
    }
  });

  const coverImageUrl = useWatch({ control, name: 'cover_image_url' });
  const dateType = watch('event_date') ? 'specific' : 'flexible';

  const steps = [
    { title: 'Welcome', description: "Let's set up your first wishlist" },
    { title: 'Title', description: 'What should we call your wishlist?' },
    { title: 'Occasion', description: 'Is this for a special occasion?' },
    { title: 'Date', description: 'When would you love to receive these gifts?' },
    { title: 'Story', description: 'Tell your Spenders why this wishlist matters.' },
    { title: 'Cover', description: 'Choose a beautiful cover photo' },
    { title: 'Privacy', description: 'Who can see your wishlist?' },
    { title: 'Wishlist Items & Goals', description: 'Add your first wishlist items or cash goals' }
  ];

  const occasions = [
    'Birthday', 'Wedding', 'Baby', 'Graduation', 
    'Housewarming', 'Charity', 'Just Because', 'Other', 'No occasion'
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = handleSubmit((data) => {
    const wizardData = {
      ...data,
      items,
      cashGoals
    };
    onComplete(wizardData);
    onClose();
  });

  const handleAddItem = (itemData) => {
    setItems(prev => [...prev, itemData]);
  };

  const handleAddGoal = (goalData) => {
    setCashGoals(prev => [...prev, goalData]);
  };

  const handleAIPolish = async (text, onChange) => {
    // TODO: Implement AI polish API call
    console.log('AI Polish requested for:', text);
    // For now, just capitalize first letter of sentences
    const polished = text.replace(/\.\s+([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`);
    onChange(polished);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-white flex items-center justify-center rounded-lg">
              <Sparkles className="w-8 h-8 text-brand-purple-dark" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to HeySpender!
              </h2>
              <p className="text-white/80">
                We'll ask a few quick questions. You can edit anything later.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={control}
              name="title"
              label="Wishlist Title"
              required
              behaviorOverrides={{
                inputProps: {
                  placeholder: 'e.g. My Birthday Wishlist, Wedding Registry',
                  className: 'bg-white border-2 border-black text-black'
                }
              }}
            />
            <p className="text-xs sm:text-sm text-white/70">
              Choose a name that describes what this wishlist is for.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-white text-sm sm:text-base font-medium">What's the occasion?</Label>
            <Select value={watch('occasion')} onValueChange={(value) => setValue('occasion', value)}>
              <SelectTrigger className="bg-white border-2 border-black text-black focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20">
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map(occasion => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-white text-sm sm:text-base font-medium">When would you love to receive these gifts?</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                   onClick={() => setValue('event_date', null)}>
                <div className={`w-4 h-4 border-2 border-black ${!watch('event_date') ? 'bg-brand-green' : 'bg-white'}`} />
                <Label className="text-white cursor-pointer flex-1">No exact date</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                   onClick={() => {/* DateInput will handle this */}}>
                <div className={`w-4 h-4 border-2 border-black ${watch('event_date') ? 'bg-brand-green' : 'bg-white'}`} />
                <Label className="text-white cursor-pointer flex-1">Specific date</Label>
              </div>
            </div>

            {dateType === 'specific' && (
              <DateInput
                value={watch('event_date')}
                onChange={(date) => setValue('event_date', date)}
                minDate={new Date()}
                placeholder="Pick a date"
                className="bg-white border-2 border-black"
              />
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <FormField
              control={control}
              name="story"
              label="Your Story"
              description="Tell your supporters why this wishlist matters to you"
              behaviorOverrides={{
                inputProps: {
                  placeholder: 'Tell your supporters why this wishlist matters to you...',
                  className: 'bg-white border-2 border-black text-black'
                }
              }}
              onAIPolish={handleAIPolish}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <ImageUploadField
              label="Cover Photo"
              value={coverImageUrl}
              onChange={(url) => setValue('cover_image_url', url)}
              description="Upload a beautiful cover photo for your wishlist"
              className="bg-white/10 p-4 rounded-lg"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <FormField
              control={control}
              name="visibility"
              label="Who can see your wishlist?"
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-white">Add Wishlist Items or Cash Goals</h3>
              <p className="text-white/70 mb-6">
                You can add wishlist items and cash goals to your wishlist. Don't worry, you can always add more later!
              </p>
            </div>
            
            {/* Show added items count */}
            {(items.length > 0 || cashGoals.length > 0) && (
              <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-white text-sm">
                <p>✓ {items.length} wishlist item{items.length !== 1 ? 's' : ''} added</p>
                <p>✓ {cashGoals.length} cash goal{cashGoals.length !== 1 ? 's' : ''} added</p>
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                type="button"
                onClick={() => setAddItemModalOpen(true)}
                className="bg-brand-green border-2 border-black text-black hover:bg-brand-green/90 w-full py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wishlist Item
              </Button>
              
              <Button 
                type="button"
                onClick={() => setAddGoalModalOpen(true)}
                className="bg-brand-green border-2 border-black text-black hover:bg-brand-green/90 w-full py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Cash Goal
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-brand-purple-dark w-full max-w-2xl h-[500px] sm:h-[600px] overflow-hidden border-2 border-black rounded-lg">
          {/* Header */}
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-[30px] font-semibold text-white">
                  {steps[currentStep].title}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {steps[currentStep].description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors ml-4 sm:ml-6 -mt-2 sm:-mt-4"
                type="button"
              >
                <XIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 h-[300px] sm:h-[350px] overflow-y-auto bg-brand-purple-dark flex items-start justify-center pt-8 sm:pt-16">
            <div className="w-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 pt-6 sm:pt-4 pb-6 sm:pb-1 h-20">
            <div className="flex items-center justify-center gap-4 sm:gap-8 px-2 sm:px-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-green border-2 border-black flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </button>

              {/* Stage Dots */}
              <div className="flex items-center gap-1 sm:gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 sm:w-4 sm:h-4 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                      index === currentStep
                        ? 'bg-brand-orange'
                        : 'bg-white hover:bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {currentStep === steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="bg-brand-green border-2 border-black px-4 sm:px-6 py-2 sm:py-3 shadow-sm hover:bg-brand-green/90"
                >
                  <span className="text-black font-medium text-sm sm:text-base">Create</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-green border-2 border-black flex items-center justify-center shadow-sm"
                >
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AddItemFormModal
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        onSave={handleAddItem}
        type="item"
      />
      
      <AddItemFormModal
        isOpen={addGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
        onSave={handleAddGoal}
        type="goal"
      />
    </>
  );
};

export default GetStartedWizard;
