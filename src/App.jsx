import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import AdminPage from '@/pages/AdminPage';
import WishlistPage from '@/pages/WishlistPage';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';
import DashboardPage from '@/pages/DashboardPage';
import VerifyPage from '@/pages/VerifyPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import PublicWishlistsPage from '@/pages/PublicWishlistsPage';
import AuthConfirmPage from '@/pages/AuthConfirmPage';
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
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wishlists" element={<PublicWishlistsPage />} />
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