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
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmailPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { identifier, password } = formData;
    let email = identifier;

    // Check if identifier is a username and not an email
    if (!identifier.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('username', identifier)
        .single();
      
      if (error || !user) {
        toast({ variant: 'destructive', title: 'Login failed', description: 'Invalid username or password.' });
        setLoading(false);
        return;
      }
      email = user.email;
    }

    const { data, error } = await signInWithEmailPassword({ email, password });

    if (error) {
      toast({ variant: 'destructive', title: 'Login failed', description: error.message });
    } else {
        toast({ title: 'Login successful!', description: "Welcome back." });
        
        // Check if user is admin
        const isAdmin = data.user.user_metadata?.role === 'admin';
        
        if (isAdmin) {
            // Redirect admin users to admin dashboard
            navigate('/admin/dashboard');
        } else {
            // For regular users, check if they have claims to show spender list
            const { data: claimsCount } = await supabase
                .from('claims')
                .select('id', { count: 'exact', head: true })
                .eq('supporter_user_id', data.user.id);
            
            if (data.user.identities?.length > 0 && (claimsCount || 0) > 0) {
                navigate('/dashboard', { state: { defaultTab: 'claims' } });
            } else {
                navigate('/dashboard');
            }
        }
    }
    
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - HeySpender</title>
        <meta name="description" content="Login to your HeySpender account." />
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border-2 border-black">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-brand-purple-dark">Welcome Back</h1>
                <p className="text-gray-600">Sign in to your account</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="identifier">Email or Username</Label>
                  <Input id="identifier" type="text" autoComplete="email" value={formData.identifier} onChange={handleInputChange} required />
                </div>
                <div className="relative">
                  <Label htmlFor="password">Password</Label>
                   <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={formData.password} onChange={handleInputChange} required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} variant="custom" className="w-full bg-brand-green text-black">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span>Login</span>}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-brand-purple-dark hover:underline">
                  Sign Up
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;