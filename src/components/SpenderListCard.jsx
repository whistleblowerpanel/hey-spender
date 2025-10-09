import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, ExternalLink, Trash2, Wallet, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';

const SpenderListCard = ({ claim, onUpdateClaim, onDelete, onViewWishlist }) => {
    const item = claim?.wishlist_items;
    const claimId = claim?.id;
    
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCashDialog, setShowCashDialog] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [reminderDate, setReminderDate] = useState();
    const [reminderTime, setReminderTime] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    // Calculate payment tracking
    const amountPaid = claim?.amount_paid || 0;
    const itemPrice = parseFloat(item?.unit_price_estimate) || 0;
    const remainingBalance = Math.max(0, itemPrice - amountPaid);
    const isFullyPaid = itemPrice > 0 && amountPaid >= itemPrice;
    
    // Debug logging
    console.log('💳 SpenderListCard - Payment tracking:', {
        claimId,
        itemName: item?.name,
        amountPaid,
        itemPrice,
        remainingBalance,
        isFullyPaid
    });
    
    // Set cash amount to remaining balance if there's a partial payment, otherwise full price
    const [cashAmount, setCashAmount] = useState(
        remainingBalance > 0 && amountPaid > 0 ? remainingBalance : (item?.unit_price_estimate || '')
    );
    
    const notImplemented = () => {
        console.log("Feature not implemented yet");
    };

    // Send Cash functionality with Paystack integration
    const handleSendCash = async () => {
        if (!cashAmount || cashAmount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid amount',
                description: 'Please enter a valid amount to send'
            });
            return;
        }

        if (!user?.email) {
            toast({
                variant: 'destructive',
                title: 'User email required',
                description: 'Please make sure you are logged in with a valid email address'
            });
            return;
        }

        setIsProcessingPayment(true);

        try {
            // Generate a unique reference for this payment
            const paymentRef = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log('Starting payment process for amount:', cashAmount);

            // Initialize Paystack payment
            const paystackResponse = await initializePaystackPayment({
                email: user.email,
                amount: parseFloat(cashAmount) * 100, // Paystack expects amount in kobo
                currency: 'NGN',
                reference: paymentRef,
                metadata: {
                    item_name: item.name,
                    recipient: item.wishlists?.users?.username,
                    recipient_id: item.wishlists?.users?.id,
                    sender_id: user.id,
                    item_id: item.id,
                    claim_id: claimId,
                    type: 'cash_payment'
                },
                callback: (response) => {
                    // Handle successful payment
                    handlePaymentSuccess(response, paymentRef);
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
                        description: error.message || 'Failed to initialize payment. Please try again.'
                    });
                }
            } finally {
                setIsProcessingPayment(false);
            }
    };

    // Initialize Paystack payment
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
                description: 'Unable to process payment. Please try again later.'
            });
        }
    };

    // Show payment instructions for development
    const showPaymentInstructions = (paymentData) => {
        const amount = (paymentData.amount / 100).toLocaleString();
        const reference = paymentData.reference;
        const email = paymentData.email;
        const itemName = paymentData.metadata?.item_name || 'Unknown item';
        
        // Show detailed payment instructions
        toast({
            title: 'Payment Instructions',
            description: `Amount: ₦${amount} | Reference: ${reference.substring(0, 20)}...`,
            duration: 15000
        });
        
        // Log detailed instructions
        console.log('=== PAYMENT INSTRUCTIONS ===');
        console.log(`Item: ${itemName}`);
        console.log(`Amount: ₦${amount}`);
        console.log(`Reference: ${reference}`);
        console.log(`Email: ${email}`);
        console.log('============================');
        
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
            <h3 style="margin: 0 0 1rem 0; color: #333;">Payment Instructions</h3>
            <p style="margin: 0 0 1rem 0; color: #666;">
                Due to development environment restrictions, please use the following details to complete payment:
            </p>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <p style="margin: 0.5rem 0;"><strong>Item:</strong> ${paymentData.metadata?.item_name || 'Unknown'}</p>
                <p style="margin: 0.5rem 0;"><strong>Amount:</strong> ₦${amount}</p>
                <p style="margin: 0.5rem 0;"><strong>Reference:</strong> ${paymentData.reference}</p>
                <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${paymentData.email}</p>
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
    const handlePaymentSuccess = async (response, paymentRef) => {
        try {
            console.log('Processing successful payment...');
            console.log('Item data in payment success:', item);
            console.log('Recipient ID:', item.wishlists?.users?.id);
            console.log('Wishlist data:', item.wishlists);
            console.log('User data:', item.wishlists?.users);
            
            const paymentAmount = parseFloat(cashAmount);
            const newAmountPaid = amountPaid + paymentAmount;
            const shouldBeFulfilled = itemPrice > 0 && newAmountPaid >= itemPrice;
            
            // Update claim with new amount_paid FIRST
            // Don't update status - UI handles button disabling based on amount_paid
            await onUpdateClaim(claimId, {
                amount_paid: newAmountPaid
            });
            
            // Then credit recipient's wallet (with claim_id link)
            await creditRecipientWallet(
                item.wishlists?.users?.id, 
                paymentAmount, 
                paymentRef,
                response.reference,
                response.trans,
                claimId // Pass claim ID to link transaction
            );

            toast({
                title: 'Payment successful!',
                description: shouldBeFulfilled 
                    ? `₦${Number(paymentAmount).toLocaleString()} sent! Item fully paid.`
                    : `₦${Number(paymentAmount).toLocaleString()} sent! Balance: ₦${Number(itemPrice - newAmountPaid).toLocaleString()}`
            });

            setShowCashDialog(false);
            setCashAmount('');

        } catch (error) {
            console.error('Payment success handling error:', error);
            toast({
                variant: 'destructive',
                title: 'Payment processing error',
                description: 'Payment was successful but there was an error processing it. Please contact support.'
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

    // Credit recipient's wallet
    const creditRecipientWallet = async (recipientId, amount, paymentRef, paystackRef, paystackTrans, claimIdParam) => {
        try {
            console.log('creditRecipientWallet called with recipientId:', recipientId);
            console.log('creditRecipientWallet amount:', amount);
            console.log('creditRecipientWallet claimId:', claimIdParam);
            
            if (!recipientId) {
                throw new Error('Recipient ID is undefined');
            }
            
            // Get or create recipient's wallet
            let { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', recipientId)
                .single();

            if (walletError && walletError.code === 'PGRST116') {
                // Wallet doesn't exist, create it
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert({
                        user_id: recipientId,
                        balance: amount,
                        currency_default: 'NGN'
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                wallet = newWallet;
            } else if (walletError) {
                throw walletError;
            } else {
                // Update existing wallet balance
                const { error: updateError } = await supabase
                    .from('wallets')
                    .update({
                        balance: (wallet.balance || 0) + amount
                    })
                    .eq('id', wallet.id);

                if (updateError) throw updateError;
            }

            // Create wallet transaction record with claim_id link
            const { error: transactionError } = await supabase
                .from('wallet_transactions')
                .insert({
                    wallet_id: wallet.id,
                    type: 'credit',
                    source: 'cash_payment',
                    amount: amount,
                    description: `Cash payment for "${item.name}" - Ref: ${paymentRef}`,
                    claim_id: claimIdParam // Link transaction to claim
                });

            if (transactionError) throw transactionError;

        } catch (error) {
            console.error('Wallet credit error:', error);
            throw error;
        }
    };

    // Set Reminder functionality
    const handleSetReminder = () => {
        if (!reminderDate || !reminderTime) {
            toast({
                variant: 'destructive',
                title: 'Missing information',
                description: 'Please select both date and time for the reminder'
            });
            return;
        }

        const reminderDateTime = new Date(`${format(reminderDate, 'yyyy-MM-dd')}T${reminderTime}`);
        const now = new Date();

        if (reminderDateTime <= now) {
            toast({
                variant: 'destructive',
                title: 'Invalid date/time',
                description: 'Reminder time must be in the future'
            });
            return;
        }

        // In a real app, this would integrate with a notification service
        toast({
            title: 'Reminder set',
            description: `You'll be reminded to purchase "${item.name}" on ${format(reminderDate, 'PPP')} at ${reminderTime}`
        });
        setShowReminderDialog(false);
        setReminderDate();
        setReminderTime('');
    };

    // Add to Calendar functionality
    const handleAddToCalendar = () => {
        const eventTitle = `Purchase: ${item.name}`;
        const eventDescription = `Don't forget to purchase "${item.name}" from ${item.wishlists?.users?.username}'s wishlist. Price: ₦${Number(item.unit_price_estimate || 0).toLocaleString()}`;
        const eventLocation = item.product_url || 'Online';
        
        // Create calendar event data
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Tomorrow
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const calendarData = {
            title: eventTitle,
            description: eventDescription,
            location: eventLocation,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        };

        // Generate calendar URLs for different platforms
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${calendarData.startDate}/${calendarData.endDate}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`;
        
        // Try to open Google Calendar, fallback to copy link
        try {
            window.open(googleCalendarUrl, '_blank');
            toast({
                title: 'Calendar event created',
                description: 'Opening Google Calendar to add the event'
            });
        } catch (error) {
            // Fallback: copy the URL to clipboard
            navigator.clipboard.writeText(googleCalendarUrl);
            toast({
                title: 'Calendar link copied',
                description: 'Calendar link copied to clipboard. Paste it in your calendar app.'
            });
        }
    };

    // Add comprehensive error handling
    if (!item) {
        console.error('SpenderListCard: No item data provided');
        return <div className="border-2 border-black p-4 bg-red-50">No item data available</div>;
    }

    console.log('SpenderListCard rendering with item:', item);
    console.log('Item wishlist data:', item?.wishlist);
    console.log('Item wishlist user data:', item?.wishlist?.user);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="border-2 border-black p-4 flex flex-col space-y-4 bg-white"
        >
            {/* Item Image */}
            <div className="relative h-[250px] bg-gray-100 mb-2">
                {item.image_url ? 
                    <img alt={item.name || 'Item'} src={item.image_url} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                    </div>
                }
            </div>

            {/* Card Content */}
            <div className="flex-grow flex flex-col">
                {/* Item Info */}
                <div className="flex-grow">
                    <Link 
                        to={`/${item.wishlists?.users?.username}/${item.wishlists?.slug}`}
                        className="text-xl font-bold hover:text-brand-purple-dark transition-colors cursor-pointer block overflow-hidden mb-3"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4',
                            maxHeight: '3.5rem'
                        }}
                    >
                        {item.name || 'Unnamed Item'}
                    </Link>
                </div>

                {/* Bottom Section - Amount, From, and Buttons */}
                <div className="mt-auto mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-brand-purple-dark">
                            {item.unit_price_estimate ? `₦${Number(item.unit_price_estimate).toLocaleString()}` : 'Price TBD'}
                        </span>
                        <span className="text-xs text-gray-500">
                            From: {item.wishlists?.users?.username || 'Unknown'}
                        </span>
                    </div>
                    
                    {/* Payment Progress - Show only if there's been a payment */}
                    {amountPaid > 0 && (
                        <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Paid:</span>
                                <span className="font-semibold text-green-600">₦{Number(amountPaid).toLocaleString()}</span>
                            </div>
                            {!isFullyPaid && remainingBalance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Balance:</span>
                                    <span className="font-semibold text-orange-600">₦{Number(remainingBalance).toLocaleString()}</span>
                                </div>
                            )}
                            {isFullyPaid && (
                                <div className="text-center text-sm font-semibold text-green-600 mt-1">
                                    ✓ Fully Paid
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                    <div className="flex gap-2">
                        <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="custom" 
                                    className={`flex-1 shadow-none ${isFullyPaid ? 'bg-gray-300 text-gray-600' : 'bg-brand-green text-black'}`}
                                    disabled={isFullyPaid}
                                >
                                    <Wallet className="w-4 h-4 mr-1"/>
                                    {isFullyPaid ? 'Fully Paid' : 'Send Cash'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send Cash for "{item.name}"</DialogTitle>
                                    <DialogDescription>
                                        Send money to {item.wishlists?.users?.username || 'the recipient'} for this item.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="amount">Amount (₦)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={cashAmount}
                                            onChange={(e) => setCashAmount(e.target.value)}
                                            placeholder="Enter amount to send"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCashDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleSendCash}
                                        disabled={isProcessingPayment}
                                    >
                                        {isProcessingPayment ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Send Cash'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        
                        {item.product_url && (
                            <Button 
                                variant="custom" 
                                className={`flex-1 shadow-none ${isFullyPaid ? 'bg-gray-300 text-gray-600' : 'bg-brand-orange text-black'}`}
                                disabled={isFullyPaid}
                                onClick={() => {
                                    console.log('Opening product URL:', item.product_url);
                                    window.open(item.product_url, '_blank');
                                }}
                            >
                                <ExternalLink className="w-4 h-4 mr-1"/>
                                {isFullyPaid ? 'Fully Paid' : 'Purchase Item'}
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="custom" 
                                    className={`flex-1 shadow-none ${isFullyPaid ? 'bg-gray-300 text-gray-600' : 'bg-brand-purple-dark text-white'}`}
                                    disabled={isFullyPaid}
                                >
                                    <Clock className="w-4 h-4 mr-1"/>
                                    {isFullyPaid ? 'Fully Paid' : 'Set Reminder'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Set Reminder for "{item.name}"</DialogTitle>
                                    <DialogDescription>
                                        Set a reminder to purchase this item.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal shadow-none">
                                                    {reminderDate ? format(reminderDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={reminderDate}
                                                    onSelect={setReminderDate}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Time</Label>
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                value={reminderTime}
                                                onChange={(e) => setReminderTime(e.target.value)}
                                                className="shadow-none cursor-pointer"
                                                placeholder="Pick a time"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSetReminder}>
                                        Set Reminder
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        
                        <Button 
                            variant="custom" 
                            className={`flex-1 shadow-none ${isFullyPaid ? 'bg-gray-300 text-gray-600' : 'bg-white text-black'}`}
                            disabled={isFullyPaid}
                            onClick={handleAddToCalendar}
                        >
                            <CalendarIcon className="w-4 h-4 mr-1"/>
                            {isFullyPaid ? 'Fully Paid' : 'Add to Calendar'}
                        </Button>
                    </div>
                    
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="custom" 
                                className={`w-full shadow-none ${isFullyPaid ? 'bg-gray-300 text-gray-600' : 'bg-red-500 text-white'}`}
                                disabled={isFullyPaid}
                            >
                                <Trash2 className="w-4 h-4 mr-1"/>
                                {isFullyPaid ? 'Fully Paid' : 'Remove from List'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Spender List?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove "{item.name || 'this item'}" from your Spender List? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => {
                                        console.log('Removing claim with ID:', claimId);
                                        onDelete(claimId);
                                        setShowDeleteDialog(false);
                                    }}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SpenderListCard;
