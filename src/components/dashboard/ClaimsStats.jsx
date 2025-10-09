import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, DollarSign, ShoppingBag } from 'lucide-react';

const ClaimsStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Claims',
      value: stats.total || 0,
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Fulfilled',
      value: stats.fulfilled || 0,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Value',
      value: `₦${(stats.totalValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClaimsStats;
