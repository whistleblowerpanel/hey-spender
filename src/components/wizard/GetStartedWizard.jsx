import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

// WizardData structure (converted from TypeScript interfaces)
// {
//   title: string,
//   occasion: string,
//   dateType: 'specific' | 'flexible',
//   specificDate?: Date,
//   story: string,
//   coverImage?: string,
//   visibility: 'public' | 'unlisted' | 'private',
//   items: Array<{name, price, quantity, url, description, image, allowGroupGift}>,
//   cashGoals: Array<{title, targetAmount, deadline}>
// }
//
// GetStartedWizardProps: {isOpen, onClose, onComplete, userId}

const GetStartedWizard = ({ isOpen, onClose, onComplete, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    title: '',
    occasion: '',
    dateType: 'flexible',
    story: '',
    visibility: 'unlisted',
    items: [],
    cashGoals: []
  });

  const steps = [
    { title: 'Welcome', description: "Let's set up your first wishlist" },
    { title: 'Title', description: 'What should we call your wishlist?' },
    { title: 'Occasion', description: 'Is this for a special occasion?' },
    { title: 'Date', description: 'When would you love to receive these gifts?' },
    { title: 'Story', description: 'Tell your Spenders why this wishlist matters.' },
    { title: 'Cover', description: 'Choose a beautiful cover photo' },
    { title: 'Privacy', description: 'Who can see your wishlist?' },
    { title: 'Items & Goals', description: 'Add your first items or cash goals' }
  ];

  const occasions = [
    'Birthday', 'Wedding', 'Baby', 'Graduation', 
    'Housewarming', 'Charity', 'Just Because', 'Other', 'No occasion'
  ];

  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

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

  const handleComplete = () => {
    onComplete(data);
    onClose();
  };

  const addItem = () => {
    updateData({
      items: [...data.items, {
        name: '',
        price: 0,
        quantity: 1,
        url: '',
        description: '',
        allowGroupGift: false
      }]
    });
  };

  const updateItem = (index, updates) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateData({ items: newItems });
  };

  const removeItem = (index) => {
    const newItems = data.items.filter((_, i) => i !== index);
    updateData({ items: newItems });
  };

  const addCashGoal = () => {
    updateData({
      cashGoals: [...data.cashGoals, {
        title: '',
        targetAmount: 0,
        deadline: undefined
      }]
    });
  };

  const updateCashGoal = (index, updates) => {
    const newGoals = [...data.cashGoals];
    newGoals[index] = { ...newGoals[index], ...updates };
    updateData({ cashGoals: newGoals });
  };

  const removeCashGoal = (index) => {
    const newGoals = data.cashGoals.filter((_, i) => i !== index);
    updateData({ cashGoals: newGoals });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-brand-purple-light flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-purple-dark" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-purple-dark mb-2">
                Welcome to HeySpender!
              </h2>
              <p className="text-gray-600">
                We'll ask a few quick questions. You can edit anything later.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Wishlist Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
                placeholder="e.g. My Birthday Wishlist, Wedding Registry"
                className="mt-2"
              />
            </div>
            <p className="text-sm text-gray-500">
              Choose a name that describes what this wishlist is for.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>What's the occasion?</Label>
            <Select value={data.occasion} onValueChange={(value) => updateData({ occasion: value })}>
              <SelectTrigger>
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
            <Label>When would you love to receive these gifts?</Label>
            <RadioGroup 
              value={data.dateType} 
              onValueChange={(value) => updateData({ dateType: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific">Specific date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible" id="flexible" />
                <Label htmlFor="flexible">No exact date</Label>
              </div>
            </RadioGroup>

            {data.dateType === 'specific' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.specificDate ? format(data.specificDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.specificDate}
                    onSelect={(date) => updateData({ specificDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="story">Your Story</Label>
            <Textarea
              id="story"
              value={data.story}
              onChange={(e) => updateData({ story: e.target.value })}
              placeholder="Tell your supporters why this wishlist matters to you..."
              className="min-h-[120px]"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Polish with AI
              </Button>
              <span className="text-xs text-gray-500">Optional: Let AI help improve your story</span>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label>Cover Photo</Label>
            <div className="border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 flex items-center justify-center">
                  {data.coverImage ? (
                    <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Upload Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">Or choose from our gallery</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label>Who can see your wishlist?</Label>
            <RadioGroup 
              value={data.visibility} 
              onValueChange={(value) => updateData({ visibility: value })}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="public" className="font-medium">Public (Show on Explore Page)</Label>
                    <p className="text-sm text-gray-500">Anyone can find and view your wishlist</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border">
                  <RadioGroupItem value="unlisted" id="unlisted" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="unlisted" className="font-medium">Unlisted (Link-only)</Label>
                    <p className="text-sm text-gray-500">Only people with the link can view it</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="private" className="font-medium">Private (Me only)</Label>
                    <p className="text-sm text-gray-500">Only you can see this wishlist</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Add Items or Cash Goals</h3>
              <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Items ({data.items.length})</TabsTrigger>
                  <TabsTrigger value="goals">Cash Goals ({data.cashGoals.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4">
                  <div className="space-y-3">
                    {data.items.map((item, index) => (
                      <div key={index} className="border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Item {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(index, { name: e.target.value })}
                              placeholder="Item name"
                            />
                          </div>
                          <div>
                            <Label>Price (₦)</Label>
                            <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label>Product URL</Label>
                            <Input
                              value={item.url || ''}
                              onChange={(e) => updateItem(index, { url: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            placeholder="Describe this item..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    ))}
                    <Button onClick={addItem} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4">
                  <div className="space-y-3">
                    {data.cashGoals.map((goal, index) => (
                      <div key={index} className="border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Cash Goal {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCashGoal(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Goal Title</Label>
                            <Input
                              value={goal.title}
                              onChange={(e) => updateCashGoal(index, { title: e.target.value })}
                              placeholder="e.g. Vacation Fund"
                            />
                          </div>
                          <div>
                            <Label>Target Amount (₦)</Label>
                            <Input
                              type="number"
                              value={goal.targetAmount || ''}
                              onChange={(e) => updateCashGoal(index, { targetAmount: Number(e.target.value) })}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Deadline (optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {goal.deadline ? format(goal.deadline, 'PPP') : 'No deadline'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={goal.deadline}
                                onSelect={(date) => updateCashGoal(index, { deadline: date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ))}
                    <Button onClick={addCashGoal} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cash Goal
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-black p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-purple-dark">
              {steps[currentStep].title}
            </h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={(currentStep + 1) / steps.length * 100} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6">
          <div className="flex justify-between">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} variant="custom" className="bg-brand-orange text-black">
                  Create Wishlist
                </Button>
              ) : (
                <Button onClick={nextStep} variant="custom" className="bg-brand-orange text-black">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStartedWizard;
