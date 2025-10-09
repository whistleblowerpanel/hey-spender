import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const AuthConfirmPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const handleAuthConfirm = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                toast({ variant: 'destructive', title: 'Authentication failed.', description: 'Could not retrieve session. Please try logging in.' });
                navigate('/login');
                return;
            }

            if (session?.user?.email) {
                const { data: claim, error } = await supabase
                    .from('claims')
                    .select('*, wishlist_item:wishlist_items!inner(*)')
                    .eq('supporter_contact', session.user.email)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (claim && !error) {
                    const { error: updateError } = await supabase
                        .from('claims')
                        .update({ status: 'confirmed', supporter_user_id: session.user.id })
                        .eq('id', claim.id);
                    
                    if (updateError) {
                        toast({ variant: 'destructive', title: 'Failed to confirm claim.', description: updateError.message });
                        const isAdmin = session.user.user_metadata?.role === 'admin';
                        navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
                        return;
                    }
                    
                    const newQtyClaimed = (claim.wishlist_item.qty_claimed || 0) + 1;
                    
                    const { error: itemUpdateError } = await supabase
                        .from('wishlist_items')
                        .update({ qty_claimed: newQtyClaimed })
                        .eq('id', claim.wishlist_item_id);

                    if (itemUpdateError) {
                        toast({ variant: 'destructive', title: 'Failed to update item quantity.' });
                    } else {
                        toast({ title: 'Item Claimed!', description: `You have successfully claimed "${claim.wishlist_item.name}".` });
                    }
                    
                    // Redirect to spender list page after claiming an item
                    const isAdmin = session.user.user_metadata?.role === 'admin';
                    navigate(isAdmin ? '/admin/dashboard' : '/dashboard/spender-list');

                } else {
                    // New user without claim - show them wishlists page with Get Started button
                    toast({ title: 'Account Confirmed!', description: 'Your account is now active.' });
                    const isAdmin = session.user.user_metadata?.role === 'admin';
                    navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
                }

            } else {
                toast({ variant: 'destructive', title: 'Verification Error', description: 'Could not verify user. Please try again.' });
                navigate('/register');
            }
        };

        const timer = setTimeout(() => {
            handleAuthConfirm();
        }, 2000); 

        return () => clearTimeout(timer);
    }, [navigate, toast]);

    return (
        <div className="flex flex-col justify-center items-center min-h-[80vh] text-center px-4">
            <Loader2 className="w-16 h-16 animate-spin text-brand-purple-dark" />
            <h1 className="text-2xl font-bold text-brand-purple-dark mt-6">Confirming your account...</h1>
            <p className="text-gray-600 mt-2">Please wait while we verify your details. You will be redirected shortly.</p>
        </div>
    );
};

export default AuthConfirmPage;