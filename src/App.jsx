import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboardLayout from '@/components/layout/AdminDashboardLayout';
import HomePage from '@/pages/HomePage';
import AdminPage from '@/pages/AdminPage';
import WishlistPage from '@/pages/WishlistPage';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';
import VerifyPage from '@/pages/VerifyPage';
import PublicWishlistsPage from '@/pages/PublicWishlistsPage';
import AuthConfirmPage from '@/pages/AuthConfirmPage';

// Dashboard Pages
import MyWishlistV2Page from '@/pages/MyWishlistV2Page';
import SpenderListPage from '@/pages/dashboard/SpenderListPage';
import WalletPage from '@/pages/dashboard/WalletPage';
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';

// Admin Dashboard Pages
import AdminDashboardPage from '@/pages/AdminDashboardPage';

import { WalletProvider } from '@/contexts/WalletContext';

function App() {
  return (
    <>
      <Helmet>
        <title>HeySpender - Create & Share Your Wishlist</title>
        <meta name="description" content="Create beautiful wishlists and share them with friends and family. Accept contributions via multiple payment methods." />
      </Helmet>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Admin Dashboard Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
              <Route index element={<Navigate to="/admin/dashboard/users" replace />} />
              <Route path="users" element={<AdminDashboardPage />} />
              <Route path="wishlists" element={<AdminDashboardPage />} />
              <Route path="payouts" element={<AdminDashboardPage />} />
              <Route path="transactions" element={<AdminDashboardPage />} />
              <Route path="notifications" element={<AdminDashboardPage />} />
              <Route path="settings" element={<AdminDashboardPage />} />
            </Route>
            
            {/* User Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/wishlists" replace />} />
              <Route path="wishlists" element={<MyWishlistV2Page />} />
              <Route path="spender-list" element={<SpenderListPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="/explore" element={<PublicWishlistsPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            <Route path="/:username/:slug" element={<WishlistPage />} />
            <Route path="/:username" element={<ProfilePage />} />
          </Route>
        </Routes>
      </WalletProvider>
    </>
  );
}

export default App;