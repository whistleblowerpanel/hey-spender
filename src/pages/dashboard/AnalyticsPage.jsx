import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { wishlistService, goalsService } from '@/lib/wishlistService';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [wishlists, setWishlists] = useState([]);
  const [cashGoals, setCashGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [wishlistsData, goalsData] = await Promise.all([
          wishlistService.fetchUserWishlists(user.id),
          goalsService.fetchUserGoals(user.id)
        ]);

        setWishlists(wishlistsData || []);
        setCashGoals(goalsData || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading analytics',
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  return (
    <div>
      <Helmet>
        <title>Analytics - HeySpender</title>
        <meta name="description" content="View analytics and insights for your wishlists" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 lg:px-0 pt-[133px] pb-28 sm:pb-36">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-purple-dark mb-2">Analytics</h1>
          <p className="text-gray-600">
            Track your wishlist performance and contribution insights
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <AnalyticsDashboard wishlists={wishlists} cashGoals={cashGoals} />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

