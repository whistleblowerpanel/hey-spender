import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowRight, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AuthPage = () => {
  const [authMethod, setAuthMethod] = useState('email');
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUpWithEmailPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { username, full_name, email, phone, password, role } = formData;

    if (!username || !full_name || !password || (authMethod === 'email' && !email)) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all required fields.' });
      setLoading(false);
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      toast({ variant: 'destructive', title: 'Username taken', description: 'This username is already in use. Please choose another.' });
      setLoading(false);
      return;
    }
    
    const signUpPayload = {
      email,
      password,
      options: {
        data: {
          username,
          full_name,
          phone,
          role,
        },
        emailRedirectTo: 'https://heyspender.com/auth/confirm'
      },
    };
    
    if(authMethod === 'phone') {
        toast({ title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" });
        setLoading(false);
        return;
    }

    const { data, error } = await signUpWithEmailPassword(signUpPayload);

    if (error) {
       toast({ variant: 'destructive', title: 'Sign up failed', description: error.message });
    } else if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
        toast({ variant: 'destructive', title: 'Email already registered', description: 'This email is already in use. Please login.' });
      } else {
        navigate('/verify');
      }
    }
    
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - HeySpender</title>
        <meta name="description" content="Create your HeySpender account to start building wishlists." />
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border-2 border-black">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-brand-purple-dark">Create Account</h1>
                <p className="text-gray-600">Join HeySpender today!</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={authMethod === 'email' ? 'custom' : 'outline'} className={authMethod === 'email' ? 'bg-brand-purple-dark text-white' : ''} onClick={() => setAuthMethod('email')}>
                    <Mail className="mr-2 h-4 w-4" /> Email
                </Button>
                <Button type="button" variant={authMethod === 'phone' ? 'custom' : 'outline'} className={authMethod === 'phone' ? 'bg-brand-green text-black' : ''} onClick={() => setAuthMethod('phone')}>
                    <Phone className="mr-2 h-4 w-4" /> Phone
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" type="text" autoComplete="name" value={formData.full_name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text" autoComplete="username" value={formData.username} onChange={handleInputChange} required />
                </div>

                {authMethod === 'email' ? (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleInputChange} required placeholder="e.g. +1234567890"/>
                  </div>
                )}
                
                <div className="relative">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} onChange={handleInputChange} required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger id="role">
                          <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading} variant="custom" className="w-full bg-brand-orange text-black">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span>Register</span>}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-purple-dark hover:underline">
                  Log In
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;