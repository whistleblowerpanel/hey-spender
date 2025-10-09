import React from 'react';
import { Outlet } from 'react-router-dom';
import { Users, Gift, DollarSign, ArrowUpDown, Bell, Settings } from 'lucide-react';
import BottomNavbar from '@/components/dashboard/BottomNavbar';

const AdminDashboardLayout = () => {
  const tabs = [
    { value: 'users', label: 'Users', icon: Users, path: '/admin/dashboard/users' },
    { value: 'wishlists', label: 'Wishlists', icon: Gift, path: '/admin/dashboard/wishlists' },
    { value: 'payouts', label: 'Payouts', icon: DollarSign, path: '/admin/dashboard/payouts' },
    { value: 'transactions', label: 'Transactions', icon: ArrowUpDown, path: '/admin/dashboard/transactions' },
    { value: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/dashboard/notifications' },
    { value: 'settings', label: 'Settings', icon: Settings, path: '/admin/dashboard/settings' },
  ];

  return (
    <div>
      <Outlet />
      <BottomNavbar tabs={tabs} />
    </div>
  );
};

export default AdminDashboardLayout;

