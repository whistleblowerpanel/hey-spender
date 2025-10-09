import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Clock, Loader2, Image as ImageIcon, Copy, QrCode as QrCodeIcon, Share2, Info, Mail, Phone, Eye, EyeOff, CheckCircle, X, ExternalLink, DollarSign, ChevronLeft, ChevronRight, PauseCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import QRCode from 'qrcode';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import Confetti from '@/components/Confetti';
import { getUserFriendlyError } from '@/lib/utils';

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

const claimSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  username: z.string().min(3, "Username must be at least 3 characters long.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

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


const Countdown = ({ date }) => {
    const [timeLeft, setTimeLeft] = useState(formatDistanceToNow(parseISO(date), { addSuffix: true }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(formatDistanceToNow(parseISO(date), { addSuffix: true }));
        }, 60000);
        return () => clearInterval(timer);
    }, [date]);

    return (
        <div className="flex items-center justify-center space-x-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{timeLeft}</span>
        </div>
    );
};

const LoggedInClaimDialog = ({ open, onOpenChange, onConfirm, loading, item }) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-brand-purple-dark border-2 border-black">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-brand-beige text-xl font-bold">Add to My Spender List</AlertDialogTitle>
                <AlertDialogDescription className="text-white">You are about to add "{item.name}" to your spender list. This will help you track items you want to buy for this person. Continue?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-between space-x-2">
                <AlertDialogCancel className="bg-brand-beige text-brand-purple-dark hover:bg-brand-beige/90 font-semibold border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={loading} className="bg-brand-green text-black hover:bg-brand-green/90 font-semibold border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Yes, Add to List!'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);


