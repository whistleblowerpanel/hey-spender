import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/customSupabaseClient';
import { sendWithdrawalNotifications } from '@/lib/notificationService';
import { Loader2, Plus, Gift, Edit, Trash2, Share2, Link as LinkIcon, QrCode as ImageIcon, Save, Trash, X, Upload, Eye, EyeOff, ShoppingBag, Clock, ToggleLeft, ToggleRight, DollarSign, Target, Wallet as WalletIcon, ChevronsRight, Banknote, Calendar as CalendarIcon, Settings, Download, ArrowDown, ArrowUp, CreditCard, CheckCircle, XCircle } from 'lucide-react';
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
  const walletContext = useWallet();
  const { wallet, loading: walletLoading } = walletContext || {};
  
  console.log('DashboardPage: walletContext:', walletContext);
  console.log('DashboardPage: user:', user?.id, 'authLoading:', authLoading);
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
    if (!user) {
      console.log('No user found, skipping dashboard data fetch');
      return;
    }
    console.log('Fetching dashboard data for user:', user.id, user.email);
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
            user:users!inner(id, username)
          )
        )
      `)
      .eq('supporter_user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    const [wishlistsRes, claimsRes] = await Promise.all([wishlistsPromise, claimsPromise]);

    console.log('Wishlists query result:', wishlistsRes);
    if (wishlistsRes.error) {
      console.error('Wishlists query error:', wishlistsRes.error);
      toast({ variant: 'destructive', title: 'Error fetching wishlists', description: wishlistsRes.error.message });
    } else {
      console.log('Setting wishlists:', wishlistsRes.data);
      setWishlists(wishlistsRes.data);
    }
    
    console.log('Claims query result:', claimsRes);
    if (claimsRes.error) {
      console.error('Claims query error:', claimsRes.error);
      toast({ variant: 'destructive', title: 'Error fetching claimed items', description: claimsRes.error.message });
    } else {
      console.log('Claims data:', claimsRes.data);
      if (claimsRes.data && claimsRes.data.length > 0) {
        console.log('First claim structure:', claimsRes.data[0]);
        console.log('First claim wishlist_item:', claimsRes.data[0].wishlist_item);
        console.log('First claim wishlist_item.wishlist:', claimsRes.data[0].wishlist_item?.wishlist);
        console.log('First claim wishlist_item.wishlist.user:', claimsRes.data[0].wishlist_item?.wishlist?.user);
      }
      setClaims(claimsRes.data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    } else if (user) {
      if (user.user_metadata?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        console.log('Triggering fetchDashboardData for user:', user.id);
        fetchDashboardData();
      }
    }
  }, [user, authLoading, navigate]);

  // Refresh data when navigating to dashboard with claims tab
  useEffect(() => {
    if (location.state?.defaultTab === 'claims' && user) {
      console.log('Refreshing dashboard data for claims tab');
      fetchDashboardData();
    }
  }, [location.state?.defaultTab, user]);

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
          <TabsList className="w-full sm:grid sm:grid-cols-4 sm:overflow-visible">
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

// Wallet Stat Card (styled like Admin StatCard) - mobile friendly sizing
const WalletStatCard = ({ title, value, icon, loading, bgColor = 'bg-brand-cream', textColor = 'text-black', showWithdrawButton = false, onWithdraw }) => (
  <div className={`border-2 border-black rounded-lg p-3 sm:p-4 min-h-[80px] ${bgColor} relative after:absolute after:left-[-8px] after:bottom-[-8px] after:w-full after:h-full after:bg-black after:z-[-1]`}>
    <div className="relative">
      <div className="flex justify-between items-center gap-3">
        <p className={`text-sm font-semibold uppercase ${textColor}`}>{title}</p>
        <div className={`${textColor} flex-shrink-0`}>{icon}</div>
      </div>
      <div className="mt-1">
        {loading ? <Loader2 className={`h-6 w-6 animate-spin ${textColor}`} /> : <p className={`text-2xl font-bold leading-tight ${textColor}`}>{value}</p>}
      </div>
      {showWithdrawButton && (
        <div className="mt-1 flex justify-end">
          <Button
            onClick={onWithdraw}
            className="bg-brand-orange hover:bg-brand-orange/90 text-black border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-base font-bold px-6 py-2 h-8 w-full max-w-[140px] flex items-center justify-center"
          >
            WITHDRAW
          </Button>
        </div>
      )}
    </div>
  </div>
);

const WalletView = () => {
  const { wallet, transactions, loading } = useWallet();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState('all');
  const [visibleTransactions, setVisibleTransactions] = useState(17);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Get withdrawal requests (payouts) for the current user
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  useEffect(() => {
    const fetchWithdrawalRequests = async () => {
      if (!wallet?.id) return;
      
      setLoadingWithdrawals(true);
      try {
        const { data, error } = await supabase
          .from('payouts')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWithdrawalRequests(data || []);
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading withdrawal history',
          description: 'Failed to load your withdrawal requests.'
        });
      } finally {
        setLoadingWithdrawals(false);
      }
    };

    fetchWithdrawalRequests();
  }, [wallet?.id, toast]);

  const getWithdrawalStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-brand-orange text-black';
      case 'processing': return 'bg-brand-purple-light text-black';
      case 'paid': return 'bg-brand-green text-black';
      case 'failed': return 'bg-brand-accent-red text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getWithdrawalStatusText = (status) => {
    switch (status) {
      case 'requested': return 'Pending Review';
      case 'processing': return 'Processing';
      case 'paid': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  // Reset visible transactions when filter changes
  useEffect(() => {
    setVisibleTransactions(17);
  }, [filterType]);

  const loadMore = () => {
    setVisibleTransactions(prev => prev + 17);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Derived totals
  const totalReceived = (transactions || []).filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  // Only count platform withdrawals (payouts), not sent contributions
  const totalWithdrawn = (transactions || []).filter(t => {
    const raw = (t.source || t.description || '').toLowerCase();
    return raw.includes('payout') || raw.includes('withdraw');
  }).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  // Balance should reflect only platform wallet movements: add credits, subtract only payouts
  const balance = (transactions || []).reduce((acc, t) => {
    if (t.type === 'credit') return acc + Number(t.amount || 0);
    const raw = (t.source || t.description || '').toLowerCase();
    if (raw.includes('payout') || raw.includes('withdraw')) return acc - Number(t.amount || 0);
    // Do not subtract sent contributions; they are paid from bank, not wallet
    return acc;
  }, 0);

  // Group transactions by date (computed later after filtering)
  // Placeholder; will be defined after filter
  let filteredTransactions = transactions || [];
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'credit') {
      return <ChevronsRight className="w-4 h-4 text-brand-green" />;
    } else {
      return <Banknote className="w-4 h-4 text-brand-purple-dark" />;
    }
  };

  const getNormalizedSource = (transaction) => {
    const raw = (transaction.source || transaction.description || '').toLowerCase();
    // Check the more specific token BEFORE the generic one
    if (raw.includes('contribution_sent')) return 'sent';
    if (raw.includes('cash_sent') || raw.includes('sent_item')) return 'sent';
    if (raw.includes('contribution')) return 'contribution';
    if (raw.includes('payout') || raw.includes('withdraw')) return 'payout';
    if (raw.includes('refund')) return 'refund';
    if (raw.includes('wishlist') || raw.includes('cash payment')) return 'wishlist_purchase';
    // Default: any credit that isn't a contribution/refund/payout is a Cash Payment
    if (transaction.type === 'credit') return 'wishlist_purchase';
    return 'other';
  };

  // Filter transactions based on selected type (after helpers are defined to avoid TDZ errors)
  const allFilteredTransactions = (transactions || []).filter(transaction => {
    if (filterType === 'all') return true;
    if (filterType === 'credit') {
      const src = getNormalizedSource(transaction);
      // Received = credits that are not "sent"
      return transaction.type === 'credit' && src !== 'sent';
    }
    if (filterType === 'sent') {
      const src = getNormalizedSource(transaction);
      // Sent = explicit contribution_sent (we mapped as 'sent') OR debits that are not payouts
      return src === 'sent' || (transaction.type === 'debit' && src !== 'payout');
    }
    if (filterType === 'debit') {
      const src = getNormalizedSource(transaction);
      // Withdrawn view should only show payouts
      return src === 'payout';
    }
    return true;
  });

  // Limit visible transactions
  filteredTransactions = allFilteredTransactions.slice(0, visibleTransactions);

  // Recompute grouping with the new filtered list
  const regrouped = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {});

  const getTransactionDescription = (transaction) => {
    if (transaction.description) {
      return transaction.description;
    }
    
    // Fallback descriptions based on source
    const source = getNormalizedSource(transaction);
    if (source === 'contribution') {
      return 'Contributions received';
    } else if (source === 'wishlist_purchase') {
      return 'Wishlist item purchase received';
    } else if (source === 'payout') {
      return 'Withdrawal processed';
    } else if (source === 'refund') {
      return 'Refund processed';
    } else if (source === 'sent') {
      return 'Cash sent';
    }
    
    return transaction.type === 'credit' ? 'Money received' : 'Money withdrawn';
  };

  const getTransactionAmount = (transaction) => {
    const amount = Number(transaction.amount || 0);
    const formattedAmount = `₦${amount.toLocaleString()}`;
    
    if (transaction.type === 'credit') {
      return <span className="text-brand-green font-semibold">+{formattedAmount}</span>;
    } else {
      return <span className="text-brand-accent-red font-semibold">-{formattedAmount}</span>;
    }
  };

  // Desktop badge with same colors as mobile icons
  const getDesktopBadge = (transaction) => {
    const source = getNormalizedSource(transaction);
    if (source === 'sent') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-accent-red"></div>
          <span className="text-xs font-semibold">Cash Sent</span>
        </div>
      );
    }
    if (source === 'contribution') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-green"></div>
          <span className="text-xs font-semibold">Contributions</span>
        </div>
      );
    }
    if (source === 'wishlist_purchase') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-purple-dark"></div>
          <span className="text-xs font-semibold">Cash Payment</span>
        </div>
      );
    }
    if (source === 'payout') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-orange"></div>
          <span className="text-xs font-semibold">Withdrawn</span>
        </div>
      );
    }
    if (source === 'refund') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200"></div>
          <span className="text-xs font-semibold">Refund</span>
        </div>
      );
    }
    return null;
  };

  // Category label for mobile rows
  const getCategoryLabel = (transaction) => {
    const source = getNormalizedSource(transaction);
    if (source === 'sent') return 'Cash Sent';
    if (source === 'contribution') return 'Contributions';
    if (source === 'wishlist_purchase') return 'Cash Payment';
    if (source === 'payout') return 'Withdrawn';
    if (source === 'refund') return 'Refund';
    return transaction.type === 'credit' ? 'Money Received' : 'Money Withdrawn';
  };

  // Helper to truncate long usernames
  const truncateUsername = (username, maxLength = 15) => {
    if (!username || username === '—') return '—';
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength) + '...';
  };

  // Relation label e.g., "From — @username" or "To — @username"
  const getRelationLabel = (transaction) => {
    const source = getNormalizedSource(transaction);
    const isTo = source === 'sent' || source === 'payout';
    const username = getDepositor(transaction);
    const right = (username && username !== '—') ? `@${truncateUsername(username)}` : '—';
    return `${isTo ? 'To' : 'From'} — ${right}`;
  };

  // Colored square icon per source
  const getIconBadge = (transaction) => {
    const source = getNormalizedSource(transaction);
    if (source === 'sent') {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-accent-red flex items-center justify-center">
          <ChevronsRight className="w-7 h-7 text-black rotate-[-90deg]" />
        </div>
      );
    }
    if (source === 'contribution') {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-green flex items-center justify-center">
          <ChevronsRight className="w-7 h-7 text-black rotate-90" />
        </div>
      );
    }
    if (source === 'wishlist_purchase') {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-purple-dark flex items-center justify-center">
          <ChevronsRight className="w-7 h-7 text-white rotate-90" />
        </div>
      );
    }
    if (source === 'payout') {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-orange flex items-center justify-center">
          <CreditCard className="w-7 h-7 text-black" />
        </div>
      );
    }
    // default
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 flex items-center justify-center">
        <WalletIcon className="w-7 h-7 text-black" />
      </div>
    );
  };

  const getDepositor = (transaction) => {
    // For Sent tab, show receiver instead of depositor
    const source = getNormalizedSource(transaction);
    if (source === 'sent') {
      if (transaction.recipient_username) return transaction.recipient_username;
      // try to parse from description "to @username"
      const desc = typeof transaction.description === 'string' ? transaction.description : '';
      const m = desc.match(/to\s+@([A-Za-z0-9_.-]+)/i);
      if (m && m[1]) return m[1];
    }
    if (transaction.contributor_name) return transaction.contributor_name;
    const desc = typeof transaction.description === 'string' ? transaction.description : '';
    const src = typeof transaction.source === 'string' ? transaction.source : '';
    // Try patterns: from @username, from username, from Name (@username)
    let m = desc.match(/from\s+@([A-Za-z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
    const m2 = desc.match(/from\s+[^\(\-@]+\s*\(@([A-Za-z0-9_.-]+)\)/i);
    if (m2 && m2[1]) return m2[1];
    const m3 = desc.match(/from\s+([A-Za-z0-9_.-]+)/i);
    if (m3 && m3[1]) return m3[1];
    // Look for any @username anywhere
    const m4 = desc.match(/@([A-Za-z0-9_.-]+)/);
    if (m4 && m4[1]) return m4[1];
    // Fallback: parse username-like token from source field if it contains it
    let s1 = src.match(/@([A-Za-z0-9_.-]+)/);
    if (s1 && s1[1]) return s1[1];
    // Exclude known keywords; pick a simple alphanumeric token as username candidate
    const tokens = src.split(/[\s:/,;-]+/).filter(Boolean);
    const blacklist = new Set(['wishlist_purchase', 'wishlist', 'purchase', 'contribution', 'contributions', 'payout', 'withdrawal', 'refund', 'cash_payment', 'cash', 'payment']);
    const candidate = tokens.find(t => !blacklist.has(t.toLowerCase()) && /^[A-Za-z0-9_.-]{3,}$/.test(t));
    if (candidate) return candidate;
    return '—';
  };

  const getTitleDisplay = (transaction) => {
    const raw = transaction.title || transaction.description || '';
    const noPrefix = raw.replace(/^\s*cash\s*payment\s*for\s*/i, '').trim();
    // remove wrapping quotes "Title" or 'Title'
    const noQuotes = noPrefix.replace(/^"(.+)"$/,'$1').replace(/^'(.*)'$/,'$1');
    // remove trailing hyphen and extra spaces
    return noQuotes.replace(/\s*-\s*$/,'').trim();
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <WalletStatCard 
          title="Wallet Balance" 
          value={`₦${balance.toLocaleString()}`} 
          icon={<WalletIcon className="w-6 h-6" />} 
          loading={false} 
          bgColor="bg-brand-green" 
          textColor="text-black"
        />
        <WalletStatCard 
          title="Total Received" 
          value={`₦${totalReceived.toLocaleString()}`} 
          icon={<ChevronsRight className="w-6 h-6" />} 
          loading={false} 
          bgColor="bg-brand-orange" 
          textColor="text-black"
        />
        <WalletStatCard 
          title="Total Withdrawn" 
          value={`₦${totalWithdrawn.toLocaleString()}`} 
          icon={<Banknote className="w-6 h-6" />} 
          loading={false} 
          bgColor="bg-brand-purple-dark" 
          textColor="text-white"
          showWithdrawButton={true}
          onWithdraw={handleWithdraw}
        />
      </div>

      {/* Withdrawal History */}
      <div className="border-2 border-black bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-brand-purple-dark">Withdrawal History</h3>
          <Button 
            variant="custom" 
            className="bg-brand-green text-black"
            onClick={handleWithdraw}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Withdrawal
          </Button>
        </div>

        {loadingWithdrawals ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple-dark" />
          </div>
        ) : withdrawalRequests.length === 0 ? (
          <div className="text-center py-8">
            <Banknote className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-4 text-lg font-semibold text-gray-600">No withdrawal requests</h4>
            <p className="mt-2 text-sm text-gray-500">You haven't made any withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawalRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold">₦{Number(request.amount).toLocaleString()}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getWithdrawalStatusColor(request.status)}`}>
                        {getWithdrawalStatusText(request.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Bank:</strong> {request.destination_bank_code || 'N/A'}</div>
                      <div><strong>Account:</strong> {request.destination_account || 'N/A'}</div>
                      <div><strong>Requested:</strong> {new Date(request.created_at).toLocaleDateString()}</div>
                      {request.updated_at && (
                        <div><strong>Last Updated:</strong> {new Date(request.updated_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {request.status === 'requested' && (
                      <div className="text-xs text-brand-orange">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Awaiting admin review
                      </div>
                    )}
                    {request.status === 'processing' && (
                      <div className="text-xs text-brand-purple-light">
                        <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                        Processing...
                      </div>
                    )}
                    {request.status === 'paid' && (
                      <div className="text-xs text-brand-green">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Completed
                      </div>
                    )}
                    {request.status === 'failed' && (
                      <div className="text-xs text-brand-accent-red">
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Failed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Section - Responsive */}
      <div className="py-4 sm:py-6 px-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-brand-purple-dark whitespace-nowrap">Transaction History</h3>
          <div className="flex gap-2 w-full mt-4 sm:mt-0 justify-end">
            <Button
              variant={filterType === 'all' ? 'custom' : 'outline'}
              className={`${filterType === 'all' ? 'bg-brand-purple-dark text-white' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'credit' ? 'custom' : 'outline'}
              className={`${filterType === 'credit' ? 'bg-brand-green text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
              onClick={() => setFilterType('credit')}
            >
              Received
            </Button>
            <Button
              variant={filterType === 'sent' ? 'custom' : 'outline'}
              className={`${filterType === 'sent' ? 'bg-brand-salmon text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
              onClick={() => setFilterType('sent')}
            >
              Sent
            </Button>
            <Button
              variant={filterType === 'debit' ? 'custom' : 'outline'}
              className={`${filterType === 'debit' ? 'bg-brand-orange text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
              onClick={() => setFilterType('debit')}
            >
              Withdrawn
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-600">No transactions found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {filterType === 'all' 
                ? "You haven't made any transactions yet." 
                : `No ${filterType === 'credit' ? 'money received' : 'withdrawals'} found.`
              }
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile list view - redesigned */}
            <div className="md:hidden">
              {Object.entries(regrouped).map(([date, transactions]) => (
                <div key={date} className="mb-6">
                  <div className="text-sm font-medium text-gray-600 mb-3">
                    {format(new Date(date), 'd MMMM yyyy')}
                  </div>
                  {transactions.map((t) => (
                    <div key={t.id} className="py-6 px-0 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center gap-3">
                        {getIconBadge(t)}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-black truncate">
                                {getTitleDisplay(t) || getTransactionDescription(t)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{getCategoryLabel(t)}</div>
                            </div>
                            <div className="text-right ml-2 whitespace-nowrap">
                              <div className="text-sm font-semibold">{getTransactionAmount(t)}</div>
                              <div className="text-xs text-gray-600 mt-1">{getRelationLabel(t)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filteredTransactions || []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{getDesktopBadge(t)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getDepositor(t) && getDepositor(t) !== '—' ? (
                          <a href={`/${getDepositor(t)}`} className="font-semibold text-brand-purple-dark hover:underline">@{truncateUsername(getDepositor(t))}</a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm font-semibold">{getTitleDisplay(t) || getTransactionDescription(t)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold">{getTransactionAmount(t)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-gray-600">{format(new Date(t.created_at), 'PP p')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {allFilteredTransactions.length > visibleTransactions && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] px-6 py-2"
            >
              Load More
            </Button>
          </div>
        )}
        </div>

      {/* Withdraw Modal */}
      <WithdrawModal 
        open={showWithdrawModal} 
        onOpenChange={setShowWithdrawModal}
        wallet={wallet}
        balance={balance}
      />
    </div>
  );
};

// Withdraw Modal Component
const WithdrawModal = ({ open, onOpenChange, wallet, balance }) => {
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Wallet not found. Please try again later.'
      });
      return;
    }

    const amount = parseFloat(withdrawData.amount);
    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.'
      });
      return;
    }

    if (amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You can only withdraw up to ₦${balance.toLocaleString()}.`
      });
      return;
    }

    if (amount < 1000) {
      toast({
        variant: 'destructive',
        title: 'Minimum Amount',
        description: 'Minimum withdrawal amount is ₦1,000.'
      });
      return;
    }

    if (!withdrawData.bankCode || !withdrawData.accountNumber || !withdrawData.accountName) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all bank account details.'
      });
      return;
    }

    setLoading(true);
    try {
      // Determine initial status based on amount and user verification
      const AUTO_APPROVAL_LIMIT = 5000; // ₦5,000 auto-approval limit
      const isVerifiedUser = user?.email_verified || user?.user_metadata?.verified;
      const shouldAutoApprove = amount <= AUTO_APPROVAL_LIMIT && isVerifiedUser;
      
      const initialStatus = shouldAutoApprove ? 'processing' : 'requested';
      
      const { data: payoutData, error } = await supabase
        .from('payouts')
        .insert({
          wallet_id: wallet.id,
          amount: amount,
          destination_bank_code: withdrawData.bankCode,
          destination_account: withdrawData.accountNumber,
          status: initialStatus,
          provider: 'manual'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications
      try {
        if (shouldAutoApprove) {
          // For auto-approved withdrawals, notify user immediately
          await sendWithdrawalNotifications.onStatusChange(payoutData, 'requested', 'processing');
        } else {
          // For manual review withdrawals, notify admins
          await sendWithdrawalNotifications.onNewWithdrawal(payoutData);
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the withdrawal if notifications fail
      }

      // If auto-approved, create wallet transaction immediately
      if (shouldAutoApprove && payoutData) {
        const { error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'debit',
            source: 'payout',
            amount: amount,
            description: `Withdrawal to ${withdrawData.bankCode} ${withdrawData.accountNumber} - Auto-approved`
          });

        if (txError) {
          console.error('Error creating wallet transaction:', txError);
          // Don't throw error here, just log it
        }
      }

      const statusMessage = shouldAutoApprove 
        ? 'Your withdrawal has been automatically approved and is now processing! Funds will be transferred within 1-2 business days.'
        : 'Your withdrawal request has been submitted and will be processed within 24-48 hours. You will receive email notifications when the status changes.';

      toast({
        title: shouldAutoApprove ? 'Withdrawal Auto-Approved!' : 'Withdrawal Request Submitted',
        description: statusMessage
      });

      setWithdrawData({
        amount: '',
        bankCode: '',
        accountNumber: '',
        accountName: ''
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        variant: 'destructive',
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to submit withdrawal request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value) => {
    // Only allow numbers and one decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return; // Only one decimal point allowed
    if (parts[1] && parts[1].length > 2) return; // Only 2 decimal places
    setWithdrawData(prev => ({ ...prev, amount: cleanValue }));
  };

  // Check if current amount qualifies for auto-approval
  const currentAmount = parseFloat(withdrawData.amount) || 0;
  const AUTO_APPROVAL_LIMIT = 5000;
  const isVerifiedUser = user?.email_verified || user?.user_metadata?.verified;
  const willAutoApprove = currentAmount > 0 && currentAmount <= AUTO_APPROVAL_LIMIT && isVerifiedUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Withdraw funds from your wallet to your bank account. Processing takes 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        {/* Processing Time Information */}
        <div className="bg-brand-orange/10 border border-brand-orange rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-brand-orange mt-0.5" />
            <div>
              <div className="font-semibold text-brand-orange text-sm">Processing Timeline</div>
              <div className="text-xs text-gray-700 mt-1 space-y-1">
                <div>• <strong>Request Submitted:</strong> Immediate confirmation</div>
                <div>• <strong>Admin Review:</strong> Within 24 hours</div>
                <div>• <strong>Processing:</strong> 24-48 hours after approval</div>
                <div>• <strong>Funds Transfer:</strong> 1-2 business days</div>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                You'll receive email notifications at each step.
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Approval Information */}
        <div className="bg-brand-green/10 border border-brand-green rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-brand-green mt-0.5" />
            <div>
              <div className="font-semibold text-brand-green text-sm">Auto-Approval Available</div>
              <div className="text-xs text-gray-700 mt-1">
                Withdrawals of ₦5,000 or less are automatically approved for verified users and processed immediately!
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Larger amounts require manual admin review for security.
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              value={withdrawData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              required
              className="shadow-none"
            />
            <p className="text-xs text-gray-500">
              Available balance: ₦{balance.toLocaleString()}
            </p>
            {currentAmount > 0 && (
              <div className={`text-xs p-2 rounded ${
                willAutoApprove 
                  ? 'bg-brand-green/10 text-brand-green border border-brand-green' 
                  : 'bg-brand-orange/10 text-brand-orange border border-brand-orange'
              }`}>
                {willAutoApprove ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>This withdrawal will be auto-approved and processed immediately!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>This withdrawal requires admin review (24-48 hours)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank</Label>
            <Select value={withdrawData.bankCode} onValueChange={(value) => setWithdrawData(prev => ({ ...prev, bankCode: value }))}>
              <SelectTrigger className="shadow-none">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="044">Access Bank</SelectItem>
                <SelectItem value="023">Citibank</SelectItem>
                <SelectItem value="050">Ecobank</SelectItem>
                <SelectItem value="011">First Bank</SelectItem>
                <SelectItem value="214">First City Monument Bank</SelectItem>
                <SelectItem value="070">Fidelity Bank</SelectItem>
                <SelectItem value="058">GTBank</SelectItem>
                <SelectItem value="030">Heritage Bank</SelectItem>
                <SelectItem value="301">Jaiz Bank</SelectItem>
                <SelectItem value="082">Keystone Bank</SelectItem>
                <SelectItem value="221">Kuda Bank</SelectItem>
                <SelectItem value="526">Opay</SelectItem>
                <SelectItem value="327">PalmPay</SelectItem>
                <SelectItem value="076">Polaris Bank</SelectItem>
                <SelectItem value="101">Providus Bank</SelectItem>
                <SelectItem value="221">Stanbic IBTC Bank</SelectItem>
                <SelectItem value="068">Standard Chartered Bank</SelectItem>
                <SelectItem value="232">Sterling Bank</SelectItem>
                <SelectItem value="100">Suntrust Bank</SelectItem>
                <SelectItem value="032">Union Bank</SelectItem>
                <SelectItem value="033">United Bank for Africa</SelectItem>
                <SelectItem value="215">Unity Bank</SelectItem>
                <SelectItem value="035">Wema Bank</SelectItem>
                <SelectItem value="057">Zenith Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              type="text"
              placeholder="Enter account number"
              value={withdrawData.accountNumber}
              onChange={(e) => setWithdrawData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
              required
              className="shadow-none"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              type="text"
              placeholder="Enter account holder name"
              value={withdrawData.accountName}
              onChange={(e) => setWithdrawData(prev => ({ ...prev, accountName: e.target.value }))}
              required
              className="shadow-none"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please ensure your account details are correct. 
              Incorrect details may result in failed transactions and additional charges.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-orange text-black shadow-none"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUp className="w-4 h-4 mr-2" />}
              Request Withdrawal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SettingsView = ({ user }) => {
  const { updatePassword, updateEmail } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking', null
  const usernameTimeoutRef = useRef(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Load profile data from database on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, username, email, phone')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading profile data:', error);
          return;
        }
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            username: data.username || '',
            email: data.email || user.email || '',
            phone: data.phone || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setProfileLoaded(true);
      }
    };
    
    loadProfileData();
  }, [user?.id, user?.email]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  // Check if username is available
  const checkUsernameAvailability = async (username) => {
    if (!username || username === user?.user_metadata?.username) {
      setUsernameStatus('available');
      return true; // Current username is always available
    }
    
    setUsernameStatus('checking');
    setUsernameChecking(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      const isAvailable = !data; // Return true if no user found (available)
      setUsernameStatus(isAvailable ? 'available' : 'taken');
      setUsernameChecking(false);
      return isAvailable;
    } catch (error) {
      setUsernameStatus('available'); // If error, assume available
      setUsernameChecking(false);
      return true;
    }
  };

  // Debounced username checking
  const debouncedUsernameCheck = useCallback((username) => {
    // Clear existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    
    // Reset status immediately
    setUsernameStatus(null);
    
    // Set new timeout
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500); // 500ms delay
  }, [user?.user_metadata?.username]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields
    if (!profile.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Full name is required.' });
      setLoading(false);
      return;
    }
    
    if (!profile.username.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Username is required.' });
      setLoading(false);
      return;
    }
    
    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(profile.username)) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Username can only contain letters, numbers, and underscores.' });
      setLoading(false);
      return;
    }
    
    // Check if username is available if it's different from current
    if (profile.username !== user?.user_metadata?.username) {
      if (usernameStatus === 'taken') {
        toast({ variant: 'destructive', title: 'Username not available', description: 'This username is already taken. Please choose a different one.' });
        setLoading(false);
        return;
      }
      
      // If status is null or checking, do a final check
      if (usernameStatus === null || usernameStatus === 'checking') {
        const isAvailable = await checkUsernameAvailability(profile.username);
        if (!isAvailable) {
          toast({ variant: 'destructive', title: 'Username not available', description: 'This username is already taken. Please choose a different one.' });
          setLoading(false);
          return;
        }
      }
    }
    
    try {
      // Update the users table in the database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          username: profile.username,
          phone: profile.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        toast({ variant: 'destructive', title: 'Error updating profile', description: dbError.message });
        setLoading(false);
        return;
      }

      // Also update the auth user metadata for consistency
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          username: profile.username,
          phone: profile.phone
        }
      });

      if (authError) {
        toast({ variant: 'destructive', title: 'Error updating auth profile', description: authError.message });
      } else {
        toast({ title: 'Profile updated successfully!' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating profile', description: 'An unexpected error occurred' });
    }
    
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters long' });
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const { error } = await updatePassword(passwordData.newPassword);
      
      if (error) {
        toast({ variant: 'destructive', title: 'Error updating password', description: error.message });
      } else {
        toast({ title: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred' });
    }
    
    setPasswordLoading(false);
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    
    if (!profile.email || !profile.email.includes('@')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid email address' });
      return;
    }
    
    setEmailLoading(true);
    
    try {
      // First update the users table in the database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          email: profile.email,
          phone: profile.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        toast({ variant: 'destructive', title: 'Error updating email', description: dbError.message });
        setEmailLoading(false);
        return;
      }

      // Then update the auth email
      const { error } = await updateEmail(profile.email);
      
      if (error) {
        toast({ variant: 'destructive', title: 'Error updating email', description: error.message });
      } else {
        toast({ title: 'Email update initiated! Please check your email for confirmation.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred' });
    }
    
    setEmailLoading(false);
  };

  if (!profileLoaded) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-dark" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Profile Settings */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white rounded-lg flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Profile Settings</h2>
        <form onSubmit={handleProfileUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm sm:text-base font-medium">Full Name</Label>
              <Input 
                id="full_name" 
                value={profile.full_name} 
                onChange={(e) => setProfile({...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base font-medium">Username</Label>
              <div className="relative">
                <Input 
                  id="username" 
                  value={profile.username} 
                  onChange={(e) => {
                    const newUsername = e.target.value;
                    setProfile({...profile, username: newUsername });
                    if (newUsername.trim()) {
                      debouncedUsernameCheck(newUsername);
                    } else {
                      setUsernameStatus(null);
                    }
                  }}
                  placeholder="Enter your username"
                  className="text-base sm:text-sm pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {usernameStatus === 'taken' && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">
                  Username can only contain letters, numbers, and underscores.
                </span>
                {usernameStatus === 'available' && profile.username && (
                  <span className="text-green-600 font-medium">✓ Available</span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-red-600 font-medium">✗ Taken</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base font-medium">Phone Number</Label>
              <Input 
                id="phone" 
                value={profile.phone} 
                onChange={(e) => setProfile({...profile, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="text-base sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-green text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2" 
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
              <span className="sm:inline">Save Profile</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Email Settings */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white rounded-lg flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Email Settings</h2>
        <form onSubmit={handleEmailUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={profile.email} 
                onChange={(e) => setProfile({...profile, email: e.target.value })}
                placeholder="Enter your email address"
                className="text-base sm:text-sm"
              />
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Changing your email will require verification of the new address.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_email" className="text-sm sm:text-base font-medium">Phone Number</Label>
              <Input 
                id="phone_email" 
                value={profile.phone} 
                onChange={(e) => setProfile({...profile, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="text-base sm:text-sm"
              />
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                This will be updated along with your email.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-orange text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2" 
              disabled={emailLoading}
            >
              {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
              <span className="sm:inline">Update Email</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Password Settings */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white rounded-lg flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Password Settings</h2>
        <form onSubmit={handlePasswordUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm sm:text-base font-medium">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword} 
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  minLength={6}
                  className="text-base sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-medium">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword} 
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  minLength={6}
                  className="text-base sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 space-y-1 bg-gray-50 p-3 rounded-md">
              <p>• Password must be at least 6 characters long</p>
              <p>• Use a combination of letters, numbers, and symbols for better security</p>
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit" 
              variant="custom" 
              className="bg-brand-purple-dark text-white shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2" 
              disabled={passwordLoading}
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
              <span className="sm:inline">Update Password</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      <div className="border-2 border-black p-4 sm:p-6 bg-brand-purple-dark rounded-lg flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Account Information</h2>
        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <span className="text-white/80 text-sm sm:text-base font-medium">Account ID:</span>
            <span className="font-mono text-xs sm:text-sm bg-white/20 text-white px-2 py-1 rounded break-all">{user?.id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <span className="text-white/80 text-sm sm:text-base font-medium">Member since:</span>
            <span className="text-white text-sm sm:text-base">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <span className="text-white/80 text-sm sm:text-base font-medium">Last sign in:</span>
            <span className="text-white text-sm sm:text-base">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
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