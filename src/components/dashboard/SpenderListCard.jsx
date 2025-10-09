import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Wallet, 
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  X,
  Edit3,
  Gift,
  Eye
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format, formatDistanceToNow } from 'date-fns';

const SpenderListCard = ({ claim, onUpdateStatus, onUpdateClaim, onDelete, onViewWishlist }) => {
  const item = claim?.wishlist_items || {};
  const wishlist = item?.wishlists || {};
  const wishlistOwner = wishlist?.users || {};
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  
  // Form states
  const [reminderDate, setReminderDate] = useState();
  const [reminderTime, setReminderTime] = useState('');
  const [cashAmount, setCashAmount] = useState(item?.unit_price_estimate || '');
  const [notes, setNotes] = useState(claim?.note || '');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [savedReminderDateTime, setSavedReminderDateTime] = useState(null);
  const [reminderCountdown, setReminderCountdown] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Load saved reminder from localStorage
  React.useEffect(() => {
    const savedReminder = localStorage.getItem(`reminder_${claim?.id}`);
    if (savedReminder) {
      setSavedReminderDateTime(new Date(savedReminder));
    }
  }, [claim?.id]);

  // Update countdown every minute
  React.useEffect(() => {
    if (!savedReminderDateTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = savedReminderDateTime - now;

      if (diff <= 0) {
        setReminderCountdown('Now!');
        localStorage.removeItem(`reminder_${claim?.id}`);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setReminderCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setReminderCountdown(`${hours}h ${minutes}m`);
      } else {
        setReminderCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [savedReminderDateTime, claim?.id]);

  // Status colors matching other cards
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800'
  };

  const handleSendCash = async () => {
    console.log('🔵 Send Cash clicked!', { cashAmount, user });
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please log in to send cash'
      });
      return;
    }

    if (!cashAmount || cashAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid amount to send'
      });
      return;
    }

    console.log('🔵 Starting payment process...');
    setIsProcessingPayment(true);
    
    try {
      const paymentRef = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔵 Payment reference generated:', paymentRef);
      
      const result = await initializePaystackPayment({
        email: user.email,
        amount: parseFloat(cashAmount) * 100,
        currency: 'NGN',
        reference: paymentRef,
        metadata: {
          item_name: item.name,
          recipient: wishlistOwner.username,
          recipient_id: wishlistOwner.id,
          sender_id: user.id,
          item_id: item.id,
          claim_id: claim.id,
          type: 'cash_payment'
        },
        callback: (response) => handlePaymentSuccess(response, paymentRef),
        onClose: () => setIsProcessingPayment(false)
      });
      
      console.log('🔵 Payment initialization result:', result);
      if (result?.error) {
        console.error('🔴 Payment initialization error details:', result.error);
      }
    } catch (error) {
      console.error('🔴 Payment error:', error);
      if (!error.message?.includes('hosted payment page') && !error.message?.includes('test mode')) {
        toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const initializePaystackPayment = async (paymentData) => {
    return new Promise((resolve) => {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      console.log('🔧 Paystack public key check:', publicKey ? 'Present' : 'Missing');
      console.log('🔧 Current hostname:', window.location.hostname);
      
      if (!publicKey) {
        console.error('🔴 Paystack public key missing from environment');
        toast({ 
          variant: 'destructive', 
          title: 'Payment configuration missing', 
          description: 'Please contact support to enable payments.' 
        });
        resolve({ error: { message: 'Paystack configuration missing' } });
        return;
      }
      
      // Localhost testing mode - show test instructions
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const amount = (paymentData.amount / 100).toLocaleString();
        toast({ 
          title: 'Test Payment Mode', 
          description: `Amount: ₦${amount} - This would process in production.`, 
          duration: 10000 
        });
        resolve({ error: { message: 'Using test mode on localhost' } });
        return;
      }

      // Production - Load Paystack script dynamically
      const loadPaystackScript = () => {
        return new Promise((scriptResolve, scriptReject) => {
          if (window.PaystackPop) {
            scriptResolve();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          
          const timeout = setTimeout(() => {
            scriptReject(new Error('Paystack script loading timeout'));
          }, 10000);

          script.onload = () => {
            clearTimeout(timeout);
            scriptResolve();
          };
          
          script.onerror = (error) => {
            clearTimeout(timeout);
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
          toast({ 
            variant: 'destructive', 
            title: 'Payment system unavailable', 
            description: 'Unable to load payment processor. Please try again.' 
          });
          resolve({ error: { message: 'Failed to load payment system' } });
        });

      function initPayment() {
        try {
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
                  paymentData.callback(response);
                  resolve({ success: true });
                },
                onClose: () => {
                  paymentData.onClose();
                  resolve({ error: { message: 'Payment cancelled' } });
                }
              });

              handler.openIframe();
            } catch (error) {
              console.error('Error in Paystack setup:', error);
              toast({ 
                variant: 'destructive', 
                title: 'Payment error', 
                description: 'Unable to open payment window. Please try again.' 
              });
              resolve({ error: { message: 'Payment setup error' } });
            }
          }, 100);
        } catch (error) {
          console.error('Payment initialization error:', error);
          toast({ 
            variant: 'destructive', 
            title: 'Payment error', 
            description: error.message 
          });
          resolve({ error: { message: error.message } });
        }
      }
    });
  };

  const handlePaymentSuccess = async (response, paymentRef) => {
    try {
      console.log('🎉 Payment successful, processing...', { response, paymentRef });
      
      // First, credit the recipient's wallet
      await creditRecipientWallet(wishlistOwner.id, parseFloat(cashAmount), paymentRef);
      console.log('✅ Wallet credited successfully');
      
      // Calculate new total paid amount
      const currentAmountPaid = claim?.amount_paid || 0;
      const newAmountPaid = currentAmountPaid + parseFloat(cashAmount);
      const estimatedPrice = item?.unit_price_estimate || 0;
      
      console.log('💰 Payment amounts:', { 
        currentAmountPaid, 
        newPayment: parseFloat(cashAmount), 
        newAmountPaid, 
        estimatedPrice 
      });
      
      // Determine if the claim should be marked as fulfilled
      const shouldBeFulfilled = newAmountPaid >= estimatedPrice;
      const newStatus = shouldBeFulfilled ? 'fulfilled' : claim.status;
      
      console.log('🔧 Updating claim in database...', {
        claimId: claim.id,
        amount_paid: newAmountPaid,
        status: newStatus,
        shouldBeFulfilled
      });
      
      // Update the claim with the new amount paid and status in a single atomic operation
      if (onUpdateClaim) {
        await onUpdateClaim(claim.id, { 
          amount_paid: newAmountPaid,
          status: newStatus
        });
        console.log('✅ Claim updated in database - status persisted');
      }
      
      toast({
        title: 'Payment successful!',
        description: shouldBeFulfilled 
          ? `₦${Number(cashAmount).toLocaleString()} sent! Item marked as fulfilled.`
          : `₦${Number(cashAmount).toLocaleString()} sent! ₦${(estimatedPrice - newAmountPaid).toLocaleString()} remaining.`
      });
      setShowCashDialog(false);
    } catch (error) {
      console.error('🔴 Payment success processing error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Payment processing error',
        description: error.message || 'Failed to process payment completion'
      });
    }
  };

  const creditRecipientWallet = async (recipientId, amount, paymentRef) => {
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipientId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: recipientId, balance: amount, currency_default: 'NGN' })
        .select()
        .single();
      if (createError) throw createError;
      wallet = newWallet;
    } else if (walletError) {
      throw walletError;
    } else {
      await supabase
        .from('wallets')
        .update({ balance: (wallet.balance || 0) + amount })
        .eq('id', wallet.id);
    }

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'credit',
      source: 'cash_payment',
      amount: amount,
      description: `Cash payment for "${item.name}" - Ref: ${paymentRef}`
    });
  };

  const handleSetReminder = () => {
    if (!reminderDate || !reminderTime) {
      toast({ variant: 'destructive', title: 'Missing information', description: 'Please select both date and time' });
      return;
    }
    const reminderDateTime = new Date(`${format(reminderDate, 'yyyy-MM-dd')}T${reminderTime}`);
    if (reminderDateTime <= new Date()) {
      toast({ variant: 'destructive', title: 'Invalid date/time', description: 'Reminder must be in the future' });
      return;
    }
    
    // Save reminder to localStorage
    localStorage.setItem(`reminder_${claim.id}`, reminderDateTime.toISOString());
    setSavedReminderDateTime(reminderDateTime);
    
    toast({ title: 'Reminder set!', description: `You'll be reminded on ${format(reminderDate, 'PPP')} at ${reminderTime}` });
    setShowReminderDialog(false);
    setReminderDate(undefined);
    setReminderTime('');
  };

  const handleAddToCalendar = () => {
    const eventTitle = `Purchase: ${item.name}`;
    const eventDescription = `Don't forget to purchase "${item.name}" from ${wishlistOwner.username}'s wishlist.`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(eventDescription)}`;
    try {
      window.open(googleCalendarUrl, '_blank');
      toast({ title: 'Calendar event created' });
    } catch (error) {
      navigator.clipboard.writeText(googleCalendarUrl);
      toast({ title: 'Calendar link copied' });
    }
  };

  const handleSaveNotes = async () => {
    try {
      if (onUpdateClaim) {
        await onUpdateClaim(claim.id, { note: notes });
        toast({ title: 'Note saved' });
        setShowNotesDialog(false);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save note' });
    }
  };

  const isExpired = claim?.expire_at ? new Date(claim.expire_at) < new Date() : false;
  const daysUntilExpiry = claim?.expire_at 
    ? Math.ceil((new Date(claim.expire_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white border-2 border-black overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* 3-Dot Menu */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-brand-purple-dark hover:bg-brand-purple-dark/90">
                <MoreHorizontal className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/${wishlistOwner.username}/${wishlist.slug}`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />
                View Wishlist
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNotesDialog(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                {claim?.note ? 'Edit Note' : 'Add Note'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {claim?.status === 'pending' && (
                <DropdownMenuItem onClick={() => onUpdateStatus && onUpdateStatus(claim.id, 'confirmed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm
                </DropdownMenuItem>
              )}
              {claim?.status === 'confirmed' && (
                <DropdownMenuItem onClick={() => onUpdateStatus && onUpdateStatus(claim.id, 'fulfilled')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Fulfilled
                </DropdownMenuItem>
              )}
              {claim?.status === 'pending' && (
                <DropdownMenuItem onClick={() => onUpdateStatus && onUpdateStatus(claim.id, 'cancelled')}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-brand-accent-red"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <div className="mb-4">
          <Link to={`/${wishlistOwner.username}/${wishlist.slug}`}>
            <h3 className="font-semibold text-lg hover:text-brand-purple-dark transition-colors truncate">
              {item.name || 'Unnamed Item'}
            </h3>
          </Link>
        </div>

        {/* Price */}
        {item.unit_price_estimate && (
          <div className="mb-4">
            {(() => {
              const estimatedPrice = Number(item.unit_price_estimate);
              const amountPaid = claim?.amount_paid || 0;
              const remainingAmount = estimatedPrice - amountPaid;
              
              if (amountPaid > 0 && remainingAmount > 0) {
                // Partial payment made
                return (
                  <div className="text-[15px] text-gray-600">
                    Est. Price — <span className="font-black text-brand-purple-dark">₦{remainingAmount.toLocaleString()}</span>
                    <div className="text-xs text-green-600 mt-1">
                      ₦{amountPaid.toLocaleString()} already paid
                    </div>
                  </div>
                );
              } else if (remainingAmount <= 0) {
                // Fully paid
                return (
                  <div className="text-[15px] text-gray-600">
                    Est. Price — <span className="font-black text-green-600">₦{estimatedPrice.toLocaleString()} (Paid)</span>
                  </div>
                );
              } else {
                // No payment yet
                return (
                  <div className="text-[15px] text-gray-600">
                    Est. Price — <span className="font-black text-brand-purple-dark">₦{estimatedPrice.toLocaleString()}</span>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Note */}
        {claim?.note && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Note</div>
            <div className="text-sm text-gray-800 line-clamp-2">{claim.note}</div>
          </div>
        )}

        {/* Status Badge */}
        {claim?.status === 'fulfilled' && (
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Fulfilled
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                console.log('🟢 Send Cash button clicked - opening dialog');
                setShowCashDialog(true);
              }}
              className="flex-1 bg-brand-green text-black hover:bg-brand-green/90"
              size="sm"
              disabled={claim?.status === 'fulfilled'}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {claim?.status === 'fulfilled' ? 'Completed' : 'Send Cash'}
            </Button>
            {item.product_url && (
              <Button
                onClick={() => window.open(item.product_url, '_blank')}
                className="flex-1 bg-brand-orange text-black hover:bg-brand-orange/90"
                size="sm"
                disabled={claim?.status === 'fulfilled'}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {claim?.status === 'fulfilled' ? 'Completed' : 'Purchase'}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowReminderDialog(true)}
              variant={savedReminderDateTime ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${savedReminderDateTime ? 'bg-brand-purple-dark text-white hover:bg-brand-purple-dark/90' : ''}`}
              disabled={claim?.status === 'fulfilled'}
            >
              <Clock className="w-4 h-4 mr-2" />
              {claim?.status === 'fulfilled' ? 'Completed' : (savedReminderDateTime ? reminderCountdown : 'Reminder')}
            </Button>
            <Button
              onClick={handleAddToCalendar}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={claim?.status === 'fulfilled'}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {claim?.status === 'fulfilled' ? 'Completed' : 'Calendar'}
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 text-xs text-gray-500">
          {claim?.expire_at && !isExpired && daysUntilExpiry !== null && (
            <span>Expiring in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong> | </span>
          )}
          {isExpired && <span className="text-red-600">Expired | </span>}
          <span>For: <strong>@{wishlistOwner.username || 'Unknown'}</strong></span>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showCashDialog} onOpenChange={(open) => {
        console.log('🟡 Dialog state changed:', open);
        setShowCashDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Cash</DialogTitle>
            <DialogDescription>
              Send money to @{wishlistOwner.username} for "{item.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                value={cashAmount}
                onChange={(e) => {
                  console.log('💰 Amount changed:', e.target.value);
                  setCashAmount(e.target.value);
                }}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashDialog(false)}>Cancel</Button>
            <Button 
              onClick={(e) => {
                console.log('🟣 Send Cash button in dialog clicked');
                e.preventDefault();
                handleSendCash();
              }} 
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                'Send Cash'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{savedReminderDateTime ? 'Update Reminder' : 'Set Reminder'}</DialogTitle>
            <DialogDescription>
              {savedReminderDateTime 
                ? `Current reminder: ${format(savedReminderDateTime, 'PPP')} at ${format(savedReminderDateTime, 'HH:mm')}`
                : `Get reminded to purchase "${item.name}"`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {reminderDate ? format(reminderDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      if (date < today) return true;
                      if (claim?.expire_at) {
                        const expiryDate = new Date(claim.expire_at);
                        if (date > expiryDate) return true;
                      }
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time</Label>
              <Input 
                type="time" 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                min={
                  reminderDate && 
                  new Date(reminderDate).toDateString() === new Date().toDateString()
                    ? new Date().toTimeString().slice(0, 5)
                    : undefined
                }
                max={
                  reminderDate && claim?.expire_at &&
                  new Date(reminderDate).toDateString() === new Date(claim.expire_at).toDateString()
                    ? new Date(claim.expire_at).toTimeString().slice(0, 5)
                    : undefined
                }
              />
              {reminderDate && new Date(reminderDate).toDateString() === new Date().toDateString() && (
                <p className="text-xs text-gray-500 mt-1">Must be after current time</p>
              )}
              {reminderDate && claim?.expire_at && new Date(reminderDate).toDateString() === new Date(claim.expire_at).toDateString() && (
                <p className="text-xs text-gray-500 mt-1">Must be before expiry time</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full items-center">
              {savedReminderDateTime && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    localStorage.removeItem(`reminder_${claim.id}`);
                    setSavedReminderDateTime(null);
                    setReminderCountdown('');
                    setShowReminderDialog(false);
                    toast({ title: 'Reminder cleared' });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear Reminder
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowReminderDialog(false)}>Cancel</Button>
                <Button onClick={handleSetReminder}>{savedReminderDateTime ? 'Update' : 'Set'} Reminder</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{claim?.note ? 'Edit Note' : 'Add Note'}</DialogTitle>
            <DialogDescription>Keep track of additional information</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Color preference, size, delivery instructions..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Spender List?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete && onDelete(claim.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SpenderListCard;
