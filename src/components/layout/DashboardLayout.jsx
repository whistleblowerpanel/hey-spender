import React from 'react';
import { Outlet } from 'react-router-dom';
import { Gift, ShoppingBag, Wallet, Settings, BarChart3 } from 'lucide-react';
import BottomNavbar from '@/components/dashboard/BottomNavbar';

const DashboardLayout = () => {
  const tabs = [
    { value: 'wishlists', label: 'Wishlists', icon: Gift, path: '/dashboard/wishlists' },
    { value: 'spender-list', label: 'Spender List', icon: ShoppingBag, path: '/dashboard/spender-list' },
    { value: 'wallet', label: 'Wallet', icon: Wallet, path: '/dashboard/wallet' },
    { value: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { value: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <div>
      <Outlet />
      <BottomNavbar tabs={tabs} />
    </div>
  );
};

export default DashboardLayout;

