import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, Gift, Edit, Trash2, Share2, Link as LinkIcon, QrCode as ImageIcon, Save, Trash, X, Upload, Eye, ShoppingBag, Clock, ToggleLeft, ToggleRight, DollarSign, Target, Wallet as WalletIcon, ChevronsRight, Banknote, Calendar as CalendarIcon, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import SpenderListCard from '@/components/SpenderListCard';
import { z } from 'zod';

// Helper function to get progress bar color based on percentage
const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'bg-brand-green'; // Complete - Green
  if (percentage >= 75) return 'bg-brand-orange'; // Almost complete - Orange  
  if (percentage >= 50) return 'bg-brand-salmon'; // Halfway - Salmon
  if (percentage >= 25) return 'bg-brand-accent-red'; // Started - Accent Red
  return 'bg-brand-purple-dark'; // Just started - Purple Dark
};

// Helper function to calculate progress percentage
const calculateProgress = (raised, target) => {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((raised / target) * 100), 100);
};

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
  const [dragActive, setDragActive] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  const handleFileChange = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `wishlist-covers/${fileName}`;

  const {
        error: uploadError
      } = await supabase.storage.from('HeySpender Media').upload(filePath, file);
      if (uploadError) throw uploadError;

    const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('HeySpender Media').getPublicUrl(filePath);

      onUpload(publicUrl);
      toast({
        title: 'Image uploaded successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    await handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    onUpload('');
  };

  return (
    <div className="col-span-3">
      <div className="space-y-3">
        {/* Current Image Preview */}
        {currentImage && (
          <div className="relative">
            <img 
              src={currentImage} 
              alt="Current cover" 
              className="w-full h-32 object-cover rounded-lg border-2 border-black" 
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-brand-green bg-brand-green/10' 
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center space-y-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </>
            )}
          </div>
            </div>
            </div>
            </div>
  );
};

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [timeoutReached, setTimeoutReached] = useState(false);

  const defaultTab = location.state?.defaultTab || 'wishlists';
  
  const [wishlists, setWishlists] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setTimeoutReached(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [authLoading]);
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const wishlistsPromise = supabase.from('wishlists').select('*, goals(*)').eq('user_id', user.id).order('created_at', { ascending: false });
    
    // Simplified claims query
    const claimsPromise = supabase
      .from('claims')
      .select(`
        *,
        wishlist_item:wishlist_items!inner(
          *,
          wishlist:wishlists!inner(
            title,
            slug,
            user:users!inner(username)
          )
        )
      `)
      .eq('supporter_user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    const [wishlistsRes, claimsRes] = await Promise.all([wishlistsPromise, claimsPromise]);

    if (wishlistsRes.error) {
      toast({ variant: 'destructive', title: 'Error fetching wishlists', description: wishlistsRes.error.message });
    } else {
      setWishlists(wishlistsRes.data);
    }
    
    if (claimsRes.error) {
      console.error('Claims query error:', claimsRes.error);
      toast({ variant: 'destructive', title: 'Error fetching claimed items', description: claimsRes.error.message });
    } else {
      console.log('Claims data:', claimsRes.data);
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

  // Refresh data when navigating to dashboard with claims tab
  useEffect(() => {
    if (location.state?.defaultTab === 'claims' && user) {
      console.log('Refreshing dashboard data for claims tab');
      fetchDashboardData();
    }
  }, [location.state?.defaultTab, user, fetchDashboardData]);

  const handleWishlistAction = updatedWishlist => {
    const existingIndex = wishlists.findIndex(w => w.id === updatedWishlist.id);
    if (existingIndex > -1) {
      setWishlists(wishlists.map((w, i) => i === existingIndex ? updatedWishlist : w));
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

  const handleRemoveFromSpenderList = async (claimId) => {
    try {
      // First, get the claim information to know which item to update
      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .select('wishlist_item_id')
        .eq('id', claimId)
        .single();

      if (claimError || !claimData) {
        toast({
          variant: 'destructive',
          title: 'Error finding claim',
          description: claimError?.message || 'Claim not found'
        });
        return;
      }

      // Get current item data before making changes
      const { data: itemData, error: itemError } = await supabase
        .from('wishlist_items')
        .select('qty_claimed, qty_total')
        .eq('id', claimData.wishlist_item_id)
        .single();

      if (itemError || !itemData) {
        toast({
          variant: 'destructive',
          title: 'Error finding item',
          description: 'Could not find the item to update'
        });
        return;
      }

      // Calculate new qty_claimed (subtract 1 since each claim represents 1 unit)
      const newQtyClaimed = Math.max((itemData.qty_claimed || 0) - 1, 0);

      // Use a transaction-like approach: update item first, then delete claim
      const { error: updateError } = await supabase
        .from('wishlist_items')
        .update({ qty_claimed: newQtyClaimed })
        .eq('id', claimData.wishlist_item_id);

      if (updateError) {
        toast({
          variant: 'destructive',
          title: 'Error updating item availability',
          description: updateError.message
        });
        return;
      }

      // Now delete the claim record
      const { error: deleteError } = await supabase
        .from('claims')
        .delete()
        .eq('id', claimId);

      if (deleteError) {
        // Try to revert the item update
        await supabase
          .from('wishlist_items')
          .update({ qty_claimed: itemData.qty_claimed })
          .eq('id', claimData.wishlist_item_id);
        
        toast({
          variant: 'destructive',
          title: 'Error removing item',
          description: deleteError.message
        });
        return;
      }
      
      toast({
        title: 'Item removed from spender list',
        description: `Item is now available for others to claim`
      });
      
      // Refresh the data
      fetchDashboardData();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error removing item',
        description: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  if (authLoading && !timeoutReached) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || timeoutReached) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-purple-dark mb-4">Please log in</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access the dashboard.</p>
          <a href="/login" className="inline-block bg-brand-purple-dark text-white px-6 py-2 rounded-lg hover:bg-brand-purple-dark/90">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <>
      <Helmet><title>Dashboard - HeySpender</title></Helmet>
      <TooltipProvider>
      <div className="max-w-7xl mx-auto py-8">
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
                </motion.div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {claims.map(claim => <SpenderListCard key={claim.id} item={claim.wishlist_item} claimId={claim.id} onRemove={handleRemoveFromSpenderList} />)}
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
      </TooltipProvider>
    </>;
};

// Include all the other components (WishlistCard, WalletView, SettingsView, etc.)
// For brevity, I'll include the essential ones

const WishlistCard = ({
  wishlist,
  onAction,
  onDelete,
  onItemsUpdated,
  user
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateQrCode = async () => {
    const wishlistUrl = `${window.location.origin}/${user.user_metadata?.username}/${wishlist.slug}`;
    try {
      const url = await QRCode.toDataURL(wishlistUrl, { width: 200, margin: 2 });
      setQrCodeUrl(url);
      setShowQrDialog(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not generate QR code' });
    }
  };

  const copyLink = () => {
    const wishlistUrl = `${window.location.origin}/${user.user_metadata?.username}/${wishlist.slug}`;
    navigator.clipboard.writeText(wishlistUrl);
    toast({ title: 'Link copied to clipboard!' });
  };

  const downloadQrCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${wishlist.title}-qr-code.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-black p-4 flex flex-col space-y-4 bg-white">
            <div className="relative h-[250px] bg-gray-100 mb-2">
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
              
              {/* Icon buttons row */}
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="custom" className="bg-white text-black shadow-none flex-1" onClick={() => navigate(`/${user.user_metadata?.username}/${wishlist.slug}`)}>
                      <Eye className="w-4 h-4 stroke-[3]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View Wishlist</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <WishlistFormModal onWishlistAction={onAction} existingWishlist={wishlist} trigger={
                      <Button variant="custom" className="bg-white text-black shadow-none flex-1" type="button">
                        <Edit className="w-4 h-4 stroke-[3]" />
                      </Button>
                    } />
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Wishlist</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="custom" className="bg-white text-black shadow-none flex-1" onClick={copyLink}>
                      <LinkIcon className="w-4 h-4 stroke-[3]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Copy Link</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="custom" className="bg-white text-black shadow-none flex-1" onClick={generateQrCode}>
                      <ImageIcon className="w-4 h-4 stroke-[3]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Generate QR Code</p></TooltipContent>
                </Tooltip>
                    </div>
              
              <Button variant="custom" className="bg-red-500 text-white w-full shadow-none" onClick={() => setShowDeleteDialog(true)}>
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
                    </Button>
            </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wishlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{wishlist.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(wishlist.id); setShowDeleteDialog(false); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {wishlist.title}</DialogTitle>
            <DialogDescription>
              Share this QR code to let others easily access your wishlist.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="border-2 border-black rounded-lg" />
            )}
            <div className="flex gap-2">
              <Button variant="custom" className="bg-brand-green text-black shadow-none" onClick={downloadQrCode}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="custom" className="bg-brand-purple-dark text-white shadow-none" onClick={copyLink}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="shadow-none">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const WalletView = () => {
  const { wallet, loading } = useWallet();
  const { toast } = useToast();

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

    return (
    <div className="space-y-6">
      <div className="border-2 border-black p-6 bg-white">
        <h2 className="text-2xl font-bold text-brand-purple-dark mb-4">Wallet Balance</h2>
        <div className="text-3xl font-bold text-brand-green">
          ₦{wallet?.balance?.toLocaleString() || '0'}
      </div>
        <p className="text-gray-600 mt-2">Available for withdrawals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Button variant="custom" className="bg-brand-green text-black shadow-none">
          <Banknote className="w-4 h-4 mr-2" />
          Withdraw Funds
        </Button>
        <Button variant="custom" className="bg-brand-purple-dark text-white shadow-none">
          <Target className="w-4 h-4 mr-2" />
          Transaction History
        </Button>
      </div>
    </div>
  );
};

const SettingsView = ({ user }) => {
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || ''
  });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

  const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name,
        username: profile.username
      }
        });

        if (error) {
      toast({ variant: 'destructive', title: 'Error updating profile', description: error.message });
        } else {
      toast({ title: 'Profile updated successfully!' });
    }
    
        setLoading(false);
    };

    return (
    <div className="space-y-6">
      <div className="border-2 border-black p-6 bg-white">
        <h2 className="text-2xl font-bold text-brand-purple-dark mb-4">Profile Settings</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value })}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value })}/>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="custom" className="bg-brand-green text-black shadow-none" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );
};

