import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Save,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Download, 
  Mail,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SettingsDashboard = ({ onSignOut }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    phone: user?.user_metadata?.phone || ''
  });

  const [emailData, setEmailData] = useState({
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    contributionAlerts: true,
    reminderEmails: true,
    marketingEmails: false
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating profile', description: error.message });
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    try {
      toast({ title: 'Email update initiated', description: 'Please check your new email for verification.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating email', description: error.message });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    
    try {
      toast({ title: 'Password updated successfully' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating password', description: error.message });
    }
  };

  const handleNotificationUpdate = (e) => {
    e.preventDefault();
    toast({ title: 'Notification settings updated' });
  };

  const handleExportData = () => {
    toast({ title: 'Data export initiated', description: 'You will receive an email when your data is ready.' });
  };

  const handleDeleteAccount = () => {
    toast({ variant: 'destructive', title: 'Account deletion', description: 'This action requires additional confirmation.' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Profile Settings Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">User Profile</h2>
        <form onSubmit={handleProfileUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm sm:text-base font-medium">Full Name</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                className="border-2 border-black text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base font-medium">Username</Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                className="border-2 border-black text-base sm:text-sm"
              />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Username can only contain letters, numbers, and underscores.</span>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base font-medium">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="border-2 border-black text-base sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-green text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Save Profile</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Email Settings Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Email Settings</h2>
        <form onSubmit={handleEmailUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email Address</Label>
              <Input
                type="email"
                id="email"
                value={emailData.email}
                onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                className="border-2 border-black text-base sm:text-sm"
              />
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Changing your email will require verification of the new address.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_email" className="text-sm sm:text-base font-medium">Phone Number</Label>
              <Input
                id="phone_email"
                value={emailData.phone}
                onChange={(e) => setEmailData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="border-2 border-black text-base sm:text-sm"
              />
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                This will be updated along with your email.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-orange text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Update Email</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Password Settings Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Password Settings</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm sm:text-base font-medium">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  minLength={6}
                  className="border-2 border-black text-base sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-medium">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  minLength={6}
                  className="border-2 border-black text-base sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 space-y-1 bg-gray-50 p-3">
              <p>• Password must be at least 6 characters long</p>
              <p>• Use a combination of letters, numbers, and symbols for better security</p>
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-purple-dark text-white shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Update Password</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Notification Settings Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Notifications</h2>
        <form onSubmit={handleNotificationUpdate} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label className="text-sm sm:text-base font-medium">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label className="text-sm sm:text-base font-medium">SMS Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label className="text-sm sm:text-base font-medium">Push Notifications</Label>
                <p className="text-xs text-gray-500">Receive push notifications</p>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label className="text-sm sm:text-base font-medium">Contribution Alerts</Label>
                <p className="text-xs text-gray-500">Get notified when someone contributes</p>
              </div>
              <Switch
                checked={notificationSettings.contributionAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, contributionAlerts: checked }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-green text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Save Settings</span>
            </Button>
          </div>
        </form>
            </div>

      {/* Account Actions Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full lg:col-span-2">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">Account Actions</h2>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleExportData}
              className="flex flex-col items-center gap-3 p-6 border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] transition-all"
            >
              <Download className="w-8 h-8 text-brand-purple-dark" />
              <div className="text-center">
                <p className="font-semibold">Export Data</p>
                <p className="text-xs text-gray-500">Download your data</p>
              </div>
            </button>

            <button
              onClick={onSignOut}
              className="flex flex-col items-center gap-3 p-6 border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] transition-all"
            >
              <LogOut className="w-8 h-8 text-brand-orange" />
              <div className="text-center">
                <p className="font-semibold">Sign Out</p>
                <p className="text-xs text-gray-500">Sign out of your account</p>
              </div>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="flex flex-col items-center gap-3 p-6 border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] transition-all bg-red-600"
            >
              <Trash2 className="w-8 h-8 text-white" />
              <div className="text-center">
                <p className="font-semibold text-white">Delete Account</p>
                <p className="text-xs text-white/80">Permanently delete your account</p>
              </div>
            </button>
              </div>
            </div>
            </div>

      {/* Account Information Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-brand-purple-dark lg:col-span-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-white/80 text-sm font-medium">Account ID:</span>
            <span className="font-mono text-xs bg-white/20 text-white px-2 py-1 break-all">
              {user?.id || 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white/80 text-sm font-medium">Member since:</span>
            <span className="text-white text-sm">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white/80 text-sm font-medium">Email:</span>
            <span className="text-white text-sm break-all">
              {user?.email || 'N/A'}
            </span>
          </div>
            </div>
          </div>
    </div>
  );
};

export default SettingsDashboard;