const ClaimItemModal = ({ item, onClaimed, trigger }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [claimMethod, setClaimMethod] = useState('email');
    const [formData, setFormData] = useState({ email: '', username: '', password: '' });
    const [emailSent, setEmailSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleLoggedInClaim = async () => {
        setLoading(true);
        console.log('Claiming item:', item.id, 'for user:', user.id);
        
        try {
            // Simple approach: Create claim directly
            const { data: claimData, error: claimError } = await supabase
                .from('claims')
                .insert({
                    wishlist_item_id: item.id,
                    supporter_user_id: user.id,
                    supporter_contact: user.email,
                    status: 'confirmed',
                    expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (claimError) {
                console.error('Claim error:', claimError);
                toast({ variant: 'destructive', title: 'Unable to claim item', description: getUserFriendlyError(claimError, 'claiming the item') });
            } else {
                console.log('Claim successful:', claimData);
                
                // Update item quantity
                await supabase
                    .from('wishlist_items')
                    .update({ qty_claimed: (item.qty_claimed || 0) + 1 })
                    .eq('id', item.id);

                toast({ title: 'Added to Spender List!', description: 'This item has been added to your spender list.' });
                onClaimed();
                setOpen(false);
                const isAdmin = user?.user_metadata?.role === 'admin';
                navigate(isAdmin ? '/admin/dashboard' : '/dashboard/spender-list');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            toast({ variant: 'destructive', title: 'Unable to claim item', description: getUserFriendlyError(err, 'claiming the item') });
        }
        
        setLoading(false);
    };

    const handleAnonymousClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);

        if (claimMethod === 'phone') {
            toast({ title: "🚧 Claiming via phone isn't ready yet, please use email! 🚀" });
            setLoading(false);
            return;
        }
        
        const validationResult = claimSchema.safeParse(formData);
        if(!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }

        const { email, username, password } = validationResult.data;

        try {
            // Step 1: Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        full_name: username
                    }
                }
            });

            if (authError) {
                const errorMessage = authError.message;
                const friendlyMessage = getUserFriendlyError(errorMessage, 'creating your account');
                toast({ variant: 'destructive', title: 'Unable to create account', description: friendlyMessage });
                
                if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
                    setOpen(false);
                    navigate('/login');
                }
                setLoading(false);
                return;
            }

            // Step 2: Create claim with pending status (will be confirmed after email verification)
            const { data: claimData, error: claimError } = await supabase
                .from('claims')
                .insert({
                    wishlist_item_id: item.id,
                    supporter_user_id: authData.user?.id || null,
                    supporter_contact: email,
                    status: 'pending',
                    expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (claimError) {
                console.error('Claim error:', claimError);
                toast({ variant: 'destructive', title: 'Unable to claim item', description: getUserFriendlyError(claimError, 'claiming the item') });
                setLoading(false);
                return;
            }

            console.log('Claim created successfully:', claimData);

            // Step 3: Send verification email
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`
                }
            });

            if (resendError) {
                toast({ variant: 'destructive', title: 'Could not send verification email', description: getUserFriendlyError(resendError, 'sending verification email') });
            } else {
                setEmailSent(true);
                onClaimed();
            }

        } catch (err) {
            console.error('Unexpected error:', err);
            toast({ variant: 'destructive', title: 'Unable to claim item', description: getUserFriendlyError(err, 'claiming the item') });
        }

        setLoading(false);
    };

    const handleOpenChange = (isOpen) => {
        if (!isOpen) {
            setOpen(false);
            setTimeout(() => {
                setClaimMethod('email');
                setFormData({ email: '', username: '', password: '' });
                setEmailSent(false);
                setErrors(null);
            }, 300);
        } else {
            setOpen(true);
        }
    };
    
    const buttonText = useMemo(() => {
        const texts = ["Odogwu, Pay for This.", "Lavishhh! Pick This.", "Oooshey! Spender, Claim This."];
        return texts[Math.floor(Math.random() * texts.length)];
    }, []);

    if (user) {
        return (
            <>
                {trigger(buttonText, () => setOpen(true))}
                <LoggedInClaimDialog 
                    open={open} 
                    onOpenChange={setOpen} 
                    onConfirm={handleLoggedInClaim} 
                    loading={loading}
                    item={item}
                />
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger(buttonText, () => setOpen(true))}</DialogTrigger>
            <DialogContent className={emailSent ? 'sm:max-w-md' : ''} fullscreenOnMobile={true}>
                {!emailSent ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Claim "{item.name}"</DialogTitle>
                            <DialogDescription>Create a light account to reserve this item. A verification link will be sent to your email.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAnonymousClaim} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Button type="button" variant={claimMethod === 'email' ? 'custom' : 'outline'} className='bg-brand-purple-dark text-white' onClick={() => setClaimMethod('email')}>
                                    <Mail className="mr-2 h-4 w-4" /> Email
                                </Button>
                                <Button type="button" variant={claimMethod === 'phone' ? 'custom' : 'outline'} className='bg-brand-green text-black' onClick={() => setClaimMethod('phone')}>
                                    <Phone className="mr-2 h-4 w-4" /> Phone
                                </Button>
                            </div>
                            
                            {claimMethod === 'email' && (
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="email">Your Email</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                                        <FormErrors errors={errors?.email} />
                                    </div>
                                    <div>
                                        <Label htmlFor="username">Choose a Username</Label>
                                        <Input id="username" type="text" value={formData.username} onChange={handleInputChange} />
                                        <FormErrors errors={errors?.username} />
                                    </div>
                                    <div className="relative">
                                        <Label htmlFor="password">Create a Password</Label>
                                        <div className="relative">
                                            <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                            </Button>
                                        </div>
                                        <FormErrors errors={errors?.password} />
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={loading} variant="custom" className="bg-brand-green text-black">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonText}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center">
                            <Mail className="w-16 h-16 mx-auto text-brand-green"/>
                            <DialogTitle className="mt-4 text-2xl">Check Your Inbox!</DialogTitle>
                            <DialogDescription className="mt-2">A verification link has been sent to {formData.email}. Please click it to confirm your account and secure your claim for 72 hours.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6 sm:justify-center gap-2">
                           <DialogClose asChild>
                             <Button type="button" variant="custom" className="w-full bg-brand-green text-black">
                               Got it!
                             </Button>
                           </DialogClose>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

const contributionSchema = z.object({
  amount: z.number().min(100, "Contribution must be at least ₦100."),
  displayName: z.string().optional(),
});


const WishlistPage = () => {
  const { username, slug } = useParams();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState(null);
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const wishlistUrl = `${window.location.origin}/${username}/${slug}`;
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchWishlistData = useCallback(async () => {
    // No full page loader on re-fetch
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, user:users!inner(full_name, username, email, is_active), goals(*, contributions(*))')
      .eq('slug', slug)
      .eq('user.username', username)
      .single();

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Wishlist not found' });
      setLoading(false);
      return;
    }
    
    setWishlist(data);
    setGoals(data.goals || []);

    // Add timestamp to force fresh data and avoid caching issues
    const { data: itemsData, error: itemsError } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          claims (
            id,
            supporter_user_id,
            supporter_contact,
            status,
            created_at,
            supporter_user:users!supporter_user_id (
              username,
              full_name
            )
          )
        `)
        .eq('wishlist_id', data.id)
        .order('created_at', { ascending: false });

    if (itemsError) {
        toast({ variant: 'destructive', title: 'Error fetching items'});
    } else {
        setItems(itemsData);
    }

    setLoading(false);
  }, [slug, username, toast]);

  const celebrate = useMemo(() => {
    const allItemsClaimed = items.length > 0 && items.every(item => (item.qty_claimed || 0) >= item.qty_total);
    const anyGoalReached = goals.length > 0 && goals.some(goal => (goal.amount_raised || 0) >= goal.target_amount);
    return allItemsClaimed || anyGoalReached;
  }, [items, goals]);

  // Pagination logic
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of items section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (celebrate) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 6000); // Confetti for 6 seconds
        return () => clearTimeout(timer);
    }
  }, [celebrate]);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);
  

  useEffect(() => {
    setLoading(true);
    fetchWishlistData();
  }, [fetchWishlistData]);

  // Track views when wishlist is loaded
  useEffect(() => {
    const trackView = async () => {
      if (!wishlist?.id) return;
      
      // Check if this view has already been tracked in this session
      const sessionKey = `viewed_wishlist_${wishlist.id}`;
      const hasViewed = sessionStorage.getItem(sessionKey);
      
      if (hasViewed) return; // Don't count multiple views in same session
      
      try {
        // Increment views_count
        const { error } = await supabase
          .from('wishlists')
          .update({ 
            views_count: (wishlist.views_count || 0) + 1 
          })
          .eq('id', wishlist.id);
        
        if (!error) {
          // Mark as viewed in this session
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (error) {
        console.error('Error tracking view:', error);
        // Silently fail - view tracking shouldn't disrupt user experience
      }
    };
    
    trackView();
  }, [wishlist?.id, wishlist?.views_count]);

  // Set up real-time subscription for wishlist items
  useEffect(() => {
    if (!wishlist?.id) return;

    const subscription = supabase
      .channel(`wishlist-${wishlist.id}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'wishlist_items',
          filter: `wishlist_id=eq.${wishlist.id}`
        }, 
        (payload) => {
          // Refresh the items data when changes occur
          fetchWishlistData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [wishlist?.id, fetchWishlistData]);

  // Set up real-time subscription for claims (when items are available)
  useEffect(() => {
    if (!wishlist?.id || items.length === 0) return;

    const subscription = supabase
      .channel(`claims-${wishlist.id}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'claims',
          filter: `wishlist_item_id=in.(${items.map(item => item.id).join(',')})`
        }, 
        (payload) => {
          // Refresh the items data when claims change
          fetchWishlistData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [wishlist?.id, items, fetchWishlistData]);

  const generateQrCode = async () => {
    if (qrCodeUrl) return;
    try {
        const url = await QRCode.toDataURL(wishlistUrl, { width: 160, margin: 2 });
        setQrCodeUrl(url);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Could not generate QR code' });
    }
  };

  const copyLink = async () => {
    navigator.clipboard.writeText(wishlistUrl);
    toast({ title: 'Link copied to clipboard!' });
    
    // Track copy as a share
    if (wishlist?.id) {
      try {
        await supabase
          .from('wishlists')
          .update({ 
            shares_count: (wishlist.shares_count || 0) + 1 
          })
          .eq('id', wishlist.id);
      } catch (error) {
        console.error('Error tracking share:', error);
      }
    }
  };

  const refreshData = async () => {
    // Force a complete refresh by clearing state first
    setItems([]);
    setWishlist(null);
    await fetchWishlistData();
  };
  
  const handleShare = async () => {
    // Track share
    const trackShare = async () => {
      if (!wishlist?.id) return;
      
      try {
        await supabase
          .from('wishlists')
          .update({ 
            shares_count: (wishlist.shares_count || 0) + 1 
          })
          .eq('id', wishlist.id);
      } catch (error) {
        console.error('Error tracking share:', error);
      }
    };
    
    // Implement share functionality with refresh
    if (navigator.share) {
      try {
        await navigator.share({
          title: wishlist.title,
          text: `Check out ${wishlist.title} wishlist!`,
          url: wishlistUrl,
        });
        // Track successful share
        await trackShare();
        // Refresh data after sharing to ensure it's up to date
        await refreshData();
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Fallback to copy link if sharing fails
          copyLink();
          await refreshData();
        }
      }
    } else {
      // Fallback to copy link for browsers that don't support Web Share API
      copyLink();
      await refreshData();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" /></div>;
  }
  
  if (!wishlist) {
      return (
          <div className="flex flex-col justify-center items-center min-h-[80vh] text-center px-4">
              <Gift className="w-20 h-20 text-brand-purple-dark mx-auto mb-4"/>
              <h1 className="text-3xl font-bold text-brand-purple-dark">Wishlist Not Found</h1>
              <p className="text-gray-600 mt-2">The wishlist you are looking for does not exist or has been moved.</p>
              <Link to="/"><Button variant="custom" className="mt-6 bg-brand-orange text-black">Go Home</Button></Link>
          </div>
      )
  }

  // Check if user account is deactivated
  if (wishlist.user && wishlist.user.is_active === false) {
      return (
          <div className="flex flex-col justify-center items-center min-h-screen text-center px-4 py-12">
              <PauseCircle className="w-32 h-32 md:w-40 md:h-40 text-amber-600 mx-auto mb-8"/>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-purple-dark mb-6">
                  Wishlist Temporarily Unavailable
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mt-6 max-w-2xl leading-relaxed">
                  <strong className="text-brand-purple-dark">{wishlist.user.full_name}'s</strong> wishlist is currently paused and temporarily unavailable. All wishlists will be back online once they reactivate their account. Please check back later!
              </p>
              <div className="mt-10 space-y-4">
                  <Link to="/explore">
                      <Button variant="custom" className="bg-brand-purple-dark text-white text-lg px-8 py-6 h-auto border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">
                          Browse Other Wishlists
                      </Button>
                  </Link>
                  <div>
                      <Link to="/">
                          <Button variant="custom" className="bg-brand-green text-black text-base px-6 py-4 h-auto border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">
                              Go Home
                          </Button>
                      </Link>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <>
      <Helmet>
        <title>{`${wishlist.title}`} - HeySpender</title>
        <meta name="description" content={wishlist.story || `Check out ${wishlist.user.full_name}'s wishlist for their ${wishlist.occasion}!`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={wishlistUrl} />
        <meta property="og:title" content={`${wishlist.title}`} />
        <meta property="og:description" content={wishlist.story || `Check out ${wishlist.user.full_name}'s wishlist for their ${wishlist.occasion}!`} />
        {wishlist.cover_image_url && <meta property="og:image" content={wishlist.cover_image_url} />}

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={wishlistUrl} />
        <meta property="twitter:title" content={`${wishlist.title}`} />
        <meta property="twitter:description" content={wishlist.story || `Check out ${wishlist.user.full_name}'s wishlist for their ${wishlist.occasion}!`} />
        {wishlist.cover_image_url && <meta property="twitter:image" content={wishlist.cover_image_url} />}
      </Helmet>
      
      <Confetti active={showConfetti} />

      <div>
        <header className="relative h-[500px] bg-brand-purple-dark flex items-center justify-center text-center p-4 pt-28 overflow-hidden">
          {wishlist.cover_image_url && (
            <img alt={wishlist.title} className="absolute top-0 left-0 w-full h-full object-cover opacity-20" src={wishlist.cover_image_url} />
          )}
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{wishlist.title}</h1>
            <p className="text-lg text-white/90 drop-shadow-md">A wishlist by <Link to={`/${wishlist.user.username}`} className="font-bold hover:underline">{wishlist.user.full_name}</Link> for their {wishlist.occasion}</p>
            {wishlist.wishlist_date && <Countdown date={wishlist.wishlist_date} />}
          </div>
        </header>

        {celebrate && (
          <div className="relative -mt-8 z-40 px-4">
            <div className="flex justify-center">
              <div className="bg-brand-green text-black font-bold py-3 px-4 md:px-8 rounded-lg shadow-lg border-2 border-black max-w-[calc(100vw-2rem)] text-center">
                🎉 GOAL REACHED! Thank you for your generosity! 🎉
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto py-8 px-4">
            {/* Share buttons - on top of description */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <Button variant="custom" className="bg-white text-black h-10 px-3" onClick={copyLink}><Copy className="w-4 h-4 mr-2"/>Copy Link</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="custom" className="bg-white text-black h-10 w-10 p-0" onClick={generateQrCode}>
                      <QrCodeIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4">
                    {qrCodeUrl ? <img alt="QR Code" src={qrCodeUrl} /> : <Loader2 className="w-10 h-10 animate-spin"/>}
                  </PopoverContent>
                </Popover>
                <Button variant="custom" className="bg-white text-black h-10 w-10 p-0" onClick={handleShare} title="Share wishlist">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {wishlist.story && (
                 <section className="mb-16 text-center max-w-3xl mx-auto">
                    <p className="text-lg text-gray-700">{wishlist.story}</p>
                </section>
            )}

            {goals.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-brand-purple-dark mb-6">Cash Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {goals.map((goal, index) => <GoalCard key={goal.id} goal={goal} index={index} recipientEmail={wishlist.user.email} onContributed={fetchWishlistData} />)}
                    </div>
                </section>
            )}

            <section className="mb-12">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-brand-purple-dark">Wishlist Items</h2>
                </div>
                
                {items.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {currentItems.map(item => <ItemCard key={item.id} item={item} onClaimed={fetchWishlistData} />)}
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center space-x-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Previous</span>
                                </Button>
                                
                                <div className="flex space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "custom" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className={`w-10 h-10 ${
                                                currentPage === page 
                                                    ? "bg-brand-purple-dark text-white" 
                                                    : "hover:bg-gray-100"
                                            }`}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center space-x-1"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        
                        <div className="text-center mt-6 text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, items.length)} of {items.length} items
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                        <Info className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-xl font-semibold">No items yet</h3>
                        <p className="mt-2 text-sm text-gray-500">The creator hasn't added any items to this wishlist.</p>
                    </div>
                )}
            </section>
        </main>
      </div>
    </>
  );
};

const ImagePreviewModal = ({ item, trigger }) => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-4xl p-2 bg-transparent border-0" showCloseButton={false}>
                 <div className="relative">
                    <img alt={item.name} src={item.image_url} className="w-full h-auto object-contain max-h-[80vh]"/>
                 </div>
                 <DialogClose className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-brand-purple-dark">
                    <X className="h-6 w-6 stroke-2" />
                 </DialogClose>
            </DialogContent>
        </Dialog>
    )
}

const DescriptionModal = ({ item, trigger }) => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl bg-brand-purple-dark border-2 border-black" fullscreenOnMobile={false}>
                <DialogHeader>
                    <DialogTitle className="text-brand-beige text-xl font-bold">{item.name}</DialogTitle>
                    <DialogDescription className="text-white/80">Full description</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-white leading-relaxed text-base">{item.description}</p>
                </div>
                <DialogFooter className="flex justify-between space-x-2">
                    {item.product_url && (
                        <a href={item.product_url.startsWith('http') ? item.product_url : `https://${item.product_url}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="custom" className="bg-brand-green text-black hover:bg-brand-green/90 font-semibold border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">
                                <ExternalLink className="w-4 h-4 mr-2"/>View Product Link
                            </Button>
                        </a>
                    )}
                    <DialogClose asChild>
                        <Button variant="custom" className="bg-brand-beige text-brand-purple-dark hover:bg-brand-beige/90 font-semibold border-2 border-black shadow-[-4px_4px_0px_#000] hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ItemCard = ({ item, onClaimed }) => {
    const isFullyClaimed = (item.qty_claimed || 0) >= item.qty_total;
    const { toast } = useToast();
    const notImplemented = () => toast({title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"});
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Get the most recent claim with a username for fully claimed items
    const getSpenderUsername = () => {
        if (!isFullyClaimed || !item.claims || item.claims.length === 0) return null;
        
        // Find the most recent confirmed claim with a username
        const confirmedClaims = item.claims.filter(claim => 
            claim.status === 'confirmed' && claim.supporter_user?.username
        );
        
        if (confirmedClaims.length > 0) {
            // Sort by created_at descending to get the most recent
            confirmedClaims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return confirmedClaims[0].supporter_user.username;
        }
        
        return null;
    };

    const spenderUsername = getSpenderUsername();

    // Function to truncate description to approximately 2 lines
    const truncateDescription = (text, maxLength = 120) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-black flex flex-col bg-white h-full">
        <div className="relative aspect-square bg-gray-100 h-[250px]">
             <ImagePreviewModal item={item} trigger={
                <button className="w-full h-full">
                    {item.image_url ? 
                        <img alt={item.name} src={item.image_url} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12"/></div>
                    }
                </button>
            } />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
                <h3 className="text-lg font-bold">{item.name}</h3>
                {item.description && (
                    <div className="text-sm text-gray-600 mt-1">
                        {item.description.length > 120 ? (
                            <div>
                                <span>{truncateDescription(item.description)}</span>
                                <DescriptionModal item={item} trigger={
                                    <button className="text-brand-purple-dark hover:underline font-semibold ml-1">
                                        Read more
                                    </button>
                                } />
                            </div>
                        ) : (
                            <span>{item.description}</span>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-auto space-y-4 pt-4">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-brand-purple-dark">
                        {item.unit_price_estimate ? `₦${Number(item.unit_price_estimate).toLocaleString()}` : 'Price TBD'}
                    </span>
                    <span className={`text-sm ${isFullyClaimed ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                        {item.qty_claimed || 0}/{item.qty_total} claimed
                    </span>
                </div>
                
                <ClaimItemModal 
                    item={item} 
                    onClaimed={onClaimed}
                    trigger={(buttonText, onClick) => (
                         <Button variant="custom" className="bg-brand-green text-black disabled:bg-gray-300 w-full" disabled={isFullyClaimed} onClick={onClick}>
                            {isFullyClaimed ? 
                                (spenderUsername ? <><strong>@{spenderUsername}</strong>&nbsp;Paid For This!</> : 'Fully Claimed') 
                                : buttonText
                            }
                        </Button>
                    )}
                />
            </div>
        </div>
    </motion.div>
)};

const GoalCard = ({ goal, index, recipientEmail, onContributed }) => {
    const progress = goal.target_amount > 0 ? ((goal.amount_raised || 0) / goal.target_amount) * 100 : 0;
    const successfulContributions = goal.contributions?.filter(c => c.status === 'success') || [];
    const buttonColors = ["bg-brand-orange", "bg-brand-green", "bg-brand-purple-light"];
    const buttonColor = buttonColors[index % buttonColors.length];
    const textColor = buttonColor === 'bg-brand-purple-light' ? 'text-black' : 'text-black';

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-black p-6 space-y-4 bg-white">
            <h3 className="text-2xl font-bold text-brand-purple-dark">{goal.title}</h3>
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">Raised: ₦{Number(goal.amount_raised || 0).toLocaleString()}</span>
                    <span className="font-semibold">Target: ₦{Number(goal.target_amount).toLocaleString()}</span>
                </div>
                <div className="relative h-4 w-full overflow-hidden border-2 border-black bg-gray-200">
                    <div className={`h-full transition-all ${getProgressColor(progress)}`} style={{width: `${progress}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.1) 10px, rgba(0, 0, 0, 0.1) 20px)'}}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span>{progress}% Complete</span>
                    <span className="font-semibold">{getProgressColor(progress).replace('bg-', '').replace('brand-', '').replace('-', ' ')}</span>
                </div>
            </div>

            <ContributeModal goal={goal} recipientEmail={recipientEmail} onContributed={onContributed} trigger={<Button variant="custom" className={`w-full ${buttonColor} ${textColor}`}>Contribute to this Goal</Button>} />

            {successfulContributions.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Recent Spenders:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {successfulContributions.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{c.is_anonymous ? 'Anonymous Spender' : c.display_name} contributed ₦{Number(c.amount).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

const ContributeModal = ({ goal, recipientEmail, onContributed, trigger }) => {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const [formData, setFormData] = useState({ amount: '', displayName: '', isAnonymous: false });
    const [errors, setErrors] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Auto-fill display name when modal opens and user is logged in
    useEffect(() => {
        if (open && user && !formData.isAnonymous) {
            setFormData(prev => ({ ...prev, displayName: user.user_metadata?.full_name || '' }));
        }
    }, [open, user, formData.isAnonymous]);

    // Format number with commas
    const formatNumber = (value) => {
        // Remove any non-numeric characters except decimal point
        const numericValue = value.replace(/[^\d.]/g, '');
        // Split by decimal point to handle both integer and decimal parts
        const parts = numericValue.split('.');
        // Add commas to the integer part
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Handle amount input change
    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const formattedValue = formatNumber(rawValue);
        setFormData({...formData, amount: formattedValue});
    };

    const handleContribution = async (e) => {
        e.preventDefault();
        setErrors(null);
        
        // Remove commas from amount for parsing
        const cleanAmount = formData.amount.replace(/,/g, '');
        const parsedAmount = parseFloat(cleanAmount);
        const validationResult = contributionSchema.safeParse({
            amount: isNaN(parsedAmount) ? undefined : parsedAmount,
            displayName: formData.displayName,
        });

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            return;
        }

        // Check if user is logged in
        if (!user?.email) {
            toast({
                variant: 'destructive',
                title: 'Login required',
                description: 'Please log in to make a contribution'
            });
            return;
        }

        setIsProcessingPayment(true);

        try {
            // Generate a unique reference for this payment
            const paymentRef = `contribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log('Starting contribution payment process for amount:', parsedAmount);

            // Initialize Paystack payment
            const paystackResponse = await initializePaystackPayment({
                email: user.email,
                amount: parsedAmount * 100, // Paystack expects amount in kobo
                currency: 'NGN',
                reference: paymentRef,
                metadata: {
                    goal_title: goal.title,
                    goal_id: goal.id,
                    recipient_email: recipientEmail,
                    display_name: formData.displayName || user.user_metadata?.full_name || 'Anonymous',
                    is_anonymous: formData.isAnonymous,
                    sender_id: user.id,
                    type: 'goal_contribution'
                },
                callback: (response) => {
                    // Handle successful payment
                    handlePaymentSuccess(response, paymentRef, parsedAmount);
                },
                onClose: () => {
                    // Handle payment cancellation
                    handlePaymentCancellation(paymentRef);
                }
            });

            if (paystackResponse.error) {
                throw new Error(paystackResponse.error.message);
            }

        } catch (error) {
            console.error('Payment initialization error:', error);
            
            // Check if it's a hosted payment case (not a real error)
            if (error.message && error.message.includes('hosted payment page')) {
                // This is expected for development, don't show error
                console.log('Using hosted payment page as expected');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Payment failed',
                    description: getUserFriendlyError(error, 'initializing payment')
                });
            }
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Initialize Paystack payment (adapted from SpenderListCard)
    const initializePaystackPayment = async (paymentData) => {
        return new Promise((resolve) => {
            console.log('Initializing Paystack payment with data:', paymentData);
            
            // Check if Paystack public key is available
            const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) {
                console.error('Paystack public key not found in environment variables');
                resolve({ error: { message: 'Paystack configuration missing. Please check your environment variables.' } });
                return;
            }

            console.log('Paystack public key found:', publicKey.substring(0, 20) + '...');

            // For development/localhost, use hosted payment page due to CORS issues
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Development environment detected, using hosted payment page...');
                useHostedPaymentPage(paymentData);
                resolve({ error: { message: 'Using hosted payment page for development' } });
                return;
            }

            // Try to load Paystack script for production
            const loadPaystackScript = () => {
                return new Promise((scriptResolve, scriptReject) => {
                    if (window.PaystackPop) {
                        console.log('Paystack script already loaded');
                        scriptResolve();
                        return;
                    }

                    console.log('Loading Paystack script...');
                    const script = document.createElement('script');
                    script.src = 'https://js.paystack.co/v1/inline.js';
                    
                    // Add timeout to prevent infinite loading
                    const timeout = setTimeout(() => {
                        scriptReject(new Error('Paystack script loading timeout'));
                    }, 10000);

                    script.onload = () => {
                        clearTimeout(timeout);
                        console.log('Paystack script loaded successfully');
                        scriptResolve();
                    };
                    
                    script.onerror = (error) => {
                        clearTimeout(timeout);
                        console.error('Failed to load Paystack script:', error);
                        scriptReject(new Error('Failed to load Paystack script'));
                    };
                    
                    document.head.appendChild(script);
                });
            };

            // Load script and initialize payment
            loadPaystackScript()
                .then(() => {
                    initPayment();
                })
                .catch((error) => {
                    console.error('Script loading failed:', error);
                    console.log('Falling back to hosted payment page...');
                    useHostedPaymentPage(paymentData);
                    resolve({ error: { message: 'Using hosted payment page due to script loading error' } });
                });

            function initPayment() {
                try {
                    console.log('Setting up Paystack payment...');
                    
                    // Add a small delay to ensure script is fully loaded
                    setTimeout(() => {
                        try {
                            const handler = window.PaystackPop.setup({
                                key: publicKey,
                                email: paymentData.email,
                                amount: paymentData.amount,
                                currency: paymentData.currency,
                                ref: paymentData.reference,
                                metadata: paymentData.metadata,
                                callback: (response) => {
                                    console.log('Paystack callback received:', response);
                                    paymentData.callback(response);
                                },
                                onClose: () => {
                                    console.log('Paystack modal closed');
                                    paymentData.onClose();
                                }
                            });

                            console.log('Opening Paystack iframe...');
                            handler.openIframe();
                            resolve({ success: true });
                        } catch (error) {
                            console.error('Error in Paystack setup:', error);
                            console.log('Falling back to hosted payment page...');
                            useHostedPaymentPage(paymentData);
                            resolve({ error: { message: 'Using hosted payment page due to inline setup error' } });
                        }
                    }, 500);
                    
                } catch (error) {
                    console.error('Error setting up Paystack payment:', error);
                    console.log('Falling back to hosted payment page...');
                    useHostedPaymentPage(paymentData);
                    resolve({ error: { message: 'Using hosted payment page due to setup error' } });
                }
            }
        });
    };

    // Use hosted payment page (works around CORS issues)
    const useHostedPaymentPage = (paymentData) => {
        try {
            console.log('Using hosted payment page...');
            
            // Show payment instructions for development
            showPaymentInstructions(paymentData);
            
        } catch (error) {
            console.error('Hosted payment page failed:', error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: getUserFriendlyError(error, 'processing payment')
            });
        }
    };

    // Show payment instructions for development
    const showPaymentInstructions = (paymentData) => {
        const amount = (paymentData.amount / 100).toLocaleString();
        const reference = paymentData.reference;
        const email = paymentData.email;
        const goalTitle = paymentData.metadata?.goal_title || 'Unknown goal';
        
        // Show detailed payment instructions
        toast({
            title: 'Payment Instructions',
            description: `Amount: ₦${amount} | Reference: ${reference.substring(0, 20)}...`,
            duration: 15000
        });
        
        // Log detailed instructions
        console.log('=== CONTRIBUTION PAYMENT INSTRUCTIONS ===');
        console.log(`Goal: ${goalTitle}`);
        console.log(`Amount: ₦${amount}`);
        console.log(`Reference: ${reference}`);
        console.log(`Email: ${email}`);
        console.log('=========================================');
        
        // Show a modal with payment details
        showPaymentModal(paymentData);
    };

    // Show payment modal with instructions
    const showPaymentModal = (paymentData) => {
        const amount = (paymentData.amount / 100).toLocaleString();
        
        // Create a simple modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        content.innerHTML = `
            <h3 style="margin: 0 0 1rem 0; color: #333;">Contribution Payment Instructions</h3>
            <p style="margin: 0 0 1rem 0; color: #666;">
                Due to development environment restrictions, please use the following details to complete payment:
            </p>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <p style="margin: 0.5rem 0;"><strong>Goal:</strong> ${paymentData.metadata?.goal_title || 'Unknown'}</p>
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> ₦${amount}</p>
                <p style="margin: 0.5rem 0;"><strong>Reference:</strong> ${paymentData.reference}</p>
                <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${paymentData.email}</p>
                <p style="margin: 0.5rem 0;"><strong>Display Name:</strong> ${paymentData.metadata?.display_name || 'Anonymous'}</p>
            </div>
            <p style="margin: 1rem 0; color: #666; font-size: 0.9rem;">
                You can manually process this payment through your Paystack dashboard or contact support.
            </p>
            <button onclick="this.closest('.modal').remove()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
            ">Close</button>
        `;
        
        modal.className = 'modal';
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Auto-close after 30 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    };

    // Handle successful payment
    const handlePaymentSuccess = async (response, paymentRef, amount) => {
        try {
            console.log('Processing successful contribution payment...');
            
            // Create contribution record
            const { data: contribution, error: contributionError } = await supabase
                .from('contributions')
                .insert({
                    goal_id: goal.id,
                    display_name: formData.isAnonymous ? null : (formData.displayName || user.user_metadata?.full_name),
                    is_anonymous: formData.isAnonymous,
                    amount: amount,
                    currency: 'NGN',
                    payment_provider: 'paystack',
                    payment_ref: paymentRef,
                    status: 'success'
                })
                .select()
                .single();

            if (contributionError) {
                throw contributionError;
            }

            // Update goal amount_raised
            const { error: goalUpdateError } = await supabase
                .from('goals')
                .update({
                    amount_raised: (goal.amount_raised || 0) + amount
                })
                .eq('id', goal.id);

            if (goalUpdateError) {
                throw goalUpdateError;
            }

            toast({
                title: 'Contribution successful!',
                description: `₦${amount.toLocaleString()} contributed to "${goal.title}"`
            });

            // Close modal and refresh data
            setOpen(false);
            onContributed();

        } catch (error) {
            console.error('Payment success handling error:', error);
            toast({
                variant: 'destructive',
                title: 'Payment processing error',
                description: 'Your payment was successful, but we encountered an issue recording it. Please contact support with your payment reference.'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Handle payment cancellation
    const handlePaymentCancellation = async (paymentRef) => {
        console.log('Payment cancelled by user');
        toast({
            title: 'Payment cancelled',
            description: 'Payment was cancelled. You can try again anytime.'
        });
        setIsProcessingPayment(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent fullscreenOnMobile={false}>
                <DialogHeader>
                    <DialogTitle>Contribute to "{goal.title}"</DialogTitle>
                    <DialogDescription>Your contribution will help reach the goal. Secure payment powered by Paystack.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleContribution} className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (₦)</Label>
                        <Input id="amount" type="text" placeholder="e.g., 5,000" value={formData.amount} onChange={handleAmountChange}/>
                         <FormErrors errors={errors?.amount} />
                    </div>
                    <div>
                        <Label htmlFor="displayName">Display Name (Optional)</Label>
                        <Input id="displayName" placeholder="e.g., John Doe" disabled={formData.isAnonymous} value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is_anonymous" checked={formData.isAnonymous} onCheckedChange={checked => {
                            const newIsAnonymous = checked;
                            const newDisplayName = newIsAnonymous ? '' : (user?.user_metadata?.full_name || '');
                            setFormData({...formData, isAnonymous: newIsAnonymous, displayName: newDisplayName});
                        }}/>
                        <Label htmlFor="is_anonymous">Contribute Anonymously</Label>
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button" disabled={isProcessingPayment}>Cancel</Button></DialogClose>
                        <Button type="submit" variant="custom" className="bg-brand-green text-black" disabled={isProcessingPayment}>
                            {isProcessingPayment ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Pay with Paystack'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export default WishlistPage;