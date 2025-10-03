import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, Gift, Edit, Trash2, Share2, Link as LinkIcon, QrCode as ImageIcon, Save, Trash, X, Upload, Eye, ShoppingBag, Clock, ToggleLeft, ToggleRight, DollarSign, Target, Wallet as WalletIcon, ChevronsRight, Banknote, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import QRCode from 'qrcode';
import slugify from 'slugify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import fileDownload from 'js-file-download';
import { z } from 'zod';

const FormErrors = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="text-xs text-red-600 mt-1">
      {errors.map((error, i) => (
        <p key={i}>{error}</p>
      ))}
    </div>
  );
};

const ImageUpload = ({
  onUpload,
  currentImage
}) => {
  const [uploading, setUploading] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const handleFileChange = async event => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      let {
        error: uploadError
      } = await supabase.storage.from('HeySpender Media').upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }
      const {
        data
      } = supabase.storage.from('HeySpender Media').getPublicUrl(filePath);
      onUpload(data.publicUrl);
      toast({
        title: 'Image uploaded successfully!'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error uploading image',
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };
  return <div className="col-span-3">
      <Label htmlFor="cover-image-upload" className="cursor-pointer border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-32 text-center p-4 hover:bg-gray-50">
        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : currentImage ? <img src={currentImage} alt="Current cover" className="max-h-full object-contain" /> : <>
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-600">Click to upload cover image</span>
          </>}
      </Label>
      <Input id="cover-image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />
    </div>;
};

const wishlistSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    slug: z.string().min(3, "URL must be at least 3 characters long").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "URL can only contain lowercase letters, numbers, and hyphens."),
    occasion: z.string().min(1, "Occasion is required"),
    customOccasion: z.string().optional(),
}).refine(data => {
    if (data.occasion === 'other') {
        return data.customOccasion && data.customOccasion.length > 0;
    }
    return true;
}, {
    message: "Please specify your custom occasion",
    path: ["customOccasion"],
});

