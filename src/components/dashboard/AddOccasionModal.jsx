import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUserFriendlyError } from '@/lib/utils';
import { imageService } from '@/lib/wishlistService';

const AddOccasionModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    description: '',
    visibility: 'unlisted',
    coverImage: null
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file'
      });
      return;
    }

    setUploading(true);

    try {
      // Use imageService for upload
      const publicUrl = await imageService.uploadCoverImage(file, user.id);

      setFormData({ ...formData, coverImage: publicUrl });
      setImagePreview(URL.createObjectURL(file));
      
      toast({
        title: 'Image uploaded successfully',
        description: 'Your cover image has been added'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: getUserFriendlyError(error, 'uploading the image')
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, coverImage: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      await onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      category: '',
      date: '',
      description: '',
      visibility: 'unlisted',
      coverImage: null
    });
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" fullscreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle>Create New Occasion</DialogTitle>
          <DialogDescription>
            Add a new occasion to organize your wishlist items and cash goals.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Occasion Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Graduation, Anniversary"
              required
            />
          </div>

          <div>
            <Label htmlFor="coverImage">Cover Photo</Label>
            {imagePreview ? (
              <div className="relative mt-2 border-2 border-black rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <label
                  htmlFor="coverImage"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <div className="text-center">
                        <Upload className="w-10 h-10 mb-3 text-gray-400 animate-pulse" />
                        <p className="text-sm text-gray-500">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    id="coverImage"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="graduation">Graduation</SelectItem>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="baby_shower">Baby Shower</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="cursor-pointer"
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Tell us about this occasion..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select 
              value={formData.visibility} 
              onValueChange={(value) => setFormData({...formData, visibility: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="modal" onClick={handleClose} className="bg-white">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="modal" 
              className="bg-brand-orange text-black"
              disabled={!formData.title.trim()}
            >
              Create Occasion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOccasionModal;

