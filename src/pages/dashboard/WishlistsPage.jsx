import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Gift, ShoppingBag, Wallet as WalletIcon, Settings, BarChart3, Edit, MoreVertical, MoreHorizontal, Trash2, Share2, Move, Sparkles, ArrowRight, Copy, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import OccasionBar from '@/components/dashboard/OccasionBar';
import CashGoalCard from '@/components/dashboard/CashGoalCard';
import WishlistCard from '@/components/dashboard/WishlistCard';
import AddCard from '@/components/dashboard/AddCard';
import SideDrawer from '@/components/dashboard/SideDrawer';
import GetStartedWizard from '@/components/wizard/GetStartedWizard.jsx';
import ShareModal from '@/components/dashboard/ShareModal';
import Confetti from '@/components/ui/Confetti';
import EditWishlistModal from '@/components/dashboard/EditWishlistModal';
import DeleteConfirmationModal from '@/components/dashboard/DeleteConfirmationModal';
import AddItemsModal from '@/components/dashboard/AddItemsModal';
import AddCashGoalModal from '@/components/dashboard/AddCashGoalModal';
import EditCashGoalModal from '@/components/dashboard/EditCashGoalModal';
import EditWishlistItemModal from '@/components/dashboard/EditWishlistItemModal';
import AddWishlistItemModal from '@/components/dashboard/AddWishlistItemModal';
import AddOccasionModal from '@/components/dashboard/AddOccasionModal';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import SpenderListCard from '@/components/dashboard/SpenderListCard';
import WishlistStats from '@/components/dashboard/WishlistStats';
import WalletDashboard from '@/components/dashboard/WalletDashboard';
import SettingsDashboard from '@/components/dashboard/SettingsDashboard';
import BottomNavbar from '@/components/dashboard/BottomNavbar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { wishlistService, goalsService, itemsService } from '@/lib/wishlistService';
import { claimsService } from '@/lib/claimsService';
import { getUserFriendlyError } from '@/lib/utils';

