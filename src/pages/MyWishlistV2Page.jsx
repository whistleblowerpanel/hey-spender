import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Gift, ShoppingBag, Wallet as WalletIcon, Settings, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import Hero from '@/components/dashboard/Hero';
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
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import ClaimCard from '@/components/dashboard/ClaimCard';
import ClaimsStats from '@/components/dashboard/ClaimsStats';
import WalletDashboard from '@/components/dashboard/WalletDashboard';
import SettingsDashboard from '@/components/dashboard/SettingsDashboard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { wishlistService, goalsService, itemsService } from '@/lib/wishlistService';
import { claimsService } from '@/lib/claimsService';

const MyWishlistV2Page = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
        title: 'Error loading data',
        description: error.message
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
        title: 'Error loading claims',
        description: error.message
      });
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchClaimsData();
  }, [user]);

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
        title: 'Error creating wishlist',
        description: error.message
      });
    }
  };

  const handleOccasionSelect = (occasion) => {
    setSelectedOccasion(occasion);
  };

  const handleOccasionCreate = () => {
    setDrawerData({
      title: '',
      category: '',
      date: '',
      description: '',
      visibility: 'unlisted'
    });
    setDrawerOpen(true);
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
      toast({ variant: 'destructive', title: 'Error renaming occasion', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error deleting occasion', description: error.message });
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
        toast({ variant: 'destructive', title: 'Error creating occasion', description: error.message });
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
    window.open(`/${wishlist.slug}`, '_blank');
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
      toast({ variant: 'destructive', title: 'Error deleting wishlist', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error updating wishlist', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error adding items', description: error.message });
    }
  };

  const handleSaveCashGoal = async (goalData) => {
    try {
      await goalsService.createGoal(goalData);
      toast({ title: 'Cash goal created successfully' });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating cash goal:', error);
      toast({ variant: 'destructive', title: 'Error creating cash goal', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error updating cash goal', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error updating wishlists', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error deleting wishlists', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error archiving wishlists', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error updating claim', description: error.message });
    }
  };

  const handleClaimUpdate = async (claimId, updates) => {
    try {
      await claimsService.updateClaim(claimId, updates);
      toast({ title: 'Claim updated successfully' });
      await fetchClaimsData();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast({ variant: 'destructive', title: 'Error updating claim', description: error.message });
    }
  };

  const handleClaimDelete = async (claimId) => {
    try {
      await claimsService.deleteClaim(claimId);
      toast({ title: 'Claim removed successfully' });
      await fetchClaimsData();
    } catch (error) {
      console.error('Error deleting claim:', error);
      toast({ variant: 'destructive', title: 'Error removing claim', description: error.message });
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
      toast({ variant: 'destructive', title: 'Error signing out', description: error.message });
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

  return (
    <div className="max-w-7xl mx-auto py-4 lg:py-8 px-4 lg:px-0 mt-20 lg:mt-24">
      <Helmet><title>Dashboard - HeySpender</title></Helmet>
      
      {/* Hero Section */}
      <Hero 
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
        onGetStarted={handleGetStarted}
        onCreateWishlist={handleCreateWishlist}
      />

      <Tabs defaultValue="wishlists" className="w-full">
        <TabsList className="w-full sm:grid sm:grid-cols-5 sm:overflow-visible">
          <TabsTrigger value="wishlists"><Gift className="w-4 h-4 mr-2" />My Wishlists</TabsTrigger>
          <TabsTrigger value="claims"><ShoppingBag className="w-4 h-4 mr-2" />My Spender List</TabsTrigger>
          <TabsTrigger value="wallet"><WalletIcon className="w-4 h-4 mr-2" />My Wallet</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="wishlists" className="mt-6 px-4 md:px-0">
          {loading ? (
            renderLoadingState()
          ) : (
            <div className="space-y-12">
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
                      onView={() => console.log('View cash goal', goal.id)}
                      onShare={() => console.log('Share cash goal', goal.id)}
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
                  <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
                    <Gift className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-xl font-semibold">No wishlist items yet!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Add items to your wishlists to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredWishlistItems.map((item) => (
                      <div key={item.id} className="group relative bg-white border-2 border-black transition-all duration-300 overflow-hidden">
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
                          
                          {/* Claim Status Badge */}
                          <div className="absolute top-3 right-3">
                            <div className={`px-2 py-1 border border-black text-xs font-medium ${
                              (item.qty_claimed || 0) >= (item.qty_total || 1) 
                                ? 'bg-green-100 text-green-700 border-green-700' 
                                : (item.qty_claimed || 0) > 0 
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-700'
                                  : 'bg-gray-100 text-gray-600 border-gray-600'
                            }`}>
                              {item.qty_claimed || 0}/{item.qty_total || 1}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {/* Title */}
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand-purple-dark transition-colors duration-200">
                            {item.name}
                          </h3>
                          
                          {/* Description */}
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.description}
                            </p>
                          )}
                          
                          {/* Wishlist Source */}
                          <div className="flex items-center mb-3">
                            <div className="w-2 h-2 bg-brand-purple-dark rounded-full mr-2"></div>
                            <p className="text-xs text-gray-500 font-medium">
                              {item.wishlist_title}
                            </p>
                          </div>
                          
                          {/* Price */}
                          {item.unit_price_estimate && (
                            <div className="mb-3">
                              <span className="text-lg font-bold text-green-600">
                                ₦{item.unit_price_estimate.toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {/* Action Button */}
                          <div className="flex items-center justify-between">
                            {item.product_url ? (
                              <a 
                                href={item.product_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-brand-purple-dark text-white text-sm font-medium py-2 px-3 border-2 border-black hover:bg-brand-purple-dark/90 transition-colors duration-200 text-center"
                              >
                                View Product
                              </a>
                            ) : (
                              <div className="flex-1 bg-gray-100 text-gray-500 text-sm font-medium py-2 px-3 border-2 border-gray-400 text-center">
                                No Link Available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
        </TabsContent>

        <TabsContent value="claims" className="mt-6 px-4 md:px-0">
          {claimsLoading ? (
            renderLoadingState()
          ) : (
            <div className="space-y-6">
              {/* Claims Statistics */}
              <ClaimsStats stats={claimsStats} />

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
                    <ClaimCard
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
        </TabsContent>

        <TabsContent value="wallet" className="mt-6 px-4 md:px-0">
          <WalletDashboard 
            onRequestPayout={handleRequestPayout}
            onAddBankDetails={handleAddBankDetails}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 px-4 md:px-0">
          {loading ? (
            renderLoadingState()
          ) : (
            <AnalyticsDashboard wishlists={wishlists} cashGoals={cashGoals} />
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 px-4 md:px-0">
          <SettingsDashboard onSignOut={handleSignOut} />
        </TabsContent>
      </Tabs>

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
            <Label htmlFor="date">Date (optional)</Label>
            <Input
              id="date"
              type="date"
              value={drawerData.date}
              onChange={(e) => setDrawerData({...drawerData, date: e.target.value})}
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

      {/* Confetti Animation */}
      <Confetti trigger={showConfetti} />
    </div>
  );
};

export default MyWishlistV2Page;


