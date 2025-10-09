import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import SettingsDashboard from '@/components/dashboard/SettingsDashboard';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.'
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: error.message
      });
    }
  };

  return (
    <div>
      <Helmet>
        <title>Settings - HeySpender</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 lg:px-0 pt-[133px] pb-28 sm:pb-36">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-purple-dark mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account, profile, and preferences
          </p>
        </div>

        <SettingsDashboard onSignOut={handleSignOut} />
      </div>
    </div>
  );
};

export default SettingsPage;