const WishlistFormModal = ({
  onWishlistAction,
  trigger,
  existingWishlist
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [occasion, setOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [wishlistDate, setWishlistDate] = useState();
  const [story, setStory] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [visibility, setVisibility] = useState('unlisted');
  const [errors, setErrors] = useState(null);

  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  const isOtherSelected = occasion === 'other';

  useEffect(() => {
    if (existingWishlist) {
      setTitle(existingWishlist.title || '');
      setSlug(existingWishlist.slug || '');
      const predefinedOccasions = ['birthday', 'wedding', 'graduation', 'burial'];
      if (predefinedOccasions.includes(existingWishlist.occasion)) {
        setOccasion(existingWishlist.occasion);
        setCustomOccasion('');
      } else {
        setOccasion('other');
        setCustomOccasion(existingWishlist.occasion || '');
      }
      setWishlistDate(existingWishlist.wishlist_date ? new Date(existingWishlist.wishlist_date) : undefined);
      setStory(existingWishlist.story || '');
      setCoverImageUrl(existingWishlist.cover_image_url || '');
      setVisibility(existingWishlist.visibility || 'unlisted');
    } else {
      setTitle('');
      setSlug('');
      setOccasion('');
      setCustomOccasion('');
      setWishlistDate(undefined);
      setStory('');
      setCoverImageUrl('');
      setVisibility('unlisted');
    }
    setErrors(null);
  }, [existingWishlist, open]);

  const handleTitleChange = e => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!existingWishlist) {
      setSlug(slugify(newTitle, {
        lower: true,
        strict: true
      }));
    }
  };

  const checkSlugUniqueness = async currentSlug => {
    const query = supabase.from('wishlists').select('slug').eq('slug', currentSlug);
    if (existingWishlist) {
      query.neq('id', existingWishlist.id);
    }
    const {
      data
    } = await query.single();
    return !data;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    const finalOccasion = isOtherSelected ? customOccasion : occasion;

    const validationResult = wishlistSchema.safeParse({ title, slug, occasion, customOccasion: isOtherSelected ? customOccasion : undefined });
    if (!validationResult.success) {
        setErrors(validationResult.error.flatten().fieldErrors);
        setLoading(false);
        return;
    }

    const isSlugUnique = await checkSlugUniqueness(slug);
    if (!isSlugUnique) {
      toast({
        variant: 'destructive',
        title: 'Wishlist URL is already taken',
        description: 'Please choose a different title or edit the URL.'
      });
      setLoading(false);
      return;
    }
    const payload = {
      title,
      slug,
      occasion: finalOccasion,
      story,
      user_id: user.id,
      wishlist_date: wishlistDate ? format(wishlistDate, 'yyyy-MM-dd') : null,
      cover_image_url: coverImageUrl || null,
      visibility,
    };
    let data, error;
    if (existingWishlist) {
      ({
        data,
        error
      } = await supabase.from('wishlists').update(payload).eq('id', existingWishlist.id).select().single());
    } else {
      ({
        data,
        error
      } = await supabase.from('wishlists').insert(payload).select().single());
    }
    if (error) {
      toast({
        variant: 'destructive',
        title: `Error ${existingWishlist ? 'updating' : 'creating'} wishlist`,
        description: error.message
      });
    } else {
      toast({
        title: `Wishlist ${existingWishlist ? 'updated' : 'created'} successfully!`
      });
      onWishlistAction(data);
      setOpen(false);
    }
    setLoading(false);
  };

  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{existingWishlist ? 'Edit' : 'Create New'} Wishlist</DialogTitle>
          <DialogDescription>Fill in the details to {existingWishlist ? 'update your' : 'create a new'} wishlist.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-y-4 py-4">
             <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <div className="col-span-3">
                <Input id="title" value={title} onChange={handleTitleChange} />
                <FormErrors errors={errors?.title} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="slug" className="text-right">URL</Label>
              <div className="col-span-3">
                <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} />
                <FormErrors errors={errors?.slug} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="occasion" className="text-right">Occasion</Label>
              <div className="col-span-3">
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger><SelectValue placeholder="Select an occasion" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem> <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem> <SelectItem value="burial">Burial</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormErrors errors={errors?.occasion} />
              </div>
            </div>
            {isOtherSelected && (
              <div className="grid grid-cols-4 items-center gap-x-4">
                <Label htmlFor="customOccasion" className="text-right">Custom</Label>
                <div className="col-span-3">
                    <Input id="customOccasion" value={customOccasion} onChange={e => setCustomOccasion(e.target.value)} placeholder="E.g., House Warming"/>
                    <FormErrors errors={errors?.customOccasion} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="wishlistDate" className="text-right">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                    {wishlistDate ? format(wishlistDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={wishlistDate} onSelect={setWishlistDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="story" className="text-right">Story</Label>
              <Textarea id="story" value={story} onChange={e => setStory(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-x-4">
              <Label className="text-right pt-2">Cover Image</Label>
              <ImageUpload onUpload={setCoverImageUrl} currentImage={coverImageUrl} />
            </div>
            <div className="grid grid-cols-4 items-center gap-x-4">
              <Label htmlFor="visibility" className="text-right">Visibility</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch id="visibility" checked={visibility === 'public'} onCheckedChange={(checked) => setVisibility(checked ? 'public' : 'unlisted')} />
                <span className="text-sm text-gray-600">{visibility === 'public' ? 'Public' : 'Unlisted'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="custom" disabled={loading} className="bg-brand-green text-black">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingWishlist ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};

const itemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  qty_total: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price_estimate: z.number().positive("Price must be a positive number").optional().or(z.literal('')),
  product_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});


const ItemFormModal = ({
  wishlistId,
  onAction,
  existingItem,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const [item, setItem] = useState({
    name: '',
    description: '',
    unit_price_estimate: '',
    qty_total: '1',
    product_url: '',
    image_url: ''
  });
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (existingItem) {
      setItem({
        name: existingItem.name || '',
        description: existingItem.description || '',
        unit_price_estimate: existingItem.unit_price_estimate || '',
        qty_total: existingItem.qty_total || '1',
        product_url: existingItem.product_url || '',
        image_url: existingItem.image_url || ''
      });
    } else {
      setItem({
        name: '',
        description: '',
        unit_price_estimate: '',
        qty_total: '1',
        product_url: '',
        image_url: ''
      });
    }
    setErrors(null);
  }, [existingItem, open]);

  const handleChange = e => setItem({
    ...item,
    [e.target.id]: e.target.value
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    const parsedData = {
        ...item,
        qty_total: parseInt(item.qty_total, 10),
        unit_price_estimate: item.unit_price_estimate ? parseFloat(item.unit_price_estimate) : '',
    };
    
    const validationResult = itemSchema.safeParse(parsedData);

    if (!validationResult.success) {
        setErrors(validationResult.error.flatten().fieldErrors);
        setLoading(false);
        return;
    }

    const payload = {
      ...validationResult.data,
      description: item.description,
      image_url: item.image_url,
      wishlist_id: wishlistId,
      unit_price_estimate: validationResult.data.unit_price_estimate || null,
    };
    
    let data, error;
    if (existingItem) {
      ({
        data,
        error
      } = await supabase.from('wishlist_items').update(payload).eq('id', existingItem.id).select().single());
    } else {
      ({
        data,
        error
      } = await supabase.from('wishlist_items').insert(payload).select().single());
    }
    if (error) {
      toast({
        variant: 'destructive',
        title: `Error ${existingItem ? 'updating' : 'adding'} item`,
        description: error.message
      });
    } else {
      toast({
        title: `Item ${existingItem ? 'updated' : 'added'}!`
      });
      onAction(data);
      setOpen(false);
    }
    setLoading(false);
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
          <DialogHeader>
              <DialogTitle>{existingItem ? 'Edit' : 'Add'} Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <div className="col-span-3">
                      <Input id="name" value={item.name} onChange={handleChange} />
                      <FormErrors errors={errors?.name} />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-x-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={item.description} onChange={handleChange} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="unit_price_estimate" className="text-right">Price (₦)</Label>
                  <div className="col-span-3">
                      <Input id="unit_price_estimate" type="number" value={item.unit_price_estimate} onChange={handleChange} />
                      <FormErrors errors={errors?.unit_price_estimate} />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="qty_total" className="text-right">Quantity</Label>
                  <div className="col-span-3">
                      <Input id="qty_total" type="number" min="1" value={item.qty_total} onChange={handleChange} />
                      <FormErrors errors={errors?.qty_total} />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-x-4"><Label className="text-right pt-2">Item Image</Label><ImageUpload onUpload={url => setItem({
      ...item,
      image_url: url
    })} currentImage={item.image_url} /></div>
              <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="product_url" className="text-right">Product URL</Label>
                  <div className="col-span-3">
                      <Input id="product_url" value={item.product_url} onChange={handleChange} />
                      <FormErrors errors={errors?.product_url} />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" variant="custom" className="bg-brand-green text-black" disabled={loading}><Save className="w-4 h-4 mr-2" />{existingItem ? 'Save' : 'Add Item'}</Button>
              </DialogFooter>
          </form>
      </DialogContent>
  </Dialog>;
};

const ItemManagementModal = ({
  wishlist,
  onItemsUpdated
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('wishlist_items').select('*').eq('wishlist_id', wishlist.id).order('created_at');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching items'
      });
    } else {
      setItems(data);
    }
    setLoading(false);
  }, [wishlist.id, toast]);
  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);
  const handleItemAction = newItem => {
    const existingIndex = items.findIndex(i => i.id === newItem.id);
    if (existingIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = newItem;
      setItems(updatedItems);
    } else {
      setItems([...items, newItem]);
    }
    onItemsUpdated();
  };
  const deleteItem = async itemId => {
    const {
      error
    } = await supabase.from('wishlist_items').delete().eq('id', itemId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting item'
      });
    } else {
      setItems(items.filter(i => i.id !== itemId));
      toast({
        title: 'Item deleted'
      });
      onItemsUpdated();
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="custom" className="bg-brand-purple-dark text-white w-full" size="sm">Manage Wishlist Items</Button></DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Items for "{wishlist.title}"</DialogTitle>
          <DialogDescription>Add, edit, or remove items from your wishlist.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-end mb-4 pr-2">
            <ItemFormModal wishlistId={wishlist.id} onAction={handleItemAction} trigger={<Button variant="custom" className="bg-brand-green text-black"><Plus className="w-4 h-4 mr-2" />Add Item</Button>} />
          </div>
          {loading ? <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="w-8 h-8 animate-spin" /></div> : items.length > 0 ? <div className="space-y-4">
                    {items.map(item => <div key={item.id} className="flex items-center gap-4 p-2 border rounded-lg">
                           <div className="w-16 h-16 bg-gray-100 flex-shrink-0">
                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-400 m-auto" />}
                           </div>
                           <div className="flex-grow">
                               <p className="font-bold">{item.name} (x{item.qty_total})</p>
                               <p className="text-sm text-gray-600">~₦{item.unit_price_estimate?.toLocaleString()}</p>
                           </div>
                           <div className="flex gap-2">
                               <ItemFormModal wishlistId={wishlist.id} onAction={handleItemAction} existingItem={item} trigger={<Button size="icon" variant="outline"><Edit className="w-4 h-4" /></Button>} />
                               <AlertDialog>
                                   <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash className="w-4 h-4" /></Button></AlertDialogTrigger>
                                   <AlertDialogContent>
                                       <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this item.</AlertDialogDescription></AlertDialogHeader>
                                       <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(item.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                   </AlertDialogContent>
                               </AlertDialog>
                           </div>
                        </div>)}
                </div> : <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold">No items yet</h3>
                <p className="mt-2 text-sm text-gray-500">Add your first item to this wishlist!</p>
              </div>}
        </div>
        <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>;
};
const DashboardPage = () => {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [wishlists, setWishlists] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const defaultTab = location.state?.defaultTab || 'wishlists';
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const wishlistsPromise = supabase.from('wishlists').select('*, goals(*)').eq('user_id', user.id).order('created_at', { ascending: false });
    const claimsPromise = supabase.from('claims').select('*, wishlist_item:wishlist_items!inner(*, wishlist:wishlists!inner(title, slug, user:users!inner(username), goals(*, contributions(*))))').eq('supporter_user_id', user.id).order('created_at', { ascending: false });

    const [wishlistsRes, claimsRes] = await Promise.all([wishlistsPromise, claimsPromise]);

    if (wishlistsRes.error) {
      toast({ variant: 'destructive', title: 'Error fetching wishlists', description: wishlistsRes.error.message });
    } else {
      setWishlists(wishlistsRes.data);
    }
    
    if (claimsRes.error) {
      toast({ variant: 'destructive', title: 'Error fetching claimed items', description: claimsRes.error.message });
    } else {
      setClaims(claimsRes.data);
    }

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      if (user.user_metadata?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, navigate, fetchDashboardData]);

  const handleWishlistAction = updatedWishlist => {
    const existingIndex = wishlists.findIndex(w => w.id === updatedWishlist.id);
    if (existingIndex > -1) {
      const newWishlists = [...wishlists];
      newWishlists[existingIndex] = { ...newWishlists[existingIndex], ...updatedWishlist };
      setWishlists(newWishlists);
    } else {
      setWishlists([updatedWishlist, ...wishlists]);
    }
  };

  const deleteWishlist = async wishlistId => {
    const {
      error
    } = await supabase.from('wishlists').delete().eq('id', wishlistId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting wishlist',
        description: error.message
      });
    } else {
      setWishlists(wishlists.filter(w => w.id !== wishlistId));
      toast({
        title: 'Wishlist deleted successfully'
      });
    }
  };

  if (authLoading || loading || !user || user.user_metadata?.role === 'admin') {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" /></div>;
  }
  return <>
      <Helmet><title>Dashboard - HeySpender</title></Helmet>
      <div className="max-w-7xl mx-auto py-8 md:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 px-4 md:px-0">
          <h1 className="text-4xl font-bold text-brand-purple-dark">Dashboard</h1>
          <WishlistFormModal onWishlistAction={handleWishlistAction} trigger={<Button variant="custom" className="bg-brand-orange text-black w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Create Wishlist</Button>} />
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="wishlists"><Gift className="w-4 h-4 mr-2" />My Wishlists</TabsTrigger>
            <TabsTrigger value="claims"><ShoppingBag className="w-4 h-4 mr-2" />My Spender List</TabsTrigger>
            <TabsTrigger value="wallet"><WalletIcon className="w-4 h-4 mr-2" />My Wallet</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wishlists" className="mt-6 px-4 md:px-0">
            {wishlists.length === 0 ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold">You have no wishlists yet</h3>
                <p className="mt-2 text-sm text-gray-500">Get started by creating your first one!</p>
              </motion.div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlists.map(wishlist => <WishlistCard key={wishlist.id} wishlist={wishlist} onAction={handleWishlistAction} onDelete={deleteWishlist} onItemsUpdated={fetchDashboardData} user={user} />)}
              </div>}
          </TabsContent>

          <TabsContent value="claims" className="mt-6 px-4 md:px-0">
            {claims.length === 0 ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-xl font-semibold">Your Spender List is empty</h3>
                  <p className="mt-2 text-sm text-gray-500">Items you claim from other wishlists will appear here.</p>
                </motion.div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {claims.map(claim => <ClaimedItemCard key={claim.id} claim={claim} onClaimUpdated={fetchDashboardData} />)}
              </div>}
          </TabsContent>
          
          <TabsContent value="wallet" className="mt-6 px-4 md:px-0">
            <WalletView />
          </TabsContent>
          <TabsContent value="settings" className="mt-6 px-4 md:px-0">
            <SettingsView user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </>;
};

