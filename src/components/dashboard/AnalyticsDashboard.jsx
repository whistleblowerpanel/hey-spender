import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, Gift, Eye, Share2, DollarSign } from 'lucide-react';
import AnalyticsCard from './AnalyticsCard';

const AnalyticsDashboard = ({ wishlists, cashGoals }) => {
  // Calculate analytics
  const totalWishlists = wishlists.length;
  const liveWishlists = wishlists.filter(w => w.status === 'live').length;
  const completedWishlists = wishlists.filter(w => w.status === 'completed').length;
  const totalViews = wishlists.reduce((sum, w) => sum + (w.views_count || 0), 0);
  const totalShares = wishlists.reduce((sum, w) => sum + (w.shares_count || 0), 0);
  const totalAmountRaised = cashGoals.reduce((sum, g) => sum + (g.amount_raised || 0), 0);
  const totalTargetAmount = cashGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const completionRate = totalTargetAmount > 0 ? (totalAmountRaised / totalTargetAmount) * 100 : 0;

  // Most popular occasion
  const occasionCounts = wishlists.reduce((acc, w) => {
    if (w.occasion) {
      acc[w.occasion] = (acc[w.occasion] || 0) + 1;
    }
    return acc;
  }, {});
  const mostPopularOccasion = Object.keys(occasionCounts).reduce((a, b) => 
    occasionCounts[a] > occasionCounts[b] ? a : b, 'None'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-brand-purple-dark" />
        <h2 className="text-2xl font-bold text-brand-purple-dark">Analytics & Insights</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Wishlists"
          value={totalWishlists}
          change="+12%"
          icon={Gift}
          trend="up"
        />
        <AnalyticsCard
          title="Live Wishlists"
          value={liveWishlists}
          change="+8%"
          icon={Eye}
          trend="up"
        />
        <AnalyticsCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          change="+23%"
          icon={Eye}
          trend="up"
        />
        <AnalyticsCard
          title="Total Shares"
          value={totalShares.toLocaleString()}
          change="+15%"
          icon={Share2}
          trend="up"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Fundraising Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Amount Raised</span>
                <span>₦{totalAmountRaised.toLocaleString()}</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₦0</span>
                <span>₦{totalTargetAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-purple-dark">
                  {cashGoals.length}
                </div>
                <div className="text-sm text-gray-600">Cash Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedWishlists}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Most Popular Occasion</span>
                <span className="font-medium capitalize">{mostPopularOccasion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Items per Wishlist</span>
                <span className="font-medium">
                  {totalWishlists > 0 ? 
                    Math.round(wishlists.reduce((sum, w) => sum + (w.items_count || 0), 0) / totalWishlists) : 0
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-medium">
                  {totalViews > 0 ? 
                    `${Math.round((totalShares / totalViews) * 100)}%` : '0%'
                  }
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Quick Actions</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-brand-purple-light text-brand-purple-dark text-xs font-medium">
                  View Reports
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                  Export Data
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {wishlists.slice(0, 5).map((wishlist) => (
              <div key={wishlist.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-purple-light flex items-center justify-center">
                    <Gift className="w-4 h-4 text-brand-purple-dark" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{wishlist.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(wishlist.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {wishlist.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
