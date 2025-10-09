import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const isProfilePage = /^\/[^/]+\/?$/.test(location.pathname) && !['/register', '/login', '/verify', '/admin', '/dashboard', '/wallet', '/explore', '/', '/auth/confirm'].includes(location.pathname);
  const isWishlistPage = /^\/[^/]+\/[^/]+$/.test(location.pathname);
  const isPublicWishlistsPage = location.pathname === '/explore';

  const noPadding = isProfilePage || isWishlistPage || isPublicWishlistsPage;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn('flex-1', !isHomePage && !noPadding && 'pt-28')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;