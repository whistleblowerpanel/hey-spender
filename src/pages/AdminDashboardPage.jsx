import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Users, Gift, Settings, Trash2, ExternalLink, Banknote, CheckCircle, XCircle, DollarSign, EyeOff, Flag, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StatCard = ({ title, value, icon, loading }) => (
    <div className="border-2 border-black p-4 bg-white relative after:absolute after:left-[-4px] after:bottom-[-4px] after:w-full after:h-full after:bg-black after:z-[-1]">
        <div className="relative">
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold uppercase text-gray-500">{title}</p>
                {icon}
            </div>
            <div className="mt-2">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <p className="text-3xl font-bold">{value}</p>}
            </div>
        </div>
    </div>
);

const AdminSettings = () => {
    const { toast } = useToast();
    const notImplemented = () => toast({title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"});

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h3 className="text-2xl font-bold">Global Settings</h3>
                <p className="text-gray-500">Manage site-wide configurations.</p>
            </div>
            <div className="border-2 border-black p-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" defaultValue="HeySpender" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input id="supportEmail" defaultValue="support@heyspender.com" />
                </div>
                <div className="flex justify-end">
                    <Button onClick={notImplemented} variant="custom" className="bg-brand-green text-black"><Save className="w-4 h-4 mr-2"/>Save Settings</Button>
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
  const [data, setData] = useState({ users: [], wishlists: [], payouts: [], contributions: [] });
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
        const usersPromise = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });
        const wishlistsPromise = supabase.from('wishlists').select('*, user:users(full_name, username)', { count: 'exact' }).order('created_at', { ascending: false });
        const payoutsPromise = supabase.from('payouts').select('*, wallet:wallets(user:users(full_name, email))').order('created_at', { ascending: false });
        const pendingPayoutsPromise = supabase.from('payouts').select('id', { count: 'exact' }).eq('status', 'requested');
        const contributionsPromise = supabase.from('contributions').select('*, goal:goals(wishlist:wishlists(title, user:users(username, full_name)))').order('created_at', { ascending: false });

        const [usersRes, wishlistsRes, payoutsRes, pendingPayoutsRes, contributionsRes] = await Promise.all([usersPromise, wishlistsPromise, payoutsPromise, pendingPayoutsPromise, contributionsPromise]);

        if (usersRes.error) throw usersRes.error;
        if (wishlistsRes.error) throw wishlistsRes.error;
        if (payoutsRes.error) throw payoutsRes.error;
        if (pendingPayoutsRes.error) throw pendingPayoutsRes.error;
        if (contributionsRes.error) throw contributionsRes.error;

        setStats({
            users: usersRes.count,
            wishlists: wishlistsRes.count,
            pendingPayouts: pendingPayoutsRes.count
        });

        setData({
            users: usersRes.data,
            wishlists: wishlistsRes.data,
            payouts: payoutsRes.data,
            contributions: contributionsRes.data
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
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        signOut();
        navigate('/login');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, navigate, toast, signOut, fetchData]);
  
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
    const { error } = await supabase.rpc('update_payout_status', { p_payout_id: payoutId, p_new_status: newStatus, p_admin_id: user.id });
    if (error) {
        toast({ variant: 'destructive', title: 'Failed to update payout', description: error.message });
    } else {
        toast({ title: `Payout status updated to ${newStatus}` });
        fetchData();
    }
  };

  if (authLoading || !user || user.user_metadata?.role !== 'admin') {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" /></div>;
  }

  return (
    <>
      <Helmet><title>Admin Dashboard - HeySpender</title></Helmet>
      <TooltipProvider>
        <div className="max-w-7xl mx-auto px-4 py-8 pt-28">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-brand-purple-dark">Admin Dashboard</h1>
                <Button variant="custom" className="bg-brand-orange text-black w-full sm:w-auto" onClick={fetchData} disabled={loadingData}>
                    {loadingData ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Refresh Data
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <StatCard title="Total Users" value={stats.users} icon={<Users className="w-6 h-6 text-gray-400" />} loading={loadingData} />
                <StatCard title="Total Wishlists" value={stats.wishlists} icon={<Gift className="w-6 h-6 text-gray-400" />} loading={loadingData} />
                <StatCard title="Pending Payouts" value={stats.pendingPayouts} icon={<DollarSign className="w-6 h-6 text-gray-400" />} loading={loadingData} />
            </div>

            <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
                <TabsTrigger value="wishlists"><Gift className="w-4 h-4 mr-2" />Wishlists</TabsTrigger>
                <TabsTrigger value="payouts"><Banknote className="w-4 h-4 mr-2" />Payouts</TabsTrigger>
                <TabsTrigger value="contributions"><DollarSign className="w-4 h-4 mr-2" />Contributions</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.users.map(u => (
                        <TableRow key={u.id}>
                        <TableCell>{u.full_name}</TableCell><TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2 justify-end">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="custom" size="icon" className={`text-black ${u.is_active ? 'bg-yellow-400' : 'bg-green-400'}`} onClick={() => handleUserStatusUpdate(u.id, !u.is_active)}><EyeOff className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{u.is_active ? 'Suspend User' : 'Activate User'}</p></TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild><Button variant="custom" size="icon" className="bg-brand-orange text-black" disabled={u.id === user.id}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
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
            
            <TabsContent value="wishlists" className="mt-4 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.wishlists.map(w => (
                        <TableRow key={w.id}>
                        <TableCell>{w.title}</TableCell><TableCell>{w.user.full_name}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${w.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{w.status}</span></TableCell>
                        <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2 justify-end">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="custom" size="icon" className="bg-white" onClick={() => window.open(`/${w.user.username}/${w.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View Wishlist</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="custom" size="icon" className="bg-yellow-400 text-black" onClick={() => handleWishlistStatusUpdate(w.id, w.status === 'active' ? 'suspended' : 'active')}><EyeOff className="w-4 h-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{w.status === 'active' ? 'Suspend Wishlist' : 'Activate Wishlist'}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="custom" size="icon" className="bg-brand-orange text-black" onClick={() => handleWishlistStatusUpdate(w.id, 'flagged')}><Flag className="w-4 h-4" /></Button>
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

            <TabsContent value="payouts" className="mt-4 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Bank</TableHead><TableHead>Account</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.payouts.map(p => (
                        <TableRow key={p.id}>
                        <TableCell>{p.wallet.user.full_name}<br/><span className="text-xs text-gray-500">{p.wallet.user.email}</span></TableCell>
                        <TableCell>₦{Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell>{p.destination_bank_code}</TableCell>
                        <TableCell>{p.destination_account}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : p.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></TableCell>
                        <TableCell className="flex gap-1 justify-end flex-wrap">
                            {p.status === 'requested' && ( 
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="custom" className="bg-blue-500 text-white" onClick={() => handlePayoutStatusUpdate(p.id, 'processing')}>Approve</Button> 
                                    </TooltipTrigger>
                                    <TooltipContent><p>Approve and move to 'processing'</p></TooltipContent>
                                </Tooltip>
                            )}
                            {p.status === 'processing' && ( 
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="custom" className="bg-brand-green text-black" onClick={() => handlePayoutStatusUpdate(p.id, 'paid')}><CheckCircle className="w-4 h-4 mr-2"/>Mark Paid</Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Mark as paid and debit wallet</p></TooltipContent>
                                </Tooltip>
                            )}
                            {(p.status === 'requested' || p.status === 'processing') && ( 
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="custom" className="bg-brand-orange text-black" onClick={() => handlePayoutStatusUpdate(p.id, 'failed')}><XCircle className="w-4 h-4 mr-2"/>Fail</Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Mark as failed</p></TooltipContent>
                                </Tooltip>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
            </TabsContent>
            
            <TabsContent value="contributions" className="mt-4 overflow-x-auto">
                {loadingData ? <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" /> : (
                <Table>
                    <TableHeader><TableRow><TableHead>Contributor</TableHead><TableHead>Amount</TableHead><TableHead>Wishlist</TableHead><TableHead>Recipient</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {data.contributions.map(c => (
                        <TableRow key={c.id}>
                            <TableCell>{c.is_anonymous ? 'Anonymous' : c.display_name}</TableCell>
                            <TableCell>₦{Number(c.amount).toLocaleString()}</TableCell>
                            <TableCell>{c.goal.wishlist.title}</TableCell>
                            <TableCell>{c.goal.wishlist.user.full_name}</TableCell>
                            <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</span></TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
                <AdminSettings />
            </TabsContent>
            </Tabs>
        </div>
      </TooltipProvider>
    </>
  );
};

export default AdminDashboardPage;