const MyWishlistV2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { wallet, transactions } = useWallet();
  const { toast } = useToast();
  
  // Active tab state - persist in sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    // First check location state (from navigation)
    if (location.state?.defaultTab) {
      return location.state.defaultTab;
    }
    // Then check sessionStorage for persisted tab
    const savedTab = sessionStorage.getItem('dashboard-active-tab');
    return savedTab || 'wishlists';
  });
  
  // Handle tab change with navigation for wallet
  const handleTabChange = React.useCallback((tab) => {
    if (tab === 'wallet') {
      navigate('/wallet');
    } else {
      setActiveTab(tab);
      // Persist tab selection in sessionStorage
      sessionStorage.setItem('dashboard-active-tab', tab);
    }
  }, [navigate]);
  
  // State management
  const [wishlists, setWishlists] = useState([]);
  const [cashGoals, setCashGoals] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addItemsModalOpen, setAddItemsModalOpen] = useState(false);
  const [addCashGoalModalOpen, setAddCashGoalModalOpen] = useState(false);
  const [editCashGoalModalOpen, setEditCashGoalModalOpen] = useState(false);
  const [selectedCashGoal, setSelectedCashGoal] = useState(null);
  const [editWishlistItemModalOpen, setEditWishlistItemModalOpen] = useState(false);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState(null);
  const [addWishlistItemModalOpen, setAddWishlistItemModalOpen] = useState(false);
  const [addOccasionModalOpen, setAddOccasionModalOpen] = useState(false);
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
  const [moveItemModalOpen, setMoveItemModalOpen] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Bulk actions state
  const [selectedWishlists, setSelectedWishlists] = useState([]);
  
  // Claims state
  const [claims, setClaims] = useState([]);
  const [claimsStats, setClaimsStats] = useState({});
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimsSearchQuery, setClaimsSearchQuery] = useState('');
  const [claimsStatusFilter, setClaimsStatusFilter] = useState('all');

  // Wallet balance calculation
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [claimsSortBy, setClaimsSortBy] = useState('created_at');
  const [claimsSortOrder, setClaimsSortOrder] = useState('desc');
  const [drawerData, setDrawerData] = useState({
    title: '',
    category: '',
    date: '',
    description: '',
    visibility: 'unlisted'
  });

  // Fetch real data from Supabase
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [wishlistsData, goalsData, itemsData, occasionsData] = await Promise.all([
        wishlistService.fetchUserWishlists(user.id),
        goalsService.fetchUserGoals(user.id),
        itemsService.fetchUserWishlistItems(user.id),
        wishlistService.fetchUserOccasions(user.id)
      ]);
      
      setWishlists(wishlistsData);
      setCashGoals(goalsData);
      setWishlistItems(itemsData);
      setOccasions(occasionsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to load your wishlists',
        description: getUserFriendlyError(error, 'loading your data')
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimsData = async () => {
    if (!user) return;
    
    setClaimsLoading(true);
    try {
      const [claimsData, statsData] = await Promise.all([
        claimsService.fetchUserClaims(user.id),
        claimsService.getUserClaimStats(user.id)
      ]);
      
      setClaims(claimsData);
      setClaimsStats(statsData);
    } catch (error) {
      console.error('Error fetching claims data:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to load your claims',
        description: getUserFriendlyError(error, 'loading your claims')
      });
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchClaimsData();
  }, [user]);

  // Fetch payouts to calculate correct wallet balance
  useEffect(() => {
    const fetchPayouts = async () => {
      if (!wallet?.id) {
        setPayouts([]);
        setPayoutsLoading(false);
        return;
      }
      
      setPayoutsLoading(true);
      try {
        const { data, error } = await supabase
          .from('payouts')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayouts(data || []);
      } catch (error) {
        console.error('Error fetching payouts:', error);
      } finally {
        setPayoutsLoading(false);
      }
    };

    fetchPayouts();
  }, [wallet?.id]);

  // Handle defaultTab from navigation state
  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
      // Persist tab selection in sessionStorage
      sessionStorage.setItem('dashboard-active-tab', location.state.defaultTab);
      // Clear the navigation state after using it to prevent it from persisting on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Calculate correct wallet balance (same logic as WalletPage)
  const correctWalletBalance = React.useMemo(() => {
    const allTransactions = transactions || [];
    // Calculate total withdrawn from payouts table only
    const totalWithdrawn = (payouts || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // Balance calculation: credits only, minus payouts
    // Do NOT subtract sent contributions; they are paid from bank, not wallet
    const balance = allTransactions.reduce((acc, t) => {
      if (t.type === 'credit') return acc + Number(t.amount || 0);
      // Do not subtract sent contributions; they are paid from bank, not wallet
      return acc;
    }, 0) - totalWithdrawn;
    
    return balance;
  }, [transactions, payouts]);

  // Filter data based on selected occasion title
  // Filter and sort wishlists
  const filteredWishlists = React.useMemo(() => {
    let filtered = wishlists;

    // Filter by occasion title
    if (selectedOccasion) {
      filtered = filtered.filter(wishlist => wishlist.title === selectedOccasion);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(wishlist => wishlist.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(wishlist => 
        wishlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wishlist.story && wishlist.story.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [wishlists, selectedOccasion, statusFilter, searchQuery, sortBy, sortOrder]);

  // Filter and sort claims
  const filteredClaims = React.useMemo(() => {
    let filtered = claims;

    // Filter by status
    if (claimsStatusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === claimsStatusFilter);
    }

    // Filter by search query
    if (claimsSearchQuery) {
      filtered = filtered.filter(claim => {
        const item = claim.wishlist_items;
        const wishlist = item?.wishlists;
        return (
          item?.name?.toLowerCase().includes(claimsSearchQuery.toLowerCase()) ||
          wishlist?.title?.toLowerCase().includes(claimsSearchQuery.toLowerCase()) ||
          claim.note?.toLowerCase().includes(claimsSearchQuery.toLowerCase())
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (claimsSortBy === 'created_at' || claimsSortBy === 'expire_at') {
        aValue = new Date(a[claimsSortBy]);
        bValue = new Date(b[claimsSortBy]);
      } else if (claimsSortBy === 'wishlist_items.unit_price_estimate') {
        aValue = a.wishlist_items?.unit_price_estimate || 0;
        bValue = b.wishlist_items?.unit_price_estimate || 0;
      } else {
        aValue = a[claimsSortBy];
        bValue = b[claimsSortBy];
      }

      if (claimsSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [claims, claimsStatusFilter, claimsSearchQuery, claimsSortBy, claimsSortOrder]);
    
  const filteredCashGoals = selectedOccasion 
    ? cashGoals.filter(g => g.wishlist_title === selectedOccasion)
    : cashGoals;

  const filteredWishlistItems = selectedOccasion 
    ? wishlistItems.filter(item => item.wishlist_title === selectedOccasion)
    : wishlistItems;

  // Event handlers
  const handleGetStarted = () => {
    setWizardOpen(true);
  };

  const handleCreateWishlist = () => {
    setWizardOpen(true);
  };

  const handleWizardComplete = async (data) => {
    try {
      const wishlistData = {
        title: data.title,
        occasion: data.occasion === 'No occasion' ? null : data.occasion,
        wishlist_date: data.dateType === 'specific' ? data.specificDate?.toISOString() : null,
        story: data.story,
        cover_image_url: data.coverImage,
        visibility: data.visibility
      };

      await wishlistService.createWishlist(user.id, wishlistData, data.items, data.cashGoals);
      
      // Show confetti for first wishlist
      if (wishlists.length === 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      toast({
        title: 'Wishlist created successfully!',
        description: 'Your new wishlist is ready to share.'
      });

      // Refresh data
      await fetchDashboardData();
      setWizardOpen(false);
    } catch (error) {
      console.error('Error creating wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to create wishlist',
        description: getUserFriendlyError(error, 'creating your wishlist')
      });
    }
  };

  const handleOccasionSelect = (occasion) => {
    setSelectedOccasion(occasion);
  };

  const handleOccasionCreate = () => {
    setAddOccasionModalOpen(true);
  };

  const handleSaveOccasion = async (formData) => {
    try {
      // Create a new wishlist with the occasion title
      await wishlistService.createWishlist(user.id, {
        title: formData.title,
        occasion: formData.category || 'other',
        story: formData.description,
        visibility: formData.visibility || 'unlisted',
        cover_image_url: formData.coverImage || null
      });
      
      toast({ title: 'Occasion created successfully' });
      await fetchDashboardData(); // Refresh data
      setAddOccasionModalOpen(false);
    } catch (error) {
      console.error('Error creating occasion:', error);
      toast({ variant: 'destructive', title: 'Unable to create occasion', description: getUserFriendlyError(error, 'creating the occasion') });
    }
  };

  const handleOccasionRename = async (prev, newVal) => {
    try {
      // Update all wishlists with the old title to have the new title
      const wishlistsToUpdate = wishlists.filter(w => w.title === prev);
      await Promise.all(
        wishlistsToUpdate.map(wishlist => 
          wishlistService.updateWishlist(wishlist.id, { title: newVal })
        )
      );
      
      // Update local state
    setOccasions(occasions.map(o => o === prev ? newVal : o));
      setWishlists(wishlists.map(w => w.title === prev ? { ...w, title: newVal } : w));
      
      // Update selected occasion if it was renamed
      if (selectedOccasion === prev) {
        setSelectedOccasion(newVal);
      }
      
      toast({ title: 'Occasion renamed successfully' });
    } catch (error) {
      console.error('Error renaming occasion:', error);
      toast({ variant: 'destructive', title: 'Unable to rename occasion', description: getUserFriendlyError(error, 'renaming the occasion') });
    }
  };

  const handleOccasionDelete = async (occasion) => {
    try {
      // Delete all wishlists with this title
      const wishlistsToDelete = wishlists.filter(w => w.title === occasion);
      await Promise.all(
        wishlistsToDelete.map(wishlist => wishlistService.deleteWishlist(wishlist.id))
      );
      
      // Update local state
    setOccasions(occasions.filter(o => o !== occasion));
      setWishlists(wishlists.filter(w => w.title !== occasion));
      setCashGoals(cashGoals.filter(g => {
        const wishlist = wishlists.find(w => w.id === g.wishlist_id);
        return wishlist?.title !== occasion;
      }));
      
    if (selectedOccasion === occasion) {
      setSelectedOccasion(null);
      }
      
      toast({ title: 'Occasion deleted successfully' });
    } catch (error) {
      console.error('Error deleting occasion:', error);
      toast({ variant: 'destructive', title: 'Unable to delete occasion', description: getUserFriendlyError(error, 'deleting the occasion') });
    }
  };

  const handleDrawerSave = async () => {
    if (drawerData.title) {
      try {
        // Create a new wishlist with the occasion title
        await wishlistService.createWishlist(user.id, {
          title: drawerData.title,
          occasion: drawerData.category || 'other',
          story: drawerData.description,
          visibility: drawerData.visibility || 'unlisted'
        });
        
        toast({ title: 'Occasion created successfully' });
        await fetchDashboardData(); // Refresh data
      } catch (error) {
        console.error('Error creating occasion:', error);
        toast({ variant: 'destructive', title: 'Unable to create occasion', description: getUserFriendlyError(error, 'creating the occasion') });
      }
    }
    setDrawerOpen(false);
  };

  const handleAddCashGoal = () => {
    setAddCashGoalModalOpen(true);
  };

  const handleAddWishlist = () => {
    setWizardOpen(true);
  };

  const handleShareWishlist = (wishlist) => {
    setSelectedWishlist(wishlist);
    setShareModalOpen(true);
  };

  const handleViewWishlist = (wishlist) => {
    const username = user?.user_metadata?.username;
    if (username) {
      window.open(`/${username}/${wishlist.slug}`, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to view wishlist',
        description: 'Your username could not be found. Please try refreshing the page.'
      });
    }
  };

  const handleEditWishlist = (wishlist) => {
    setSelectedWishlist(wishlist);
    setEditModalOpen(true);
  };

  const handleDeleteWishlist = (wishlist) => {
    setSelectedWishlist(wishlist);
    setDeleteModalOpen(true);
  };

  const handleAddItemsToWishlist = (wishlist) => {
    setSelectedWishlist(wishlist);
    setAddItemsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWishlist) return;
    
    try {
      await wishlistService.deleteWishlist(selectedWishlist.id);
      toast({ title: 'Wishlist deleted successfully' });
      await fetchDashboardData();
      setDeleteModalOpen(false);
      setSelectedWishlist(null);
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      toast({ variant: 'destructive', title: 'Unable to delete wishlist', description: getUserFriendlyError(error, 'deleting the wishlist') });
    }
  };

  const handleUpdateWishlist = async (updates) => {
    if (!selectedWishlist) return;
    
    try {
      await wishlistService.updateWishlist(selectedWishlist.id, updates);
      toast({ title: 'Wishlist updated successfully' });
      await fetchDashboardData();
      setEditModalOpen(false);
      setSelectedWishlist(null);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast({ variant: 'destructive', title: 'Unable to update wishlist', description: getUserFriendlyError(error, 'updating the wishlist') });
    }
  };

  const handleAddItems = async (items) => {
    if (!selectedWishlist) return;
    
    try {
      await wishlistService.addItemsToWishlist(selectedWishlist.id, items);
      toast({ title: `${items.length} items added successfully` });
      await fetchDashboardData();
      setAddItemsModalOpen(false);
      setSelectedWishlist(null);
    } catch (error) {
      console.error('Error adding items:', error);
      toast({ variant: 'destructive', title: 'Unable to add items', description: getUserFriendlyError(error, 'adding items') });
    }
  };

  const handleSaveCashGoal = async (goalData) => {
    try {
      await goalsService.createGoal(goalData);
      toast({ title: 'Cash goal created successfully' });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating cash goal:', error);
      toast({ variant: 'destructive', title: 'Unable to create cash goal', description: getUserFriendlyError(error, 'creating the cash goal') });
    }
  };

  const handleEditCashGoal = (goal) => {
    setSelectedCashGoal(goal);
    setEditCashGoalModalOpen(true);
  };

  const handleUpdateCashGoal = async (goalId, updates) => {
    try {
      await goalsService.updateGoal(goalId, updates);
      toast({ title: 'Cash goal updated successfully' });
      await fetchDashboardData();
      setEditCashGoalModalOpen(false);
      setSelectedCashGoal(null);
    } catch (error) {
      console.error('Error updating cash goal:', error);
      toast({ variant: 'destructive', title: 'Unable to update cash goal', description: getUserFriendlyError(error, 'updating the cash goal') });
    }
  };

  const handleEditWishlistItem = (item) => {
    setSelectedWishlistItem(item);
    setEditWishlistItemModalOpen(true);
  };

  const handleUpdateWishlistItem = async (itemId, updates) => {
    try {
      await itemsService.updateItem(itemId, updates);
      toast({ title: 'Wishlist item updated successfully' });
      await fetchDashboardData();
      setEditWishlistItemModalOpen(false);
      setSelectedWishlistItem(null);
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      toast({ variant: 'destructive', title: 'Unable to update item', description: getUserFriendlyError(error, 'updating the item') });
    }
  };

  const handleAddWishlistItem = () => {
    setAddWishlistItemModalOpen(true);
  };

  const handleSaveWishlistItem = async (payload) => {
    try {
      await itemsService.createItem(payload);
      toast({ title: 'Wishlist item created successfully' });
      await fetchDashboardData();
      setAddWishlistItemModalOpen(false);
    } catch (error) {
      console.error('Error creating wishlist item:', error);
      toast({ variant: 'destructive', title: 'Unable to create item', description: getUserFriendlyError(error, 'creating the item') });
    }
  };

  const handleDeleteWishlistItem = (item) => {
    setSelectedWishlistItem(item);
    setDeleteItemModalOpen(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (!selectedWishlistItem) return;
    
    try {
      await itemsService.deleteItem(selectedWishlistItem.id);
      toast({ title: 'Wishlist item deleted successfully' });
      await fetchDashboardData();
      setDeleteItemModalOpen(false);
      setSelectedWishlistItem(null);
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      toast({ variant: 'destructive', title: 'Unable to delete item', description: getUserFriendlyError(error, 'deleting the item') });
    }
  };

  const handleShareWishlistItem = (item) => {
    // Find the parent wishlist to share its link
    const parentWishlist = wishlists.find(w => w.id === item.wishlist_id);
    if (parentWishlist) {
      setSelectedWishlist(parentWishlist);
      setShareModalOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to share item',
        description: 'The wishlist for this item could not be found.'
      });
    }
  };

  const handleViewWishlistItem = (item) => {
    const username = user?.user_metadata?.username;
    
    if (item.wishlist_slug && username) {
      window.open(`/${username}/${item.wishlist_slug}`, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to view item',
        description: !item.wishlist_slug ? 'The wishlist for this item could not be found.' : 'Your username could not be found. Please try refreshing the page.'
      });
    }
  };

  const handleMoveWishlistItem = (item) => {
    setSelectedWishlistItem(item);
    setMoveItemModalOpen(true);
  };

  const handleSaveMoveItem = async (targetWishlistId) => {
    if (!selectedWishlistItem || !targetWishlistId) return;
    
    try {
      await itemsService.updateItem(selectedWishlistItem.id, { wishlist_id: targetWishlistId });
      toast({ title: 'Wishlist item moved successfully' });
      await fetchDashboardData();
      setMoveItemModalOpen(false);
      setSelectedWishlistItem(null);
    } catch (error) {
      console.error('Error moving wishlist item:', error);
      toast({ variant: 'destructive', title: 'Unable to move item', description: getUserFriendlyError(error, 'moving the item') });
    }
  };

  const handleViewCashGoal = (goal) => {
    const username = user?.user_metadata?.username;
    if (username && goal.wishlist_slug) {
      window.open(`/${username}/${goal.wishlist_slug}`, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to view cash goal',
        description: 'The cash goal page could not be found.'
      });
    }
  };

  const handleShareCashGoal = (goal) => {
    // Find the parent wishlist to share its link
    const parentWishlist = wishlists.find(w => w.id === goal.wishlist_id);
    if (parentWishlist) {
      setSelectedWishlist(parentWishlist);
      setShareModalOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Unable to share cash goal',
        description: 'The wishlist for this cash goal could not be found.'
      });
    }
  };

  // Bulk action handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedWishlists(filteredWishlists.map(w => w.id));
    } else {
      setSelectedWishlists([]);
    }
  };

  const handleSelectWishlist = (wishlistId, checked) => {
    if (checked) {
      setSelectedWishlists(prev => [...prev, wishlistId]);
    } else {
      setSelectedWishlists(prev => prev.filter(id => id !== wishlistId));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await Promise.all(
        selectedWishlists.map(id => 
          wishlistService.updateWishlist(id, { status: newStatus })
        )
      );
      toast({ title: `${selectedWishlists.length} wishlists updated` });
      await fetchDashboardData();
      setSelectedWishlists([]);
    } catch (error) {
      console.error('Error updating wishlists:', error);
      toast({ variant: 'destructive', title: 'Unable to update wishlists', description: getUserFriendlyError(error, 'updating wishlists') });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedWishlists.map(id => wishlistService.deleteWishlist(id))
      );
      toast({ title: `${selectedWishlists.length} wishlists deleted` });
      await fetchDashboardData();
      setSelectedWishlists([]);
    } catch (error) {
      console.error('Error deleting wishlists:', error);
      toast({ variant: 'destructive', title: 'Unable to delete wishlists', description: getUserFriendlyError(error, 'deleting wishlists') });
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedWishlists.map(id => 
          wishlistService.updateWishlist(id, { status: 'archived' })
        )
      );
      toast({ title: `${selectedWishlists.length} wishlists archived` });
      await fetchDashboardData();
      setSelectedWishlists([]);
    } catch (error) {
      console.error('Error archiving wishlists:', error);
      toast({ variant: 'destructive', title: 'Unable to archive wishlists', description: getUserFriendlyError(error, 'archiving wishlists') });
    }
  };

  const handleExport = () => {
    const selectedData = wishlists.filter(w => selectedWishlists.includes(w.id));
    const dataStr = JSON.stringify(selectedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'wishlists-export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({ title: 'Export completed' });
  };

  // Claim handlers
  const handleClaimStatusUpdate = async (claimId, newStatus) => {
    try {
      await claimsService.updateClaimStatus(claimId, newStatus);
      toast({ title: 'Claim status updated successfully' });
      await fetchClaimsData();
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast({ variant: 'destructive', title: 'Unable to update claim', description: getUserFriendlyError(error, 'updating the claim') });
    }
  };

  const handleClaimUpdate = async (claimId, updates) => {
    try {
      await claimsService.updateClaim(claimId, updates);
      toast({ title: 'Claim updated successfully' });
      await fetchClaimsData();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast({ variant: 'destructive', title: 'Unable to update claim', description: getUserFriendlyError(error, 'updating the claim') });
    }
  };

  const handleClaimDelete = async (claimId) => {
    try {
      await claimsService.deleteClaim(claimId);
      toast({ title: 'Claim removed successfully' });
      await fetchClaimsData();
    } catch (error) {
      console.error('Error deleting claim:', error);
      toast({ variant: 'destructive', title: 'Unable to remove claim', description: getUserFriendlyError(error, 'removing the claim') });
    }
  };

  const handleViewClaimWishlist = (slug) => {
    window.open(`/${slug}`, '_blank');
  };

  // Wallet handlers
  const handleRequestPayout = () => {
    // TODO: Implement payout request functionality
    toast({ 
      title: 'Payout Request', 
      description: 'Payout request functionality will be available soon!' 
    });
  };

  const handleAddBankDetails = () => {
    // TODO: Implement bank details management
    toast({ 
      title: 'Bank Details', 
      description: 'Bank details management will be available soon!' 
    });
  };

  // Settings handlers
  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/customSupabaseClient');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ variant: 'destructive', title: 'Unable to sign out', description: getUserFriendlyError(error, 'signing out') });
    }
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
      <Gift className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-xl font-semibold">No wishlists yet!</h3>
      <p className="mt-2 text-sm text-gray-500">
        Click 'Get Started' to create your first wishlist — it's fun and takes 2 minutes.
      </p>
      <Button 
        onClick={handleGetStarted}
        variant="custom" 
        className="bg-brand-orange text-black mt-4"
      >
        Get Started
      </Button>
    </div>
  );

  // Tabs configuration
  const tabs = [
    { value: 'wishlists', label: 'Wishlists', icon: Gift },
    { value: 'claims', label: 'Spender List', icon: ShoppingBag },
    { value: 'wallet', label: 'Wallet', icon: WalletIcon },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  // Dynamic page content based on active tab
  const pageContent = {
    wishlists: {
      title: 'Wishlists',
      description: 'Organize occasions, add wishlist items or cash goals, and share with your Spenders.',
      showButton: true
    },
    claims: {
      title: 'Spender List',
      description: 'Track items you\'ve claimed from other people\'s wishlists and manage your gifting commitments.',
      showButton: false
    },
    wallet: {
      title: 'Wallet',
      description: 'Manage your earnings, track contributions received, and request payouts.',
      showButton: false
    },
    analytics: {
      title: 'Analytics',
      description: 'View insights about your wishlists, track performance, and understand your audience.',
      showButton: false
    },
    settings: {
      title: 'Settings',
      description: 'Manage your account preferences, profile information, and application settings.',
      showButton: false
    }
  };

  const currentPage = pageContent[activeTab];

  return (
    <div>
      <Helmet><title>{currentPage.title} - HeySpender</title></Helmet>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-0 pt-[133px] pb-28 sm:pb-36">
        {/* Page Title and Description */}
        <div className="flex flex-row items-start justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-brand-purple-dark mb-2">{currentPage.title}</h1>
            <p className="text-gray-600">
              {currentPage.description}
            </p>
          </div>
          {currentPage.showButton && (
            <div className="flex gap-4 flex-shrink-0">
              {!occasions.length ? (
                <Button onClick={handleGetStarted} variant="custom" className="bg-brand-orange text-black">
                  <span>Get Started</span>
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleCreateWishlist} variant="custom" className="bg-brand-orange text-black">
                  <span>Create Wishlist</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'wishlists' && (
            <div>
              {loading ? (
                renderLoadingState()
              ) : (
                <div className="space-y-12">
                  {/* Wishlist Statistics */}
                  <WishlistStats 
                    wishlistItems={filteredWishlistItems} 
                    cashGoals={filteredCashGoals}
                    walletBalance={correctWalletBalance}
                  />

                  {/* Occasion Bar */}
                  <div>
                    <h2 className="text-[30px] font-semibold text-brand-purple-dark mb-4">Occasion Titles</h2>
                    <OccasionBar
                      occasions={occasions}
                      active={selectedOccasion}
                      onSelect={handleOccasionSelect}
                      onCreate={handleOccasionCreate}
                      onRename={handleOccasionRename}
                      onDelete={handleOccasionDelete}
                    />
                  </div>

                  {/* Cash Goals Section */}
                  <div>
                    <h2 className="text-[30px] font-semibold text-brand-purple-dark mb-4">Cash Goals</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      {filteredCashGoals.map((goal) => (
                        <CashGoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={() => handleEditCashGoal(goal)}
                          onView={() => handleViewCashGoal(goal)}
                          onShare={() => handleShareCashGoal(goal)}
                        />
                      ))}
                      <AddCard 
                        label="Add New Cash Goal"
                        onClick={handleAddCashGoal}
                      />
                    </div>
                  </div>

                  {/* Wishlist Items Section */}
                  <div>
                    <h2 className="text-[30px] font-semibold text-brand-purple-dark mb-4">Wishlist Items</h2>
                    {filteredWishlistItems.length === 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AddCard 
                          label="Add New Wishlist Item"
                          onClick={handleAddWishlistItem}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredWishlistItems.map((item) => {
                          const isFullyClaimed = (item.qty_claimed || 0) >= (item.qty_total || 1);
                          const getSpenderInfo = () => {
                            if (!isFullyClaimed || !item.claims || item.claims.length === 0) return null;
                            const confirmedClaims = item.claims.filter(claim => 
                              claim.status === 'confirmed' && claim.supporter_user?.username
                            );
                            if (confirmedClaims.length > 0) {
                              confirmedClaims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                              return confirmedClaims[0].supporter_user.username;
                            }
                            return null;
                          };
                          const spenderUsername = getSpenderInfo();

                          return (
                            <div key={item.id} className="group relative bg-white border-2 border-black transition-all duration-300 overflow-hidden flex flex-col h-full">
                              {/* Image Container */}
                              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                {item.image_url ? (
                                  <img 
                                    alt={item.name} 
                                    src={item.image_url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Gift className="w-16 h-16" />
                                  </div>
                                )}
                                
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                {/* 3-Dot Menu - Top Right */}
                                <div className="absolute top-3 right-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-brand-purple-dark hover:bg-brand-purple-dark/90"
                                      >
                                        <MoreHorizontal className="h-4 w-4 text-white" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewWishlistItem(item)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditWishlistItem(item)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteWishlistItem(item)} className="text-brand-accent-red">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleShareWishlistItem(item)}>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMoveWishlistItem(item)}>
                                        <Move className="w-4 h-4 mr-2" />
                                        Move
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="p-4 flex flex-col grow gap-2">
                                {/* Title */}
                                <h3 className="text-lg font-bold text-gray-900 min-h-[48px] leading-6 line-clamp-2">
                                  {item.name}
                                </h3>
                                
                                {/* Wishlist Source */}
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-brand-purple-dark rounded-full mr-2"></div>
                                  <p className="text-xs text-gray-500 font-medium">
                                    {item.wishlist_title}
                                  </p>
                                </div>
                                
                                {/* Bottom-anchored amount + status */}
                                <div className="mt-auto space-y-2">
                                  {item.unit_price_estimate && (
                                    <div>
                                      <span className="text-lg font-bold text-green-600">
                                        ₦{item.unit_price_estimate.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="w-full bg-brand-green text-black text-sm font-medium py-2 px-3 border-2 border-black text-center">
                                    {isFullyClaimed ? (
                                      spenderUsername ? (
                                        <><strong>@{spenderUsername}</strong> Paid For This!</>
                                      ) : (
                                        'Fully Claimed'
                                      )
                                    ) : (
                                      `Available (${(item.qty_total || 1) - (item.qty_claimed || 0)} left)`
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <AddCard 
                          label="Add New Wishlist Item"
                          onClick={handleAddWishlistItem}
                        />
                      </div>
                    )}
                  </div>

                  {/* Occasions Section (moved to fourth position) */}
                  <div>
                    <h2 className="text-[30px] font-semibold text-brand-purple-dark mb-4">Occasions</h2>
                    {filteredWishlists.length === 0 && occasions.length === 0 ? (
                      renderEmptyState()
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {filteredWishlists.map((wishlist) => (
                                  <WishlistCard
                                    key={wishlist.id}
                                    wishlist={wishlist}
                                    onEdit={() => handleEditWishlist(wishlist)}
                                    onView={() => handleViewWishlist(wishlist)}
                                    onShare={() => handleShareWishlist(wishlist)}
                                    onAddItems={() => handleAddItemsToWishlist(wishlist)}
                                    onDelete={() => handleDeleteWishlist(wishlist)}
                                  />
                        ))}
                        <AddCard 
                          label="Add New Wishlist"
                          onClick={handleAddWishlist}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            )}

            {activeTab === 'claims' && (
              <div>
              {claimsLoading ? (
                renderLoadingState()
              ) : (
                <div className="space-y-6">
                  {/* Claims Grid */}
                  {filteredClaims.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-xl font-semibold">No Claims Yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {claims.length === 0 
                          ? "You haven't claimed any items yet. Browse public wishlists to get started!"
                          : "No claims match your current filters. Try adjusting your search criteria."
                        }
                      </p>
                      {claims.length === 0 && (
                        <Button 
                          variant="custom" 
                          className="bg-brand-orange text-black mt-4"
                          onClick={() => navigate('/explore')}
                        >
                          Browse Public Wishlists
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      {filteredClaims.map((claim) => (
                        <SpenderListCard
                          key={claim.id}
                          claim={claim}
                          onUpdateStatus={handleClaimStatusUpdate}
                          onUpdateClaim={handleClaimUpdate}
                          onDelete={handleClaimDelete}
                          onViewWishlist={handleViewClaimWishlist}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <WalletDashboard 
                  onRequestPayout={handleRequestPayout}
                  onAddBankDetails={handleAddBankDetails}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                {loading ? (
                  renderLoadingState()
                ) : (
                  <AnalyticsDashboard wishlists={wishlists} cashGoals={cashGoals} />
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <SettingsDashboard onSignOut={handleSignOut} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavbar 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Modals */}
        <GetStartedWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={handleWizardComplete}
          userId={user?.id}
        />

        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Create New Occasion"
          onSave={handleDrawerSave}
          onCancel={() => setDrawerOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Occasion Title</Label>
              <Input
                id="title"
                value={drawerData.title}
                onChange={(e) => setDrawerData({...drawerData, title: e.target.value})}
                placeholder="e.g. Graduation, Anniversary"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={drawerData.category} onValueChange={(value) => setDrawerData({...drawerData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celebration">Celebration</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={drawerData.date}
                onChange={(e) => setDrawerData({...drawerData, date: e.target.value})}
                className="cursor-pointer"
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={drawerData.description}
                onChange={(e) => setDrawerData({...drawerData, description: e.target.value})}
                placeholder="Tell us about this occasion..."
              />
            </div>
          </div>
        </SideDrawer>

        {/* Share Modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          wishlist={selectedWishlist}
        />

        <EditWishlistModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          wishlist={selectedWishlist}
          onSave={handleUpdateWishlist}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemType="wishlist"
          itemName={selectedWishlist?.title}
        />

        <AddItemsModal
          isOpen={addItemsModalOpen}
          onClose={() => setAddItemsModalOpen(false)}
          wishlist={selectedWishlist}
          onSave={handleAddItems}
        />

        <AddCashGoalModal
          isOpen={addCashGoalModalOpen}
          onClose={() => setAddCashGoalModalOpen(false)}
          wishlists={wishlists}
          onSave={handleSaveCashGoal}
        />

        <EditCashGoalModal
          isOpen={editCashGoalModalOpen}
          onClose={() => setEditCashGoalModalOpen(false)}
          goal={selectedCashGoal}
          wishlists={wishlists}
          onSave={handleUpdateCashGoal}
        />

        <EditWishlistItemModal
          isOpen={editWishlistItemModalOpen}
          onClose={() => setEditWishlistItemModalOpen(false)}
          item={selectedWishlistItem}
          wishlists={wishlists}
          onSave={handleUpdateWishlistItem}
        />

        <AddWishlistItemModal
          isOpen={addWishlistItemModalOpen}
          onClose={() => setAddWishlistItemModalOpen(false)}
          wishlists={wishlists}
          defaultWishlistId={selectedWishlist?.id}
          onSave={handleSaveWishlistItem}
        />

        <AddOccasionModal
          isOpen={addOccasionModalOpen}
          onClose={() => setAddOccasionModalOpen(false)}
          onSave={handleSaveOccasion}
        />

        {/* Wishlist Item Modals */}
        <DeleteConfirmationModal
          isOpen={deleteItemModalOpen}
          onClose={() => setDeleteItemModalOpen(false)}
          onConfirm={handleConfirmDeleteItem}
          itemType="item"
          itemName={selectedWishlistItem?.name}
        />

        {/* Move Item Modal */}
        <Dialog open={moveItemModalOpen} onOpenChange={setMoveItemModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Move className="w-5 h-5" />
                Move Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Move "{selectedWishlistItem?.name}" to another wishlist
              </p>
              <div className="space-y-2">
                <Label>Select Destination Wishlist</Label>
                <Select onValueChange={(value) => handleSaveMoveItem(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a wishlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {wishlists
                      .filter(w => w.id !== selectedWishlistItem?.wishlist_id)
                      .map(wishlist => (
                        <SelectItem key={wishlist.id} value={wishlist.id}>
                          {wishlist.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confetti Animation */}
        <Confetti trigger={showConfetti} />
      </div>
  );
};

export default MyWishlistV2Page;


