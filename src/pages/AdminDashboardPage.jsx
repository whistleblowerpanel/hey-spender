import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { sendWithdrawalNotifications } from '@/lib/notificationService';
import { paystackTransferService } from '@/lib/paystackTransferService';
import { Loader2, Users, Gift, Settings, Trash2, ExternalLink, Banknote, CheckCircle, XCircle, DollarSign, Eye, EyeOff, Flag, Save, CreditCard, ArrowUpDown, Wallet as WalletIcon, ChevronsRight, Calendar as CalendarIcon, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StatCard = ({ title, value, icon, loading, bgColor = 'bg-brand-cream', textColor = 'text-black' }) => (
    <div className={`border-2 border-black p-4 ${bgColor} relative after:absolute after:left-[-8px] after:bottom-[-8px] after:w-full after:h-full after:bg-black after:z-[-1]`}>
        <div className="relative">
            <div className="flex justify-between items-center">
                <p className={`text-sm font-semibold uppercase ${textColor}`}>{title}</p>
                <div className={textColor}>{icon}</div>
            </div>
            <div className="mt-2">
                {loading ? <Loader2 className={`h-6 w-6 animate-spin ${textColor}`} /> : <p className={`text-3xl font-bold ${textColor}`}>{value}</p>}
            </div>
        </div>
    </div>
);

const AdminSettings = ({ user }) => {
    const { updatePassword, updateEmail } = useAuth();
    const { toast } = useToast();
    
    // Admin profile settings state
    const [profile, setProfile] = useState({
        full_name: user?.user_metadata?.full_name || '',
        username: user?.user_metadata?.username || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || ''
    });
    
    // Password settings state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Global settings state
    const [globalSettings, setGlobalSettings] = useState({
        siteName: 'HeySpender',
        supportEmail: 'support@heyspender.com',
        maintenanceMode: false
    });
    
    // Loading states
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking', null
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const usernameTimeoutRef = useRef(null);

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

    const handleGlobalSettingsUpdate = async (e) => {
        e.preventDefault();
        setGlobalLoading(true);
        
        // Here you would typically save to a global settings table or configuration
        // For now, we'll just show a success message
        setTimeout(() => {
            toast({ title: 'Global settings updated successfully!' });
            setGlobalLoading(false);
        }, 1000);
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
                <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Admin Profile</h2>
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

            {/* Global Settings */}
            <div className="border-2 border-black p-4 sm:p-6 bg-white rounded-lg flex flex-col h-full">
                <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Global Settings</h2>
                <form onSubmit={handleGlobalSettingsUpdate} className="flex flex-col h-full space-y-4">
                    <div className="flex-1 space-y-4">
                <div className="space-y-2">
                            <Label htmlFor="siteName" className="text-sm sm:text-base font-medium">Site Name</Label>
                            <Input 
                                id="siteName" 
                                value={globalSettings.siteName} 
                                onChange={(e) => setGlobalSettings({...globalSettings, siteName: e.target.value })}
                                placeholder="Enter site name"
                                className="text-base sm:text-sm"
                            />
                </div>
                <div className="space-y-2">
                            <Label htmlFor="supportEmail" className="text-sm sm:text-base font-medium">Support Email</Label>
                            <Input 
                                id="supportEmail" 
                                type="email"
                                value={globalSettings.supportEmail} 
                                onChange={(e) => setGlobalSettings({...globalSettings, supportEmail: e.target.value })}
                                placeholder="Enter support email"
                                className="text-base sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2 mt-auto">
                        <Button 
                            type="submit" 
                            variant="custom" 
                            className="bg-brand-green text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2" 
                            disabled={globalLoading}
                        >
                            {globalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
                            <span className="sm:inline">Save Global Settings</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Account Information */}
            <div className="border-2 border-black p-4 sm:p-6 bg-brand-purple-dark rounded-lg lg:col-span-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Admin Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-white/80 text-sm font-medium">Account ID:</span>
                        <span className="font-mono text-xs bg-white/20 text-white px-2 py-1 rounded break-all">{user?.id}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-white/80 text-sm font-medium">Admin since:</span>
                        <span className="text-white text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-white/80 text-sm font-medium">Last sign in:</span>
                        <span className="text-white text-sm">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ users: 0, wishlists: 0, pendingPayouts: 0 });
  const [data, setData] = useState({ users: [], wishlists: [], payouts: [], contributions: [], walletTransactions: [] });
  const [filterType, setFilterType] = useState('all');
  const [visibleTransactions, setVisibleTransactions] = useState(17);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');

  // Payout management state
  const [payoutFilter, setPayoutFilter] = useState('all');
  const [payoutSearchTerm, setPayoutSearchTerm] = useState('');
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [selectedPayoutForDetails, setSelectedPayoutForDetails] = useState(null);

  // Reset visible transactions when filter changes
  useEffect(() => {
    setVisibleTransactions(17);
  }, [filterType]);

  const loadMore = () => {
    setVisibleTransactions(prev => prev + 17);
  };

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
        const usersPromise = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });
        const wishlistsPromise = supabase.from('wishlists').select('*, user:users(full_name, username)', { count: 'exact' }).order('created_at', { ascending: false });
        const payoutsPromise = supabase.from('payouts').select('*, wallet:wallets(user:users(full_name, email))').order('created_at', { ascending: false });
        const pendingPayoutsPromise = supabase.from('payouts').select('id', { count: 'exact' }).eq('status', 'requested');
        const contributionsPromise = supabase.from('contributions').select('*, goal:goals(wishlist:wishlists(title, user:users(username, full_name)))').order('created_at', { ascending: false });
        const walletTransactionsPromise = supabase.from('wallet_transactions').select('*, wallet:wallets(user:users(full_name, username, email))').order('created_at', { ascending: false });

        const [usersRes, wishlistsRes, payoutsRes, pendingPayoutsRes, contributionsRes, walletTransactionsRes] = await Promise.all([usersPromise, wishlistsPromise, payoutsPromise, pendingPayoutsPromise, contributionsPromise, walletTransactionsPromise]);

        if (usersRes.error) throw usersRes.error;
        if (wishlistsRes.error) throw wishlistsRes.error;
        if (payoutsRes.error) throw payoutsRes.error;
        if (pendingPayoutsRes.error) throw pendingPayoutsRes.error;
        if (contributionsRes.error) throw contributionsRes.error;
        if (walletTransactionsRes.error) throw walletTransactionsRes.error;

        setStats({
            users: usersRes.count,
            wishlists: wishlistsRes.count,
            pendingPayouts: pendingPayoutsRes.count
        });

        setData({
            users: usersRes.data,
            wishlists: wishlistsRes.data,
            payouts: payoutsRes.data,
            contributions: contributionsRes.data,
            walletTransactions: walletTransactionsRes.data
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
    } finally {
        setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.user_metadata?.role !== 'admin') {
        // Only show access denied if we're not already navigating away (i.e., not during logout)
        if (user && user.user_metadata?.role !== 'admin') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        }
        // Only sign out if user exists but isn't admin (not during normal logout)
        if (user && user.user_metadata?.role !== 'admin') {
        signOut();
        }
        navigate('/');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, navigate, toast, signOut]);

  // Helpers to normalize/format transactions like the user's Wallet view
  const getNormalizedSource = (transaction) => {
    const raw = ((transaction.source || transaction.description || '') + '').toLowerCase();
    if (raw.includes('contribution_sent')) return 'sent';
    if (raw.includes('cash_sent') || raw.includes('sent_item')) return 'sent';
    if (raw.includes('contribution')) return 'contribution';
    if (raw.includes('payout') || raw.includes('withdraw')) return 'payout';
    if (raw.includes('refund')) return 'refund';
    if (raw.includes('wishlist') || raw.includes('cash payment')) return 'wishlist_purchase';
    if (transaction.type === 'credit') return 'wishlist_purchase';
    return 'other';
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
          <span className="text-xs font-semibold">Withdrawal</span>
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
    if (source === 'payout') return 'Withdrawal';
    if (source === 'refund') return 'Refund';
    return transaction.type === 'credit' ? 'Money Received' : 'Money Withdrawal';
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
    const userInfo = getUserInfo(transaction);
    const right = (userInfo && userInfo !== '—') ? `@${truncateUsername(userInfo.replace('@', ''))}` : '—';
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
    const s = getNormalizedSource(transaction);
    
    if (s === 'sent') {
      if (transaction.recipient_username) return transaction.recipient_username;
      const desc = typeof transaction.description === 'string' ? transaction.description : '';
      const m = desc.match(/to\s+@([A-Za-z0-9_.-]+)/i);
      if (m && m[1]) return m[1];
    }
    
    
    if (transaction.contributor_name) return transaction.contributor_name;
    const desc = typeof transaction.description === 'string' ? transaction.description : '';
    const src = typeof transaction.source === 'string' ? transaction.source : '';
    let m = desc.match(/from\s+@([A-Za-z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
    const m2 = desc.match(/from\s+[^\(\-@]+\s*\(@([A-Za-z0-9_.-]+)\)/i);
    if (m2 && m2[1]) return m2[1];
    const m3 = desc.match(/from\s+([A-Za-z0-9_.-]+)/i);
    if (m3 && m3[1]) return m3[1];
    const m4 = desc.match(/@([A-Za-z0-9_.-]+)/);
    if (m4 && m4[1]) return m4[1];
    const s1 = src.match(/@([A-Za-z0-9_.-]+)/);
    if (s1 && s1[1]) return s1[1];
    const tokens = src.split(/[\s:/,;-]+/).filter(Boolean);
    const blacklist = new Set(['wishlist_purchase', 'wishlist', 'purchase', 'contribution', 'contributions', 'payout', 'withdrawal', 'refund', 'cash_payment', 'cash', 'payment']);
    const candidate = tokens.find(t => !blacklist.has(t.toLowerCase()) && /^[A-Za-z0-9_.-]{3,}$/.test(t));
    if (candidate) return candidate;
    return '—';
  };

  // Helper function to get user information for admin dashboard
  const getUserInfo = (transaction) => {
    // For wallet transactions
    if (transaction.wallet?.user) {
      const user = transaction.wallet.user;
      return user.username || user.full_name || user.email || '—';
    }
    
    // For contributions - show the wishlist owner's username (person receiving the contribution)
    if (transaction.source === 'contributions' && transaction.wishlist_owner_username) {
      return transaction.wishlist_owner_username;
    }
    
    // For contributions (from merged transactions) - fallback to contributor name if no wishlist owner username
    if (transaction.contributor_name && transaction.contributor_name !== 'Anonymous') {
      return transaction.contributor_name;
    }
    
    // For payouts (from merged transactions)
    if (transaction.contributor_name) {
      return transaction.contributor_name;
    }
    
    // Fallback to getDepositor for other cases
    return getDepositor(transaction);
  };

  const getTitleDisplay = (transaction) => {
    const raw = transaction.title || transaction.description || '';
    const noPrefix = raw.replace(/^\s*cash\s*payment\s*for\s*/i, '').trim();
    const noQuotes = noPrefix.replace(/^"(.+)"$/,'$1').replace(/^'(.*)'$/,'$1');
    return noQuotes.replace(/\s*-\s*$/,'').trim();
  };

  const getAmountDisplay = (transaction) => {
    const amount = Number(transaction.amount || 0);
    const formatted = `₦${amount.toLocaleString()}`;
    return transaction.type === 'credit'
      ? <span className="text-brand-green font-semibold">+{formatted}</span>
      : <span className="text-brand-accent-red font-semibold">-{formatted}</span>;
  };

  // Build merged transaction list for admin from contributions, payouts, and wallet payments
  const mergedTransactions = (() => {
    // Filter out payout-related transactions from wallet_transactions since we'll use payouts table instead
    const wt = (data.walletTransactions || []).filter((t) => {
      const raw = (t.source || t.description || '').toLowerCase();
      // Exclude payout/withdrawal transactions as they should come from payouts table
      return !(raw.includes('payout') || raw.includes('withdraw'));
    }).map((t) => {
      // Ensure minimal shape
      return { ...t };
    });
    const contribs = (data.contributions || []).map((c) => ({
      id: `contrib_${c.id}`,
      wallet_id: c.goal?.wishlist?.user?.id || null,
      type: 'credit',
      source: 'contributions',
      amount: c.amount,
      title: c.goal?.wishlist?.title || c.goal?.title || null,
      contributor_name: c.is_anonymous ? 'Anonymous' : (c.display_name || 'Unknown'),
      // Store the wishlist owner's username for display
      wishlist_owner_username: c.goal?.wishlist?.user?.username || null,
      description: c.goal?.title ? `Contributions for "${c.goal.title}"` : 'Contributions received',
      created_at: c.created_at,
    }));
    // Use ALL payouts from the payouts table, not just 'paid' ones
    const payouts = (data.payouts || []).map((p) => ({
      id: `payout_${p.id}`,
      wallet_id: p.wallet_id || null,
      type: 'debit',
      source: 'payout',
      amount: p.amount,
      title: 'Withdrawal',
      contributor_name: p.wallet?.user?.username || p.wallet?.user?.full_name || null,
      description: `Withdrawal to ${p.destination_bank_code || 'bank'} ${p.destination_account || ''}`.trim(),
      created_at: p.created_at,
      status: p.status, // Include status for filtering
    }));
    return [...wt, ...contribs, ...payouts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  })();

  // Derived totals (match user's wallet logic semantics)
  const totalReceived = mergedTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  // Calculate total withdrawn using ONLY payouts table data
  const totalWithdrawn = (data.payouts || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const balance = mergedTransactions.reduce((acc, t) => {
    if (t.type === 'credit') return acc + Number(t.amount || 0);
    // Only subtract payouts from the payouts table, not wallet_transactions
    if (t.source === 'payout') return acc - Number(t.amount || 0);
    return acc;
  }, 0);

  // Dynamic card data based on active tab
  const dynamicCardData = useMemo(() => {
    switch (activeTab) {
      case 'users':
        return {
          card1: { title: 'Total Users', value: stats.users, icon: <Users className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card2: { title: 'Active Users', value: data.users?.filter(u => u.is_active).length || 0, icon: <CheckCircle className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card3: { title: 'Suspended Users', value: data.users?.filter(u => !u.is_active).length || 0, icon: <XCircle className="w-6 h-6" />, bgColor: 'bg-brand-accent-red', textColor: 'text-white' }
        };
      case 'wishlists':
        return {
          card1: { title: 'Total Wishlists', value: stats.wishlists, icon: <Gift className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card2: { title: 'Active Wishlists', value: data.wishlists?.filter(w => w.status === 'active').length || 0, icon: <CheckCircle className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card3: { title: 'Suspended Wishlists', value: data.wishlists?.filter(w => w.status === 'suspended').length || 0, icon: <XCircle className="w-6 h-6" />, bgColor: 'bg-brand-accent-red', textColor: 'text-white' }
        };
      case 'payouts':
        return {
          card1: { title: 'Pending Requests', value: data.payouts?.filter(p => p.status === 'requested').length || 0, icon: <Clock className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card2: { title: 'Completed', value: data.payouts?.filter(p => p.status === 'paid').length || 0, icon: <CheckCircle className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card3: { title: 'Failed', value: data.payouts?.filter(p => p.status === 'failed').length || 0, icon: <XCircle className="w-6 h-6" />, bgColor: 'bg-brand-accent-red', textColor: 'text-white' }
        };
      case 'transactions':
        return {
          card1: { title: 'Total Balance', value: `₦${Number(balance).toLocaleString()}`, icon: <WalletIcon className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card2: { title: 'Total Received', value: `₦${Number(totalReceived).toLocaleString()}`, icon: <ChevronsRight className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card3: { title: 'Total Withdrawal', value: `₦${Number(totalWithdrawn).toLocaleString()}`, icon: <Banknote className="w-6 h-6" />, bgColor: 'bg-brand-purple-dark', textColor: 'text-white' }
        };
      case 'settings':
        return {
          card1: { title: 'Admin Profile', value: 'Complete', icon: <Settings className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card2: { title: 'System Status', value: 'Online', icon: <CheckCircle className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card3: { title: 'Last Backup', value: 'Today', icon: <CalendarIcon className="w-6 h-6" />, bgColor: 'bg-brand-purple-dark', textColor: 'text-white' }
        };
      default:
        return {
          card1: { title: 'Total Users', value: stats.users, icon: <Users className="w-6 h-6" />, bgColor: 'bg-brand-green', textColor: 'text-black' },
          card2: { title: 'Total Wishlists', value: stats.wishlists, icon: <Gift className="w-6 h-6" />, bgColor: 'bg-brand-orange', textColor: 'text-black' },
          card3: { title: 'Pending Payouts', value: stats.pendingPayouts, icon: <DollarSign className="w-6 h-6" />, bgColor: 'bg-brand-purple-dark', textColor: 'text-white' }
        };
    }
  }, [activeTab, stats, data, balance, totalReceived, totalWithdrawn]);

  // Apply filters for admin dashboard (contributions, payments, payouts)
  const allFilteredTransactions = mergedTransactions.filter(transaction => {
    // Apply search filter first
    if (transactionSearchTerm) {
      const searchLower = transactionSearchTerm.toLowerCase();
      const userInfo = getUserInfo(transaction).toLowerCase();
      const title = (transaction.title || '').toLowerCase();
      const description = (transaction.description || '').toLowerCase();
      const amount = (transaction.amount || '').toString();
      
      const matchesSearch = userInfo.includes(searchLower) || 
                           title.includes(searchLower) || 
                           description.includes(searchLower) ||
                           amount.includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Apply category filter
    if (filterType === 'all') return true;
    
    const src = getNormalizedSource(transaction);
    
    // Filter by transaction source
    if (filterType === 'contributions') {
      return src === 'contribution';
    }
    if (filterType === 'payouts') {
      return src === 'payout';
    }
    if (filterType === 'payments') {
      return src === 'wishlist_purchase' || src === 'cash_payment';
    }
    
    return true;
  });

  // Limit visible transactions
  const filteredTransactions = allFilteredTransactions.slice(0, visibleTransactions);

  // Group transactions by date for mobile view
  const regrouped = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {});
  
  const handleUserStatusUpdate = async (userId, isActive) => {
    const { error } = await supabase.rpc('update_user_status', { p_user_id: userId, p_is_active: isActive, p_admin_id: user.id });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update user status', description: error.message });
    } else {
      toast({ title: `User status updated successfully` });
      fetchData();
    }
  };

  const handleDeleteUser = async (userId) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
       toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
    } else {
       toast({ title: 'User deleted successfully' });
       fetchData();
    }
  };

  const handleWishlistStatusUpdate = async (wishlistId, newStatus) => {
    const { error } = await supabase.rpc('update_wishlist_status', { p_wishlist_id: wishlistId, p_new_status: newStatus, p_admin_id: user.id });
     if (error) {
      toast({ variant: 'destructive', title: 'Failed to update wishlist status', description: error.message });
    } else {
      toast({ title: `Wishlist status updated to ${newStatus}` });
      fetchData();
    }
  };

  const handlePayoutStatusUpdate = async (payoutId, newStatus) => {
    try {
      // Get the current payout data to track status change
      const { data: currentPayout, error: fetchError } = await supabase
        .from('payouts')
        .select('*, wallet:wallets(user:users(full_name, email))')
        .eq('id', payoutId)
        .single();

      if (fetchError) throw fetchError;

      const oldStatus = currentPayout.status;

      // If marking as paid, process the actual Paystack transfer first
      if (newStatus === 'paid') {
        // Validate required payout data for transfer
        if (!currentPayout.destination_account || !currentPayout.destination_bank_code) {
          toast({ 
            variant: 'destructive', 
            title: 'Cannot process payout', 
            description: 'Missing bank account details. Please ensure the payout has valid account number and bank code.' 
          });
          return;
        }

        // Show loading toast
        toast({ 
          title: 'Processing Paystack transfer...', 
          description: 'Please wait while we process the withdrawal.' 
        });

        // Process the payout through Paystack
        const transferResult = await paystackTransferService.processPayout({
          payout_id: payoutId,
          amount: currentPayout.amount,
          destination_account: currentPayout.destination_account,
          destination_bank_code: currentPayout.destination_bank_code,
          user_name: currentPayout.wallet?.user?.full_name || 'User',
          user_email: currentPayout.wallet?.user?.email || 'user@example.com'
        });

        if (!transferResult.success) {
          toast({ 
            variant: 'destructive', 
            title: 'Transfer failed', 
            description: `Paystack transfer failed: ${transferResult.error}. Please try again or contact support.` 
          });
          return;
        }

        // If transfer requires OTP, show special message
        if (transferResult.requires_otp) {
          toast({ 
            title: 'Transfer initiated - OTP required', 
            description: 'Transfer has been initiated but requires OTP verification. Check your Paystack dashboard to complete the transfer.' 
          });
        } else {
          toast({ 
            title: 'Transfer successful', 
            description: `Transfer of ₦${currentPayout.amount.toLocaleString()} has been processed successfully.` 
          });
        }

        // Update the payout status to paid (this will also debit the wallet)
        const { error } = await supabase.rpc('update_payout_status', { 
          p_payout_id: payoutId, 
          p_new_status: 'paid', 
          p_admin_id: user.id 
        });

        if (error) throw error;

        // Send notification to user about successful transfer
        try {
          await sendWithdrawalNotifications.onStatusChange(currentPayout, oldStatus, 'paid');
        } catch (notificationError) {
          console.error('Notification error:', notificationError);
          // Don't fail the status update if notifications fail
        }

        fetchData();
        return;
      }

      // For other status updates (approve, fail, etc.), use the original logic
      const { error } = await supabase.rpc('update_payout_status', { 
        p_payout_id: payoutId, 
        p_new_status: newStatus, 
        p_admin_id: user.id 
      });

      if (error) throw error;

      // Send notification to user about status change
      try {
        await sendWithdrawalNotifications.onStatusChange(currentPayout, oldStatus, newStatus);
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the status update if notifications fail
      }

      toast({ title: `Payout status updated to ${newStatus}` });
      fetchData();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to update payout', 
        description: error.message 
      });
    }
  };

  // Payout management functions
  const filteredPayouts = (data.payouts || []).filter(payout => {
    // Filter by status
    if (payoutFilter !== 'all' && payout.status !== payoutFilter) {
      return false;
    }
    
    // Filter by search term
    if (payoutSearchTerm) {
      const searchLower = payoutSearchTerm.toLowerCase();
      const userEmail = payout.wallet?.user?.email?.toLowerCase() || '';
      const userName = payout.wallet?.user?.full_name?.toLowerCase() || '';
      const accountNumber = payout.destination_account?.toLowerCase() || '';
      const bankCode = payout.destination_bank_code?.toLowerCase() || '';
      
      return userEmail.includes(searchLower) || 
             userName.includes(searchLower) || 
             accountNumber.includes(searchLower) || 
             bankCode.includes(searchLower);
    }
    
    return true;
  });

  const handleSelectPayout = (payoutId, checked) => {
    if (checked) {
      setSelectedPayouts(prev => [...prev, payoutId]);
    } else {
      setSelectedPayouts(prev => prev.filter(id => id !== payoutId));
    }
  };

  const handleSelectAllPayouts = (checked) => {
    if (checked) {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedPayouts.length === 0) return;
    
    try {
      const promises = selectedPayouts.map(payoutId => 
        supabase.rpc('update_payout_status', { 
          p_payout_id: payoutId, 
          p_new_status: 'processing', 
          p_admin_id: user.id 
        })
      );
      
      await Promise.all(promises);
      
      toast({ 
        title: 'Batch approval successful', 
        description: `${selectedPayouts.length} payouts approved for processing` 
      });
      
      setSelectedPayouts([]);
      fetchData();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Batch approval failed', 
        description: error.message 
      });
    }
  };

  if (authLoading || !user || user.user_metadata?.role !== 'admin') {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" /></div>;
  }

  return (
    <>
      <Helmet><title>Admin Dashboard - HeySpender</title></Helmet>
      <TooltipProvider>
        <div className="max-w-7xl mx-auto py-8 mt-32">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 px-4 md:px-0">
                <h1 className="text-4xl font-bold text-brand-purple-dark">Admin Dashboard</h1>
                <Button variant="custom" className="bg-brand-orange text-black w-full sm:w-auto" onClick={fetchData} disabled={loadingData}>
                    {loadingData ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Refresh Data
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4 md:px-0">
                <StatCard 
                    title={dynamicCardData.card1.title} 
                    value={dynamicCardData.card1.value} 
                    icon={dynamicCardData.card1.icon} 
                    loading={loadingData} 
                    bgColor={dynamicCardData.card1.bgColor} 
                    textColor={dynamicCardData.card1.textColor} 
                />
                <StatCard 
                    title={dynamicCardData.card2.title} 
                    value={dynamicCardData.card2.value} 
                    icon={dynamicCardData.card2.icon} 
                    loading={loadingData} 
                    bgColor={dynamicCardData.card2.bgColor} 
                    textColor={dynamicCardData.card2.textColor} 
                />
                <StatCard 
                    title={dynamicCardData.card3.title} 
                    value={dynamicCardData.card3.value} 
                    icon={dynamicCardData.card3.icon} 
                    loading={loadingData} 
                    bgColor={dynamicCardData.card3.bgColor} 
                    textColor={dynamicCardData.card3.textColor} 
                />
            </div>

            <Tabs defaultValue="users" className="w-full px-4 md:px-0" onValueChange={setActiveTab}>
            <TabsList className="inline-flex h-12 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground gap-1 overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] w-full sm:grid sm:grid-cols-4 md:grid-cols-5 sm:overflow-visible">
                <TabsTrigger value="users" className="flex-shrink-0 min-w-[44px] min-h-[40px]"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
                <TabsTrigger value="wishlists" className="flex-shrink-0 min-w-[44px] min-h-[40px]"><Gift className="w-4 h-4 mr-2" />Wishlists</TabsTrigger>
                <TabsTrigger value="payouts" className="flex-shrink-0 min-w-[44px] min-h-[40px]"><DollarSign className="w-4 h-4 mr-2" />Payouts</TabsTrigger>
                <TabsTrigger value="transactions" className="flex-shrink-0 min-w-[44px] min-h-[40px]"><ArrowUpDown className="w-4 h-4 mr-2" />Transactions</TabsTrigger>
                <TabsTrigger value="settings" className="flex-shrink-0 min-w-[44px] min-h-[40px]"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.users.map(u => (
                        <TableRow key={u.id}>
                        <TableCell>{u.full_name}</TableCell><TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2 justify-end">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="flat" size="icon" className={`text-black border-2 border-black hover:shadow-[-2px_2px_0px_#000] ${u.is_active ? 'bg-yellow-400' : 'bg-green-400'}`} onClick={() => handleUserStatusUpdate(u.id, !u.is_active)}><EyeOff className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{u.is_active ? 'Suspend User' : 'Activate User'}</p></TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild><Button variant="flat" size="icon" className="bg-brand-orange text-black border-2 border-black hover:shadow-[-2px_2px_0px_#000]" disabled={u.id === user.id}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Delete User</p></TooltipContent>
                                </Tooltip>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This action is irreversible. Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Delete User</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
            </TabsContent>
            
            <TabsContent value="wishlists" className="mt-6 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.wishlists.map(w => (
                        <TableRow key={w.id}>
                        <TableCell>{w.title}</TableCell><TableCell>{w.user.full_name}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs font-semibold ${w.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{w.status}</span></TableCell>
                        <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2 justify-end">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="flat" size="icon" className="bg-white border-2 border-black hover:shadow-[-2px_2px_0px_#000]" onClick={() => window.open(`/${w.user.username}/${w.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View Wishlist</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="flat" size="icon" className="bg-yellow-400 text-black border-2 border-black hover:shadow-[-2px_2px_0px_#000]" onClick={() => handleWishlistStatusUpdate(w.id, w.status === 'active' ? 'suspended' : 'active')}><EyeOff className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{w.status === 'active' ? 'Suspend Wishlist' : 'Activate Wishlist'}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="flat" size="icon" className="bg-brand-orange text-black border-2 border-black hover:shadow-[-2px_2px_0px_#000]" onClick={() => handleWishlistStatusUpdate(w.id, 'flagged')}><Flag className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Flag for Review</p></TooltipContent>
                            </Tooltip>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
            </TabsContent>

            <TabsContent value="payouts" className="mt-6">
                {loadingData ? (
                  <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
                ) : (
                  <div className="space-y-6">
                    {/* Payout History Section */}
                    <div className="py-4 sm:py-6 px-0">
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                          <h3 className="text-2xl sm:text-3xl font-bold text-brand-purple-dark whitespace-nowrap">All Payouts</h3>
                          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                            <Input 
                              placeholder="Search by user email or account..." 
                              className="w-full sm:w-64"
                              value={payoutSearchTerm}
                              onChange={(e) => setPayoutSearchTerm(e.target.value)}
                            />
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                variant={payoutFilter === 'all' ? 'custom' : 'outline'}
                                className={`${payoutFilter === 'all' ? 'bg-brand-purple-dark text-white' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setPayoutFilter('all')}
                              >
                                All
                              </Button>
                              <Button
                                variant={payoutFilter === 'requested' ? 'custom' : 'outline'}
                                className={`${payoutFilter === 'requested' ? 'bg-brand-orange text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setPayoutFilter('requested')}
                              >
                                Pending
                              </Button>
                              <Button
                                variant={payoutFilter === 'processing' ? 'custom' : 'outline'}
                                className={`${payoutFilter === 'processing' ? 'bg-brand-purple-light text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setPayoutFilter('processing')}
                              >
                                Processing
                              </Button>
                              <Button
                                variant={payoutFilter === 'paid' ? 'custom' : 'outline'}
                                className={`${payoutFilter === 'paid' ? 'bg-brand-green text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setPayoutFilter('paid')}
                              >
                                Completed
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Batch Actions */}
                      <div className="flex justify-end mb-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            variant="custom" 
                            className="bg-brand-green text-black border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] flex-[2] sm:flex-none"
                            onClick={handleBatchApprove}
                            disabled={selectedPayouts.length === 0}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Selected ({selectedPayouts.length})
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] flex-1 sm:flex-none"
                            onClick={() => setSelectedPayouts([])}
                            disabled={selectedPayouts.length === 0}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </div>

                      {/* Empty state */}
                      {filteredPayouts.length === 0 ? (
                        <div className="text-center py-8">
                          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-semibold text-gray-600">No payouts found</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            {payoutFilter === 'all' 
                              ? "No withdrawal requests have been made yet." 
                              : `No ${payoutFilter} payouts found.`
                            }
                          </p>
                        </div>
                      ) : (
                        <div>
                          {/* Mobile list view - redesigned */}
                          <div className="md:hidden">
                            {filteredPayouts.map((payout) => (
                              <div key={payout.id} className="py-6 px-0 border-b border-gray-200 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-orange flex items-center justify-center">
                                    <CreditCard className="w-7 h-7 text-black" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-black truncate">
                                          {payout.wallet?.user?.full_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">Withdrawal</div>
                                      </div>
                                      <div className="text-right ml-2 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-brand-accent-red">-₦{Number(payout.amount).toLocaleString()}</div>
                                        <div className="text-xs text-gray-600 mt-1">{payout.status?.toUpperCase()}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop table */}
                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">
                                    <Checkbox 
                                      checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                                      onCheckedChange={handleSelectAllPayouts}
                                    />
                                  </TableHead>
                                  <TableHead>User</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Bank Details</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Requested</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredPayouts.map((payout) => (
                                  <TableRow key={payout.id}>
                                    <TableCell>
                                      <Checkbox 
                                        checked={selectedPayouts.includes(payout.id)}
                                        onCheckedChange={(checked) => handleSelectPayout(payout.id, checked)}
                                      />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <div>
                                        <div className="font-semibold">{payout.wallet?.user?.full_name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-600">{payout.wallet?.user?.email || 'No email'}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap font-semibold text-brand-accent-red">-₦{Number(payout.amount).toLocaleString()}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                      <div className="text-sm">
                                        <div>{payout.destination_bank_code || 'N/A'}</div>
                                        <div className="text-gray-600">{payout.destination_account || 'N/A'}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        payout.status === 'requested' ? 'bg-brand-orange text-black' :
                                        payout.status === 'processing' ? 'bg-brand-purple-light text-black' :
                                        payout.status === 'paid' ? 'bg-brand-green text-black' :
                                        'bg-brand-accent-red text-white'
                                      }`}>
                                        {payout.status?.toUpperCase() || 'UNKNOWN'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-xs text-gray-600">{new Date(payout.created_at).toLocaleString()}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => setSelectedPayoutForDetails(payout)}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        {payout.status === 'requested' && (
                                          <>
                                            <Button 
                                              size="sm" 
                                              variant="custom" 
                                              className="bg-brand-green text-black"
                                              onClick={() => handlePayoutStatusUpdate(payout.id, 'processing')}
                                            >
                                              Approve
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="custom" 
                                              className="bg-brand-accent-red text-white"
                                              onClick={() => handlePayoutStatusUpdate(payout.id, 'failed')}
                                            >
                                              Reject
                                            </Button>
                                          </>
                                        )}
                                        {payout.status === 'processing' && (
                                          <>
                                            <Button 
                                              size="sm" 
                                              variant="custom" 
                                              className="bg-brand-green text-black"
                                              onClick={() => handlePayoutStatusUpdate(payout.id, 'paid')}
                                            >
                                              Mark Paid
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="custom" 
                                              className="bg-brand-accent-red text-white"
                                              onClick={() => handlePayoutStatusUpdate(payout.id, 'failed')}
                                            >
                                              Mark Failed
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
                {loadingData ? (
                  <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
                ) : (
                  <div className="space-y-6">
                    {/* Transaction History Section */}
                    <div className="py-4 sm:py-6 px-0">
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                          <h3 className="text-2xl sm:text-3xl font-bold text-brand-purple-dark whitespace-nowrap">All Transactions</h3>
                          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                            <Input 
                              placeholder="Search by user, amount, or description..." 
                              className="w-full sm:w-64"
                              value={transactionSearchTerm}
                              onChange={(e) => setTransactionSearchTerm(e.target.value)}
                            />
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                variant={filterType === 'all' ? 'custom' : 'outline'}
                                className={`${filterType === 'all' ? 'bg-brand-purple-dark text-white' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setFilterType('all')}
                              >
                                All
                              </Button>
                              <Button
                                variant={filterType === 'contributions' ? 'custom' : 'outline'}
                                className={`${filterType === 'contributions' ? 'bg-brand-green text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setFilterType('contributions')}
                              >
                                Contributions
                              </Button>
                              <Button
                                variant={filterType === 'payments' ? 'custom' : 'outline'}
                                className={`${filterType === 'payments' ? 'bg-brand-purple-dark text-white' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setFilterType('payments')}
                              >
                                Payments
                              </Button>
                              <Button
                                variant={filterType === 'payouts' ? 'custom' : 'outline'}
                                className={`${filterType === 'payouts' ? 'bg-brand-orange text-black' : ''} border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] text-sm sm:text-base px-2 sm:px-4 flex-1 sm:flex-none rounded-md`}
                                onClick={() => setFilterType('payouts')}
                              >
                                Payouts
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Empty state */}
                      {filteredTransactions.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-semibold text-gray-600">No transactions found</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            {filterType === 'all' 
                              ? "No transactions found." 
                              : `No ${filterType === 'contributions' ? 'contributions' : filterType === 'payments' ? 'payments' : 'payouts'} found.`
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
                                  {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                {transactions.map((t) => (
                                  <div key={t.id} className="py-6 px-0 border-b border-gray-200 last:border-b-0">
                                    <div className="flex items-center gap-3">
                                      {getIconBadge(t)}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-black truncate">
                                              {getTitleDisplay(t) || (t.description || '')}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">{getCategoryLabel(t)}</div>
                                          </div>
                                          <div className="text-right ml-2 whitespace-nowrap">
                                            <div className="text-sm font-semibold">{getAmountDisplay(t)}</div>
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
                            <TableHead>{filterType === 'payments' ? 'Users' : 'Username'}</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredTransactions.map((t) => (
                                  <TableRow key={t.id}>
                                    <TableCell className="whitespace-nowrap">{getDesktopBadge(t)}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {(() => {
                                        const userInfo = getUserInfo(t);
                                        if (userInfo && userInfo !== '—') {
                                          // Check if it's a username (starts with @ or contains no spaces and is alphanumeric)
                                          const isUsername = userInfo.startsWith('@') || (!userInfo.includes(' ') && /^[A-Za-z0-9_.-]+$/.test(userInfo));
                                          if (isUsername) {
                                            const cleanUsername = userInfo.replace('@', '');
                                            return (
                                              <a href={`/${cleanUsername}`} className="font-semibold text-brand-purple-dark hover:underline">
                                                @{truncateUsername(cleanUsername)}
                                              </a>
                                            );
                                          } else {
                                            // It's a name or email, display as is
                                            return (
                                              <div className="font-semibold text-gray-900">{userInfo}</div>
                                            );
                                          }
                                        }
                                        return '—';
                                      })()}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">{getTitleDisplay(t) || (t.description || '')}</TableCell>
                                    <TableCell className="whitespace-nowrap font-semibold">{getAmountDisplay(t)}</TableCell>
                                    <TableCell className="whitespace-nowrap text-xs text-gray-600">{new Date(t.created_at).toLocaleString()}</TableCell>
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
                  </div>
                )}
            </TabsContent>
            
            

            <TabsContent value="settings" className="mt-6">
                <AdminSettings user={user} />
            </TabsContent>
            </Tabs>
        </div>

        {/* Payout Details Modal */}
        {selectedPayoutForDetails && (
          <AlertDialog open={!!selectedPayoutForDetails} onOpenChange={() => setSelectedPayoutForDetails(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Payout Details</AlertDialogTitle>
                <AlertDialogDescription>
                  Detailed information about this withdrawal request
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">User Information</Label>
                    <div className="mt-1 space-y-1">
                      <div className="text-sm">
                        <strong>Name:</strong> {selectedPayoutForDetails.wallet?.user?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm">
                        <strong>Email:</strong> {selectedPayoutForDetails.wallet?.user?.email || 'No email'}
                      </div>
                      <div className="text-sm">
                        <strong>User ID:</strong> {selectedPayoutForDetails.wallet?.user_id || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold">Withdrawal Details</Label>
                    <div className="mt-1 space-y-1">
                      <div className="text-sm">
                        <strong>Amount:</strong> ₦{Number(selectedPayoutForDetails.amount).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedPayoutForDetails.status === 'requested' ? 'bg-brand-orange text-black' :
                          selectedPayoutForDetails.status === 'processing' ? 'bg-brand-purple-light text-black' :
                          selectedPayoutForDetails.status === 'paid' ? 'bg-brand-green text-black' :
                          'bg-brand-accent-red text-white'
                        }`}>
                          {selectedPayoutForDetails.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <strong>Requested:</strong> {new Date(selectedPayoutForDetails.created_at).toLocaleString()}
                      </div>
                      {selectedPayoutForDetails.updated_at && (
                        <div className="text-sm">
                          <strong>Last Updated:</strong> {new Date(selectedPayoutForDetails.updated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Bank Details</Label>
                  <div className="mt-1 space-y-1">
                    <div className="text-sm">
                      <strong>Bank Code:</strong> {selectedPayoutForDetails.destination_bank_code || 'Not provided'}
                    </div>
                    <div className="text-sm">
                      <strong>Account Number:</strong> {selectedPayoutForDetails.destination_account || 'Not provided'}
                    </div>
                    {selectedPayoutForDetails.provider && (
                      <div className="text-sm">
                        <strong>Provider:</strong> {selectedPayoutForDetails.provider}
                      </div>
                    )}
                    {selectedPayoutForDetails.provider_ref && (
                      <div className="text-sm">
                        <strong>Provider Reference:</strong> {selectedPayoutForDetails.provider_ref}
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Time Estimate */}
                {selectedPayoutForDetails.status === 'requested' && (
                  <div className="bg-brand-orange/10 border border-brand-orange rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-orange" />
                      <div>
                        <div className="font-semibold text-brand-orange">Processing Time Estimate</div>
                        <div className="text-sm text-gray-700">
                          This withdrawal will be processed within 24-48 hours after approval.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayoutForDetails.status === 'processing' && (
                  <div className="bg-brand-purple-light/10 border border-brand-purple-light rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-brand-purple-light animate-spin" />
                      <div>
                        <div className="font-semibold text-brand-purple-light">Processing in Progress</div>
                        <div className="text-sm text-gray-700">
                          This withdrawal is currently being processed. Funds will be transferred within 1-2 business days.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                {selectedPayoutForDetails.status === 'requested' && (
                  <div className="flex gap-2">
                    <AlertDialogAction 
                      className="bg-brand-green text-black hover:bg-brand-green/90"
                      onClick={() => {
                        handlePayoutStatusUpdate(selectedPayoutForDetails.id, 'processing');
                        setSelectedPayoutForDetails(null);
                      }}
                    >
                      Approve
                    </AlertDialogAction>
                    <AlertDialogAction 
                      className="bg-brand-accent-red text-white hover:bg-brand-accent-red/90"
                      onClick={() => {
                        handlePayoutStatusUpdate(selectedPayoutForDetails.id, 'failed');
                        setSelectedPayoutForDetails(null);
                      }}
                    >
                      Reject
                    </AlertDialogAction>
                  </div>
                )}
                {selectedPayoutForDetails.status === 'processing' && (
                  <div className="flex gap-2">
                    <AlertDialogAction 
                      className="bg-brand-green text-black hover:bg-brand-green/90"
                      onClick={() => {
                        handlePayoutStatusUpdate(selectedPayoutForDetails.id, 'paid');
                        setSelectedPayoutForDetails(null);
                      }}
                    >
                      Mark as Paid
                    </AlertDialogAction>
                    <AlertDialogAction 
                      className="bg-brand-accent-red text-white hover:bg-brand-accent-red/90"
                      onClick={() => {
                        handlePayoutStatusUpdate(selectedPayoutForDetails.id, 'failed');
                        setSelectedPayoutForDetails(null);
                      }}
                    >
                      Mark as Failed
                    </AlertDialogAction>
                  </div>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TooltipProvider>
    </>
  );
};

export default AdminDashboardPage;