// Item Image Upload Component
const ItemImageUpload = ({ onUpload, currentImage }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadId] = useState(() => `item-file-upload-${Math.random().toString(36).substr(2, 9)}`);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `item-images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('HeySpender Media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('HeySpender Media').getPublicUrl(filePath);

      onUpload(publicUrl);
      toast({ title: 'Image uploaded successfully' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    await handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    onUpload('');
  };

  return (
    <div className="space-y-2">
      {/* Current Image Preview */}
      {currentImage && (
        <div className="relative">
          <img 
            src={currentImage} 
            alt="Current item" 
            className="w-full h-24 object-cover rounded-lg border-2 border-black" 
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 h-5 w-5 p-0"
            onClick={removeImage}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
          dragActive 
            ? 'border-brand-green bg-brand-green/10' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(uploadId).click()}
      >
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center space-y-1">
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-brand-green" />
              <p className="text-xs text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              <div className="text-xs text-gray-600">
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </>
          )}
        </div>
        </div>
    </div>
  );
};

// Placeholder components for modals
// Add Item Modal - Separate modal for adding items
const AddItemModal = ({ wishlist, onClose, onItemAdded, existingItem }) => {
  const [newItem, setNewItem] = useState({
    name: '',
    unit_price_estimate: '',
    qty_total: '',
    product_url: '',
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Populate form when editing existing item
  useEffect(() => {
    if (existingItem) {
      setNewItem({
        name: existingItem.name || '',
        unit_price_estimate: existingItem.unit_price_estimate || '',
        qty_total: existingItem.qty_total || '',
        product_url: existingItem.product_url || '',
        description: existingItem.description || '',
        image_url: existingItem.image_url || ''
      });
    }
  }, [existingItem]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.unit_price_estimate) return;

    setLoading(true);
    try {
      if (existingItem) {
        // Update existing item
        const { error } = await supabase
          .from('wishlist_items')
          .update({
            name: newItem.name,
            unit_price_estimate: parseFloat(newItem.unit_price_estimate),
            qty_total: parseInt(newItem.qty_total) || 1,
            product_url: newItem.product_url || null,
            description: newItem.description || null,
            image_url: newItem.image_url || null
          })
          .eq('id', existingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Add new item
        const { error } = await supabase
          .from('wishlist_items')
          .insert({
            wishlist_id: wishlist.id,
            name: newItem.name,
            unit_price_estimate: parseFloat(newItem.unit_price_estimate),
            qty_total: parseInt(newItem.qty_total) || 1,
            product_url: newItem.product_url || null,
            description: newItem.description || null,
            image_url: newItem.image_url || null
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }

      setNewItem({ name: '', unit_price_estimate: '', qty_total: '', product_url: '', description: '', image_url: '' });
      onItemAdded();
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: existingItem ? "Failed to update item" : "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingItem ? 'Edit Wishlist Item' : 'Add Wishlist Item'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={addItem} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Name</Label>
            <Input
              placeholder="Enter item name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              required
              className="shadow-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price (₦)</Label>
              <Input
                placeholder="Enter price"
                type="number"
                step="0.01"
                value={newItem.unit_price_estimate}
                onChange={(e) => setNewItem({...newItem, unit_price_estimate: e.target.value})}
                required
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <Input
                placeholder="Enter quantity"
                type="number"
                min="1"
                value={newItem.qty_total}
                onChange={(e) => setNewItem({...newItem, qty_total: e.target.value})}
                required
                className="shadow-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product URL</Label>
            <Input
              placeholder="Enter product URL"
              value={newItem.product_url}
              onChange={(e) => setNewItem({...newItem, product_url: e.target.value})}
              className="shadow-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              placeholder="Enter description"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="shadow-none min-h-[80px]"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Image</Label>
            <ItemImageUpload 
              onUpload={(url) => setNewItem({...newItem, image_url: url})} 
              currentImage={newItem.image_url} 
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-green text-black shadow-none"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {existingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Item Management Modal - Shows list of items
const ItemManagementModal = ({ wishlist, onItemsUpdated }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', wishlist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      });
    }
  }, [wishlist.id]);

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, fetchItems]);

  const deleteItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems();
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
  <Button variant="custom" className="bg-brand-orange text-black w-full shadow-none">
    <Gift className="w-4 h-4 mr-2" />
            Manage Wishlist Items
  </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">Manage Wishlist Items for '{wishlist.title}'</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => {
                  setEditingItem(null);
                  setShowAddItemModal(true);
                }}
                variant="custom" 
                className="bg-brand-green text-black shadow-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items added yet</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-3 sm:p-4 border-2 border-black space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 flex items-center space-x-2 sm:space-x-3 min-w-0">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-cover flex-shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm sm:text-base md:text-lg truncate">
                            {item.qty_total && item.qty_total > 1 ? `(x${item.qty_total}) ` : ''}{item.name}
                          </p>
                          {item.unit_price_estimate && <p className="text-xs sm:text-sm text-brand-orange font-semibold">₦{item.unit_price_estimate.toLocaleString()}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.product_url.startsWith('http') ? item.product_url : `https://${item.product_url}`, '_blank')}
                          disabled={!item.product_url}
                          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 shadow-none"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setShowAddItemModal(true);
                          }}
                          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 shadow-none"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 shadow-none"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline" className="shadow-none">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal - Pops up over the main modal */}
      {showAddItemModal && (
        <AddItemModal 
          wishlist={wishlist}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
          onItemAdded={fetchItems}
          existingItem={editingItem}
        />
      )}
    </>
  );
};

