import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Clock, Loader2, Image as ImageIcon, Copy, QrCode as QrCodeIcon, Share2, Info, Mail, Phone, Eye, EyeOff, CheckCircle, X, ExternalLink, DollarSign } from 'lucide-react';
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
        <div className="flex items-center space-x-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{timeLeft}</span>
        </div>
    );
};

const LoggedInClaimDialog = ({ open, onOpenChange, onConfirm, loading, item }) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Your Claim</AlertDialogTitle>
                <AlertDialogDescription>You are about to claim "{item.name}". This will reserve the item for you. Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Yes, Claim It!'}
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
        const { error } = await supabase.rpc('claim_item_for_existing_user', {
            p_item_id: item.id,
            p_user_id: user.id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to claim item', description: error.message });
        } else {
            toast({ title: 'Item Claimed!', description: 'You can now see this item in your spender list.' });
            onClaimed();
            setOpen(false);
            navigate('/dashboard', { state: { defaultTab: 'claims' } });
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

        const { data, error } = await supabase.rpc('claim_item_transaction', {
            item_id: item.id,
            user_email: email,
            user_username: username,
            user_password: password,
        });

        if (error || (data && !data.success)) {
            const errorMessage = (data && data.message) || error?.message || 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Failed to claim item', description: errorMessage });
            
            if (errorMessage.includes("already exists")) {
                setOpen(false);
                navigate('/login');
            }
        } else {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`
                }
            });

            if (resendError) {
                 toast({ variant: 'destructive', title: 'Could not send verification email', description: resendError.message });
            } else {
                 setEmailSent(true);
                 onClaimed();
            }
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
            <DialogContent className={emailSent ? 'sm:max-w-md' : ''}>
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

  const fetchWishlistData = useCallback(async () => {
    // No full page loader on re-fetch
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, user:users!inner(full_name, username, email), goals(*, contributions(*))')
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

    const { data: itemsData, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', data.id);

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

  useEffect(() => {
    if (celebrate) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 6000); // Confetti for 6 seconds
        return () => clearTimeout(timer);
    }
  }, [celebrate]);
  

  useEffect(() => {
    setLoading(true);
    fetchWishlistData();
  }, [fetchWishlistData]);

  const generateQrCode = async () => {
    if (qrCodeUrl) return;
    try {
        const url = await QRCode.toDataURL(wishlistUrl, { width: 160, margin: 2 });
        setQrCodeUrl(url);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Could not generate QR code' });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(wishlistUrl);
    toast({ title: 'Link copied to clipboard!' });
  };
  
  const notImplemented = () => toast({title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"});

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
          {celebrate && (
            <div className="absolute top-0 left-0 w-full bg-brand-green text-black font-bold py-2 text-center z-20">
              🎉 GOAL REACHED! Thank you for your generosity! 🎉
            </div>
          )}
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{wishlist.title}</h1>
            <p className="text-lg text-white/90 drop-shadow-md">A wishlist by <Link to={`/${wishlist.user.username}`} className="font-bold hover:underline">{wishlist.user.full_name}</Link> for their {wishlist.occasion}</p>
            {wishlist.wishlist_date && <Countdown date={wishlist.wishlist_date} />}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {wishlist.story && (
                 <section className="mb-12 text-center max-w-3xl mx-auto">
                    <p className="text-lg text-gray-700">{wishlist.story}</p>
                </section>
            )}

            {goals.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-brand-purple-dark mb-6">Cash Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {goals.map((goal, index) => <GoalCard key={goal.id} goal={goal} index={index} recipientEmail={wishlist.user.email} onContributed={fetchWishlistData} />)}
                    </div>
                </section>
            )}

            <section className="mb-12">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-brand-purple-dark">Wishlist Items</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="custom" className="bg-white text-black" size="sm" onClick={copyLink}><Copy className="w-4 h-4 mr-2"/>Copy Link</Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="custom" className="bg-white text-black" size="icon" onClick={generateQrCode}>
                                    <QrCodeIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4">
                                {qrCodeUrl ? <img alt="QR Code" src={qrCodeUrl} /> : <Loader2 className="w-10 h-10 animate-spin"/>}
                            </PopoverContent>
                        </Popover>
                        <Button variant="custom" className="bg-white text-black" size="icon" onClick={notImplemented}><Share2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map(item => <ItemCard key={item.id} item={item} onClaimed={fetchWishlistData} />)}
                    </div>
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
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                        <h3 className="text-2xl font-bold">{item.name}</h3>
                        <p className="mt-2 text-base">{item.description}</p>
                        {item.product_url && (
                            <a href={item.product_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="custom" className="mt-4 bg-white text-black">
                                    <ExternalLink className="w-4 h-4 mr-2"/>View Product Link
                                </Button>
                            </a>
                        )}
                    </div>
                 </div>
                 <DialogClose className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-black">
                    <X className="h-6 w-6" />
                 </DialogClose>
            </DialogContent>
        </Dialog>
    )
}

const ItemCard = ({ item, onClaimed }) => {
    const isFullyClaimed = (item.qty_claimed || 0) >= item.qty_total;
    const { toast } = useToast();
    const notImplemented = () => toast({title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"});
    const [showFullDescription, setShowFullDescription] = useState(false);

    return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-black flex flex-col">
        <div className="relative aspect-square bg-gray-100">
             <ImagePreviewModal item={item} trigger={
                <button className="w-full h-full">
                    {item.image_url ? 
                        <img alt={item.name} src={item.image_url} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12"/></div>
                    }
                </button>
            } />
        </div>
        <div className="p-4 flex flex-col flex-grow space-y-4">
            <div>
                <h3 className="text-lg font-bold flex-grow">{item.name}</h3>
                {item.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                    </p>
                )}
                <ImagePreviewModal item={item} trigger={
                    <button className="text-sm text-brand-purple-dark hover:underline font-semibold">
                        Read more
                    </button>
                } />
            </div>
            
            <div className="flex justify-between items-center mt-auto pt-4">
                <span className="font-bold text-lg text-brand-purple-dark">
                    {item.unit_price_estimate ? `~₦${Number(item.unit_price_estimate).toLocaleString()}` : 'Price TBD'}
                </span>
                <span className={`text-sm ${isFullyClaimed ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                    {item.qty_claimed || 0}/{item.qty_total} claimed
                </span>
            </div>
            
            <div className="flex flex-col gap-2">
                <Button variant="custom" className="bg-brand-orange text-black disabled:bg-gray-300 w-full" disabled={isFullyClaimed} onClick={notImplemented}>
                    <DollarSign className="w-4 h-4 mr-2"/> Send Money
                </Button>
                <ClaimItemModal 
                    item={item} 
                    onClaimed={onClaimed}
                    trigger={(buttonText, onClick) => (
                         <Button variant="custom" className="bg-brand-green text-black disabled:bg-gray-300 w-full" disabled={isFullyClaimed} onClick={onClick}>
                            {isFullyClaimed ? 'Fully Claimed' : 'Claim Item'}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-black p-6 space-y-4">
            <h3 className="text-2xl font-bold text-brand-purple-dark">{goal.title}</h3>
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">Raised: ₦{Number(goal.amount_raised || 0).toLocaleString()}</span>
                    <span className="font-semibold">Target: ₦{Number(goal.target_amount).toLocaleString()}</span>
                </div>
                <Progress value={progress} />
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
    const [formData, setFormData] = useState({ amount: '', displayName: '', isAnonymous: false });
    const [errors, setErrors] = useState(null);

    const notImplemented = (e) => {
        e.preventDefault();
        setErrors(null);
        const parsedAmount = parseFloat(formData.amount);
        const validationResult = contributionSchema.safeParse({
            amount: isNaN(parsedAmount) ? undefined : parsedAmount,
            displayName: formData.displayName,
        });

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            return;
        }

        toast({title: "🚧 Payment feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"});
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribute to "{goal.title}"</DialogTitle>
                    <DialogDescription>Your contribution will help reach the goal. Payment integration is coming soon!</DialogDescription>
                </DialogHeader>
                <form onSubmit={notImplemented} className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (₦)</Label>
                        <Input id="amount" type="number" placeholder="e.g., 5000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}/>
                         <FormErrors errors={errors?.amount} />
                    </div>
                    <div>
                        <Label htmlFor="displayName">Display Name (Optional)</Label>
                        <Input id="displayName" placeholder="e.g., John Doe" disabled={formData.isAnonymous} value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is_anonymous" checked={formData.isAnonymous} onCheckedChange={checked => setFormData({...formData, isAnonymous: checked, displayName: checked ? 'Anonymous Spender' : ''})}/>
                        <Label htmlFor="is_anonymous">Contribute Anonymously</Label>
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                        <Button type="submit" variant="custom" className="bg-brand-green text-black">
                            Pay with Paystack
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export default WishlistPage;