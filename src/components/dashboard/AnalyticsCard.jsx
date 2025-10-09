import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Eye, Share2, Heart, DollarSign } from 'lucide-react';

const AnalyticsCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={`inline-flex items-center ${trendColor}`}>
              <trendIcon className="w-3 h-3 mr-1" />
              {change}
            </span>
            {' '}from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
