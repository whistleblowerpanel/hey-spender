import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, DollarSign, CheckCircle, Wallet } from 'lucide-react';

const WishlistStats = ({ wishlistItems, cashGoals, walletBalance = 0 }) => {
  // Calculate statistics
  const totalItems = wishlistItems.length;
  const claimedItems = wishlistItems.filter(item => 
    (item.qty_claimed || 0) >= (item.qty_total || 1)
  ).length;
  
  const totalCashGoals = cashGoals.length;
  const totalAmountRaised = cashGoals.reduce((sum, goal) => sum + (goal.amount_raised || 0), 0);
  const totalTargetAmount = cashGoals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  
  const statCards = [
    {
      title: 'Total Wishlist Items',
      value: totalItems,
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Claimed',
      value: claimedItems,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Cash Raised',
      value: `₦${totalAmountRaised.toLocaleString()}`,
      subtitle: totalTargetAmount > 0 ? `of ₦${totalTargetAmount.toLocaleString()}` : null,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-white'
    },
    {
      title: 'Wallet Balance',
      value: `₦${walletBalance.toLocaleString()}`,
      icon: Wallet,
      color: 'text-white',
      bgColor: 'bg-brand-purple-dark',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={stat.bgColor}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.textColor || ''}`}>{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor || ''}`}>{stat.value}</div>
              {stat.subtitle && (
                <p className={`text-xs mt-1 ${stat.textColor ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default WishlistStats;

