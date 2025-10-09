import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { claimsService } from '@/lib/claimsService';
import SpenderListCard from '@/components/dashboard/SpenderListCard';
import { Button } from '@/components/ui/button';

const SpenderListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const data = await claimsService.fetchUserClaims(user.id);
        setClaims(data || []);
      } catch (error) {
        console.error('Error fetching claims:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading claims',
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [user?.id, toast]);

  const handleClaimStatusUpdate = async (claimId, newStatus) => {
    try {
      await claimsService.updateClaimStatus(claimId, newStatus);
      toast({ title: 'Claim status updated successfully' });
      
      // Refresh claims
      const data = await claimsService.fetchUserClaims(user.id);
      setClaims(data || []);
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: error.message
      });
    }
  };

  const handleClaimUpdate = async (claimId, updates) => {
    try {
      await claimsService.updateClaim(claimId, updates);
      toast({ title: 'Claim updated successfully' });
      
      // Refresh claims
      const data = await claimsService.fetchUserClaims(user.id);
      setClaims(data || []);
    } catch (error) {
      console.error('Error updating claim:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update claim',
        description: error.message
      });
    }
  };

  const handleClaimDelete = async (claimId) => {
    try {
      await claimsService.deleteClaim(claimId);
      toast({ title: 'Claim deleted successfully' });
      setClaims(prevClaims => prevClaims.filter(c => c.id !== claimId));
    } catch (error) {
      console.error('Error deleting claim:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete claim',
        description: error.message
      });
    }
  };

  const handleViewClaimWishlist = (claim) => {
    if (claim.wishlist?.slug && claim.wishlist?.user?.username) {
      window.open(`/${claim.wishlist.user.username}/${claim.wishlist.slug}`, '_blank');
    }
  };

  return (
    <div>
      <Helmet>
        <title>Spender List - HeySpender</title>
        <meta name="description" content="Manage items you've claimed from wishlists" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 lg:px-0 pt-[133px] pb-28 sm:pb-36">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-purple-dark mb-2">Spender List</h1>
          <p className="text-gray-600">
            Track and manage items you've claimed from other people's wishlists
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold">No Claims Yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't claimed any items yet. Browse public wishlists to get started!
            </p>
            <Button 
              variant="custom" 
              className="bg-brand-orange text-black mt-4"
              onClick={() => navigate('/explore')}
            >
              Browse Public Wishlists
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {claims.map((claim) => (
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
    </div>
  );
};

export default SpenderListPage;