const WishlistCard = ({
  wishlist,
  onAction,
  onDelete,
  onItemsUpdated,
  user
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const wishlistUrl = `${window.location.origin}/${user.user_metadata.username}/${wishlist.slug}`;
  const generateQrCode = async () => {
    try {
      const url = await QRCode.toDataURL(wishlistUrl, {
        width: 128,
        margin: 1
      });
      setQrCodeUrl(url);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not generate QR code'
      });
    }
  };
  const copyLink = () => {
    navigator.clipboard.writeText(wishlistUrl);
    toast({
      title: 'Link copied to clipboard!'
    });
  };
  const shareOnWhatsApp = () => {
    const message = `Check out my wishlist on HeySpender: ${wishlistUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} className="border-2 border-black p-4 flex flex-col space-y-4">
            <div className="relative aspect-video bg-gray-100 mb-2">
                 {wishlist.cover_image_url ? <img alt={wishlist.title} src={wishlist.cover_image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12" /></div>}
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold truncate">{wishlist.title}</h3>
                <p className="text-sm text-gray-500 capitalize">{wishlist.occasion}</p>
                 {wishlist.wishlist_date && <p className="text-sm text-gray-500">{format(new Date(wishlist.wishlist_date), 'PPP')}</p>}
                 <div className="flex items-center space-x-2 mt-2">
                    {wishlist.visibility === 'public' ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}
                    <span className="text-xs text-gray-500">{wishlist.visibility === 'public' ? 'Public' : 'Unlisted'}</span>
                </div>
            </div>
            <div className="space-y-2">
              <ItemManagementModal wishlist={wishlist} onItemsUpdated={onItemsUpdated} />
              <GoalManagementModal wishlist={wishlist} onAction={onItemsUpdated} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="flat" className="bg-brand-purple-light text-black" size="sm" onClick={() => navigate(`/${user.user_metadata.username}/${wishlist.slug}`)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                <Popover>
                    <PopoverTrigger asChild><Button variant="flat" className="bg-brand-purple-light text-black" size="sm" onClick={generateQrCode}><Share2 className="h-4 w-4 mr-2" /> Share</Button></PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <div className="flex flex-col gap-2 items-center p-2">
                            <p className="font-bold text-sm">Share Wishlist</p>
                            {qrCodeUrl ? <img alt="QR code for wishlist link" src={qrCodeUrl} /> : <Loader2 className="w-8 h-8 animate-spin my-4" />}
                            <div className="flex flex-col gap-2 w-full">
                                <Button size="sm" variant="custom" onClick={copyLink} className="w-full bg-brand-green text-black"><LinkIcon className="w-4 h-4 mr-2" /> Copy Link</Button>
                                <Button size="sm" variant="custom" onClick={shareOnWhatsApp} className="w-full bg-[#25D366] text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    WhatsApp
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <WishlistFormModal onWishlistAction={onAction} existingWishlist={wishlist} trigger={<Button variant="flat" size="sm" className="bg-brand-purple-light text-black flex-grow"><Edit className="h-4 w-4 mr-2" /> Edit</Button>} />
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="flat" size="sm" className="bg-brand-orange text-black flex-grow"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete this wishlist and all its items. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(wishlist.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </motion.div>;
};

const ClaimedItemCard = ({ claim, onClaimUpdated }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (claim.expire_at) {
      const updateCountdown = () => {
        const distance = formatDistanceToNow(parseISO(claim.expire_at), { addSuffix: true });
        setTimeLeft(distance);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [claim.expire_at]);

  const { wishlist_item } = claim;
  const { wishlist } = wishlist_item;
  const itemUrl = `/${wishlist.user.username}/${wishlist.slug}`;

  const generateIcsFile = () => {
    const eventDate = claim.scheduled_purchase_date || wishlist_item.wishlist?.wishlist_date;
    if (!eventDate) {
        alert("No date set for this item.");
        return;
    }
    const formattedDate = new Date(eventDate).toISOString().replace(/-|:|\.\d\d\d/g,"");
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HeySpender//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${claim.id}@heyspender.com
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g,"")}
DTSTART;VALUE=DATE:${formattedDate.substring(0,8)}
DTEND;VALUE=DATE:${formattedDate.substring(0,8)}
SUMMARY:Purchase ${wishlist_item.name}
DESCRIPTION:Reminder to purchase ${wishlist_item.name} for ${wishlist.user.username}'s wishlist: ${itemUrl}
END:VEVENT
END:VCALENDAR`;
    fileDownload(icsContent, `${wishlist_item.name}.ics`);
  };

  const hasCashGoal = wishlist.goals && wishlist.goals.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="border-2 border-black p-4 flex flex-col gap-4 bg-white"
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 border-2 border-black">
          {wishlist_item.image_url ? (
            <img src={wishlist_item.image_url} alt={wishlist_item.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-12 h-12 text-gray-400 m-auto" />
          )}
        </div>
        <div className="flex-grow">
          <p className="text-sm text-gray-500">From "{wishlist.title}"</p>
          <h3 className="text-xl font-bold text-brand-purple-dark mt-1">{wishlist_item.name}</h3>
           <p className="text-sm font-semibold text-gray-700 mt-1">~₦{wishlist_item.unit_price_estimate?.toLocaleString() || 'N/A'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-100 border-2 border-yellow-400 p-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold">Claim expires {timeLeft}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
         <Button onClick={() => navigate(itemUrl)} variant="custom" className="bg-brand-purple-dark text-white">View Wishlist</Button>
         <ReminderModal claim={claim} onClaimUpdated={onClaimUpdated}/>
      </div>
      { hasCashGoal &&
        <Button onClick={() => navigate(itemUrl)} variant="custom" className="bg-brand-orange text-black w-full">
            <DollarSign className="w-4 h-4 mr-2"/> Contribute Cash
        </Button>
      }
      { (claim.scheduled_purchase_date || wishlist_item.wishlist?.wishlist_date) &&
        <Button onClick={generateIcsFile} variant="custom" className="bg-white text-black w-full" size="sm">
            <CalendarIcon className="w-4 h-4 mr-2"/> Add to Calendar
        </Button>
      }
    </motion.div>
  );
};