// Add Goal Modal - Separate modal for adding goals
const AddGoalModal = ({ wishlist, onClose, onGoalAdded }) => {
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_amount: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !newGoal.target_amount) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          wishlist_id: wishlist.id,
          title: newGoal.title,
          target_amount: parseFloat(newGoal.target_amount),
          deadline: newGoal.deadline || null
        });

      if (error) throw error;

      setNewGoal({ title: '', target_amount: '', deadline: '' });
      onGoalAdded();
      onClose();
      toast({
        title: "Success",
        description: "Goal added successfully",
      });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cash Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={addGoal} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Goal Title</Label>
            <Input
              placeholder="Enter goal title"
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              required
              className="shadow-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Amount (₦)</Label>
            <Input
              placeholder="Enter target amount"
              type="number"
              step="0.01"
              value={newGoal.target_amount}
              onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
              required
              className="shadow-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal shadow-none">
                  {newGoal.deadline ? format(new Date(newGoal.deadline), 'PPP') : <span>Pick a date</span>}
  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newGoal.deadline ? new Date(newGoal.deadline) : undefined}
                  onSelect={(date) => setNewGoal({...newGoal, deadline: date ? format(date, 'yyyy-MM-dd') : ''})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-green text-black shadow-none"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Goal Management Modal - Shows list of goals
const GoalManagementModal = ({ wishlist, onAction }) => {
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('wishlist_id', wishlist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
    }
  }, [wishlist.id]);

  useEffect(() => {
    if (open) {
      fetchGoals();
    }
  }, [open, fetchGoals]);

  const deleteGoal = async (goalId) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      await fetchGoals();
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
  <Button variant="custom" className="bg-brand-green text-black w-full shadow-none">
    <Target className="w-4 h-4 mr-2" />
    Manage Cash Goals
  </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">Manage Cash Goals for '{wishlist.title}'</DialogTitle>
      </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => setShowAddGoalModal(true)}
                variant="custom" 
                className="bg-brand-green text-black shadow-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
      </div>

            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No goals set yet</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="p-4 border-2 border-black space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{goal.title}</p>
                        <p className="text-sm text-gray-600">Target: ₦{goal.target_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast({ title: "🚧 Edit functionality coming soon!", description: "This feature will be implemented in the next update." })}
                          className="h-10 w-10 p-0 shadow-none"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                          className="h-10 w-10 p-0 shadow-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Raised: ₦{Number(goal.amount_raised || 0).toLocaleString()}</span>
                        <span>{calculateProgress(goal.amount_raised || 0, goal.target_amount)}%</span>
                      </div>
                      <div className="relative h-4 w-full overflow-hidden border-2 border-black bg-gray-200">
                        <div className={`h-full transition-all ${getProgressColor(calculateProgress(goal.amount_raised || 0, goal.target_amount))}`} style={{width: `${calculateProgress(goal.amount_raised || 0, goal.target_amount)}%`}}></div>
                      </div>
                    </div>
                    {goal.deadline && (
                      <div className="text-xs text-gray-500">
                        Deadline: {format(new Date(goal.deadline), 'PPP')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

      <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline" className="shadow-none">
              Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

      {/* Add Goal Modal - Pops up over the main modal */}
      {showAddGoalModal && (
        <AddGoalModal 
          wishlist={wishlist}
          onClose={() => setShowAddGoalModal(false)}
          onGoalAdded={fetchGoals}
        />
      )}
    </>
  );
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
          <div className="grid gap-y-2 py-4">
             <div className="grid grid-cols-4 items-center gap-x-2">
              <Label htmlFor="title" className="text-right">Title</Label>
              <div className="col-span-3">
                <Input id="title" value={title} onChange={handleTitleChange} />
                <FormErrors errors={errors?.title} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-2">
              <Label htmlFor="slug" className="text-right">URL</Label>
              <div className="col-span-3">
                <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} />
                <FormErrors errors={errors?.slug} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-2">
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
              <div className="grid grid-cols-4 items-center gap-x-2">
                <Label htmlFor="customOccasion" className="text-right">Custom</Label>
                <div className="col-span-3">
                    <Input id="customOccasion" value={customOccasion} onChange={e => setCustomOccasion(e.target.value)} placeholder="E.g., House Warming"/>
                    <FormErrors errors={errors?.customOccasion} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-x-2">
              <Label htmlFor="wishlistDate" className="text-right">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal shadow-none">
                    {wishlistDate ? format(wishlistDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={wishlistDate} onSelect={setWishlistDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-2">
              <Label htmlFor="story" className="text-right">Story</Label>
              <Textarea id="story" value={story} onChange={e => setStory(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-x-2">
              <Label className="text-right pt-2">Cover Image</Label>
              <ImageUpload onUpload={setCoverImageUrl} currentImage={coverImageUrl} />
            </div>
            <div className="grid grid-cols-4 items-center gap-x-2">
              <Label htmlFor="visibility" className="text-right">Visibility</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch id="visibility" checked={visibility === 'public'} onCheckedChange={(checked) => setVisibility(checked ? 'public' : 'unlisted')} />
                <span className="text-sm text-gray-600">{visibility === 'public' ? 'Public' : 'Unlisted'}</span>
              </div>
            </div>
      </div>
      <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="custom" disabled={loading} className="bg-brand-green text-black shadow-none">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingWishlist ? 'Save Changes' : 'Create'}
        </Button>
      </DialogFooter>
        </form>
    </DialogContent>
    </Dialog>;
};

export default DashboardPage;