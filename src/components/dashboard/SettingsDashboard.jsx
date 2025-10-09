import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Save,
  LogOut,
  Trash2,
  Download,
  CreditCard,
  PauseCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUserFriendlyError } from '@/lib/utils';
import { profileUpdateSchema, emailUpdateSchema, passwordChangeSchema } from '@/lib/formValidation';
import FormField from '@/components/forms/FormField';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';

const SettingsDashboard = ({ onSignOut }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Bank details state
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    bankCode: ''
  });

  // Profile Form
  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      username: user?.user_metadata?.username || '',
      phone: user?.user_metadata?.phone || ''
    }
  });

  // Email Form
  const emailForm = useForm({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      email: user?.email || ''
    }
  });

  // Password Form
  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    contributionAlerts: true,
    reminderEmails: true,
    marketingEmails: false
  });
  
  // Developer mode state (for admins only)
  const [developerMode, setDeveloperMode] = useState(() => {
    return localStorage.getItem('devMode') === 'true';
  });
  
  // Account active state
  const [accountActive, setAccountActive] = useState(true);
  const [loadingAccountStatus, setLoadingAccountStatus] = useState(true);
  
  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  // Fetch user's account active status
  useEffect(() => {
    const fetchAccountStatus = async () => {
      if (!user?.id) return;
      
      setLoadingAccountStatus(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_active')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setAccountActive(data.is_active ?? true);
        }
      } catch (error) {
        console.error('Error fetching account status:', error);
      } finally {
        setLoadingAccountStatus(false);
      }
    };
    
    fetchAccountStatus();
  }, [user?.id]);

  const handleProfileUpdate = async (data) => {
    try {
      // TODO: Implement actual profile update
      console.log('Profile update:', data);
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Unable to update profile', 
        description: getUserFriendlyError(error, 'updating your profile') 
      });
    }
  };

  const handleEmailUpdate = async (data) => {
    try {
      // TODO: Implement actual email update
      console.log('Email update:', data);
      toast({ 
        title: 'Email update initiated', 
        description: 'Please check your new email for verification.' 
      });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Unable to update email', 
        description: getUserFriendlyError(error, 'updating your email') 
      });
    }
  };

  const handlePasswordChange = async (data) => {
    try {
      // TODO: Implement actual password change
      console.log('Password change:', data);
      toast({ title: 'Password updated successfully' });
      passwordForm.reset();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Unable to update password', 
        description: getUserFriendlyError(error, 'updating your password') 
      });
    }
  };

  const handleNotificationUpdate = (e) => {
    e.preventDefault();
    toast({ title: 'Notification settings updated' });
  };
  
  const handleDeveloperModeToggle = (checked) => {
    setDeveloperMode(checked);
    localStorage.setItem('devMode', checked.toString());
    toast({ 
      title: checked ? 'Developer Mode Enabled' : 'Developer Mode Disabled',
      description: checked 
        ? 'You will now see technical error messages for debugging.' 
        : 'User-friendly error messages have been restored.'
    });
  };

  const handleExportData = () => {
    toast({ 
      title: 'Data export initiated', 
      description: 'You will receive an email when your data is ready.' 
    });
  };

  const handleDeleteAccount = () => {
    toast({ 
      variant: 'destructive', 
      title: 'Account deletion', 
      description: 'This action requires additional confirmation.' 
    });
  };

  const handleAccountStatusToggle = async (checked) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: checked,
          suspended_by: checked ? null : 'self' // Set to 'self' when deactivating, null when activating
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setAccountActive(checked);
      toast({
        title: checked ? 'Account Activated' : 'Account Deactivated',
        description: checked 
          ? 'Your wishlists are now visible and accessible to everyone.' 
          : 'Your wishlists are now hidden from public view. They can only be accessed by you.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to update account status',
        description: getUserFriendlyError(error, 'updating your account status')
      });
    }
  };

  const handleSaveBankDetails = (e) => {
    e.preventDefault();
    if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all required bank details.'
      });
      return;
    }

    // TODO: Implement actual bank details save to database
    toast({
      title: 'Bank Details Saved',
      description: 'Your bank details have been saved successfully.'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Profile Settings Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4">User Profile</h2>
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <FormField
              control={profileForm.control}
              name="full_name"
              label="Full Name"
              required
            />
            
            <FormField
              control={profileForm.control}
              name="username"
              label="Username"
              required
            />
            
            <FormField
              control={profileForm.control}
              name="phone"
              label="Phone Number"
              description="Optional: Include country code"
            />
          </div>
          
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-green text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
              disabled={profileForm.formState.isSubmitting}
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
        <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              label="Email Address"
              required
              description="Changing your email will require verification"
            />
          </div>
          
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-orange text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
              disabled={emailForm.formState.isSubmitting}
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
        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <FormField
              control={passwordForm.control}
              name="newPassword"
              label="New Password"
              required
            />
            
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              label="Confirm New Password"
              required
            />
          </div>
          
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-purple-dark text-white shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
              disabled={passwordForm.formState.isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Update Password</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Bank Account Details Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Bank Account Details
        </h2>
        <form onSubmit={handleSaveBankDetails} className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Full name on account"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="10-digit account number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                maxLength={10}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Select 
                value={bankDetails.bankName} 
                onValueChange={(value) => setBankDetails({...bankDetails, bankName: value})}
              >
                <SelectTrigger id="bank-name" className="rounded-none">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="access">Access Bank</SelectItem>
                  <SelectItem value="gtb">GTBank</SelectItem>
                  <SelectItem value="uba">UBA</SelectItem>
                  <SelectItem value="zenith">Zenith Bank</SelectItem>
                  <SelectItem value="first">First Bank</SelectItem>
                  <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                  <SelectItem value="union">Union Bank</SelectItem>
                  <SelectItem value="sterling">Sterling Bank</SelectItem>
                  <SelectItem value="stanbic">Stanbic IBTC</SelectItem>
                  <SelectItem value="fcmb">FCMB</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">For payout withdrawals</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-2 mt-auto">
            <Button 
              type="submit"
              className="inline-flex items-center justify-center font-semibold border-2 border-black hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90 h-10 bg-brand-salmon text-black shadow-none w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="sm:inline">Save Bank Details</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Account Status Card */}
      <div className="border-2 border-black p-4 sm:p-6 bg-white flex flex-col h-full">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-purple-dark mb-4 flex items-center gap-2">
          <PauseCircle className="w-6 h-6" />
          Account Status
        </h2>
        <div className="flex-1 space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>What happens when you deactivate your account?</strong>
            </p>
            <ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Your wishlists won't appear on the Explore page</li>
              <li>Direct links to your wishlists will show a "temporarily unavailable" message</li>
              <li>All your data remains safe and can be reactivated anytime</li>
              <li>You can still access your dashboard and manage your wishlists</li>
            </ul>
          </div>

          <div className={`flex items-center justify-between py-4 px-4 border-2 rounded-lg transition-all ${
            accountActive ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}>
            <div className="flex-1">
              <Label className="text-base font-semibold flex items-center gap-2">
                {accountActive ? (
                  <span className="text-green-700">🟢 Account Active</span>
                ) : (
                  <span className="text-red-700">🔴 Account Deactivated</span>
                )}
              </Label>
              <p className="text-sm mt-1">
                {accountActive ? (
                  <span className="text-green-700">Your wishlists are visible to everyone</span>
                ) : (
                  <span className="text-red-700">Your wishlists are hidden from public view</span>
                )}
              </p>
            </div>
            <Switch
              checked={accountActive}
              onCheckedChange={handleAccountStatusToggle}
              disabled={loadingAccountStatus}
            />
          </div>

          {!accountActive && (
            <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Note:</strong> While your account is deactivated, visitors with direct links will see a message that your wishlists are temporarily unavailable.
              </p>
            </div>
          )}
        </div>
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
            
            {/* Developer Mode Toggle - Only visible to admins */}
            {isAdmin && (
              <div className="border-t-2 border-orange-200 pt-4 mt-4">
                <div className="flex items-center justify-between py-2 bg-orange-50 px-3 rounded">
                  <div className="flex-1">
                    <Label className="text-sm sm:text-base font-medium text-orange-900 flex items-center gap-2">
                      🔧 Developer Mode
                      <span className="text-xs bg-orange-200 text-orange-900 px-2 py-0.5 rounded font-normal">Admin Only</span>
                    </Label>
                    <p className="text-xs text-orange-700">Show technical error messages for debugging</p>
                  </div>
                  <Switch
                    checked={developerMode}
                    onCheckedChange={handleDeveloperModeToggle}
                  />
                </div>
              </div>
            )}
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