const ReminderModal = ({claim, onClaimUpdated}) => {
    const {toast} = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [purchaseDate, setPurchaseDate] = useState(claim.scheduled_purchase_date ? new Date(claim.scheduled_purchase_date) : null);
    const [channel, setChannel] = useState(claim.reminder_channel || '');

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('claims')
            .update({
                scheduled_purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
                reminder_channel: channel || null,
            })
            .eq('id', claim.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving reminder', description: error.message });
        } else {
            toast({ title: 'Reminder settings saved!' });
            onClaimUpdated();
            setOpen(false);
        }
        setLoading(false);
    };

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="custom" className="bg-brand-green text-black">Set Reminder</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Purchase Reminder</DialogTitle>
                    <DialogDescription>Schedule a reminder to purchase "{claim.wishlist_item.name}".</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label>Purchase Date (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                {purchaseDate ? format(purchaseDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div>
                        <Label>Reminder Channel</Label>
                        <Select value={channel} onValueChange={setChannel}>
                            <SelectTrigger><SelectValue placeholder="Select a channel" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms" disabled>SMS (coming soon)</SelectItem>
                                <SelectItem value="whatsapp" disabled>WhatsApp (coming soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={loading} variant="custom" className="bg-brand-green text-black">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                        Save Reminder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const goalFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  target_amount: z.number().positive("Target amount must be a positive number"),
});

const GoalManagementModal = ({ wishlist, onAction }) => {
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    if (!wishlist?.id) return;
    setLoading(true);
    const { data, error } = await supabase.from('goals').select('*').eq('wishlist_id', wishlist.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching goals', description: error.message });
    } else {
      setGoals(data);
    }
    setLoading(false);
  }, [wishlist?.id, toast]);

  useEffect(() => {
    if (open) {
      fetchGoals();
    }
  }, [open, fetchGoals]);

  const handleGoalAction = () => {
    fetchGoals();
    onAction();
  };
  
  const deleteGoal = async (goalId) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting goal', description: error.message });
    } else {
      toast({ title: 'Goal deleted successfully' });
      handleGoalAction();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="flat" size="sm" className="w-full bg-brand-green text-black">
          <DollarSign className="h-4 w-4 mr-2" />
          Manage Cash Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Cash Goals for "{wishlist.title}"</DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-end mb-4">
             <GoalFormModal wishlistId={wishlist.id} onAction={handleGoalAction} trigger={<Button variant="flat" className="bg-brand-green text-black"><Plus className="w-4 h-4 mr-2"/>Add Goal</Button>} />
          </div>
          {loading ? <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div> :
           goals.length > 0 ? (
            <div className="space-y-4">
                {goals.map(goal => {
                    const progress = goal.target_amount > 0 ? ((goal.amount_raised || 0) / goal.target_amount) * 100 : 0;
                    return (
                        <div key={goal.id} className="p-4 border-2 border-black space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{goal.title}</p>
                                    <p className="text-sm text-gray-600">Target: ₦{Number(goal.target_amount).toLocaleString()}</p>
                                    {goal.deadline && <p className="text-xs text-gray-500">Deadline: {format(parseISO(goal.deadline), 'PPP')}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <GoalFormModal wishlistId={wishlist.id} onAction={handleGoalAction} existingGoal={goal} trigger={<Button size="icon" variant="outline"><Edit className="w-4 h-4"/></Button>} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash className="w-4 h-4"/></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this cash goal.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteGoal(goal.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold">Raised: ₦{Number(goal.amount_raised || 0).toLocaleString()}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        </div>
                    )
                })}
            </div>
           ) : (
             <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold">No cash goals yet</h3>
                <p className="mt-2 text-sm text-gray-500">Add a goal to start accepting cash contributions.</p>
              </div>
           )
          }
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const GoalFormModal = ({ wishlistId, onAction, existingGoal, trigger }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [goal, setGoal] = useState({ title: '', target_amount: '', deadline: null });
    const [errors, setErrors] = useState(null);

    useEffect(() => {
        if (existingGoal) {
            setGoal({
                title: existingGoal.title || '',
                target_amount: existingGoal.target_amount || '',
                deadline: existingGoal.deadline ? parseISO(existingGoal.deadline) : null,
            });
        } else {
            setGoal({ title: '', target_amount: '', deadline: null });
        }
        setErrors(null);
    }, [existingGoal, open]);

    const handleChange = e => setGoal({ ...goal, [e.target.id]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);

        const parsedData = {
            ...goal,
            target_amount: parseFloat(goal.target_amount)
        };

        const validationResult = goalFormSchema.safeParse(parsedData);
        if(!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }

        const payload = {
            wishlist_id: wishlistId,
            title: validationResult.data.title,
            target_amount: validationResult.data.target_amount,
            deadline: goal.deadline ? format(goal.deadline, 'yyyy-MM-dd') : null,
        };

        const { error } = existingGoal 
            ? await supabase.from('goals').update(payload).eq('id', existingGoal.id)
            : await supabase.from('goals').insert(payload);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving goal', description: error.message });
        } else {
            toast({ title: `Goal ${existingGoal ? 'updated' : 'created'}!` });
            onAction();
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existingGoal ? 'Edit' : 'Add'} Cash Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="title">Goal Title</Label>
                        <Input id="title" value={goal.title} onChange={handleChange} />
                        <FormErrors errors={errors?.title} />
                    </div>
                    <div>
                        <Label htmlFor="target_amount">Target Amount (₦)</Label>
                        <Input id="target_amount" type="number" value={goal.target_amount} onChange={handleChange} />
                        <FormErrors errors={errors?.target_amount} />
                    </div>
                    <div>
                        <Label>Deadline (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                    {goal.deadline ? format(goal.deadline, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={goal.deadline} onSelect={(date) => setGoal({...goal, deadline: date})} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={loading} variant="custom" className="bg-brand-green text-black">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                            {existingGoal ? 'Save' : 'Add Goal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const payoutSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(100, "Minimum payout is ₦100"),
  bank_code: z.string().min(3, "Please enter a valid bank name"),
  account_number: z.string().length(10, "Account number must be 10 digits"),
});


const WalletView = () => {
  const { user } = useAuth();
  const { wallet, transactions, loading, refreshWallet } = useWallet();
  const { toast } = useToast();

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-dark" /></div>
  }

  if (!wallet) {
    return (
      <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
        <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold">Wallet Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">Your wallet is being created. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="border-2 border-black p-6 bg-brand-purple-light text-center space-y-2">
            <p className="text-sm font-semibold text-brand-purple-dark uppercase">Available Balance</p>
            <p className="text-4xl font-bold text-black">₦{Number(wallet.balance || 0).toLocaleString()}</p>
        </div>
        <PayoutRequestModal wallet={wallet} user={user} onPayoutRequested={refreshWallet} />
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-2xl font-bold text-brand-purple-dark mb-4">Transaction History</h3>
        {transactions.length > 0 ? (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{format(parseISO(tx.created_at), 'PPP p')}</TableCell>
                  <TableCell className={`capitalize font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{tx.type}</TableCell>
                  <TableCell>₦{Number(tx.amount).toLocaleString()}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-8">No transactions yet.</p>
        )}
      </div>
    </div>
  )
}

const PayoutRequestModal = ({ wallet, user, onPayoutRequested }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ amount: '', bank_code: '', account_number: '' });
    const [errors, setErrors] = useState(null);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);
        
        const parsedData = {
          ...formData,
          amount: parseFloat(formData.amount)
        };

        const validationResult = payoutSchema.safeParse(parsedData);
        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }
        
        const amount = validationResult.data.amount;

        if (amount > wallet.balance) {
            setErrors({ amount: ['Insufficient balance'] });
            setLoading(false);
            return;
        }

        const { error } = await supabase.rpc('request_payout', {
            p_wallet_id: wallet.id,
            p_amount: amount,
            p_bank_code: validationResult.data.bank_code,
            p_account: validationResult.data.account_number,
            p_user_id: user.id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Payout Request Failed', description: error.message });
        } else {
            toast({ title: 'Payout Request Submitted!', description: 'Your request is being reviewed by our team.' });
            onPayoutRequested();
            setOpen(false);
            setFormData({ amount: '', bank_code: '', account_number: '' });
        }
        setLoading(false);
    };
    
    const handleOpenChange = (isOpen) => {
        if(!isOpen) {
            setFormData({ amount: '', bank_code: '', account_number: '' });
            setErrors(null);
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="custom" className="bg-brand-green text-black w-full h-auto py-6 text-lg">
                    <ChevronsRight className="mr-2 h-6 w-6"/> Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>Enter your bank details to withdraw funds. Payouts are processed manually.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                     <div>
                        <Label htmlFor="amount">Amount (₦)</Label>
                        <Input id="amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} max={wallet.balance}/>
                        <FormErrors errors={errors?.amount} />
                    </div>
                    <div>
                        <Label htmlFor="bank_code">Bank Name</Label>
                        <Input id="bank_code" placeholder="e.g., Guaranty Trust Bank" value={formData.bank_code} onChange={e => setFormData({...formData, bank_code: e.target.value})} />
                        <FormErrors errors={errors?.bank_code} />
                    </div>
                     <div>
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input id="account_number" type="text" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                        <FormErrors errors={errors?.account_number} />
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={loading} variant="custom" className="bg-brand-green text-black">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const SettingsView = ({ user }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({ full_name: '', username: '' });

    useEffect(() => {
        setProfile({
            full_name: user.user_metadata.full_name || '',
            username: user.user_metadata.username || '',
        })
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        toast({ title: "🚧 Feature not implemented", description: "Profile updates are coming soon!" });
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-brand-purple-dark">Profile Settings</h2>
                <p className="text-gray-500">Manage your personal information.</p>
            </div>
            <form onSubmit={handleProfileUpdate} className="border-2 border-black p-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value })}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value })}/>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="custom" className="bg-brand-green text-black" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default DashboardPage;