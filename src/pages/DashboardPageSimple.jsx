import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" /></div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen"><h1>Please log in</h1></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-brand-purple-dark mb-8">Dashboard</h1>
      <div className="text-center py-16">
        <p>Dashboard is working! User: {user.email}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
